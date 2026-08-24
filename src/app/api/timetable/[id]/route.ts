import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

/**
 * DELETE /api/timetable/[id]
 * Remove a lesson from the timetable
 */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { id } = await params
    await db.timetable.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[timetable DELETE] error:', error)
    return NextResponse.json({ error: 'Failed to remove lesson' }, { status: 500 })
  }
}
