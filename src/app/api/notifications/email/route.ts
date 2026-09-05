import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/notifications/email
 *
 * Sends an email notification to a parent/guardian.
 * Uses Nodemailer if SMTP credentials are configured, otherwise
 * logs the email in demo mode (same pattern as SMS).
 *
 * Body: {
 *   to: string,           // email address
 *   subject: string,
 *   html: string,         // HTML email body
 *   studentId?: string,
 *   eventType?: string,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      to: string
      subject: string
      html: string
      studentId?: string
      eventType?: string
    }

    if (!body.to || !body.subject || !body.html) {
      return NextResponse.json({ error: 'to, subject, and html are required' }, { status: 400 })
    }

    let schoolId: string | null = null
    let schoolName = 'SkulHub Academy'
    try {
      const schools = await db.$queryRawUnsafe<Array<{id: string; name: string}>>(
        `SELECT id, name FROM "School" WHERE "schoolCode" = 'SKH-2024-001' LIMIT 1`
      )
      if (schools.length > 0) { schoolId = schools[0].id; schoolName = schools[0].name }
    } catch {}

    // Check if SMTP is configured (env vars)
    const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_HOST
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASS

    let sent = false
    let messageId: string | null = null

    if (smtpHost && smtpUser && smtpPass) {
      // Send real email via Nodemailer
      try {
        const nodemailer = await import('nodemailer')
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(process.env.SMTP_PORT || 587),
          secure: process.env.SMTP_SECURE === 'true',
          auth: { user: smtpUser, pass: smtpPass },
        })

        const info = await transporter.sendMail({
          from: `"${schoolName}" <${smtpUser}>`,
          to: body.to,
          subject: body.subject,
          html: body.html,
        })

        sent = true
        messageId = info.messageId
      } catch (e: any) {
        console.error('[email] SMTP error:', e.message)
        // Fall through to demo mode
      }
    }

    // Log the email
    const logId = `email_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    try {
      await db.$executeRawUnsafe(`
        INSERT INTO "SmsLog" (id, "schoolId", "studentId", "eventType", channel, "recipientPhone", message, status, "createdAt")
        VALUES ($1, $2, $3, $4, 'email', $5, $6, $7, NOW())
        ON CONFLICT (id) DO NOTHING
      `, logId, schoolId, body.studentId || null, body.eventType || 'email', body.to,
         `${body.subject}: ${body.html.slice(0, 200)}`,
         sent ? 'sent' : 'demo'
      ).catch(() => {})
    } catch {}

    return NextResponse.json({
      success: true,
      sent,
      demo: !sent,
      messageId,
      message: sent
        ? `Email sent to ${body.to}`
        : `Demo mode: Email would be sent to ${body.to}. Configure SMTP_HOST, SMTP_USER, SMTP_PASS env vars to send real emails.`,
      logId,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
