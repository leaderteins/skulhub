import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

/**
 * GET /api/notifications
 * -----------------------
 * Returns the in-app notifications for the signed-in user's school.
 * The query supports `?limit=`, `?type=`, `?priority=`, `?status=read|unread|archived|all`.
 *
 * Response shape:
 *   {
 *     notifications: AppNotification[],
 *     stats: { total, unread, actionRequired, today, byType: {...} },
 *     byDay: [{ label, count }]   // last 7 days
 *   }
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10) || 50, 200)
    const type = url.searchParams.get('type') || null
    const priority = url.searchParams.get('priority') || null
    const status = url.searchParams.get('status') || 'all'

    // Resolve the schoolId from the JWT in the request, falling back to the
    // first non-platform school in the DB (so the UI works even if the
    // caller is in demo mode without a token).
    let schoolId: string | null = null
    let userId: string | null = null
    let role: string | null = null
    try {
      const u = await getUserFromRequest(req)
      if (u?.schoolId) {
        schoolId = u.schoolId
        userId = u.id
        role = u.role
      }
    } catch {}
    if (!schoolId) {
      try {
        const school = await db.school.findFirst({ where: { slug: { not: 'platform' } } })
        if (school) schoolId = school.id
      } catch {}
    }

    // Build the where clause (always scoped to a school to prevent leakage)
    const where: Record<string, unknown> = {}
    if (schoolId) where.schoolId = schoolId
    if (type && type !== 'all') where.type = type
    if (priority && priority !== 'all') where.priority = priority
    if (status === 'unread') {
      where.readAt = null
      where.archivedAt = null
    } else if (status === 'read') {
      where.readAt = { not: null }
      where.archivedAt = null
    } else if (status === 'archived') {
      where.archivedAt = { not: null }
    }

    // Fetch the notifications + stats in parallel
    const [
      notifications,
      total,
      unread,
      actionRequired,
      today,
      typeGroups,
      allRecentForByDay,
    ] = await Promise.all([
      db.appNotification.findMany({
        where,
        orderBy: [{ createdAt: 'desc' }],
        take: limit,
      }),
      db.appNotification.count({ where: { schoolId: schoolId ?? undefined } }),
      db.appNotification.count({
        where: { schoolId: schoolId ?? undefined, readAt: null, archivedAt: null },
      }),
      db.appNotification.count({
        where: {
          schoolId: schoolId ?? undefined,
          readAt: null,
          archivedAt: null,
          priority: { in: ['high', 'urgent'] },
        },
      }),
      db.appNotification.count({
        where: {
          schoolId: schoolId ?? undefined,
          createdAt: { gte: startOfToday() },
        },
      }),
      db.appNotification.groupBy({
        by: ['type'],
        _count: true,
        where: { schoolId: schoolId ?? undefined },
      }),
      // Pull up to 500 most-recent notifications for the 7-day chart, ignoring
      // the user's `limit` param (which only controls the table page size).
      db.appNotification.findMany({
        where: { schoolId: schoolId ?? undefined, createdAt: { gte: sevenDaysAgo() } },
        select: { createdAt: true },
        take: 500,
        orderBy: { createdAt: 'desc' },
      }),
    ])

    // Build last-7-days series from the unbounded query (so the bar chart
    // is accurate even when the table is paginated to a small limit).
    const byDay = buildLast7Days(allRecentForByDay as Array<{ createdAt: Date | string }>)

    const byType: Record<string, number> = {
      fee: 0, attendance: 0, exam: 0, discipline: 0, system: 0, message: 0,
    }
    for (const g of typeGroups) {
      byType[g.type] = g._count
    }

    return NextResponse.json({
      notifications: notifications.map(formatNotification),
      stats: {
        total: total ?? 0,
        unread: unread ?? 0,
        actionRequired: actionRequired ?? 0,
        today: today ?? 0,
        byType,
      },
      byDay,
      viewer: { userId, role, schoolId },
    })
  } catch (e: unknown) {
    console.error('[notifications GET] error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to fetch notifications' },
      { status: 500 },
    )
  }
}

/**
 * POST /api/notifications
 * -----------------------
 * Creates a new in-app notification, then broadcasts it via the
 * notifications mini-service (port 3003) so connected clients receive it
 * in real-time.
 *
 * Body: {
 *   userId?: string,     // target user (null = broadcast to school)
 *   role?: string,       // target role  (null = all roles)
 *   type: string,        // fee | attendance | exam | discipline | system | message
 *   priority?: string,   // low | normal | high | urgent (default 'normal')
 *   title: string,
 *   message: string,
 *   metadata?: object,   // arbitrary JSON, stringified before insert
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
    }
    const { type, title, message } = body as Record<string, unknown>
    if (typeof type !== 'string' || typeof title !== 'string' || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'type, title and message (all strings) are required' },
        { status: 400 },
      )
    }

    // Resolve the schoolId (from JWT, falling back to first non-platform school)
    let schoolId: string | null = null
    let actorUserId: string | null = null
    try {
      const u = await getUserFromRequest(req)
      if (u?.schoolId) {
        schoolId = u.schoolId
        actorUserId = u.id
      }
    } catch {}
    if (!schoolId) {
      try {
        const school = await db.school.findFirst({ where: { slug: { not: 'platform' } } })
        if (school) schoolId = school.id
      } catch {}
    }

    const userId = typeof body.userId === 'string' && body.userId ? body.userId : null
    const role = typeof body.role === 'string' && body.role ? body.role : null
    const priority = typeof body.priority === 'string'
      ? body.priority
      : 'normal'
    const metadata = body.metadata != null
      ? JSON.stringify(body.metadata)
      : null

    const created = await db.appNotification.create({
      data: {
        schoolId,
        userId,
        role,
        type,
        priority,
        title,
        message,
        metadata,
      },
    })

    // Fire-and-forget broadcast to the realtime mini-service.
    // Wrapped in try/catch — if the service is down, the notification still
    // lives in the DB and will be picked up on the next refetch.
    try {
      await broadcastToRealtime({
        id: created.id,
        userId,
        schoolId,
        role,
        type,
        priority,
        title,
        message,
        metadata: body.metadata ?? null,
        createdAt: created.createdAt.toISOString(),
      })
    } catch (e) {
      console.error('[notifications POST] realtime broadcast failed:', e)
    }

    // Activity log entry (best-effort)
    try {
      await db.activityLog.create({
        data: {
          action: 'CREATE',
          entity: 'AppNotification',
          entityId: created.id,
          user: actorUserId || 'System',
          details: `${type}/${priority}: ${title}`,
        },
      })
    } catch {}

    return NextResponse.json(
      { notification: formatNotification(created), ok: true },
      { status: 201 },
    )
  } catch (e: unknown) {
    console.error('[notifications POST] error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to create notification' },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function startOfToday(): Date {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function sevenDaysAgo(): Date {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d
}

function buildLast7Days(items: Array<{ createdAt: Date | string }>): Array<{ label: string; count: number }> {
  const days: Array<{ label: string; key: string }> = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - i)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    days.push({ label: d.toLocaleDateString('en-KE', { weekday: 'short' }), key })
  }
  const buckets: Record<string, number> = {}
  for (const d of days) buckets[d.key] = 0
  for (const item of items) {
    const d = new Date(item.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    if (buckets[key] !== undefined) buckets[key] += 1
  }
  return days.map(d => ({ label: d.label, count: buckets[d.key] || 0 }))
}

function formatNotification(n: {
  id: string
  schoolId: string | null
  userId: string | null
  role: string | null
  type: string
  priority: string
  title: string
  message: string
  metadata: string | null
  readAt: Date | null
  archivedAt: Date | null
  createdAt: Date
}) {
  let metadata: Record<string, unknown> | null = null
  if (n.metadata) {
    try { metadata = JSON.parse(n.metadata) } catch {}
  }
  return {
    id: n.id,
    schoolId: n.schoolId,
    userId: n.userId,
    role: n.role,
    type: n.type,
    priority: n.priority,
    title: n.title,
    message: n.message,
    metadata,
    readAt: n.readAt?.toISOString() ?? null,
    archivedAt: n.archivedAt?.toISOString() ?? null,
    createdAt: n.createdAt.toISOString(),
  }
}

async function broadcastToRealtime(payload: {
  id: string
  userId: string | null
  schoolId: string | null
  role: string | null
  type: string
  priority: string
  title: string
  message: string
  metadata: unknown
  createdAt: string
}): Promise<void> {
  // Server-to-server call to the notifications mini-service. Always uses
  // localhost:3003 directly (this never goes through Caddy — server-only).
  const res = await fetch('http://localhost:3003/internal/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    // Don't hang the API route if the service is down
    signal: AbortSignal.timeout(2000),
  })
  if (!res.ok) {
    throw new Error(`realtime service responded ${res.status}`)
  }
}
