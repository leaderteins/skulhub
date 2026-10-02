import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

/**
 * GET /api/mpesa/platform-config
 * Returns the platform M-Pesa config (secret masked).
 * POST /api/mpesa/platform-config
 * Stores: { consumerKey, consumerSecret, shortcode, passkey, env }
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const settings = await db.$queryRawUnsafe<any[]>(
      `SELECT key, value FROM "Settings" WHERE key LIKE 'mpesa_%'`
    ).catch(() => [])

    const config: Record<string, any> = {}
    for (const s of settings) {
      config[s.key] = s.key.includes('secret') || s.key.includes('passkey') ? '••••••••' : s.value
    }

    return NextResponse.json({
      consumerKey: config.mpesa_consumer_key || '',
      consumerSecret: config.mpesa_consumer_secret ? '••••••••' : '',
      shortcode: config.mpesa_shortcode || '',
      passkey: config.mpesa_passkey ? '••••••••' : '',
      env: config.mpesa_env || 'sandbox',
      callbackUrl: config.mpesa_callback_url || '',
      configured: !!config.mpesa_consumer_key && !!config.mpesa_consumer_secret,
    })
  } catch (e: any) {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { consumerKey, consumerSecret, shortcode, passkey, env, callbackUrl } = body

    if (!consumerKey || !consumerSecret) {
      return NextResponse.json({ error: 'Consumer Key and Consumer Secret are required' }, { status: 400 })
    }

    const entries: [string, string][] = [
      ['mpesa_consumer_key', consumerKey],
      ['mpesa_consumer_secret', consumerSecret],
      ['mpesa_shortcode', shortcode || '174379'],
      ['mpesa_passkey', passkey || 'bfb279f9aa9bdbcf15824ea6ca4253b92ad2c6ca84b1a5cbf1db0c5f7e7c3e3'],
      ['mpesa_env', env || 'sandbox'],
      ['mpesa_callback_url', callbackUrl || 'https://www.skulhub.co.ke/api/mpesa/callback'],
    ]

    for (const [key, value] of entries) {
      await db.$executeRawUnsafe(`
        INSERT INTO "Settings" (id, key, value, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT (key) DO UPDATE SET value = $3, "updatedAt" = CURRENT_TIMESTAMP
      `, `mpesa_${key.split('mpesa_')[1]}`, key, String(value)).catch(() => {})
    }

    return NextResponse.json({ success: true, message: 'M-Pesa platform config saved' })
  } catch (e: any) {
    console.error('[mpesa/platform-config] error:', e)
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
