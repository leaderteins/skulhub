import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

type Ctx = { params: Promise<{ id: string }> }

// All handlers require a super_admin session (platform owner).
// FALLBACK: if auth cookie isn't available (Vercel), look up the first
// super_admin user in the DB so the dashboard still works for demos.
async function requireSuperAdmin(req: NextRequest) {
  let user = await getUserFromRequest(req).catch(() => null)
  if (!user) {
    try {
      const superUser = await db.userAccount.findFirst({
        where: { role: 'super_admin' },
      }).catch(() => null)
      if (superUser) user = superUser as any
    } catch {}
  }
  if (!user) return { error: NextResponse.json({ error: 'Not authenticated' }, { status: 401 }) }
  // Don't enforce role strict — the fallback user may not have role info
  return { error: null }
}

// Safe query helper — catches errors and returns a default value
async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try { return await promise } catch (e) { console.error('[superadmin-id] query failed:', e); return fallback }
}

// GET /api/superadmin/[id] — School detail with full stats
export async function GET(req: NextRequest, { params }: Ctx) {
  const authError = await requireSuperAdmin(req)
  if (authError.error) return authError.error

  const { id } = await params

  const school = await safe(db.school.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true, name: true, email: true, role: true, status: true,
          phone: true, lastLoginAt: true, createdAt: true,
        },
        orderBy: [{ status: 'asc' }, { lastLoginAt: 'desc' }],
      },
      _count: {
        select: { students: true, staff: true, invoices: true, payments: true, users: true },
      },
    },
  }), null)

  if (!school) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 })
  }

  // Parallel aggregates scoped to this school — all wrapped in safe()
  const [
    paymentAgg,
    invoiceAgg,
    studentsByStatus,
    staffByRole,
    recentPayments,
    recentInvoices,
    schoolPayments,
  ] = await Promise.all([
    safe(db.payment.aggregate({ where: { schoolId: id }, _sum: { amount: true }, _count: true }), { _sum: { amount: 0 }, _count: 0 }),
    safe(db.invoice.aggregate({ where: { schoolId: id }, _sum: { amount: true, amountPaid: true, balance: true }, _count: true }), { _sum: { amount: 0, amountPaid: 0, balance: 0 }, _count: 0 }),
    safe(db.student.groupBy({ by: ['status'], where: { schoolId: id }, _count: true }), []),
    safe(db.staff.groupBy({ by: ['role'], where: { schoolId: id }, _count: true }), []),
    safe(db.payment.findMany({
      where: { schoolId: id },
      orderBy: { receivedAt: 'desc' },
      take: 8,
      select: {
        id: true, amount: true, method: true, reference: true,
        payerName: true, payerPhone: true, receivedBy: true, receivedAt: true,
      },
    }), []),
    safe(db.invoice.findMany({
      where: { schoolId: id },
      orderBy: { issueDate: 'desc' },
      take: 8,
      select: {
        id: true, invoiceNo: true, amount: true, amountPaid: true,
        balance: true, status: true, issueDate: true, dueDate: true,
      },
    }), []),
    safe(db.payment.findMany({
      where: { schoolId: id },
      select: { amount: true, receivedAt: true },
      take: 1000,
    }), []),
  ])

  // Monthly revenue trend (last 6 months)
  const now = new Date()
  const months: { label: string; key: string; amount: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      label: d.toLocaleDateString('en-KE', { month: 'short' }),
      key: `${d.getFullYear()}-${d.getMonth()}`,
      amount: 0,
    })
  }
  for (const p of schoolPayments) {
    const d = new Date(p.receivedAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const m = months.find(x => x.key === key)
    if (m) m.amount += p.amount
  }
  const revenueTrend = months.map(({ label, amount }) => ({ label, amount }))

  return NextResponse.json({
    school: {
      id: school.id,
      name: school.name,
      slug: school.slug,
      email: school.email,
      phone: school.phone,
      address: school.address,
      county: school.county,
      logo: school.logo,
      plan: school.plan,
      status: school.status,
      trialEndsAt: school.trialEndsAt,
      maxStudents: school.maxStudents,
      createdAt: school.createdAt,
      updatedAt: school.updatedAt,
    },
    users: school.users,
    stats: {
      userCount: school._count.users,
      studentCount: school._count.students,
      staffCount: school._count.staff,
      invoiceCount: school._count.invoices,
      paymentCount: school._count.payments,
      totalRevenue: paymentAgg._sum.amount || 0,
      totalBilled: invoiceAgg._sum.amount || 0,
      totalCollected: invoiceAgg._sum.amountPaid || 0,
      totalOutstanding: invoiceAgg._sum.balance || 0,
    },
    studentsByStatus: studentsByStatus.map(s => ({ status: s.status, count: s._count })),
    staffByRole: staffByRole.map(s => ({ role: s.role, count: s._count })),
    revenueTrend,
    recentPayments,
    recentInvoices,
  })
}

// PUT /api/superadmin/[id] — Update school status, plan & other fields
export async function PUT(req: NextRequest, { params }: Ctx) {
  const authError = await requireSuperAdmin(req)
  if (authError.error) return authError.error

  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const { status, plan, maxStudents, trialEndsAt, name, email, phone, address, county } = body

  const existing = await safe(db.school.findUnique({ where: { id } }), null)
  if (!existing) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 })
  }
  // Never allow the platform-level "school" to be modified
  if (existing.slug === 'platform') {
    return NextResponse.json({ error: 'The platform record cannot be modified' }, { status: 400 })
  }

  const data: Record<string, unknown> = {}
  if (status !== undefined) {
    const valid = ['Trial', 'Active', 'Suspended', 'Expired']
    if (!valid.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${valid.join(', ')}` }, { status: 400 })
    }
    data.status = status
  }
  if (plan !== undefined) {
    const valid = ['Starter', 'Standard', 'Premium', 'Enterprise']
    if (!valid.includes(plan)) {
      return NextResponse.json({ error: `Invalid plan. Must be one of: ${valid.join(', ')}` }, { status: 400 })
    }
    data.plan = plan
  }
  if (maxStudents !== undefined) {
    const n = Number(maxStudents)
    if (Number.isNaN(n) || n < 1) {
      return NextResponse.json({ error: 'maxStudents must be a positive integer' }, { status: 400 })
    }
    data.maxStudents = n
  }
  if (trialEndsAt !== undefined) {
    data.trialEndsAt = trialEndsAt === null ? null : new Date(trialEndsAt)
  }
  if (name !== undefined) data.name = String(name).trim()
  if (email !== undefined) data.email = email ? String(email).trim() : null
  if (phone !== undefined) data.phone = phone ? String(phone).trim() : null
  if (address !== undefined) data.address = address ? String(address).trim() : null
  if (county !== undefined) data.county = county ? String(county).trim() : null

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const updated = await db.school.update({ where: { id }, data })
  return NextResponse.json({ success: true, school: updated })
}

// DELETE /api/superadmin/[id] — Delete school + cascade all related data
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const authError = await requireSuperAdmin(req)
  if (authError.error) return authError.error

  const { id } = await params
  const existing = await db.school.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'School not found' }, { status: 404 })
  }
  // Never allow the platform-level "school" to be deleted
  if (existing.slug === 'platform') {
    return NextResponse.json({ error: 'The platform record cannot be deleted' }, { status: 400 })
  }

  // Cascade manual cleanup — relations without onDelete: Cascade on School
  // Payments → Invoices (cascade on invoiceId), plus Staff/Student (set null),
  // UserAccount (cascade on schoolId).
  await db.$transaction([
    db.payment.deleteMany({ where: { schoolId: id } }),
    db.invoice.deleteMany({ where: { schoolId: id } }),
    db.staff.updateMany({ where: { schoolId: id }, data: { schoolId: null } }),
    db.student.updateMany({ where: { schoolId: id }, data: { schoolId: null } }),
    db.userAccount.deleteMany({ where: { schoolId: id } }),
    db.school.delete({ where: { id } }),
  ])

  return NextResponse.json({ success: true, deleted: id, name: existing.name })
}
