import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

// GET /api/attendance/stats?from=YYYY-MM-DD&to=YYYY-MM-DD
// Returns daily attendance summary for the date range (default last 30 days),
// plus overall stats and today's per-stream summary.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  const today = todayStr()
  const to = searchParams.get('to') || today
  const defaultFrom = new Date()
  defaultFrom.setDate(defaultFrom.getDate() - 29)
  const from = searchParams.get('from') || defaultFrom.toISOString().slice(0, 10)

  // -------------------------------------------------------------------
  // Daily summary across the range
  // -------------------------------------------------------------------
  const rangeRecords = await db.attendance.findMany({
    where: {
      personType: 'Student',
      date: { gte: startOfDay(from), lte: endOfDay(to) },
    },
    select: { date: true, status: true },
  })

  const byDate: Record<string, {
    date: string
    present: number
    absent: number
    late: number
    excused: number
    sick: number
    total: number
  }> = {}

  rangeRecords.forEach(r => {
    const key = new Date(r.date).toISOString().slice(0, 10)
    if (!byDate[key]) {
      byDate[key] = { date: key, present: 0, absent: 0, late: 0, excused: 0, sick: 0, total: 0 }
    }
    const bucket = byDate[key]
    bucket.total++
    const s = (r.status || '').toLowerCase()
    if (s === 'present') bucket.present++
    else if (s === 'absent') bucket.absent++
    else if (s === 'late') bucket.late++
    else if (s === 'excused') bucket.excused++
    else if (s === 'sick') bucket.sick++
  })

  const days = Object.values(byDate)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(d => ({
      ...d,
      rate: d.total > 0
        ? Math.round(((d.present + d.late) / d.total) * 1000) / 10
        : 0,
    }))

  // Overall for the range
  const overall = {
    present: days.reduce((s, d) => s + d.present, 0),
    absent: days.reduce((s, d) => s + d.absent, 0),
    late: days.reduce((s, d) => s + d.late, 0),
    excused: days.reduce((s, d) => s + d.excused, 0),
    sick: days.reduce((s, d) => s + d.sick, 0),
    total: days.reduce((s, d) => s + d.total, 0),
  }
  const overallRate = overall.total > 0
    ? Math.round(((overall.present + overall.late) / overall.total) * 1000) / 10
    : 0

  // -------------------------------------------------------------------
  // Today's stats (overall)
  // -------------------------------------------------------------------
  const todayRecords = await db.attendance.findMany({
    where: {
      personType: 'Student',
      date: { gte: startOfDay(today), lte: endOfDay(today) },
    },
    select: { status: true, studentId: true },
  })
  const todayStats = {
    present: todayRecords.filter(r => r.status === 'Present').length,
    absent: todayRecords.filter(r => r.status === 'Absent').length,
    late: todayRecords.filter(r => r.status === 'Late').length,
    excused: todayRecords.filter(r => r.status === 'Excused').length,
    sick: todayRecords.filter(r => r.status === 'Sick').length,
    total: todayRecords.length,
  }
  const todayRate = todayStats.total > 0
    ? Math.round(((todayStats.present + todayStats.late) / todayStats.total) * 1000) / 10
    : 0

  // -------------------------------------------------------------------
  // Today's per-stream summary
  // -------------------------------------------------------------------
  const streams = await db.stream.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      classLevel: { select: { name: true } },
      enrollments: {
        where: { status: 'Active', academicYear: ACADEMIC_YEAR, term: TERM },
        select: { studentId: true },
      },
    },
  })

  const todayByStudent = new Map<string, string>()
  todayRecords.forEach(r => {
    if (r.studentId) todayByStudent.set(r.studentId, r.status)
  })

  const todayByStream = streams.map(s => {
    const studentIds = s.enrollments.map(e => e.studentId)
    let present = 0, absent = 0, late = 0, excused = 0, sick = 0, unmarked = 0
    studentIds.forEach(sid => {
      const st = todayByStudent.get(sid)
      if (st === 'Present') present++
      else if (st === 'Absent') absent++
      else if (st === 'Late') late++
      else if (st === 'Excused') excused++
      else if (st === 'Sick') sick++
      else unmarked++
    })
    const marked = present + absent + late + excused + sick
    const rate = marked > 0
      ? Math.round(((present + late) / marked) * 1000) / 10
      : 0
    return {
      streamId: s.id,
      streamName: s.name,
      classLevelName: s.classLevel?.name || '',
      enrolled: studentIds.length,
      present,
      absent,
      late,
      excused,
      sick,
      unmarked,
      marked,
      rate,
    }
  })

  return NextResponse.json({
    from,
    to,
    days,
    overall: { ...overall, rate: overallRate },
    today: { ...todayStats, rate: todayRate, date: today },
    todayByStream,
  })
}
