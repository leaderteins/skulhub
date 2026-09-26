import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

/**
 * DELETE /api/timetable/[id]
 * Remove a lesson from the timetable.
 * After deleting, insert an ActivityLog entry so the action surfaces in
 * the dashboard "Recent Activity" feed.
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params

    // Fetch the entry BEFORE deleting so we can describe it in the audit log.
    const existing = await db.timetable.findUnique({
      where: { id },
      include: {
        subject: { select: { name: true } },
        stream: { select: { name: true } },
      },
    }).catch(() => null)

    await db.timetable.delete({ where: { id } })

    // Audit log entry. Uses CURRENT_TIMESTAMP (SQLite + PostgreSQL
    // compatible) and is wrapped in .catch so logging failures never
    // affect the actual delete.
    const schoolId = user.schoolId || null
    const userName = user.name || user.email || 'Unknown'
    const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const subjName = existing?.subject?.name || 'Subject'
    const dayLabel = existing?.dayOfWeek || ''
    const timeLabel = existing ? `${existing.startTime}-${existing.endTime}` : ''
    const logDetails = existing
      ? `Removed ${subjName} from ${dayLabel} ${timeLabel} timetable`
      : `Removed timetable entry ${id}`
    await db.$executeRawUnsafe(
      `INSERT INTO "ActivityLog" (id, "schoolId", action, entity, "entityId", details, "createdAt", "user")
       VALUES ($1, $2, 'DELETE', 'Timetable', $3, $4, CURRENT_TIMESTAMP, $5)`,
      logId, schoolId, id, logDetails, userName
    ).catch(() => {})

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[timetable DELETE] error:', error)
    return NextResponse.json({ error: 'Failed to remove lesson' }, { status: 500 })
  }
}

/**
 * PUT /api/timetable/[id]
 * Update an existing lesson (e.g. change teacher, room, or time slot).
 * Accepts partial updates — only the provided fields are updated.
 * After updating, insert an ActivityLog entry with action 'UPDATE'.
 */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { subjectId, teacherId, dayOfWeek, startTime, endTime, room } = body

    // Build the update payload from provided fields only (partial update).
    const data: Record<string, unknown> = {}
    if (subjectId) data.subjectId = String(subjectId)
    if (teacherId !== undefined) data.teacherId = teacherId || null
    if (dayOfWeek) data.dayOfWeek = String(dayOfWeek)
    if (startTime) data.startTime = String(startTime)
    if (endTime) data.endTime = String(endTime)
    if (room !== undefined) data.room = room || null

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const updated = await db.timetable.update({
      where: { id },
      data,
      include: {
        subject: { select: { id: true, name: true, code: true, category: true } },
        teacher: { select: { id: true, firstName: true, lastName: true } },
        stream: { select: { id: true, name: true } },
      },
    })

    // Audit log entry for the update.
    const schoolId = user.schoolId || null
    const userName = user.name || user.email || 'Unknown'
    const logId = `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const subjName = updated.subject?.name || 'Subject'
    const dayLabel = updated.dayOfWeek || ''
    const timeLabel = `${updated.startTime}-${updated.endTime}`
    const changes = Object.keys(data).join(', ')
    const logDetails = `Updated ${subjName} (${dayLabel} ${timeLabel}) — changed: ${changes}`
    await db.$executeRawUnsafe(
      `INSERT INTO "ActivityLog" (id, "schoolId", action, entity, "entityId", details, "createdAt", "user")
       VALUES ($1, $2, 'UPDATE', 'Timetable', $3, $4, CURRENT_TIMESTAMP, $5)`,
      logId, schoolId, id, logDetails, userName
    ).catch(() => {})

    return NextResponse.json({ success: true, entry: updated })
  } catch (error) {
    console.error('[timetable PUT] error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Failed to update lesson', details: msg.slice(0, 200) },
      { status: 500 }
    )
  }
}
