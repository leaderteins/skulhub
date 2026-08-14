import { NextRequest, NextResponse } from 'next/server'
import { resolveSchoolFromRequest, getMpesaAuthToken, getMpesaConfigStatus } from '@/lib/mpesa'

/**
 * POST /api/mpesa/oauth
 * Tests the Daraja OAuth handshake using the school's stored credentials.
 *
 * Used by the Settings → M-Pesa "Test Connection" button. Returns 200 on
 * success with a masked token, or 4xx/5xx with an error message.
 */
export async function POST(req: NextRequest) {
  try {
    const { school, user, error } = await resolveSchoolFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (!school) {
      return NextResponse.json({ error: error || 'No school configured' }, { status: 404 })
    }

    // Allow caller to pass inline credentials (for "Test before save" UX)
    let testSchool = school
    let body: any = null
    try {
      body = await req.json()
    } catch {
      /* no body — use stored creds */
    }
    if (body && (body.consumerKey || body.consumerSecret || body.env)) {
      testSchool = {
        ...school,
        mpesaConsumerKey: body.consumerKey ?? school.mpesaConsumerKey,
        mpesaConsumerSecret: body.consumerSecret ?? school.mpesaConsumerSecret,
        mpesaEnv: body.env ?? school.mpesaEnv,
      }
    }

    const status = getMpesaConfigStatus(testSchool)
    if (!status.configured) {
      return NextResponse.json(
        {
          ok: false,
          error: `Missing Daraja credentials: ${status.missing.join(', ')}`,
          missing: status.missing,
        },
        { status: 400 }
      )
    }

    const result = await getMpesaAuthToken(testSchool)
    if (result.error || !result.token) {
      return NextResponse.json(
        {
          ok: false,
          error: result.error || 'OAuth failed',
          env: status.env,
          shortcode: status.shortcode,
        },
        { status: 502 }
      )
    }

    return NextResponse.json({
      ok: true,
      message: 'Daraja OAuth successful — credentials are valid.',
      env: status.env,
      shortcode: status.shortcode,
      expiresIn: result.raw?.expires_in || 3599,
      tokenPreview: result.token.slice(0, 8) + '…' + result.token.slice(-4),
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'OAuth test failed' },
      { status: 500 }
    )
  }
}
