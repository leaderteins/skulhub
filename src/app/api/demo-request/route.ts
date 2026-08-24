import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isDemoMode } from '@/lib/demo-data'

/**
 * POST /api/demo-request
 * Public endpoint — accepts demo request submissions from the landing page.
 * No auth required.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { schoolName, contactName, email, phone, role, studentCount, preferredDate, preferredTime, message, referralCode } = body

    if (!schoolName?.trim() || !contactName?.trim() || !email?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: 'School name, contact name, email, and phone are required' },
        { status: 400 }
      )
    }

    // ─── DEMO MODE ───────────────────────────────────────────────────────────
    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        id: `demo-req-${Date.now()}`,
        demoMode: true,
        message: 'Demo request received! We\'ll contact you within 24 hours to schedule your live demo.',
      }, { status: 201 })
    }
    // ─── END DEMO MODE ───────────────────────────────────────────────────────

    const record = await db.demoRequest.create({
      data: {
        schoolName: schoolName.trim().slice(0, 200),
        contactName: contactName.trim().slice(0, 100),
        email: email.trim().toLowerCase().slice(0, 120),
        phone: phone.trim().slice(0, 30),
        role: role || 'Principal',
        studentCount: studentCount || '100-500',
        preferredDate: preferredDate || null,
        preferredTime: preferredTime || null,
        message: message?.trim() ? message.trim().slice(0, 1000) : null,
        referralCode: referralCode?.trim() || null,
      },
    })

    return NextResponse.json({ success: true, id: record.id }, { status: 201 })
  } catch (error) {
    console.error('[demo-request] error:', error)
    return NextResponse.json(
      { error: 'Could not submit your demo request. Please try again.' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/demo-request
 * Admin-only — returns all demo requests for the super admin dashboard.
 */
export async function GET(req: NextRequest) {
  try {
    const { getUserFromRequest } = await import('@/lib/auth-utils')
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'super_admin' && user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // ─── DEMO MODE ───────────────────────────────────────────────────────────
    if (isDemoMode()) {
      return NextResponse.json({
        requests: [
          {
            id: 'demo-req-1',
            schoolName: 'Bright Future Academy',
            contactName: 'Jane Wanjiru',
            email: 'principal@brightfuture.ac.ke',
            phone: '+254712345678',
            role: 'Principal',
            studentCount: '500-1000',
            preferredDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
            preferredTime: 'Morning',
            message: 'We have 600 students and want to digitize our fee collection and exam management.',
            status: 'New',
            referralCode: null,
            createdAt: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: 'demo-req-2',
            schoolName: 'Nakuru Highlands School',
            contactName: 'David Kiprop',
            email: 'admin@highlands.ac.ke',
            phone: '+254723456789',
            role: 'Bursar',
            studentCount: '200-500',
            preferredDate: null,
            preferredTime: 'Afternoon',
            message: 'Interested in M-Pesa integration for fee payments.',
            status: 'Scheduled',
            referralCode: 'REF-SHA-001',
            createdAt: new Date(Date.now() - 86400000).toISOString(),
          },
        ],
        demoMode: true,
      })
    }
    // ─── END DEMO MODE ───────────────────────────────────────────────────────

    const requests = await db.demoRequest.findMany({
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('[demo-request GET] error:', error)
    return NextResponse.json({ error: 'Failed to load demo requests' }, { status: 500 })
  }
}
