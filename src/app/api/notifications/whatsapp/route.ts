import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/notifications/whatsapp
 *
 * Sends a WhatsApp message to a parent/guardian.
 * Uses WhatsApp Business API (Meta Cloud API) if configured,
 * otherwise logs in demo mode.
 *
 * Body: {
 *   to: string,         // phone number with country code
 *   message: string,    // text message
 *   imageUrl?: string,   // optional image URL (for report cards, fee statements)
 *   studentId?: string,
 *   eventType?: string,
 * }
 *
 * To enable real WhatsApp:
 * 1. Create a Meta Business account
 * 2. Get WHATSAPP_TOKEN + WHATSAPP_PHONE_NUMBER_ID env vars
 * 3. Set up WhatsApp Business API webhook
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      to: string
      message: string
      imageUrl?: string
      studentId?: string
      eventType?: string
    }

    if (!body.to || !body.message) {
      return NextResponse.json({ error: 'to and message are required' }, { status: 400 })
    }

    // Normalize phone (WhatsApp requires international format without +)
    let phone = body.to.replace(/\D/g, '')
    if (phone.startsWith('0')) phone = '254' + phone.slice(1)
    if (!phone.startsWith('254') && !phone.startsWith('1')) phone = '254' + phone

    let schoolId: string | null = null
    try {
      const schools = await db.$queryRawUnsafe<Array<{id: string}>>(`
        SELECT id FROM "School" WHERE "schoolCode" = 'SKH-2024-001' LIMIT 1
      `)
      if (schools.length > 0) schoolId = schools[0].id
    } catch {}

    const token = process.env.WHATSAPP_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    let sent = false
    let messageId: string | null = null

    if (token && phoneNumberId) {
      // Send real WhatsApp message via Meta Cloud API
      try {
        const payload: any = {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: phone,
          type: 'text',
          text: { body: body.message },
        }

        // If image URL provided, send as image message
        if (body.imageUrl) {
          payload.type = 'image'
          payload.image = { link: body.imageUrl, caption: body.message }
        }

        const response = await fetch(
          `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          }
        )

        const data = await response.json()
        if (data.messages?.[0]?.id) {
          sent = true
          messageId = data.messages[0].id
        }
      } catch (e: any) {
        console.error('[whatsapp] API error:', e.message)
      }
    }

    // Log the message
    const logId = `wa_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    try {
      await db.$executeRawUnsafe(`
        INSERT INTO "SmsLog" (id, "schoolId", "studentId", "eventType", channel, "recipientPhone", message, status, "createdAt")
        VALUES ($1, $2, $3, $4, 'whatsapp', $5, $6, $7, NOW())
        ON CONFLICT (id) DO NOTHING
      `, logId, schoolId, body.studentId || null, body.eventType || 'whatsapp',
         phone, body.message, sent ? 'sent' : 'demo'
      ).catch(() => {})
    } catch {}

    return NextResponse.json({
      success: true,
      sent,
      demo: !sent,
      messageId,
      message: sent
        ? `WhatsApp message sent to ${phone}`
        : `Demo mode: WhatsApp would be sent to ${phone}. Set WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID env vars to send real messages.`,
      logId,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
