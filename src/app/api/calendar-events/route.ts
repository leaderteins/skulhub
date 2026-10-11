import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    let events: any[] = []
    try {
      events = await db.event.findMany({ where: { schoolId: user.schoolId }, orderBy: { startDate: 'asc' }, take: 100 })
    } catch {}
    return NextResponse.json({ events })
  } catch {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const { title, description, category, startDate, endDate, location } = body
    if (!title || !startDate) return NextResponse.json({ error: 'title and startDate required' }, { status: 400 })
    let event: any = null
    try {
      event = await db.event.create({
        data: {
          title, description: description || '', category: category || 'General',
          startDate: new Date(startDate), endDate: endDate ? new Date(endDate) : null,
          location: location || '', schoolId: user.schoolId, type: category || 'General',
          date: new Date(startDate), organizer: user.name || 'System'
        }
      })
    } catch {}
    return NextResponse.json({ success: true, event })
  } catch {
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
  }
}
