import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

/**
 * GET /api/subjects
 * Returns all subjects defined for the school, ordered by name.
 * Used by the timetable Add-Lesson dropdown (and any other UI that needs to
 * pick a subject). The response shape is `{ subjects: [...] }` so callers can
 * distinguish an empty list from an error.
 *
 * Falls back to an empty list on any DB error (e.g. table not yet migrated)
 * so the client can render a text-input fallback instead of crashing.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const subjects = await db.subject.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        code: true,
        category: true,
        departmentId: true,
      },
    })

    return NextResponse.json({ subjects })
  } catch (error) {
    console.error('[subjects GET] error:', error)
    // Defensive: return an empty list so the client can fall back to a text input
    return NextResponse.json({ subjects: [] })
  }
}
