import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

type Ctx = { params: Promise<{ id: string }> }

// GET /api/staff/[id] — full detail
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params

  const staff = await db.staff.findUnique({
    where: { id },
    include: {
      department: { select: { id: true, name: true, description: true } },
      taughtSubjects: {
        include: {
          subject: { select: { id: true, name: true, code: true, category: true } },
          classLevel: { select: { id: true, name: true } },
        },
      },
      attendanceAsStaff: {
        orderBy: { date: 'desc' },
        take: 10,
        include: {
          marker: { select: { firstName: true, lastName: true } },
        },
      },
      timetable: {
        include: {
          stream: { select: { id: true, name: true } },
          subject: { select: { id: true, name: true, code: true } },
        },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      },
    },
  })

  if (!staff) {
    return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
  }

  // Group timetable by day
  const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  const timetableByDay: Record<string, any[]> = {}
  staff.timetable.forEach((t) => {
    if (!timetableByDay[t.dayOfWeek]) timetableByDay[t.dayOfWeek] = []
    timetableByDay[t.dayOfWeek].push(t)
  })
  const groupedTimetable = dayOrder
    .filter((d) => timetableByDay[d])
    .map((day) => ({ day, lessons: timetableByDay[day] }))

  // Weekly teaching load summary
  const totalLessons = staff.timetable.length
  const totalPeriods = staff.taughtSubjects.reduce((s, a) => s + (a.weeklyPeriods || 0), 0)
  const uniqueSubjects = new Set(staff.taughtSubjects.map((a) => a.subjectId)).size
  const uniqueClasses = new Set(staff.taughtSubjects.map((a) => a.classLevelId)).size

  // Recent attendance summary
  const last10 = staff.attendanceAsStaff
  const presentCount = last10.filter((a) => a.status === 'Present').length
  const attendanceRate = last10.length > 0 ? Math.round((presentCount / last10.length) * 100) : 0

  return NextResponse.json({
    ...staff,
    timetableByDay: groupedTimetable,
    loadSummary: {
      totalLessons,
      totalPeriods,
      uniqueSubjects,
      uniqueClasses,
    },
    attendanceSummary: {
      recent: last10,
      rate: attendanceRate,
      totalRecords: last10.length,
    },
  })
}

// PUT /api/staff/[id] — update
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const body = await req.json()

  const existing = await db.staff.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
  }

  // Uniqueness guards on update
  if (body.employeeNo && body.employeeNo !== existing.employeeNo) {
    const dup = await db.staff.findUnique({ where: { employeeNo: body.employeeNo } })
    if (dup) {
      return NextResponse.json({ error: 'Employee number already exists.' }, { status: 400 })
    }
  }
  if (body.email && body.email !== existing.email) {
    const dup = await db.staff.findUnique({ where: { email: body.email } })
    if (dup) {
      return NextResponse.json({ error: 'Email already in use.' }, { status: 400 })
    }
  }

  const data: any = {}
  for (const key of [
    'employeeNo', 'firstName', 'lastName', 'email', 'phone', 'gender', 'role',
    'qualification', 'specialization', 'employmentType', 'status', 'address',
  ]) {
    if (body[key] !== undefined) data[key] = body[key] || null
  }
  if (body.salary !== undefined) data.salary = Number(body.salary) || 0
  if (body.departmentId !== undefined) data.departmentId = body.departmentId || null
  if (body.hireDate !== undefined) data.hireDate = new Date(body.hireDate)

  const staff = await db.staff.update({ where: { id }, data })

  await db.activityLog.create({
    data: {
      action: 'UPDATE',
      entity: 'Staff',
      entityId: staff.id,
      user: 'System',
      details: `Updated staff ${staff.firstName} ${staff.lastName} (${staff.employeeNo})`,
    },
  })

  return NextResponse.json(staff)
}

// DELETE /api/staff/[id]
export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const { id } = await params
  const existing = await db.staff.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Staff not found' }, { status: 404 })
  }

  // Detach relations that have no cascade defined (taughtSubjects, timetable, etc.)
  await db.subjectAssignment.updateMany({ where: { teacherId: id }, data: { teacherId: null } })
  await db.timetable.updateMany({ where: { teacherId: id }, data: { teacherId: null } })
  await db.transportRoute.updateMany({ where: { driverId: id }, data: { driverId: null } })
  await db.attendance.deleteMany({ where: { markedById: id } })
  await db.attendance.deleteMany({ where: { staffId: id } })
  // Detach head of department link
  await db.department.updateMany({ where: { headId: id }, data: { headId: null } })

  await db.staff.delete({ where: { id } })

  await db.activityLog.create({
    data: {
      action: 'DELETE',
      entity: 'Staff',
      entityId: id,
      user: 'System',
      details: `Deleted staff ${existing.firstName} ${existing.lastName} (${existing.employeeNo})`,
    },
  })

  return NextResponse.json({ success: true })
}
