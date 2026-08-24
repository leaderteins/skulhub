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
 * Create a new timetable entry (lesson)
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const { streamId, subjectId, teacherId, dayOfWeek, startTime, endTime, room } = body

    if (!streamId || !subjectId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'streamId, subjectId, dayOfWeek, startTime, and endTime are required' },
        { status: 400 }
      )
    }

    const entry = await db.timetable.create({
      data: {
        streamId, subjectId,
        teacherId: teacherId || null,
        dayOfWeek, startTime, endTime,
        room: room || null,
      },
      include: {
        subject: { select: { id: true, name: true, code: true, category: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        stream: { select: { id: true, name: true } },
      },
    })

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
