import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * PATCH /api/notifications/[id]
 * -----------------------------
 * Updates a single notification's read/archived state.
 *
 * Body: {
 *   read?: boolean,         // sets readAt to now() if true, null if false
 *   archived?: boolean,     // sets archivedAt to now() if true, null if false
 * }
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }
    const body = await req.json().catch(() => ({} as Record<string, unknown>))

    const data: Record<string, Date | null> = {}
    if (body.read === true) data.readAt = new Date()
    if (body.read === false) data.readAt = null
    if (body.archived === true) data.archivedAt = new Date()
    if (body.archived === false) data.archivedAt = null

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: 'Nothing to update — pass { read?: boolean, archived?: boolean }' },
        { status: 400 },
      )
    }

    const updated = await db.appNotification.update({
      where: { id },
      data,
    })

    return NextResponse.json({
      ok: true,
      notification: {
        id: updated.id,
        readAt: updated.readAt,
        archivedAt: updated.archivedAt,
      },
    })
  } catch (e: unknown) {
    console.error('[notifications PATCH] error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to update notification' },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/notifications/[id]
 * ------------------------------
 * Permanently removes a single notification.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }
    await db.appNotification.delete({ where: { id } })
    return NextResponse.json({ ok: true, id })
  } catch (e: unknown) {
    console.error('[notifications DELETE] error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to delete notification' },
      { status: 500 },
    )
  }
}
