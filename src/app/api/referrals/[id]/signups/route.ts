import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'
import { isDemoMode } from '@/lib/demo-data'

/**
 * POST /api/referrals/[id]/signups
 * Super admin only — record a new school signup from a referral.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden — super admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { referredSchoolName, referredEmail, referredPhone, plan, monthlyValue } = body

    if (!referredSchoolName?.trim() || !referredEmail?.trim()) {
      return NextResponse.json({ error: 'School name and email are required' }, { status: 400 })
    }

    // ─── DEMO MODE ───────────────────────────────────────────────────────────
    if (isDemoMode()) {
      return NextResponse.json({
        success: true,
        commissionEarned: Number(monthlyValue) * 0.15,
        demoMode: true,
        message: 'Demo mode: Referral signup recorded for this session.',
      }, { status: 201 })
    }
    // ─── END DEMO MODE ───────────────────────────────────────────────────────

    const referral = await db.referral.findUnique({ where: { id } })
    if (!referral) {
      return NextResponse.json({ error: 'Referral not found' }, { status: 404 })
    }

    const monthly = Number(monthlyValue) || 0
    const commission = monthly * (referral.commissionRate / 100)

    const signup = await db.referralSignup.create({
      data: {
        referralId: id,
        referredSchoolName: referredSchoolName.trim(),
        referredEmail: referredEmail.trim().toLowerCase(),
        referredPhone: referredPhone?.trim() || null,
        plan: plan || 'Starter',
        monthlyValue: monthly,
        commissionEarned: commission,
        status: 'Trial',
      },
    })

    // Update referral aggregate counts
    await db.referral.update({
      where: { id },
      data: {
        referredCount: { increment: 1 },
        totalCommission: { increment: commission },
      },
    })

    return NextResponse.json({ success: true, signup }, { status: 201 })
  } catch (error) {
    console.error('[referral signup POST] error:', error)
    return NextResponse.json({ error: 'Failed to record referral signup' }, { status: 500 })
  }
}
