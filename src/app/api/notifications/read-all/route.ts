import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

/**
 * POST /api/notifications/read-all
 * --------------------------------
 * Marks every unread notification for the current school/user as read.
 *
 * Body (optional): {
 *   scope?: 'school' | 'user',   // default: school
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>))
    const scope = body?.scope === 'user' ? 'user' : 'school'

    let schoolId: string | null = null
    let userId: string | null = null
    try {
      const u = await getUserFromRequest(req)
      if (u?.schoolId) {
        schoolId = u.schoolId
        userId = u.id
      }
    } catch {}
    if (!schoolId) {
      try {
        const school = await db.school.findFirst({ where: { slug: { not: 'platform' } } })
        if (school) schoolId = school.id
      } catch {}
    }

    const where: Record<string, unknown> = {
      readAt: null,
      archivedAt: null,
    }
    if (scope === 'user' && userId) {
      where.userId = userId
    } else if (schoolId) {
      where.schoolId = schoolId
    }

    const result = await db.appNotification.updateMany({
      where,
      data: { readAt: new Date() },
    })

    return NextResponse.json({ ok: true, updated: result.count })
  } catch (e: unknown) {
    console.error('[notifications/read-all] error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to mark all as read' },
      { status: 500 },
    )
  }
}
