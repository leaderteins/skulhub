import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/lessonplans?subjectId=&classLevelId=&week=&status=&search=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const subjectId = searchParams.get('subjectId') || ''
  const classLevelId = searchParams.get('classLevelId') || ''
  const week = searchParams.get('week') || ''
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search')?.trim() || ''

  const where: {
    subjectId?: string
    classLevelId?: string
    week?: number
    status?: string
    OR?: Array<Record<string, unknown>>
  } = {}
  if (subjectId) where.subjectId = subjectId
  if (classLevelId) where.classLevelId = classLevelId
  if (week) where.week = Number(week)
  if (status) where.status = status
  if (search) {
    where.OR = [
      { topic: { contains: search } },
      { objectives: { contains: search } },
      { activities: { contains: search } },
      { resources: { contains: search } },
      { notes: { contains: search } },
    ]
  }

  // Determine "current school week" for the term.
  // Strategy: use the highest week number among existing plans; fall back to ISO week.
  // This gives a meaningful "this week" stat aligned to the academic calendar.
  const allWeeks = await db.lessonPlan.findMany({ select: { week: true }, distinct: ['week'] })
  const weeksList = allWeeks.map(w => w.week).sort((a, b) => a - b)
  const currentSchoolWeek = weeksList.length > 0 ? weeksList[weeksList.length - 1] : getCurrentISOWeek()

  const [lessonPlans, total, published, drafts, completed, thisWeek, bySubject, subjects, classLevels] = await Promise.all([
    db.lessonPlan.findMany({
      where,
      orderBy: [{ week: 'asc' }, { createdAt: 'desc' }],
      include: {
        subject: { select: { id: true, name: true, code: true } },
        classLevel: { select: { id: true, name: true, stage: true } },
      },
    }),
    db.lessonPlan.count({ where }),
    db.lessonPlan.count({ where: { ...where, status: 'Published' } }),
    db.lessonPlan.count({ where: { ...where, status: 'Draft' } }),
    db.lessonPlan.count({ where: { ...where, status: 'Completed' } }),
    db.lessonPlan.count({ where: { ...where, week: currentSchoolWeek } }),
    db.lessonPlan.groupBy({
      by: ['subjectId'],
      _count: true,
    }),
    db.subject.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, code: true, category: true } }),
    db.classLevel.findMany({ orderBy: { order: 'asc' }, select: { id: true, name: true, stage: true } }),
  ])

  // Resolve subject names for bySubject breakdown (subjects list already fetched)
  const subjectMap = new Map(subjects.map(s => [s.id, s.name]))

  return NextResponse.json({
    stats: {
      total,
      published,
      drafts,
      completed,
      thisWeek,
      currentWeek: currentSchoolWeek,
    },
    bySubject: bySubject.map(s => ({
      subjectId: s.subjectId,
      name: s.subjectId ? (subjectMap.get(s.subjectId) || 'Unknown') : 'Unassigned',
      count: s._count,
    })),
    subjects,
    classLevels,
    lessonPlans: lessonPlans.map(p => ({
      ...p,
      subjectName: p.subject?.name || null,
      subjectCode: p.subject?.code || null,
      classLevelName: p.classLevel?.name || null,
      stage: p.classLevel?.stage || null,
    })),
  })
}

// POST /api/lessonplans — create a new lesson plan
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.topic || !body.week) {
    return NextResponse.json({ error: 'topic and week are required' }, { status: 400 })
  }
  const lessonPlan = await db.lessonPlan.create({
    data: {
      subjectId: body.subjectId || null,
      classLevelId: body.classLevelId || null,
      week: Number(body.week),
      term: body.term || 'Term 1',
      topic: body.topic,
      objectives: body.objectives || null,
      activities: body.activities || null,
      resources: body.resources || null,
      assessment: body.assessment || null,
      notes: body.notes || null,
      createdBy: body.createdBy || null,
      status: body.status || 'Draft',
    },
    include: {
      subject: { select: { id: true, name: true, code: true } },
      classLevel: { select: { id: true, name: true, stage: true } },
    },
  })
  await db.activityLog.create({
    data: {
      action: 'CREATE',
      entity: 'LessonPlan',
      entityId: lessonPlan.id,
      user: body.createdBy || 'Teacher',
      details: `Created lesson plan "${lessonPlan.topic}" (Week ${lessonPlan.week})`,
    },
  })
  return NextResponse.json(lessonPlan, { status: 201 })
}

// PUT /api/lessonplans — update lesson plan (status or full record)
// Body: { id, status?, ...fields }
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }
  const existing = await db.lessonPlan.findUnique({ where: { id: body.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Lesson plan not found' }, { status: 404 })
  }
  const data: Record<string, unknown> = {}
  if (body.status) data.status = body.status
  if (body.topic) data.topic = body.topic
  if (body.week !== undefined) data.week = Number(body.week)
  if (body.term) data.term = body.term
  if (body.subjectId !== undefined) data.subjectId = body.subjectId || null
  if (body.classLevelId !== undefined) data.classLevelId = body.classLevelId || null
  if (body.objectives !== undefined) data.objectives = body.objectives || null
  if (body.activities !== undefined) data.activities = body.activities || null
  if (body.resources !== undefined) data.resources = body.resources || null
  if (body.assessment !== undefined) data.assessment = body.assessment || null
  if (body.notes !== undefined) data.notes = body.notes || null

  const updated = await db.lessonPlan.update({
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
      entity: 'LessonPlan',
      entityId: updated.id,
      user: body.updatedBy || 'Teacher',
      details: body.status
        ? `Updated lesson plan "${updated.topic}" status → ${body.status}`
        : `Updated lesson plan "${updated.topic}"`,
    },
  })
  return NextResponse.json(updated)
}

// Compute ISO week number (1-53) for "this week" stats
function getCurrentISOWeek(): number {
  const now = new Date()
  const target = new Date(now.valueOf())
  const dayNumber = (now.getUTCDay() + 6) % 7 // Monday=0..Sunday=6
  target.setUTCDate(target.getUTCDate() - dayNumber + 3) // Thursday of this ISO week
  const firstThursday = target.valueOf()
  target.setUTCMonth(0, 1) // Jan 1
  if (target.getUTCDay() !== 4) {
    target.setUTCMonth(0, 1 + ((4 - target.getUTCDay()) + 7) % 7)
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / (7 * 24 * 3600 * 1000))
}
