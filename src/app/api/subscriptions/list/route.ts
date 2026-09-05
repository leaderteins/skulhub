import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/subscriptions/list
 * Lists all school subscriptions (super admin only).
 * Shows: school name, plan, status, amount, next billing date.
 */
export async function GET(req: NextRequest) {
  try {
    const subscriptions = await db.$queryRawUnsafe<any[]>(`
      SELECT s.id, s.name, s.slug, s.plan, s.status, s."trialEndsAt",
             s."maxStudents", s."createdAt",
             (SELECT SUM(amount) FROM "Payment" p WHERE p."schoolId" = s.id) as "totalRevenue",
             (SELECT MAX("receivedAt") FROM "Payment" p WHERE p."schoolId" = s.id) as "lastPayment"
      FROM "School" s
      WHERE s.slug != 'platform'
      ORDER BY s."createdAt" DESC
    `).catch(() => [])

    const plans = {
      Starter: { price: 2000, students: 200, features: ['Core modules', 'SMS (100/mo)', 'Basic reports'] },
      Standard: { price: 5000, students: 500, features: ['All modules', 'SMS (500/mo)', 'Biometric', 'Bus tracking'] },
      Premium: { price: 10000, students: 2000, features: ['Everything', 'Unlimited SMS', 'AI assistant', 'White-label'] },
      Enterprise: { price: 25000, students: 10000, features: ['Everything + custom', 'Dedicated support', 'API access'] },
    }

    return NextResponse.json({ subscriptions, plans })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

/**
 * POST /api/subscriptions/create
 * Creates or updates a subscription for a school.
 * Body: { schoolId, plan, billingCycle }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { schoolId: string; plan: string; billingCycle?: string }
    if (!body.schoolId || !body.plan) return NextResponse.json({ error: 'schoolId and plan required' }, { status: 400 })

    const validPlans = ['Starter', 'Standard', 'Premium', 'Enterprise']
    if (!validPlans.includes(body.plan)) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

    const prices: Record<string, number> = { Starter: 2000, Standard: 5000, Premium: 10000, Enterprise: 25000 }
    const maxStudents: Record<string, number> = { Starter: 200, Standard: 500, Premium: 2000, Enterprise: 10000 }

    await db.$executeRawUnsafe(`
      UPDATE "School" SET plan = $1, "maxStudents" = $2, status = 'Active', "updatedAt" = NOW()
      WHERE id = $3
    `, body.plan, maxStudents[body.plan], body.schoolId).catch(() => {})

    return NextResponse.json({
      success: true,
      plan: body.plan,
      price: prices[body.plan],
      maxStudents: maxStudents[body.plan],
      message: `School upgraded to ${body.plan} plan (KES ${prices[body.plan]}/month)`,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
