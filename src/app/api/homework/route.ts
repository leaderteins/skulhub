import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/homework?subjectId=&classLevelId=&status=&search=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const subjectId = searchParams.get('subjectId') || ''
  const classLevelId = searchParams.get('classLevelId') || ''
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search')?.trim() || ''

  const where: {
    subjectId?: string
    classLevelId?: string
    status?: string
    OR?: Array<Record<string, unknown>>
  } = {}
  if (subjectId) where.subjectId = subjectId
  if (classLevelId) where.classLevelId = classLevelId
  if (status) where.status = status
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
    ]
  }

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setHours(0, 0, 0, 0)
  startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7)) // Monday
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(endOfWeek.getDate() + 7)

  const [homework, total, active, closed, graded, overdue, dueThisWeek, subjects, classLevels] = await Promise.all([
    db.homework.findMany({
      where,
      orderBy: [{ dueDate: 'asc' }],
      include: {
        subject: { select: { id: true, name: true, code: true } },
        classLevel: { select: { id: true, name: true, stage: true } },
      },
    }),
    db.homework.count({ where }),
    db.homework.count({ where: { ...where, status: 'Active' } }),
    db.homework.count({ where: { ...where, status: 'Closed' } }),
    db.homework.count({ where: { ...where, status: 'Graded' } }),
    db.homework.count({
      where: { ...where, status: 'Active', dueDate: { lt: now } },
    }),
    db.homework.count({
      where: {
        ...where,
        status: 'Active',
        dueDate: { gte: startOfWeek, lt: endOfWeek },
      },
    }),
    db.subject.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, code: true, category: true } }),
    db.classLevel.findMany({ orderBy: { order: 'asc' }, select: { id: true, name: true, stage: true } }),
  ])

  return NextResponse.json({
    stats: {
      total,
      active,
      closed,
      graded,
      overdue,
      dueThisWeek,
    },
    subjects,
    classLevels,
    homework: homework.map(h => ({
      ...h,
      subjectName: h.subject?.name || null,
      subjectCode: h.subject?.code || null,
      classLevelName: h.classLevel?.name || null,
      stage: h.classLevel?.stage || null,
    })),
  })
}

// POST /api/homework — create new homework
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.title || !body.dueDate) {
    return NextResponse.json({ error: 'title and dueDate are required' }, { status: 400 })
  }
  const homework = await db.homework.create({
    data: {
      title: body.title,
      subjectId: body.subjectId || null,
      classLevelId: body.classLevelId || null,
      description: body.description || '',
      dueDate: new Date(body.dueDate),
      maxMarks: Number(body.maxMarks) || 100,
      status: body.status || 'Active',
      createdBy: body.createdBy || null,
    },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      classLevel: { select: { id: true, name: true, stage: true } },
    },
  })
  await db.activityLog.create({
    data: {
      action: 'CREATE',
      entity: 'Homework',
      entityId: homework.id,
      user: body.createdBy || 'Teacher',
      details: `Created homework "${homework.title}"`,
    },
  })
  return NextResponse.json(homework, { status: 201 })
}

// PUT /api/homework — update homework status (close/grade) or fields
// Body: { id, status?, ...fields }
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }
  const existing = await db.homework.findUnique({ where: { id: body.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Homework not found' }, { status: 404 })
  }
  const data: Record<string, unknown> = {}
  if (body.status) data.status = body.status
  if (body.title) data.title = body.title
  if (body.description !== undefined) data.description = body.description || ''
  if (body.dueDate) data.dueDate = new Date(body.dueDate)
  if (body.maxMarks !== undefined) data.maxMarks = Number(body.maxMarks)
  if (body.subjectId !== undefined) data.subjectId = body.subjectId || null
  if (body.classLevelId !== undefined) data.classLevelId = body.classLevelId || null

  const updated = await db.homework.update({
    where: { id: body.id },
    data,
    include: {
      subject: { select: { id: true, name: true, code: true } },
      classLevel: { select: { id: true, name: true, stage: true } },
    },
  })
  await db.activityLog.create({
    data: {
      action: 'UPDATE',
      entity: 'Homework',
      entityId: updated.id,
      user: body.updatedBy || 'Teacher',
      details: body.status
        ? `Updated homework "${updated.title}" status → ${body.status}`
        : `Updated homework "${updated.title}"`,
    },
  })
  return NextResponse.json(updated)
}
