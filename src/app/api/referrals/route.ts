import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

/**
 * GET /api/referrals — returns referral stats for the current school
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    
    // Get referral count
    const referrals = await db.$queryRawUnsafe<any[]>(`
      SELECT COUNT(*) as count FROM "ActivityLog" WHERE "schoolId" = $1 AND action = 'REFERRAL'
    `, user.schoolId).catch(() => [{ count: 0 }])
    
    // Get discount
    const discount = await db.$queryRawUnsafe<any[]>(`
      SELECT value FROM "Settings" WHERE key = $1
    `, `referral_discount_${user.schoolId}`).catch(() => [])
    
    // Get school code (for sharing)
    const school = await db.school.findUnique({ where: { id: user.schoolId } }).catch(() => null)
    
    return NextResponse.json({
      referralCode: school?.schoolCode || '',
      totalReferrals: Number(referrals[0]?.count) || 0,
      discountPercent: discount[0]?.value ? Number(discount[0].value) : 0,
      shareUrl: `https://www.skulhub.co.ke/?ref=${school?.schoolCode || ''}`,
      message: discount[0]?.value ? `You have ${discount[0].value}% off your next billing!` : 'Refer a school and get 20% off your next billing cycle.',
    })
  } catch { return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 }) }
}
