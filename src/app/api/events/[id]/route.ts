import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/events/[id] — event detail with participants
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const event = await db.event.findUnique({
    where: { id },
    include: { participants: { orderBy: { createdAt: 'asc' } } },
  })
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  return NextResponse.json(event)
}

// PUT /api/events/[id] — update event
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const data: Record<string, unknown> = {}
  if (body.title !== undefined) data.title = body.title
  if (body.description !== undefined) data.description = body.description
  if (body.category !== undefined) data.category = body.category
  if (body.startDate !== undefined) data.startDate = new Date(body.startDate)
  if (body.endDate !== undefined) data.endDate = body.endDate ? new Date(body.endDate) : null
  if (body.allDay !== undefined) data.allDay = body.allDay
  if (body.location !== undefined) data.location = body.location
  if (body.organizer !== undefined) data.organizer = body.organizer
  if (body.audience !== undefined) data.audience = body.audience
  if (body.status !== undefined) data.status = body.status
  if (body.priority !== undefined) data.priority = body.priority
  if (body.color !== undefined) data.color = body.color

  const event = await db.event.update({ where: { id }, data })
  return NextResponse.json(event)
}

// DELETE /api/events/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.event.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
