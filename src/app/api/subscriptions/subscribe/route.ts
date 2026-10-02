import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'
import { initiateStkPush, normalizeMpesaPhone } from '@/lib/mpesa'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as { plan?: string; phone?: string }
    const plan = (body.plan || '').trim()
    const phone = (body.phone || '').trim()

    const VALID_PLANS = ['Starter', 'Standard', 'Premium'] as const
    if (!VALID_PLANS.includes(plan as any)) {
      return NextResponse.json({ error: 'Invalid plan. Choose Starter, Standard, or Premium.' }, { status: 400 })
    }
    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
    }

    const PRICES: Record<string, number> = { Starter: 2500, Standard: 5000, Premium: 10000 }
    const MAX_STUDENTS: Record<string, number> = { Starter: 200, Standard: 500, Premium: 2000 }
    const amount = PRICES[plan]
    const maxStudents = MAX_STUDENTS[plan]
    const normalizedPhone = normalizeMpesaPhone(phone)

    const user = await getUserFromRequest(req)
    if (!user?.schoolId) {
      return NextResponse.json({ error: 'No school found for this account.' }, { status: 400 })
    }

    // Load platform M-Pesa config from Settings table OR env vars
    const settings = await db.$queryRawUnsafe<any[]>(
      `SELECT key, value FROM "Settings" WHERE key LIKE 'mpesa_%'`
    ).catch(() => [])
    const config: Record<string, string> = {}
    for (const s of settings) config[s.key] = s.value

    const CONSUMER_KEY = config.mpesa_consumer_key || process.env.MPESA_CONSUMER_KEY
    const CONSUMER_SECRET = config.mpesa_consumer_secret || process.env.MPESA_CONSUMER_SECRET
    const SHORTCODE = config.mpesa_shortcode || process.env.MPESA_SHORTCODE || '174379'
    const PASSKEY = config.mpesa_passkey || process.env.MPESA_PASSKEY || 'bfb279f9aa9bdbcf15824ea6ca4253b92ad2c6ca84b1a5cbf1db0c5f7e7c3e3'
    const ENV = config.mpesa_env || process.env.MPESA_ENV || 'sandbox'
    const CALLBACK_URL = config.mpesa_callback_url || process.env.MPESA_CALLBACK_URL || 'https://www.skulhub.co.ke/api/mpesa/callback'

    if (!CONSUMER_KEY || !CONSUMER_SECRET) {
      const paymentId = `subpay_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      await db.$executeRawUnsafe(`
        INSERT INTO "Payment" (id, "schoolId", amount, method, status, reference, "payerName", "payerPhone", "receivedBy", "receivedAt")
        VALUES ($1, $2, $3, 'M-Pesa', 'Demo', $4, 'Platform Subscription', $5, 'System', CURRENT_TIMESTAMP)
        ON CONFLICT (id) DO NOTHING
      `, paymentId, user.schoolId, amount, `SUB-${plan}-${Date.now()}`, normalizedPhone).catch(() => {})

      const trialEndsAt = new Date(Date.now() + 30 * 86400000).toISOString()
      await db.$executeRawUnsafe(`
        UPDATE "School" SET plan = $1, "maxStudents" = $2, status = 'Active', "trialEndsAt" = $3, "updatedAt" = CURRENT_TIMESTAMP
        WHERE id = $4
      `, plan, maxStudents, trialEndsAt, user.schoolId).catch(() => {})

      return NextResponse.json({ status: 'demo', message: `Demo: ${plan} activated. Configure M-Pesa for real payments.`, plan, amount, trialEndsAt })
    }

    const platformSchool = {
      id: 'platform', name: 'SkulHub Platform',
      mpesaConsumerKey: CONSUMER_KEY, mpesaConsumerSecret: CONSUMER_SECRET,
      mpesaPasskey: PASSKEY, mpesaShortcode: SHORTCODE, mpesaEnv: ENV,
      mpesaCallbackUrl: CALLBACK_URL, mpesaAccountRef: 'SKULHUB-SUB',
    }

    const stkResponse = await initiateStkPush({
      school: platformSchool as any, phone: normalizedPhone, amount,
      accountReference: `SUB-${plan}`.slice(0, 12),
      transactionDesc: `SkulHub ${plan}`.slice(0, 13),
    }).catch((e: any) => { throw new Error(`STK Push failed: ${e?.message || 'Unknown error'}`) })

    if (stkResponse.error) return NextResponse.json({ error: stkResponse.error }, { status: 502 })

    const paymentId = `subpay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    await db.$executeRawUnsafe(`
      INSERT INTO "Payment" (id, "schoolId", amount, method, status, reference, "payerName", "payerPhone", "receivedBy", "receivedAt")
      VALUES ($1, $2, $3, 'M-Pesa', 'Pending', $4, 'Platform Subscription', $5, 'System', CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO NOTHING
    `, paymentId, user.schoolId, amount, `SUB-${plan}-${stkResponse.checkoutRequestId || Date.now()}`, normalizedPhone).catch(() => {})

    return NextResponse.json({ status: 'pending', checkoutRequestId: stkResponse.checkoutRequestId, message: `STK Push sent to ${normalizedPhone}. Confirm to activate ${plan}.` })
  } catch (e: any) {
    console.error('[subscriptions/subscribe] error:', e)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
