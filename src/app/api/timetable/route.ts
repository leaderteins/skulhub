import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

/**
 * GET /api/timetable
 * Returns all timetable entries + lists of streams, subjects, and teachers
 * for the dropdowns.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const [entries, streams, subjects, teachers] = await Promise.all([
      db.timetable.findMany({
        include: {
          subject: { select: { id: true, name: true, code: true, category: true } },
          teacher: { select: { id: true, firstName: true, lastName: true } },
          stream: { select: { id: true, name: true } },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      }),
      db.stream.findMany({
        include: { classLevel: { select: { name: true } } },
        orderBy: { name: 'asc' },
      }),
      db.subject.findMany({ orderBy: { name: 'asc' } }),
      db.staff.findMany({
        where: { status: 'Active', role: { in: ['Teacher', 'HOD'] } },
        select: { id: true, firstName: true, lastName: true, specialization: true },
        orderBy: [{ firstName: 'asc' }],
      }),
    ])

    return NextResponse.json({
      entries,
      streams: streams.map(s => ({ ...s, name: s.name })),
      subjects,
      teachers,
    })
  } catch (error) {
    console.error('[timetable GET] error:', error)
    // Return empty data on error (demo mode / DB not set up)
    return NextResponse.json({ entries: [], streams: [], subjects: [], teachers: [] })
  }
}

/**
 * POST /api/timetable
 * Create a new timetable entry (lesson).
 *
 * Accepts either `subjectId` (preferred — comes from the dropdown) or
 * `subjectName` (fallback — comes from the text input when no subjects are
 * seeded yet). When only `subjectName` is provided, we look up an existing
 * Subject by name (case-insensitive) and reuse its id; if not found, we
 * create a new Subject record so the timetable row can still link to it.
 *
 * After creating the Timetable row we also insert an ActivityLog entry so
 * the action surfaces in the dashboard "Recent Activity" feed.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const { streamId, subjectId, subjectName, teacherId, dayOfWeek, startTime, endTime, room } = body

    if (!streamId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'streamId, dayOfWeek, startTime, and endTime are required' },
        { status: 400 }
      )
    }
    if (!subjectId && !subjectName) {
      return NextResponse.json(
        { error: 'Either subjectId or subjectName is required' },
        { status: 400 }
      )
    }

    // Resolve the subjectId. If the caller only passed a subjectName (the
    // text-input fallback path), look up by name or create on the fly.
    let resolvedSubjectId: string = subjectId
    let resolvedSubjectName: string = ''
    if (!resolvedSubjectId && subjectName) {
      const existing = await db.subject.findFirst({
        where: { name: { equals: String(subjectName) } },
        select: { id: true, name: true, code: true },
      })
      if (existing) {
        resolvedSubjectId = existing.id
        resolvedSubjectName = existing.name
      } else {
        // Derive a 3-letter uppercase code from the subject name.
        const code = String(subjectName)
          .replace(/[^a-zA-Z]/g, '')
          .slice(0, 3)
          .toUpperCase() || 'SUB'
        const created = await db.subject.create({
          data: { name: String(subjectName), code, category: 'Core' },
          select: { id: true, name: true },
        })
        resolvedSubjectId = created.id
        resolvedSubjectName = created.name
      }
    } else if (resolvedSubjectId) {
      // Look up the subject name for the activity-log description.
      const subj = await db.subject.findUnique({
        where: { id: resolvedSubjectId },
        select: { name: true },
      }).catch(() => null)
      resolvedSubjectName = subj?.name || 'Subject'
    }

    const entry = await db.timetable.create({
      data: {
        streamId,
        subjectId: resolvedSubjectId,
        teacherId: teacherId || null,
        dayOfWeek,
        startTime,
        endTime,
        room: room || null,
      },
      include: {
        subject: { select: { id: true, name: true, code: true, category: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        stream: { select: { id: true, name: true } },
      },
    })

    // Record the action in the audit log. Uses CURRENT_TIMESTAMP so it
    // works on both SQLite and PostgreSQL. Wrapped in .catch so a logging
    // failure never breaks the actual create.
    const schoolId = user.schoolId || null
    const userName = user.name || user.email || 'Unknown'
    const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const logDetails = `Added ${resolvedSubjectName} to ${dayOfWeek} ${startTime}-${endTime} timetable`
    await db.$executeRawUnsafe(
      `INSERT INTO "ActivityLog" (id, "schoolId", action, entity, "entityId", details, "createdAt", "user")
       VALUES ($1, $2, 'CREATE', 'Timetable', $3, $4, CURRENT_TIMESTAMP, $5)`,
      logId, schoolId, entry.id, logDetails, userName
    ).catch(() => {})

    return NextResponse.json({ success: true, entry }, { status: 201 })
  } catch (error) {
    console.error('[timetable POST] error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Failed to add lesson', details: msg.slice(0, 200) },
      { status: 500 }
    )
  }
}
