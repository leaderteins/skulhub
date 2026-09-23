import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/** GET /api/superadmin/compare?ids=id1,id2,id3 — Compare schools side by side */
export async function GET(req: NextRequest) {
  try {
    const ids = req.nextUrl.searchParams.get('ids')?.split(',').filter(Boolean) || []
    if (ids.length < 2) return NextResponse.json({ error: 'Provide at least 2 school IDs via ?ids=id1,id2' }, { status: 400 })

    // SQLite-compatible: no ::int / ::float casts, and parameterized IN clause
    // instead of PostgreSQL's ANY($1::text[]) — both are PG-only and would
    // silently break inside the .catch(() => []) swallow.
    const placeholders = ids.map((_, i) => '$' + (i + 1)).join(',')
    const schools = await db.$queryRawUnsafe<any[]>(`
      SELECT s.id, s.name, s.slug, s.plan, s.status, s."maxStudents", s."createdAt",
             (SELECT COUNT(*) FROM "Student" st WHERE st."schoolId" = s.id) as students,
             (SELECT COUNT(*) FROM "Staff" sf WHERE sf."schoolId" = s.id) as staff,
             (SELECT COUNT(*) FROM "UserAccount" u WHERE u."schoolId" = s.id) as users,
             (SELECT COUNT(*) FROM "Invoice" i WHERE i."schoolId" = s.id) as invoices,
             (SELECT COUNT(*) FROM "Payment" p WHERE p."schoolId" = s.id) as payments,
             (SELECT COALESCE(SUM(p.amount), 0) FROM "Payment" p WHERE p."schoolId" = s.id) as revenue,
             (SELECT COALESCE(SUM(i.balance), 0) FROM "Invoice" i WHERE i."schoolId" = s.id AND i.status IN ('Unpaid', 'Partially Paid')) as outstanding,
             (SELECT COUNT(*) FROM "BiometricLog" b WHERE b."schoolId" = s.id) as biometricTaps,
             (SELECT COUNT(*) FROM "BusTrip" t WHERE t."schoolId" = s.id) as busTrips
      FROM "School" s
      WHERE s.id IN (${placeholders})
    `, ...ids).catch(() => [])

    const planPrices: Record<string, number> = { Starter: 2000, Standard: 5000, Premium: 10000, Enterprise: 25000 }
    // Safe number conversion (SQLite returns bigint for COUNT/SUM)
    const toNum = (v: any) => {
      if (v == null) return 0
      if (typeof v === 'bigint') return Number(v.toString())
      return Number(v) || 0
    }
    const result = schools.map((s: any) => ({
      ...s,
      students: toNum(s.students),
      staff: toNum(s.staff),
      users: toNum(s.users),
      invoices: toNum(s.invoices),
      payments: toNum(s.payments),
      revenue: toNum(s.revenue),
      outstanding: toNum(s.outstanding),
      biometricTaps: toNum(s.biometricTaps),
      busTrips: toNum(s.busTrips),
      collectionRate: toNum(s.revenue) + toNum(s.outstanding) > 0
        ? Math.round((toNum(s.revenue) / (toNum(s.revenue) + toNum(s.outstanding))) * 100) : 0,
      monthlyPlan: planPrices[s.plan] || 2000,
    }))

    return NextResponse.json({ schools: result })
  } catch (e: any) { return NextResponse.json({ error: e?.message }, { status: 500 }) }
}
