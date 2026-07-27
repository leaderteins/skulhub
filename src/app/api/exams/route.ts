import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/exams?tab=questions|assessments&subject=&difficulty=&type=&status=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const tab = searchParams.get('tab') || 'all'
  const subject = searchParams.get('subject') || ''
  const difficulty = searchParams.get('difficulty') || ''
  const qType = searchParams.get('qType') || ''
  const aType = searchParams.get('aType') || ''
  const status = searchParams.get('status') || ''

  const [questions, assessments, totalQuestions, totalAssessments, bySubject, byDifficulty, byType, byAssessmentType, byStatus, subjects] = await Promise.all([
    db.questionBank.findMany({
      where: {
        ...(subject && { subjectId: subject }),
        ...(difficulty && { difficulty }),
        ...(qType && { questionType: qType }),
      },
      orderBy: { createdAt: 'desc' },
      include: { subject: { select: { name: true, code: true } } },
    }),
    db.assessment.findMany({
      where: {
        ...(subject && { subjectId: subject }),
        ...(aType && { assessmentType: aType }),
        ...(status && { status }),
      },
      orderBy: { startDate: 'desc' },
      include: {
        subject: { select: { name: true, code: true } },
        classLevel: { select: { name: true } },
      },
    }),
    db.questionBank.count(),
    db.assessment.count(),
    db.questionBank.groupBy({ by: ['subjectId'], _count: true }),
    db.questionBank.groupBy({ by: ['difficulty'], _count: true }),
    db.questionBank.groupBy({ by: ['questionType'], _count: true }),
    db.assessment.groupBy({ by: ['assessmentType'], _count: true }),
    db.assessment.groupBy({ by: ['status'], _count: true }),
    db.subject.findMany({ select: { id: true, name: true, code: true }, orderBy: { name: 'asc' } }),
  ])

  const subjectNames: Record<string, string> = {}
  subjects.forEach(s => { subjectNames[s.id] = s.name })
  const bySubjectNamed = bySubject.map(s => ({ name: subjectNames[s.subjectId] || 'Unknown', count: s._count }))

  return NextResponse.json({
    stats: {
      totalQuestions,
      totalAssessments,
      published: byStatus.find(s => s.status === 'Published')?._count || 0,
      completed: byStatus.find(s => s.status === 'Completed')?._count || 0,
      graded: byStatus.find(s => s.status === 'Graded')?._count || 0,
      drafts: byStatus.find(s => s.status === 'Draft')?._count || 0,
    },
    questions: questions.map(q => ({
      ...q,
      subjectName: q.subject?.name || '—',
      subjectCode: q.subject?.code || '—',
      optionsArray: q.options ? JSON.parse(q.options) : null,
      subject: undefined,
    })),
    assessments: assessments.map(a => ({
      ...a,
      subjectName: a.subject?.name || '—',
      subjectCode: a.subject?.code || '—',
      classLevelName: a.classLevel?.name || '—',
      subject: undefined,
      classLevel: undefined,
    })),
    bySubject: bySubjectNamed,
    byDifficulty: byDifficulty.map(d => ({ name: d.difficulty, count: d._count })),
    byQuestionType: byType.map(t => ({ name: t.questionType, count: t._count })),
    byAssessmentType: byAssessmentType.map(t => ({ name: t.assessmentType, count: t._count })),
    byStatus: byStatus.map(s => ({ name: s.status, count: s._count })),
    subjects,
  })
}

// POST /api/exams — create question or assessment (based on body.type)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  if (body.entityType === 'question') {
    if (!body.question) return NextResponse.json({ error: 'question is required' }, { status: 400 })
    const q = await db.questionBank.create({
      data: {
        subjectId: body.subjectId || null,
        question: body.question,
        questionType: body.questionType || 'Multiple Choice',
        options: body.options ? JSON.stringify(body.options) : null,
        correctAnswer: body.correctAnswer || null,
        marks: Number(body.marks) || 1,
        difficulty: body.difficulty || 'Medium',
        topic: body.topic || null,
        bloomLevel: body.bloomLevel || null,
        createdBy: body.createdBy || null,
        status: 'Active',
      },
    })
    await db.activityLog.create({ data: { action: 'CREATE', entity: 'QuestionBank', entityId: q.id, user: body.createdBy || 'Teacher', details: `Created question: ${body.question.slice(0, 50)}` } })
    return NextResponse.json(q, { status: 201 })
  } else if (body.entityType === 'assessment') {
    if (!body.title || !body.startDate) return NextResponse.json({ error: 'title and startDate are required' }, { status: 400 })
    const a = await db.assessment.create({
      data: {
        title: body.title,
        subjectId: body.subjectId || null,
        classLevelId: body.classLevelId || null,
        assessmentType: body.assessmentType || 'CAT',
        term: body.term || 'Term 1',
        academicYear: body.academicYear || '2025',
        totalMarks: Number(body.totalMarks) || 100,
        weight: Number(body.weight) || 0,
        duration: body.duration ? Number(body.duration) : null,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : null,
        status: body.status || 'Draft',
        rubric: body.rubric || null,
        instructions: body.instructions || null,
        createdBy: body.createdBy || null,
      },
    })
    await db.activityLog.create({ data: { action: 'CREATE', entity: 'Assessment', entityId: a.id, user: body.createdBy || 'Teacher', details: `Created assessment: ${body.title}` } })
    return NextResponse.json(a, { status: 201 })
  }
  return NextResponse.json({ error: 'entityType must be "question" or "assessment"' }, { status: 400 })
}
