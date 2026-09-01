import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/notifications/send
 *
 * Sends an SMS or WhatsApp message to a parent/guardian.
 * Uses Africa's Talking API (Kenya's most popular SMS gateway).
 *
 * Body: {
 *   to: string,           // phone number (e.g. "+254712345678")
 *   message: string,      // the message text
 *   channel?: 'sms'|'whatsapp',  // default 'sms'
 *   studentId?: string,   // for logging
 *   eventType?: string,  // e.g. 'check_in', 'fee_reminder'
 * }
 *
 * If Africa's Talking credentials aren't configured, the message is
 * logged but not actually sent (demo mode).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      to: string
      message: string
      channel?: string
      studentId?: string
      eventType?: string
    }

    if (!body.to || !body.message) {
      return NextResponse.json({ error: 'to and message are required' }, { status: 400 })
    }

    // Normalize phone number (Kenyan format: +254712345678)
    let phone = body.to.replace(/\s+/g, '').replace(/-/g, '')
    if (phone.startsWith('07')) phone = '+254' + phone.slice(1)
    else if (phone.startsWith('7')) phone = '+254' + phone
    else if (phone.startsWith('254')) phone = '+' + phone

    const channel = body.channel || 'sms'

    // Get school info for logging
    let schoolId: string | null = null
    let schoolName = 'SkulHub Academy'
    try {
      const { getUserFromRequest } = await import('@/lib/auth-utils')
      const user = await getUserFromRequest(req)
      if (user?.school) {
        schoolId = (user.school as any).id
        schoolName = (user.school as any).name || schoolName
      }
    } catch {}

    if (!schoolId) {
      try {
        const school = await db.school.findFirst({ where: { slug: { not: 'platform' } } })
        if (school) { schoolId = school.id; schoolName = school.name }
      } catch {}
    }

    // --- Africa's Talking SMS Gateway ---
    // In production, this would call the Africa's Talking API:
    //   POST https://api.africastalking.com/version1/messaging
    //   Headers: apiKey: <AT_API_KEY>
    //   Body: username, to, message, from
    //
    // For now, we check if AT_API_KEY is set. If not, we log the message
    // and return success (demo mode — the message appears in the UI but
    // isn't actually sent to the phone network).

    const apiKey = process.env.AT_API_KEY || process.env.AFRICAS_TALKING_API_KEY
    const username = process.env.AT_USERNAME || process.env.AFRICAS_TALKING_USERNAME || 'sandbox'

    let sent = false
    let providerMessageId: string | null = null

    if (apiKey && channel === 'sms') {
      try {
        const response = await fetch('https://api.africastalking.com/version1/messaging', {
          method: 'POST',
          headers: {
            'apiKey': apiKey,
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
          body: new URLSearchParams({
            username,
            to: phone,
            message: body.message,
            from: process.env.AT_SENDER_ID || 'SKULHUB',
          }).toString(),
        })
        const data = await response.json()
        if (data.SMSMessageData?.Recipients?.[0]?.status === 'Success') {
          sent = true
          providerMessageId = data.SMSMessageData?.Recipients?.[0]?.messageId || null
        }
      } catch (e) {
        // Network error — log but don't fail the request
        console.error('[sms] Africa\'s Talking API error:', e)
      }
    }

    // Log the notification (for audit trail + dashboard display)
    // Using raw SQL since the SmsLog table may not exist on Vercel
    const logId = `sms_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    try {
      await db.$executeRawUnsafe(`
        INSERT INTO "SmsLog" (id, "schoolId", "studentId", "eventType", channel, "recipientPhone", message, status, "providerMessageId", "createdAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        ON CONFLICT DO NOTHING
      `, logId, schoolId, body.studentId || null, body.eventType || 'manual', channel, phone, body.message, sent ? 'sent' : 'demo', providerMessageId).catch(() => {})
    } catch {}

    return NextResponse.json({
      success: true,
      sent,
      demo: !sent,
      message: sent
        ? `SMS sent to ${phone}`
        : `Demo mode: SMS would be sent to ${phone}. Configure Africa's Talking API key in env vars to send real messages.`,
      logId,
      channel,
      recipient: phone,
      timestamp: new Date().toISOString(),
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
