import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/appraisals/[id]
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const appraisal = await db.appraisal.findUnique({
    where: { id },
    include: {
      staff: {
        select: {
          id: true, employeeNo: true, firstName: true, lastName: true, email: true,
          phone: true, role: true, employmentType: true, salary: true,
          department: { select: { name: true } },
        },
      },
    },
  })
  if (!appraisal) return NextResponse.json({ error: 'Appraisal not found' }, { status: 404 })
  return NextResponse.json(appraisal)
}

// PUT /api/appraisals/[id] — update status or scores
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const data: Record<string, unknown> = {}

  if (body.status !== undefined) {
    const allowed = ['Draft', 'Completed', 'Reviewed']
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    data.status = body.status
  }

  let recalc = false
  for (const f of ['punctuality', 'teamwork', 'studentResults', 'professionalism', 'innovation']) {
    if (body[f] !== undefined) {
      data[f] = Math.min(10, Math.max(0, Number(body[f]) || 0))
      recalc = true
    }
  }

  if (body.strengths !== undefined) data.strengths = body.strengths || null
  if (body.improvements !== undefined) data.improvements = body.improvements || null
  if (body.goals !== undefined) data.goals = body.goals || null
  if (body.reviewerName !== undefined) data.reviewerName = body.reviewerName || null
  if (body.period !== undefined) data.period = body.period
  if (body.reviewDate !== undefined) data.reviewDate = new Date(body.reviewDate)

  if (recalc) {
    const existing = await db.appraisal.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Appraisal not found' }, { status: 404 })
    const p = Number(data.punctuality ?? existing.punctuality)
    const t = Number(data.teamwork ?? existing.teamwork)
    const s = Number(data.studentResults ?? existing.studentResults)
    const pr = Number(data.professionalism ?? existing.professionalism)
    const i = Number(data.innovation ?? existing.innovation)
    data.overallScore = Math.round((p + t + s + pr + i) / 5)
  } else if (body.overallScore !== undefined) {
    data.overallScore = Number(body.overallScore)
  }

  const updated = await db.appraisal.update({ where: { id }, data })

  await db.activityLog.create({
    data: {
      action: 'UPDATE',
      entity: 'Appraisal',
      entityId: id,
      user: body.updatedBy || body.reviewerName || 'Reviewer',
      details: body.status
        ? `Appraisal marked as ${body.status}`
        : `Appraisal updated — score ${updated.overallScore}/10`,
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/appraisals/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.appraisal.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
