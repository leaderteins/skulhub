import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/communications
// Returns announcements (pinned first, then chronological) +
// notification stats (counts by status) + recent notifications.
export async function GET() {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const [announcements, recentNotifications, statusGroups, smsThisWeek, emailThisWeek] = await Promise.all([
    db.announcement.findMany({
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      take: 100,
    }),
    db.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: 15,
    }),
    db.notification.groupBy({
      by: ['status'],
      _count: true,
    }),
    db.notification.count({
      where: {
        channel: 'SMS',
        createdAt: { gte: weekAgo },
        status: { in: ['Sent', 'Delivered'] },
      },
    }),
    db.notification.count({
      where: {
        channel: 'Email',
        createdAt: { gte: weekAgo },
        status: { in: ['Sent', 'Delivered'] },
      },
    }),
  ])

  const totalAnnouncements = await db.announcement.count()
  const pinnedCount = await db.announcement.count({ where: { pinned: true } })

  const statusCounts: Record<string, number> = {
    Queued: 0,
    Sent: 0,
    Delivered: 0,
    Failed: 0,
  }
  for (const g of statusGroups) {
    statusCounts[g.status] = g._count
  }

  return NextResponse.json({
    announcements,
    notifications: recentNotifications,
    stats: {
      totalAnnouncements,
      pinned: pinnedCount,
      smsThisWeek,
      emailThisWeek,
      statusCounts,
      totalNotifications: Object.values(statusCounts).reduce((a, b) => a + b, 0),
    },
  })
}

// POST /api/communications
// Two modes:
//   1) Announcement (default): { title, body, audience, priority, pinned?, authorName? }
//   2) Bulk SMS: { mode: 'bulk-sms', recipients: string[], message, channel?, subject? }
//      → creates Notification records with status "Queued".
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  // ---- Mode 2: Bulk SMS ----
  if (body.mode === 'bulk-sms') {
    const recipients: string[] = Array.isArray(body.recipients) ? body.recipients : []
    const message = typeof body.message === 'string' ? body.message.trim() : ''
    if (recipients.length === 0 || !message) {
      return NextResponse.json(
        { error: 'recipients (array) and message are required for bulk-sms' },
        { status: 400 },
      )
    }
    const channel = body.channel === 'Email' ? 'Email' : 'SMS'
    const subject = body.subject ? String(body.subject).trim() : null

    const created = await db.notification.createMany({
      data: recipients.slice(0, 500).map((r) => ({
        recipient: String(r).trim(),
        channel,
        subject,
        message,
        status: 'Queued',
      })),
    })

    await db.activityLog.create({
      data: {
        action: 'CREATE',
        entity: 'Notification',
        user: body.actor || 'System',
        details: `Queued ${created.count} ${channel} message(s)`,
      },
    })

    return NextResponse.json({ queued: created.count, channel }, { status: 201 })
  }

  // ---- Mode 1: Announcement (default) ----
  if (!body.title || !body.body) {
    return NextResponse.json({ error: 'title and body are required' }, { status: 400 })
  }
  const audience = body.audience || 'All'
  const priority = body.priority || 'Normal'

  const announcement = await db.announcement.create({
    data: {
      title: String(body.title).trim(),
      body: String(body.body).trim(),
      audience,
      priority,
      authorName: body.authorName ? String(body.authorName).trim() : null,
      pinned: !!body.pinned,
      publishedAt: new Date(),
    },
  })

  await db.activityLog.create({
    data: {
      action: 'CREATE',
      entity: 'Announcement',
      entityId: announcement.id,
      user: body.authorName || 'System',
      details: `Published announcement "${announcement.title}" to ${audience} (${priority})`,
    },
  })

  return NextResponse.json(announcement, { status: 201 })
}
