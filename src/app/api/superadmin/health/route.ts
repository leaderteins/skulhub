import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/** GET /api/superadmin/health — Platform health monitor */
export async function GET() {
  try {
    const schools = await db.$queryRawUnsafe<any[]>(`
      SELECT s.id, s.name, s.slug, s.status,
             (SELECT COUNT(*)::int FROM "UserAccount" u WHERE u."schoolId" = s.id) as users,
             (SELECT COUNT(*)::int FROM "Student" st WHERE st."schoolId" = s.id) as students,
             (SELECT MAX(u."lastLoginAt") FROM "UserAccount" u WHERE u."schoolId" = s.id) as lastLogin,
             (SELECT COUNT(*)::int FROM "Payment" p WHERE p."schoolId" = s.id) as payments,
             (SELECT COUNT(*)::int FROM "Invoice" i WHERE i."schoolId" = s.id) as invoices,
             (SELECT COALESCE(SUM(p.amount), 0)::float FROM "Payment" p WHERE p."schoolId" = s.id) as revenue
      FROM "School" s WHERE s.slug != 'platform'
      ORDER BY s.name
    `).catch(() => [])

    const now = new Date()
    const schoolHealth = schools.map(s => {
      const daysSinceLogin = s.lastLogin ? Math.floor((now.getTime() - new Date(s.lastLogin).getTime()) / (1000 * 60 * 60 * 24)) : null
      let health: 'healthy' | 'warning' | 'critical' = 'healthy'
      if (s.status === 'Suspended' || s.status === 'Expired') health = 'critical'
      else if (daysSinceLogin && daysSinceLogin > 14) health = 'warning'
      else if (daysSinceLogin && daysSinceLogin > 7) health = 'warning'
      return { ...s, daysSinceLogin, health, revenue: Number(s.revenue) || 0 }
    })

    const summary = {
      totalSchools: schools.length,
      healthy: schoolHealth.filter(s => s.health === 'healthy').length,
      warning: schoolHealth.filter(s => s.health === 'warning').length,
      critical: schoolHealth.filter(s => s.health === 'critical').length,
    }

    return NextResponse.json({ summary, schools: schoolHealth })
  } catch (e: any) { return NextResponse.json({ error: e?.message }, { status: 500 }) }
}
