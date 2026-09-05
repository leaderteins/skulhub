import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/** GET /api/superadmin/compare?ids=id1,id2,id3 — Compare schools side by side */
export async function GET(req: NextRequest) {
  try {
    const ids = req.nextUrl.searchParams.get('ids')?.split(',').filter(Boolean) || []
    if (ids.length < 2) return NextResponse.json({ error: 'Provide at least 2 school IDs via ?ids=id1,id2' }, { status: 400 })

    const schools = await db.$queryRawUnsafe<any[]>(`
      SELECT s.id, s.name, s.slug, s.plan, s.status, s."maxStudents", s."createdAt",
             (SELECT COUNT(*)::int FROM "Student" st WHERE st."schoolId" = s.id) as students,
             (SELECT COUNT(*)::int FROM "Staff" sf WHERE sf."schoolId" = s.id) as staff,
             (SELECT COUNT(*)::int FROM "UserAccount" u WHERE u."schoolId" = s.id) as users,
             (SELECT COUNT(*)::int FROM "Invoice" i WHERE i."schoolId" = s.id) as invoices,
             (SELECT COUNT(*)::int FROM "Payment" p WHERE p."schoolId" = s.id) as payments,
             (SELECT COALESCE(SUM(p.amount), 0)::float FROM "Payment" p WHERE p."schoolId" = s.id) as revenue,
             (SELECT COALESCE(SUM(i.balance), 0)::float FROM "Invoice" i WHERE i."schoolId" = s.id AND i.status IN ('Unpaid', 'Partially Paid')) as outstanding,
             (SELECT COUNT(*)::int FROM "BiometricLog" b WHERE b."schoolId" = s.id) as biometricTaps,
             (SELECT COUNT(*)::int FROM "BusTrip" t WHERE t."schoolId" = s.id) as busTrips
      FROM "School" s
      WHERE s.id = ANY($1::text[])
    `, ids).catch(() => [])

    const planPrices: Record<string, number> = { Starter: 2000, Standard: 5000, Premium: 10000, Enterprise: 25000 }
    const result = schools.map(s => ({
      ...s,
      revenue: Number(s.revenue) || 0,
      outstanding: Number(s.outstanding) || 0,
      collectionRate: Number(s.revenue) + Number(s.outstanding) > 0
        ? Math.round((Number(s.revenue) / (Number(s.revenue) + Number(s.outstanding))) * 100) : 0,
      monthlyPlan: planPrices[s.plan] || 2000,
    }))

    return NextResponse.json({ schools: result })
  } catch (e: any) { return NextResponse.json({ error: e?.message }, { status: 500 }) }
}
