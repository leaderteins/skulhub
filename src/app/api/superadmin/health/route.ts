import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/** GET /api/superadmin/health — Platform health monitor */
export async function GET() {
  try {
    // SQLite-compatible: no ::int / ::float casts (PostgreSQL-only).
    // COUNT(*) returns bigint on SQLite — convert with Number() in JS below.
    const schools = await db.$queryRawUnsafe<any[]>(`
      SELECT s.id, s.name, s.slug, s.status,
             (SELECT COUNT(*) FROM "UserAccount" u WHERE u."schoolId" = s.id) as users,
             (SELECT COUNT(*) FROM "Student" st WHERE st."schoolId" = s.id) as students,
             (SELECT MAX(u."lastLoginAt") FROM "UserAccount" u WHERE u."schoolId" = s.id) as lastLogin,
             (SELECT COUNT(*) FROM "Payment" p WHERE p."schoolId" = s.id) as payments,
             (SELECT COUNT(*) FROM "Invoice" i WHERE i."schoolId" = s.id) as invoices,
             (SELECT COALESCE(SUM(p.amount), 0) FROM "Payment" p WHERE p."schoolId" = s.id) as revenue
      FROM "School" s WHERE s.slug != 'platform'
      ORDER BY s.name
    `).catch(() => [])

    // Safe number conversion for SQLite (returns bigint for COUNT/SUM).
    const toNum = (v: any) => {
      if (v == null) return 0
      if (typeof v === 'bigint') return Number(v.toString())
      return Number(v) || 0
    }

    const now = new Date()
    const schoolHealth = schools.map((s: any) => {
      // Safely handle bigint lastLogin (new Date(bigint) can crash)
      const lastLoginRaw = typeof s.lastLogin === 'bigint' ? Number(s.lastLogin.toString()) : s.lastLogin
      const daysSinceLogin = lastLoginRaw ? Math.floor((now.getTime() - new Date(lastLoginRaw).getTime()) / (1000 * 60 * 60 * 24)) : null
      let health: 'healthy' | 'warning' | 'critical' = 'healthy'
      if (s.status === 'Suspended' || s.status === 'Expired') health = 'critical'
      else if (daysSinceLogin && daysSinceLogin > 14) health = 'warning'
      else if (daysSinceLogin && daysSinceLogin > 7) health = 'warning'
      return {
        ...s,
        users: toNum(s.users),
        students: toNum(s.students),
        payments: toNum(s.payments),
        invoices: toNum(s.invoices),
        // Override raw lastLogin (could be bigint if stored as INTEGER epoch)
        // with the safely-coerced value used for daysSinceLogin computation.
        lastLogin: lastLoginRaw instanceof Date ? lastLoginRaw.toISOString() : lastLoginRaw,
        daysSinceLogin,
        health,
        revenue: toNum(s.revenue),
      }
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
