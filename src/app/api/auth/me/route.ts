import { NextRequest, NextResponse } from 'next/server'
import { getUserFromRequest } from '@/lib/auth-utils'

/**
 * GET /api/auth/me
 * Returns the currently-authenticated user, used by the client to validate
 * a persisted session token on page load.
 */
export async function GET(req: NextRequest) {
  const user = await getUserFromRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolId: user.schoolId,
      schoolName: user.school?.name ?? null,
      schoolSlug: user.school?.slug ?? null,
      avatar: user.avatar,
      status: user.status,
      isSuperAdmin: user.role === 'super_admin',
    },
  })
}
