import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'
import { isDemoMode } from '@/lib/demo-data'

/**
 * GET /api/referrals
 * Super admin only — returns all referrals with their signup counts.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden — super admin access required' }, { status: 403 })
    }

    // ─── DEMO MODE ───────────────────────────────────────────────────────────
    if (isDemoMode()) {
      return NextResponse.json({
        referrals: [
          {
            id: 'demo-ref-1',
            referralCode: 'REF-SHA-001',
            referrerName: 'Moses Kinyanjui',
            referrerEmail: 'admin@skulhub.ac.ke',
            referrerPhone: '+254700123456',
            referrerSchool: 'SkulHub Academy',
            commissionRate: 15.0,
            status: 'Active',
            referredCount: 3,
            totalCommission: 2250,
            paidOut: 0,
            notes: 'Top referrer — offer bonus',
            createdAt: '2026-07-01T10:00:00.000Z',
            signups: [
              { id: 's1', referredSchoolName: 'Bright Future Secondary', plan: 'Standard', monthlyValue: 5000, commissionEarned: 750, status: 'Converted' },
              { id: 's2', referredSchoolName: 'Rift Valley Academy', plan: 'Starter', monthlyValue: 2500, commissionEarned: 375, status: 'Trial' },
              { id: 's3', referredSchoolName: 'Coastal Primary', plan: 'Premium', monthlyValue: 10000, commissionEarned: 1500, status: 'Converted' },
            ],
          },
          {
            id: 'demo-ref-2',
            referralCode: 'REF-MW-002',
            referrerName: 'Mary Wanjiru',
            referrerEmail: 'principal@skulhub.ac.ke',
            referrerPhone: '+254700123457',
            referrerSchool: 'SkulHub Academy',
            commissionRate: 15.0,
            status: 'Active',
            referredCount: 1,
            totalCommission: 375,
            paidOut: 0,
            notes: null,
            createdAt: '2026-07-15T14:00:00.000Z',
            signups: [
              { id: 's4', referredSchoolName: 'Nakuru Highlands', plan: 'Starter', monthlyValue: 2500, commissionEarned: 375, status: 'Trial' },
            ],
          },
        ],
        summary: {
          totalReferrers: 2,
          activeReferrers: 2,
          totalSignups: 4,
          totalCommission: 2625,
          totalPaidOut: 0,
          outstandingCommission: 2625,
        },
        demoMode: true,
      })
    }
    // ─── END DEMO MODE ───────────────────────────────────────────────────────

    const referrals = await db.referral.findMany({
      include: { signups: true },
      orderBy: { createdAt: 'desc' },
    })

    const summary = {
      totalReferrers: referrals.length,
      activeReferrers: referrals.filter(r => r.status === 'Active').length,
      totalSignups: referrals.reduce((s, r) => s + r.signups.length, 0),
      totalCommission: referrals.reduce((s, r) => s + r.totalCommission, 0),
      totalPaidOut: referrals.reduce((s, r) => s + r.paidOut, 0),
      outstandingCommission: referrals.reduce((s, r) => s + (r.totalCommission - r.paidOut), 0),
    }

    return NextResponse.json({ referrals, summary })
  } catch (error) {
    console.error('[referrals GET] error:', error)
    return NextResponse.json({ error: 'Failed to load referrals' }, { status: 500 })
  }
}

/**
 * POST /api/referrals
 * Super admin only — create a new referrer with a unique referral code.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (user.role !== 'super_admin') {
      return NextResponse.json({ error: 'Forbidden — super admin access required' }, { status: 403 })
    }

    const body = await req.json()
    const { referrerName, referrerEmail, referrerPhone, referrerSchool, referrerSchoolId, commissionRate, notes } = body

    if (!referrerName?.trim() || !referrerEmail?.trim()) {
      return NextResponse.json({ error: 'Referrer name and email are required' }, { status: 400 })
    }

    // ─── DEMO MODE ───────────────────────────────────────────────────────────
    if (isDemoMode()) {
      const initials = referrerName.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
      const code = `REF-${initials}-${String(Math.floor(Math.random() * 900) + 100)}`
      return NextResponse.json({
        success: true,
        referralCode: code,
        demoMode: true,
        message: 'Demo mode: Referrer created for this session.',
      }, { status: 201 })
    }
    // ─── END DEMO MODE ───────────────────────────────────────────────────────

    // Generate a unique referral code
    const initials = referrerName.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
    const count = await db.referral.count()
    const referralCode = `REF-${initials}-${String(count + 1).padStart(3, '0')}`

    const referral = await db.referral.create({
      data: {
        referralCode,
        referrerName: referrerName.trim(),
        referrerEmail: referrerEmail.trim().toLowerCase(),
        referrerPhone: referrerPhone?.trim() || null,
        referrerSchool: referrerSchool?.trim() || null,
        referrerSchoolId: referrerSchoolId || null,
        commissionRate: Number(commissionRate) || 15.0,
        notes: notes?.trim() || null,
      },
    })

    return NextResponse.json({ success: true, referral }, { status: 201 })
  } catch (error) {
    console.error('[referrals POST] error:', error)
    return NextResponse.json({ error: 'Failed to create referral' }, { status: 500 })
  }
}
