import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  resolveSchoolFromRequest,
  getMpesaConfigStatus,
} from '@/lib/mpesa'

/**
 * GET /api/mpesa/config
 * Returns the school's Daraja credential configuration status (masked —
 * never returns the actual secrets). Used by the Settings page to display
 * the saved state and by the Finance module to know whether to show the
 * "Pay via M-Pesa STK Push" button or a "not configured" notice.
 */
export async function GET(req: NextRequest) {
  try {
    const { school, user, error } = await resolveSchoolFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (!school) {
      return NextResponse.json({ error: error || 'No school configured' }, { status: 404 })
    }

    const status = getMpesaConfigStatus(school)
    return NextResponse.json({
      configured: status.configured,
      missing: status.missing,
      env: status.env,
      shortcode: status.shortcode,
      callbackUrl: status.callbackUrl,
      accountRef: (school as any).mpesaAccountRef || 'Admission No.',
      // Masked consumer key (first 4 chars + ellipsis) for display
      consumerKeyMasked: school.mpesaConsumerKey
        ? school.mpesaConsumerKey.slice(0, 4) + '…' + school.mpesaConsumerKey.slice(-2)
        : null,
      hasConsumerSecret: !!school.mpesaConsumerSecret,
      hasPasskey: !!school.mpesaPasskey,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

/**
 * PUT /api/mpesa/config
 * Body: {
 *   consumerKey?, consumerSecret?, passkey?, shortcode?,
 *   env?, callbackUrl?, accountRef?
 * }
 * Saves the Daraja credentials to the school record. Only fields that are
 * present in the body are updated — pass `null` to clear a field.
 */
export async function PUT(req: NextRequest) {
  try {
    const { school, user, error } = await resolveSchoolFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (!school) {
      return NextResponse.json({ error: error || 'No school configured' }, { status: 404 })
    }

    // Only admins/principals/bursars should configure M-Pesa credentials
    if (!['admin', 'principal', 'bursar', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to edit M-Pesa configuration' },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => ({})) as {
      consumerKey?: string | null
      consumerSecret?: string | null
      passkey?: string | null
      shortcode?: string | null
      env?: string | null
      callbackUrl?: string | null
      accountRef?: string | null
    }

    const data: any = {}
    if (body.consumerKey !== undefined) data.mpesaConsumerKey = body.consumerKey?.trim() || null
    if (body.consumerSecret !== undefined) data.mpesaConsumerSecret = body.consumerSecret?.trim() || null
    if (body.passkey !== undefined) data.mpesaPasskey = body.passkey?.trim() || null
    if (body.shortcode !== undefined) data.mpesaShortcode = body.shortcode?.trim() || null
    if (body.env !== undefined) {
      const env = body.env === 'production' ? 'production' : 'sandbox'
      data.mpesaEnv = env
    }
    if (body.callbackUrl !== undefined) data.mpesaCallbackUrl = body.callbackUrl?.trim() || null
    if (body.accountRef !== undefined) data.mpesaAccountRef = body.accountRef || 'Admission No.'

    const updated = await db.school.update({
      where: { id: school.id },
      data,
      select: {
        id: true,
        mpesaEnv: true,
        mpesaShortcode: true,
        mpesaCallbackUrl: true,
        mpesaAccountRef: true,
        mpesaConsumerKey: true,
        mpesaConsumerSecret: true,
        mpesaPasskey: true,
      },
    })

    const status = getMpesaConfigStatus(updated)
    return NextResponse.json({
      ok: true,
      configured: status.configured,
      missing: status.missing,
      env: status.env,
      shortcode: status.shortcode,
      callbackUrl: status.callbackUrl,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
