import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/superadmin/trials
 *
 * Trial Conversion Tracker — shows:
 * - Active trials (with days remaining until expiry)
 * - Conversion rate (trials → paid)
 * - Trials expiring soon (7 days or less)
 * - Expired trials (not converted)
 * - Revenue at risk from expiring trials
 */
export async function GET() {
  try {
    // 1. Get all trial schools with their trial end dates
    const trials = await db.$queryRawUnsafe<any[]>(`
      SELECT s.id, s.name, s.slug, s.plan, s.status, s."trialEndsAt", s."createdAt",
             s."maxStudents",
             (SELECT COUNT(*)::int FROM "UserAccount" u WHERE u."schoolId" = s.id) as user_count,
             (SELECT COUNT(*)::int FROM "Student" st WHERE st."schoolId" = s.id) as student_count
      FROM "School" s
      WHERE s.slug != 'platform'
      ORDER BY s."trialEndsAt" ASC
    `).catch(() => [])

    const now = new Date()
    let activeTrials = 0
    let expiringSoon = 0
    let expired = 0
    let converted = 0
    const trialDetails: any[] = []

    for (const t of trials) {
      const daysLeft = t.trialEndsAt
        ? Math.ceil((new Date(t.trialEndsAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
        : null

      if (t.status === 'Trial') {
        if (daysLeft !== null && daysLeft > 0) {
          activeTrials++
          if (daysLeft <= 7) expiringSoon++
          trialDetails.push({
            ...t,
            daysLeft,
            urgency: daysLeft <= 3 ? 'critical' : daysLeft <= 7 ? 'urgent' : 'ok',
            userCount: Number(t.user_count) || 0,
            studentCount: Number(t.student_count) || 0,
          })
        } else {
          expired++
          trialDetails.push({
            ...t,
            daysLeft: 0,
            urgency: 'expired',
            userCount: Number(t.user_count) || 0,
            studentCount: Number(t.student_count) || 0,
          })
        }
      } else if (t.status === 'Active' || t.status === 'Suspended') {
        converted++
      }
    }

    // 2. Get conversion stats
    const totalSchools = trials.length
    const conversionRate = totalSchools > 0 ? Math.round((converted / totalSchools) * 100) : 0

    // 3. Revenue at risk (potential MRR from expiring trials)
    const planPrices: Record<string, number> = { Starter: 2000, Standard: 5000, Premium: 10000, Enterprise: 25000 }
    const revenueAtRisk = trialDetails
      .filter(t => t.urgency === 'critical' || t.urgency === 'urgent')
      .reduce((sum, t) => sum + (planPrices[t.plan] || 2000), 0)

    // 4. Historical conversions (last 6 months)
    const monthlyConversions = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const nextMonth = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
      const monthTrials = trials.filter(t => {
        const created = new Date(t.createdAt)
        return created >= d && created < nextMonth
      })
      const monthConverted = monthTrials.filter(t => t.status !== 'Trial' && t.status !== 'Expired')
      monthlyConversions.push({
        month: d.toLocaleDateString('en-KE', { month: 'short' }),
        trials: monthTrials.length,
        converted: monthConverted.length,
        rate: monthTrials.length > 0 ? Math.round((monthConverted.length / monthTrials.length) * 100) : 0,
      })
    }

    return NextResponse.json({
      summary: {
        totalSchools,
        activeTrials,
        expiringSoon,
        expired,
        converted,
        conversionRate,
        revenueAtRisk,
      },
      trials: trialDetails,
      monthlyConversions,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
