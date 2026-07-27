import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/exams/[id]?type=question|assessment
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'question'

  if (type === 'assessment') {
    const a = await db.assessment.findUnique({
      where: { id },
      include: { subject: true, classLevel: true },
    })
    if (!a) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 })
    return NextResponse.json(a)
  } else {
    const q = await db.questionBank.findUnique({
      where: { id },
      include: { subject: true },
    })
    if (!q) return NextResponse.json({ error: 'Question not found' }, { status: 404 })
    return NextResponse.json({ ...q, optionsArray: q.options ? JSON.parse(q.options) : null })
  }
}

// PUT
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  if (body.entityType === 'assessment') {
    const data: Record<string, unknown> = {}
    if (body.title !== undefined) data.title = body.title
    if (body.status !== undefined) data.status = body.status
    if (body.totalMarks !== undefined) data.totalMarks = Number(body.totalMarks)
    if (body.weight !== undefined) data.weight = Number(body.weight)
    if (body.duration !== undefined) data.duration = body.duration ? Number(body.duration) : null
    if (body.rubric !== undefined) data.rubric = body.rubric
    if (body.instructions !== undefined) data.instructions = body.instructions
    const a = await db.assessment.update({ where: { id }, data })
    return NextResponse.json(a)
  } else {
    const data: Record<string, unknown> = {}
    if (body.question !== undefined) data.question = body.question
    if (body.questionType !== undefined) data.questionType = body.questionType
    if (body.options !== undefined) data.options = body.options ? JSON.stringify(body.options) : null
    if (body.correctAnswer !== undefined) data.correctAnswer = body.correctAnswer
    if (body.marks !== undefined) data.marks = Number(body.marks)
    if (body.difficulty !== undefined) data.difficulty = body.difficulty
    if (body.topic !== undefined) data.topic = body.topic
    if (body.bloomLevel !== undefined) data.bloomLevel = body.bloomLevel
    if (body.status !== undefined) data.status = body.status
    const q = await db.questionBank.update({ where: { id }, data })
    return NextResponse.json(q)
  }
}

// DELETE
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'question'
  if (type === 'assessment') {
    await db.assessment.delete({ where: { id } })
  } else {
    await db.questionBank.delete({ where: { id } })
  }
  return NextResponse.json({ success: true })
}
