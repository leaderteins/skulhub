import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

// GET /api/superadmin — Platform-wide dashboard data for the platform owner.
// Returns aggregated stats across every school on the platform.
// Requires a super_admin session (platform owner).
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }
  if (user.role !== 'super_admin') {
    return NextResponse.json(
      { error: 'Forbidden — super admin access required' },
      { status: 403 }
    )
  }

  // The "platform" school is a system record (owns the super-admin user) and
  // must never appear in tenant listings or platform-wide stats.
  const tenantWhere = { slug: { not: 'platform' } }

  // Aggregate counts in parallel
  const [
    totalSchools,
    activeSchools,
    trialSchools,
    suspendedSchools,
    expiredSchools,
    totalUsers,
    totalStudents,
    totalStaff,
    totalInvoices,
    paymentsAgg,
    schools,
    recentSchools,
  ] = await Promise.all([
    db.school.count({ where: tenantWhere }),
    db.school.count({ where: { ...tenantWhere, status: 'Active' } }),
    db.school.count({ where: { ...tenantWhere, status: 'Trial' } }),
    db.school.count({ where: { ...tenantWhere, status: 'Suspended' } }),
    db.school.count({ where: { ...tenantWhere, status: 'Expired' } }),
    db.userAccount.count({ where: { school: { slug: { not: 'platform' } } } }),
    db.student.count({ where: { schoolId: { not: null }, school: { slug: { not: 'platform' } } } }),
    db.staff.count({ where: { schoolId: { not: null }, school: { slug: { not: 'platform' } } } }),
    db.invoice.count({ where: { schoolId: { not: null }, school: { slug: { not: 'platform' } } } }),
    db.payment.aggregate({
      where: { school: { slug: { not: 'platform' } } },
      _sum: { amount: true },
      _count: true,
    }),
    db.school.findMany({
      where: tenantWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        users: {
          select: { id: true, name: true, email: true, role: true, status: true, lastLoginAt: true },
          orderBy: { lastLoginAt: 'desc' },
        },
        _count: { select: { students: true, staff: true, invoices: true, payments: true, users: true } },
      },
    }),
    db.school.findMany({
      where: tenantWhere,
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: {
        id: true, name: true, slug: true, plan: true, status: true,
        county: true, createdAt: true, trialEndsAt: true,
        _count: { select: { students: true, users: true } },
      },
    }),
  ])

  // Revenue per school
  const revenueBySchoolRaw = await db.payment.groupBy({
    by: ['schoolId'],
    where: { school: { slug: { not: 'platform' } } },
    _sum: { amount: true },
    _count: true,
  })
  const revenueBySchoolMap = new Map<string, number>()
  for (const r of revenueBySchoolRaw) {
    if (r.schoolId) revenueBySchoolMap.set(r.schoolId, r._sum.amount || 0)
  }

  // Revenue by plan
  const planRevenue: Record<string, number> = { Starter: 0, Standard: 0, Premium: 0, Enterprise: 0 }
  const planSchools: Record<string, number> = { Starter: 0, Standard: 0, Premium: 0, Enterprise: 0 }
  for (const s of schools) {
    if (planSchools[s.plan] !== undefined) planSchools[s.plan]++
    const rev = revenueBySchoolMap.get(s.id) || 0
    if (planRevenue[s.plan] !== undefined) planRevenue[s.plan] += rev
  }

  // Schools by status
  const schoolsByStatus = [
    { name: 'Active', value: activeSchools, color: '#059669' },
    { name: 'Trial', value: trialSchools, color: '#f59e0b' },
    { name: 'Suspended', value: suspendedSchools, color: '#ef4444' },
    { name: 'Expired', value: expiredSchools, color: '#64748b' },
  ].filter(s => s.value > 0)

  // Monthly growth — last 6 months
  const now = new Date()
  const months: { label: string; key: string; count: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('en-KE', { month: 'short' })
    const key = `${d.getFullYear()}-${d.getMonth()}`
    months.push({ label, key, count: 0 })
  }
  for (const s of schools) {
    const d = new Date(s.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const m = months.find(x => x.key === key)
    if (m) m.count++
  }
  const monthlyGrowth = months.map(({ label, count }) => ({ label, count }))

  // Schools list with computed fields
  const schoolsList = schools.map(s => {
    const revenue = revenueBySchoolMap.get(s.id) || 0
    const lastLoginAt = s.users
      .map(u => u.lastLoginAt)
      .filter(Boolean)
      .sort((a, b) => new Date(b!).getTime() - new Date(a!).getTime())[0] || null
    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      email: s.email,
      phone: s.phone,
      address: s.address,
      county: s.county,
      plan: s.plan,
      status: s.status,
      trialEndsAt: s.trialEndsAt,
      maxStudents: s.maxStudents,
      createdAt: s.createdAt,
      userCount: s._count.users,
      studentCount: s._count.students,
      staffCount: s._count.staff,
      invoiceCount: s._count.invoices,
      paymentCount: s._count.payments,
      revenue,
      lastLoginAt,
      users: s.users,
    }
  })

  // Recent registrations (last 5)
  const recentRegistrations = recentSchools.map(s => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    plan: s.plan,
    status: s.status,
    county: s.county,
    createdAt: s.createdAt,
    trialEndsAt: s.trialEndsAt,
    userCount: s._count.users,
    studentCount: s._count.students,
  }))

  return NextResponse.json({
    summary: {
      totalSchools,
      activeSchools,
      trialSchools,
      suspendedSchools,
      expiredSchools,
      totalUsers,
      totalStudents,
      totalStaff,
      totalInvoices,
      totalPayments: paymentsAgg._count,
      totalRevenue: paymentsAgg._sum.amount || 0,
    },
    revenueByPlan: Object.entries(planRevenue).map(([plan, amount]) => ({ plan, amount })),
    schoolsByPlan: Object.entries(planSchools).map(([plan, count]) => ({ plan, count })),
    schoolsByStatus,
    monthlyGrowth,
    recentRegistrations,
    schools: schoolsList,
  })
}
