import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/superadmin/platform-stats
 *
 * Platform-wide analytics across ALL schools:
 * - Total students, staff, users across all schools
 * - Total fees collected (all-time + this month)
 * - Total invoices issued
 * - Most popular modules (by usage)
 * - Growth trends (students, revenue, schools per month)
 * - Plan distribution
 */
export async function GET() {
  try {
    // 1. Aggregated counts across all schools
    const totals = await db.$queryRawUnsafe<any[]>(`
      SELECT
        (SELECT COUNT(*) FROM "School" WHERE slug != 'platform') as total_schools,
        (SELECT COUNT(*) FROM "School" WHERE slug != 'platform' AND status = 'Active') as active_schools,
        (SELECT COUNT(*) FROM "Student" WHERE "schoolId" IS NOT NULL) as total_students,
        (SELECT COUNT(*) FROM "Staff" WHERE "schoolId" IS NOT NULL) as total_staff,
        (SELECT COUNT(*) FROM "UserAccount") as total_users,
        (SELECT COUNT(*) FROM "Invoice") as total_invoices,
        (SELECT COUNT(*) FROM "Payment") as total_payments,
        (SELECT COALESCE(SUM(amount), 0) FROM "Payment") as total_revenue,
        (SELECT COALESCE(SUM(amount), 0) FROM "Invoice") as total_billed,
        (SELECT COALESCE(SUM(balance), 0) FROM "Invoice" WHERE status IN ('Unpaid', 'Partially Paid')) as total_outstanding
    `).catch(() => [{}])

    const t = totals[0] || {}

    // 2. Monthly trends (last 12 months)
    const now = new Date()
    const monthlyData = []
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthLabel = d.toLocaleDateString('en-KE', { month: 'short', year: '2-digit' })

      const monthStats = await db.$queryRawUnsafe<any[]>(`
        SELECT
          (SELECT COUNT(*) FROM "School" WHERE slug != 'platform' AND "createdAt" >= $1 AND "createdAt" < $2) as new_schools,
          (SELECT COUNT(*) FROM "Student" WHERE "createdAt" >= $1 AND "createdAt" < $2) as new_students,
          (SELECT COALESCE(SUM(amount), 0) FROM "Payment" WHERE "receivedAt" >= $1 AND "receivedAt" < $2) as revenue,
          (SELECT COUNT(*) FROM "Payment" WHERE "receivedAt" >= $1 AND "receivedAt" < $2) as payment_count
      `, d, nextMonth).catch(() => [{ new_schools: 0, new_students: 0, revenue: 0, payment_count: 0 }])

      const ms = monthStats[0] || {}
      monthlyData.push({
        month: monthLabel,
        newSchools: Number(ms.new_schools) || 0,
        newStudents: Number(ms.new_students) || 0,
        revenue: Number(ms.revenue) || 0,
        payments: Number(ms.payment_count) || 0,
      })
    }

    // 3. Plan distribution
    const planDistribution = await db.$queryRawUnsafe<any[]>(`
      SELECT plan, COUNT(*)::int as count,
             (SELECT COALESCE(SUM(p.amount), 0) FROM "Payment" p
              JOIN "School" s2 ON s2.id = p."schoolId" WHERE s2.plan = s.plan) as revenue
      FROM "School" s WHERE slug != 'platform'
      GROUP BY plan
    `).catch(() => [])

    // 4. Top performing schools (by revenue)
    const topSchools = await db.$queryRawUnsafe<any[]>(`
      SELECT s.id, s.name, s.plan, s.status,
             (SELECT COUNT(*) FROM "Student" st WHERE st."schoolId" = s.id) as student_count,
             (SELECT COALESCE(SUM(p.amount), 0) FROM "Payment" p WHERE p."schoolId" = s.id) as revenue,
             (SELECT COUNT(*) FROM "UserAccount" u WHERE u."schoolId" = s.id AND u."lastLoginAt" > NOW() - INTERVAL '7 days') as active_users_7d
      FROM "School" s WHERE s.slug != 'platform'
      ORDER BY revenue DESC LIMIT 10
    `).catch(() => [])

    // 5. Average metrics per school
    const schoolCount = Number(t.total_schools) || 1
    const averages = {
      avgStudentsPerSchool: Math.round((Number(t.total_students) || 0) / schoolCount),
      avgRevenuePerSchool: Math.round((Number(t.total_revenue) || 0) / schoolCount),
      avgUsersPerSchool: Math.round((Number(t.total_users) || 0) / schoolCount),
      collectionRate: Number(t.total_billed) > 0
        ? Math.round((Number(t.total_revenue) / Number(t.total_billed)) * 100)
        : 0,
    }

    return NextResponse.json({
      totals: {
        schools: Number(t.total_schools) || 0,
        activeSchools: Number(t.active_schools) || 0,
        students: Number(t.total_students) || 0,
        staff: Number(t.total_staff) || 0,
        users: Number(t.total_users) || 0,
        invoices: Number(t.total_invoices) || 0,
        payments: Number(t.total_payments) || 0,
        totalRevenue: Number(t.total_revenue) || 0,
        totalBilled: Number(t.total_billed) || 0,
        totalOutstanding: Number(t.total_outstanding) || 0,
      },
      averages,
      monthlyData,
      planDistribution: planDistribution.map((p: any) => ({
        plan: p.plan,
        count: Number(p.count),
        revenue: Number(p.revenue),
      })),
      topSchools: topSchools.map((s: any) => ({
        id: s.id,
        name: s.name,
        plan: s.plan,
        status: s.status,
        studentCount: Number(s.student_count),
        revenue: Number(s.revenue),
        activeUsers7d: Number(s.active_users_7d),
      })),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
