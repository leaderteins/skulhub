import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/events?category=&status=&audience=&month=&search=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') || ''
  const status = searchParams.get('status') || ''
  const audience = searchParams.get('audience') || ''
  const month = searchParams.get('month') // YYYY-MM
  const search = searchParams.get('search')?.trim() || ''
  const upcoming = searchParams.get('upcoming') === 'true'

  const where: {
    category?: string
    status?: string
    audience?: string
    startDate?: { gte: Date }
    OR?: Array<Record<string, unknown>>
  } = {}
  if (category) where.category = category
  if (status) where.status = status
  if (audience) where.audience = audience
  if (upcoming) where.startDate = { gte: new Date() }
  if (month) {
    const [y, m] = month.split('-').map(Number)
    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 0, 23, 59, 59)
    where.startDate = { gte: start }
    // Need to also filter endDate <= end; use raw OR approach below
  }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { location: { contains: search } },
      { organizer: { contains: search } },
    ]
  }

  const [events, total, byCategory, byStatus, upcomingList, thisWeek] = await Promise.all([
    db.event.findMany({
      where,
      orderBy: { startDate: 'asc' },
      include: { participants: { select: { id: true, name: true, role: true, status: true } } },
    }),
    db.event.count({ where }),
    db.event.groupBy({ by: ['category'], _count: true }),
    db.event.groupBy({ by: ['status'], _count: true }),
    db.event.findMany({
      where: { startDate: { gte: new Date() }, status: { in: ['Scheduled', 'Ongoing'] } },
      orderBy: { startDate: 'asc' },
      take: 6,
    }),
    db.event.count({
      where: {
        startDate: { gte: new Date(), lte: new Date(Date.now() + 7 * 86400000) },
        status: { in: ['Scheduled', 'Ongoing'] },
      },
    }),
  ])

  return NextResponse.json({
    stats: {
      total,
      scheduled: byStatus.find(s => s.status === 'Scheduled')?._count || 0,
      ongoing: byStatus.find(s => s.status === 'Ongoing')?._count || 0,
      completed: byStatus.find(s => s.status === 'Completed')?._count || 0,
      cancelled: byStatus.find(s => s.status === 'Cancelled')?._count || 0,
      thisWeek,
    },
    events: events.map(e => ({
      ...e,
      participantCount: e.participants.length,
      confirmedCount: e.participants.filter(p => p.status === 'Confirmed' || p.status === 'Attended').length,
    })),
    byCategory: byCategory.map(c => ({ name: c.category, count: c._count })),
    byStatus: byStatus.map(s => ({ name: s.status, count: s._count })),
    upcoming: upcomingList,
  })
}

// POST /api/events — create a new event
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.title || !body.startDate) {
    return NextResponse.json({ error: 'title and startDate are required' }, { status: 400 })
  }
  const event = await db.event.create({
    data: {
      title: body.title,
      description: body.description || null,
      category: body.category || 'General',
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      allDay: body.allDay || false,
      location: body.location || null,
      organizer: body.organizer || null,
      audience: body.audience || 'All',
      status: body.status || 'Scheduled',
      priority: body.priority || 'Normal',
      color: body.color || 'emerald',
    },
  })
  await db.activityLog.create({
    data: { action: 'CREATE', entity: 'Event', entityId: event.id, user: body.organizer || 'Admin', details: `Created event "${event.title}"` },
  })
  return NextResponse.json(event, { status: 201 })
}
