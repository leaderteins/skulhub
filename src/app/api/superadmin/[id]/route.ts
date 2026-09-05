import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

async function safe<T>(promise: Promise<T>, fallback: T): Promise<T> {
  try { return await promise } catch (e) { return fallback }
}

// GET /api/superadmin/[id] — School detail with full stats (raw SQL)
export async function GET(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params

    const schools = await db.$queryRawUnsafe<any[]>(`SELECT * FROM "School" WHERE id = $1 LIMIT 1`, id).catch(() => [])
    if (schools.length === 0) return NextResponse.json({ error: 'School not found' }, { status: 404 })
    const school = schools[0]

    const users = await db.$queryRawUnsafe<any[]>(`SELECT id, name, email, role, status, phone, "lastLoginAt", "createdAt" FROM "UserAccount" WHERE "schoolId" = $1 ORDER BY status ASC, "lastLoginAt" DESC`, id).catch(() => [])

    const [payAgg, invAgg, stuCount, staffCount] = await Promise.all([
      safe(db.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as count, COALESCE(SUM(amount),0)::float as total FROM "Payment" WHERE "schoolId" = $1`, id), [{count:0,total:0}]),
      safe(db.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as count, COALESCE(SUM(amount),0)::float as total, COALESCE(SUM("amountPaid"),0)::float as paid, COALESCE(SUM(balance),0)::float as balance FROM "Invoice" WHERE "schoolId" = $1`, id), [{count:0,total:0,paid:0,balance:0}]),
      safe(db.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as count FROM "Student" WHERE "schoolId" = $1`, id), [{count:0}]),
      safe(db.$queryRawUnsafe<any[]>(`SELECT COUNT(*)::int as count FROM "Staff" WHERE "schoolId" = $1`, id), [{count:0}]),
    ])

    const recentPayments = await db.$queryRawUnsafe<any[]>(`SELECT id, amount, method, reference, "payerName", "payerPhone", "receivedBy", "receivedAt" FROM "Payment" WHERE "schoolId" = $1 ORDER BY "receivedAt" DESC LIMIT 8`, id).catch(() => [])
    const recentInvoices = await db.$queryRawUnsafe<any[]>(`SELECT id, "invoiceNo", amount, "amountPaid", balance, status, "issueDate", "dueDate" FROM "Invoice" WHERE "schoolId" = $1 ORDER BY "issueDate" DESC LIMIT 8`, id).catch(() => [])
    const schoolPayments = await db.$queryRawUnsafe<any[]>(`SELECT amount, "receivedAt" FROM "Payment" WHERE "schoolId" = $1 LIMIT 1000`, id).catch(() => [])

    const now = new Date()
    const months: { label: string; key: string; amount: number }[] = []
    for (let i = 5; i >= 0; i--) { const d = new Date(now.getFullYear(), now.getMonth() - i, 1); months.push({ label: d.toLocaleDateString('en-KE', { month: 'short' }), key: `${d.getFullYear()}-${d.getMonth()}`, amount: 0 }) }
    for (const p of schoolPayments) { const d = new Date(p.receivedAt); const key = `${d.getFullYear()}-${d.getMonth()}`; const m = months.find(x => x.key === key); if (m) m.amount += Number(p.amount) || 0 }

    return NextResponse.json({
      school: { ...school, users: users.map((u:any) => ({...u})), _count: { students: Number(stuCount[0]?.count)||0, staff: Number(staffCount[0]?.count)||0, invoices: Number(invAgg[0]?.count)||0, payments: Number(payAgg[0]?.count)||0, users: users.length } },
      stats: { totalRevenue: Number(payAgg[0]?.total)||0, paymentCount: Number(payAgg[0]?.count)||0, totalBilled: Number(invAgg[0]?.total)||0, totalPaid: Number(invAgg[0]?.paid)||0, outstandingBalance: Number(invAgg[0]?.balance)||0, invoiceCount: Number(invAgg[0]?.count)||0 },
      recentPayments: recentPayments.map((p:any) => ({...p, amount: Number(p.amount), receivedAt: p.receivedAt})),
      recentInvoices: recentInvoices.map((i:any) => ({...i, amount: Number(i.amount), amountPaid: Number(i.amountPaid), balance: Number(i.balance)})),
      revenueTrend: months.map(({label, amount}) => ({label, amount})),
    })
  } catch (e: any) { return NextResponse.json({ error: e?.message }, { status: 500 }) }
}

// PUT /api/superadmin/[id] — Update school (status, plan, etc.)
export async function PUT(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const { status, plan, maxStudents, name, email, phone, address, county } = body

    const existing = await db.$queryRawUnsafe<any[]>(`SELECT slug FROM "School" WHERE id = $1 LIMIT 1`, id).catch(() => [])
    if (existing.length === 0) return NextResponse.json({ error: 'School not found' }, { status: 404 })
    if (existing[0].slug === 'platform') return NextResponse.json({ error: 'The platform record cannot be modified' }, { status: 400 })

    const sets: string[] = ['"updatedAt" = NOW()']
    const vals: any[] = []
    let idx = 1
    if (status !== undefined) { const valid = ['Trial', 'Active', 'Suspended', 'Expired']; if (!valid.includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 }); sets.push(`status = $${idx++}`); vals.push(status) }
    if (plan !== undefined) { const valid = ['Starter', 'Standard', 'Premium', 'Enterprise']; if (!valid.includes(plan)) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 }); sets.push(`plan = $${idx++}`); vals.push(plan) }
    if (maxStudents !== undefined) { const n = Number(maxStudents); if (Number.isNaN(n) || n < 1) return NextResponse.json({ error: 'maxStudents must be positive' }, { status: 400 }); sets.push(`"maxStudents" = $${idx++}`); vals.push(n) }
    if (name !== undefined) { sets.push(`name = $${idx++}`); vals.push(String(name).trim()) }
    if (email !== undefined) { sets.push(`email = $${idx++}`); vals.push(email ? String(email).trim() : null) }
    if (phone !== undefined) { sets.push(`phone = $${idx++}`); vals.push(phone ? String(phone).trim() : null) }
    if (address !== undefined) { sets.push(`address = $${idx++}`); vals.push(address ? String(address).trim() : null) }
    if (county !== undefined) { sets.push(`county = $${idx++}`); vals.push(county ? String(county).trim() : null) }

    if (sets.length === 1) return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    vals.push(id)
    await db.$executeRawUnsafe(`UPDATE "School" SET ${sets.join(', ')} WHERE id = $${idx}`, ...vals)

    const updated = await db.$queryRawUnsafe<any[]>(`SELECT * FROM "School" WHERE id = $1 LIMIT 1`, id).catch(() => [])
    return NextResponse.json({ success: true, school: updated[0] || null })
  } catch (e: any) { return NextResponse.json({ error: e?.message }, { status: 500 }) }
}

// DELETE /api/superadmin/[id]
export async function DELETE(req: NextRequest, { params }: Ctx) {
  try {
    const { id } = await params
    const existing = await db.$queryRawUnsafe<any[]>(`SELECT slug FROM "School" WHERE id = $1 LIMIT 1`, id).catch(() => [])
    if (existing.length === 0) return NextResponse.json({ error: 'School not found' }, { status: 404 })
    if (existing[0].slug === 'platform') return NextResponse.json({ error: 'Cannot delete the platform record' }, { status: 400 })
    await db.$executeRawUnsafe(`DELETE FROM "School" WHERE id = $1`, id).catch(() => {})
    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ error: e?.message }, { status: 500 }) }
}
