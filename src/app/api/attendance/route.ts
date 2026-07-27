import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Current academic year/term (matches seed)
const ACADEMIC_YEAR = '2025'
const TERM = 'Term 1'

function startOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`)
}
function endOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999Z`)
}
function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

// GET /api/attendance?date=YYYY-MM-DD&streamId=&personType=Student
// Returns the list of streams + the attendance roster for the selected stream/date.
// If no attendance records exist for a stream/date, returns the students with empty status.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const date = searchParams.get('date') || todayStr()
  const streamId = searchParams.get('streamId') || ''
  const personType = searchParams.get('personType') || 'Student'

  // Always return the list of streams for the selector
  const streams = await db.stream.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      capacity: true,
      classTeacherId: true,
      classLevel: { select: { id: true, name: true, stage: true } },
      _count: { select: { enrollments: { where: { status: 'Active', academicYear: ACADEMIC_YEAR, term: TERM } } } },
    },
  })

  // Resolve class teacher names in a single query
  const teacherIds = streams.map(s => s.classTeacherId).filter(Boolean) as string[]
  const teachers = teacherIds.length
    ? await db.staff.findMany({ where: { id: { in: teacherIds } }, select: { id: true, firstName: true, lastName: true } })
    : []
  const teacherMap = new Map(teachers.map(t => [t.id, `${t.firstName} ${t.lastName}`]))

  // If no stream selected, return empty roster
  if (!streamId) {
    return NextResponse.json({
      date,
      streamId: null,
      personType,
      streams: streams.map(s => ({
        id: s.id,
        name: s.name,
        capacity: s.capacity,
        classLevelName: s.classLevel?.name || '',
        classLevelStage: s.classLevel?.stage || '',
        classTeacher: s.classTeacherId ? teacherMap.get(s.classTeacherId) || null : null,
        enrolledCount: s._count.enrollments,
      })),
      records: [],
      summary: { total: 0, present: 0, absent: 0, late: 0, excused: 0, sick: 0, marked: 0, rate: 0 },
    })
  }

  // Active students enrolled in the selected stream for the current academic year/term
  const enrollments = await db.enrollment.findMany({
    where: {
      streamId,
      status: 'Active',
      academicYear: ACADEMIC_YEAR,
      term: TERM,
    },
    include: {
      student: {
        select: {
          id: true,
          admissionNo: true,
          firstName: true,
          lastName: true,
          gender: true,
          photoUrl: true,
          status: true,
        },
      },
    },
    orderBy: { student: { lastName: 'asc' } },
  })

  // Existing attendance records for the date/stream's students
  const studentIds = enrollments.map(e => e.studentId)
  const attendance = studentIds.length
    ? await db.attendance.findMany({
        where: {
          date: { gte: startOfDay(date), lte: endOfDay(date) },
          personType,
          studentId: { in: studentIds },
        },
      })
    : []

  const attByStudent = new Map(attendance.map(a => [a.studentId, a]))

  // Build merged roster
  const records = enrollments.map(e => {
    const att = attByStudent.get(e.studentId)
    return {
      id: att?.id || null,
      studentId: e.student.id,
      admissionNo: e.student.admissionNo,
      firstName: e.student.firstName,
      lastName: e.student.lastName,
      gender: e.student.gender,
      photoUrl: e.student.photoUrl,
      status: att?.status || '',
      remarks: att?.remarks || '',
      checkInTime: att?.checkInTime || null,
      marked: !!att,
    }
  })

  // Roster summary
  const summary = {
    total: records.length,
    marked: records.filter(r => r.marked).length,
    present: records.filter(r => r.status === 'Present').length,
    absent: records.filter(r => r.status === 'Absent').length,
    late: records.filter(r => r.status === 'Late').length,
    excused: records.filter(r => r.status === 'Excused').length,
    sick: records.filter(r => r.status === 'Sick').length,
    rate: records.length
      ? Math.round(
          ((records.filter(r => r.status === 'Present').length +
            records.filter(r => r.status === 'Late').length) /
            records.length) *
            100,
        )
      : 0,
  }

  return NextResponse.json({
    date,
    streamId,
    personType,
    streams: streams.map(s => ({
      id: s.id,
      name: s.name,
      capacity: s.capacity,
      classLevelName: s.classLevel?.name || '',
      classLevelStage: s.classLevel?.stage || '',
      classTeacher: s.classTeacherId ? teacherMap.get(s.classTeacherId) || null : null,
      enrolledCount: s._count.enrollments,
    })),
    records,
    summary,
  })
}

// POST /api/attendance
// Body: { date, streamId, records: [{ studentId, status, remarks? }] }
// Upserts attendance records for the date/stream. Returns count saved.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { date, streamId, records } = body as {
      date: string
      streamId?: string
      records: { studentId: string; status: string; remarks?: string }[]
    }

    if (!date || !Array.isArray(records) || records.length === 0) {
      return NextResponse.json({ error: 'date and records[] are required' }, { status: 400 })
    }

    const start = startOfDay(date)
    const end = endOfDay(date)

    let saved = 0
    for (const r of records) {
      if (!r.studentId || !r.status) continue
      const existing = await db.attendance.findFirst({
        where: {
          studentId: r.studentId,
          personType: 'Student',
          date: { gte: start, lte: end },
        },
      })
      const remarks = r.remarks?.trim() ? r.remarks.trim() : null
      if (existing) {
        await db.attendance.update({
          where: { id: existing.id },
          data: { status: r.status, remarks },
        })
      } else {
        await db.attendance.create({
          data: {
            studentId: r.studentId,
            personType: 'Student',
            date: start,
            status: r.status,
            remarks,
          },
        })
      }
      saved++
    }

    // Log activity
    try {
      await db.activityLog.create({
        data: {
          action: 'MARK',
          entity: 'Attendance',
          user: 'Class Teacher',
          details: `Marked attendance for ${saved} student(s) on ${date}${streamId ? ` in stream ${streamId}` : ''}`,
        },
      })
    } catch {
      // ignore log errors
    }

    return NextResponse.json({ saved, date })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to save attendance' }, { status: 500 })
  }
}
