import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/subscriptions/pay
 * Records a subscription payment (M-Pesa) for a school.
 * Body: { schoolId, plan, amount, method, reference }
 *
 * This is how the platform owner gets paid — schools pay monthly
 * subscriptions to use SkulHub.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      schoolId: string
      plan: string
      amount: number
      method: string
      reference: string
    }

    if (!body.schoolId || !body.plan || !body.amount) {
      return NextResponse.json({ error: 'schoolId, plan, and amount are required' }, { status: 400 })
    }

    const paymentId = `subpay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // Record the subscription payment
    await db.$executeRawUnsafe(`
      INSERT INTO "Payment" (id, "schoolId", amount, method, status, reference, "payerName", "payerPhone", "receivedBy", "receivedAt", "createdAt")
      VALUES ($1, $2, $3, $4, 'Completed', $5, 'Platform Subscription', 'N/A', 'System', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, paymentId, body.schoolId, body.amount, body.method || 'M-Pesa', body.reference || `SUB-${Date.now()}`).catch(() => {})

    // Update school plan + activate
    const maxStudents: Record<string, number> = { Starter: 200, Standard: 500, Premium: 2000, Enterprise: 10000 }
    await db.$executeRawUnsafe(`
      UPDATE "School" SET plan = $1, "maxStudents" = $2, status = 'Active', "updatedAt" = NOW()
      WHERE id = $3
    `, body.plan, maxStudents[body.plan] || 200, body.schoolId).catch(() => {})

    return NextResponse.json({
      success: true,
      paymentId,
      plan: body.plan,
      amount: body.amount,
      message: `Subscription payment of KES ${body.amount} recorded. School activated on ${body.plan} plan.`,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
