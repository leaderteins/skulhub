import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admissions/[id] — application detail
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const application = await db.application.findUnique({
    where: { id },
    include: { appliedClassLevel: true },
  })
  if (!application) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  return NextResponse.json(application)
}

// PUT /api/admissions/[id] — update status / schedule interview / make decision
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (body.status) data.status = body.status
  if (body.priority) data.priority = body.priority
  if (body.interviewDate) data.interviewDate = new Date(body.interviewDate)
  if (body.interviewNotes !== undefined) data.interviewNotes = body.interviewNotes
  if (body.notes !== undefined) data.notes = body.notes
  if (body.rejectionReason !== undefined) data.rejectionReason = body.rejectionReason
  // Set decision metadata when status changes to a decision state
  if (['Accepted', 'Rejected', 'Enrolled', 'Waitlisted'].includes(body.status)) {
    data.decisionDate = new Date()
    data.decisionBy = body.decisionBy || 'Principal Office'
  }

  const application = await db.application.update({ where: { id }, data })
  await db.activityLog.create({
    data: {
      action: 'UPDATE',
      entity: 'Application',
      entityId: id,
      user: body.decisionBy || 'Admissions',
      details: `Application ${application.applicationNo} status → ${body.status || application.status}`,
    },
  })
  return NextResponse.json(application)
}

// DELETE /api/admissions/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.application.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
