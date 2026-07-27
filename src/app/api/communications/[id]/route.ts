import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT /api/communications/[id]
// Update an announcement (e.g. toggle pin, edit fields).
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const existing = await db.announcement.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
  }

  const data: Record<string, unknown> = {}
  if (typeof body.title === 'string') data.title = body.title.trim()
  if (typeof body.body === 'string') data.body = body.body.trim()
  if (typeof body.audience === 'string') data.audience = body.audience
  if (typeof body.priority === 'string') data.priority = body.priority
  if (typeof body.pinned === 'boolean') data.pinned = body.pinned
  if (typeof body.authorName === 'string') data.authorName = body.authorName.trim() || null

  const updated = await db.announcement.update({ where: { id }, data })

  await db.activityLog.create({
    data: {
      action: 'UPDATE',
      entity: 'Announcement',
      entityId: id,
      user: body.actor || 'System',
      details: `Updated announcement "${updated.title}"`,
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/communications/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await db.announcement.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
  }

  await db.announcement.delete({ where: { id } })

  await db.activityLog.create({
    data: {
      action: 'DELETE',
      entity: 'Announcement',
      entityId: id,
      user: 'System',
      details: `Deleted announcement "${existing.title}"`,
    },
  })

  return NextResponse.json({ success: true })
}
