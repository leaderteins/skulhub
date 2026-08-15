import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/contact
 * Public endpoint — accepts contact form submissions from the landing page
 * footer. No auth required.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { name, phone, email, schoolName, message } = body as {
      name?: string
      phone?: string
      email?: string
      schoolName?: string
      message?: string
    }

    if (!name?.trim() || !phone?.trim() || !message?.trim()) {
      return NextResponse.json(
        { error: 'Name, phone number, and message are required' },
        { status: 400 }
      )
    }

    const record = await db.contactMessage.create({
      data: {
        name: name.trim().slice(0, 100),
        phone: phone.trim().slice(0, 30),
        email: email?.trim() ? email.trim().slice(0, 120) : null,
        schoolName: schoolName?.trim() ? schoolName.trim().slice(0, 200) : null,
        message: message.trim().slice(0, 2000),
      },
    })

    return NextResponse.json({ success: true, id: record.id }, { status: 201 })
  } catch (error) {
    console.error('[contact] error:', error)
    return NextResponse.json(
      { error: 'Could not submit your message. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/contact
 * Returns contact messages — only accessible to super_admin / admin.
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    const cookie = req.headers.get('cookie') || ''
    const cookieToken = cookie.match(/skulhub-token=([^;]+)/)?.[1]
    const finalToken = token || cookieToken
    if (!finalToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { verifySessionToken } = await import('@/lib/auth-utils')
    const verified = verifySessionToken(finalToken)
    if (!verified) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const user = await db.userAccount.findUnique({
      where: { id: verified.userId },
      select: { role: true },
    })
    if (!user || !['super_admin', 'admin', 'principal'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const messages = await db.contactMessage.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('[contact GET] error:', error)
    return NextResponse.json({ error: 'Failed to load messages' }, { status: 500 })
  }
}
