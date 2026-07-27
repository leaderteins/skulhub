import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const streamId = searchParams.get('streamId')

  if (!streamId) {
    return NextResponse.json({ error: 'streamId is required' }, { status: 400 })
  }

  const entries = await db.timetable.findMany({
    where: { streamId },
    include: {
      subject: { select: { id: true, name: true, code: true, category: true } },
      teacher: { select: { id: true, firstName: true, lastName: true, employeeNo: true } },
    },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  })

  const data = entries.map((e) => ({
    id: e.id,
    streamId: e.streamId,
    subjectId: e.subjectId,
    teacherId: e.teacherId,
    dayOfWeek: e.dayOfWeek,
    startTime: e.startTime,
    endTime: e.endTime,
    room: e.room,
    subject: e.subject,
    teacher: e.teacher
      ? { id: e.teacher.id, name: `${e.teacher.firstName} ${e.teacher.lastName}`, employeeNo: e.teacher.employeeNo }
      : null,
  }))

  return NextResponse.json({ entries: data })
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { streamId, subjectId, teacherId, dayOfWeek, startTime, endTime, room } = body || {}

    if (!streamId || !subjectId || !dayOfWeek || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Missing required fields: streamId, subjectId, dayOfWeek, startTime, endTime' },
        { status: 400 },
      )
    }

    const entry = await db.timetable.create({
      data: {
        streamId,
        subjectId,
        teacherId: teacherId || null,
        dayOfWeek,
        startTime,
        endTime,
        room: room || null,
      },
      include: {
        subject: { select: { id: true, name: true, code: true, category: true } },
        teacher: { select: { id: true, firstName: true, lastName: true, employeeNo: true } },
      },
    })

    return NextResponse.json({
      entry: {
        id: entry.id,
        streamId: entry.streamId,
        subjectId: entry.subjectId,
        teacherId: entry.teacherId,
        dayOfWeek: entry.dayOfWeek,
        startTime: entry.startTime,
        endTime: entry.endTime,
        room: entry.room,
        subject: entry.subject,
        teacher: entry.teacher
          ? {
              id: entry.teacher.id,
              name: `${entry.teacher.firstName} ${entry.teacher.lastName}`,
              employeeNo: entry.teacher.employeeNo,
            }
          : null,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Failed to create timetable entry' }, { status: 500 })
  }
}
