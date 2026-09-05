import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/** GET /api/superadmin/churn — Revenue churn analysis */
export async function GET() {
  try {
    const churned = await db.$queryRawUnsafe<any[]>(`
      SELECT s.id, s.name, s.slug, s.plan, s.status, s."updatedAt",
             (SELECT COALESCE(SUM(p.amount), 0) FROM "Payment" p WHERE p."schoolId" = s.id) as "lostRevenue",
             (SELECT COUNT(*)::int FROM "Student" st WHERE st."schoolId" = s.id) as "studentCount"
      FROM "School" s
      WHERE s.slug != 'platform' AND s.status IN ('Suspended', 'Expired')
      ORDER BY s."updatedAt" DESC
    `).catch(() => [])

    const planPrices: Record<string, number> = { Starter: 2000, Standard: 5000, Premium: 10000, Enterprise: 25000 }
    const totalLostMRR = churned.reduce((sum, s) => sum + (planPrices[s.plan] || 2000), 0)
    const totalLostRevenue = churned.reduce((sum, s) => sum + Number(s.lostRevenue || 0), 0)

    const winBack = churned.filter(s => s.status === 'Suspended')
    const expired = churned.filter(s => s.status === 'Expired')

    // Monthly churn trend (last 6 months)
    const now = new Date()
    const monthlyChurn = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthChurned = churned.filter(s => {
        const updated = new Date(s.updatedAt)
        return updated >= d && updated < next
      })
      monthlyChurn.push({ month: d.toLocaleDateString('en-KE', { month: 'short' }), churned: monthChurned.length, lostMRR: monthChurned.reduce((s, sc) => s + (planPrices[sc.plan] || 2000), 0) })
    }

    return NextResponse.json({
      summary: { totalChurned: churned.length, totalLostMRR, totalLostRevenue, winBackOpportunities: winBack.length, expiredCount: expired.length },
      churnedSchools: churned.map(s => ({ ...s, lostMRR: planPrices[s.plan] || 2000, lostRevenue: Number(s.lostRevenue) || 0, studentCount: Number(s.studentCount) || 0 })),
      monthlyChurn,
    })
  } catch (e: any) { return NextResponse.json({ error: e?.message }, { status: 500 }) }
}
