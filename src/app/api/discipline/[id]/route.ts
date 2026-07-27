import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/discipline/[id] — incident detail
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const incident = await db.incident.findUnique({
    where: { id },
    include: {
      student: {
        include: {
          guardian: true,
          enrollments: { take: 1, include: { stream: { include: { classLevel: true } } } },
        },
      },
    },
  })
  if (!incident) return NextResponse.json({ error: 'Incident not found' }, { status: 404 })

  // Get student's other incidents for context
  const otherIncidents = await db.incident.findMany({
    where: { studentId: incident.studentId, id: { not: id } },
    orderBy: { date: 'desc' },
    take: 5,
    select: { id: true, incidentNo: true, date: true, category: true, severity: true, status: true },
  })

  return NextResponse.json({ ...incident, otherIncidents })
}

// PUT /api/discipline/[id] — update (resolve, add sanction, etc.)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (body.status !== undefined) data.status = body.status
  if (body.severity !== undefined) data.severity = body.severity
  if (body.category !== undefined) data.category = body.category
  if (body.description !== undefined) data.description = body.description
  if (body.location !== undefined) data.location = body.location
  if (body.sanction !== undefined) data.sanction = body.sanction
  if (body.sanctionDetails !== undefined) data.sanctionDetails = body.sanctionDetails
  if (body.sanctionStartDate !== undefined) data.sanctionStartDate = body.sanctionStartDate ? new Date(body.sanctionStartDate) : null
  if (body.sanctionEndDate !== undefined) data.sanctionEndDate = body.sanctionEndDate ? new Date(body.sanctionEndDate) : null
  if (body.resolutionNotes !== undefined) data.resolutionNotes = body.resolutionNotes
  if (body.parentNotified !== undefined) {
    data.parentNotified = body.parentNotified
    if (body.parentNotified) data.parentNotificationDate = new Date()
  }
  // Set resolution metadata when resolving
  if (['Resolved', 'Closed'].includes(body.status)) {
    data.resolvedDate = new Date()
    data.resolvedBy = body.resolvedBy || 'Administration'
  }

  const incident = await db.incident.update({ where: { id }, data })
  await db.activityLog.create({
    data: { action: 'UPDATE', entity: 'Incident', entityId: id, user: body.resolvedBy || 'Staff', details: `Incident ${incident.incidentNo} updated → ${body.status || incident.status}` },
  })
  return NextResponse.json(incident)
}

// DELETE /api/discipline/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.incident.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
