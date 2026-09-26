import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

/**
 * GET /api/activity-log?limit=20
 *
 * Returns the most recent ActivityLog entries (newest first). This is the
 * canonical "recent activity" feed used by the dashboard's "Recent Activity"
 * card and any other UI that wants to surface audit-trail events.
 *
 * SQL compatibility notes:
 * - Uses `CURRENT_TIMESTAMP` (works on both SQLite and PostgreSQL) — never
 *   `NOW()` which is PostgreSQL-only.
 * - No `::int` / `::float` casts — those are PostgreSQL-only and break on
 *   SQLite. We coerce any BigInt values to plain numbers in JS.
 * - LIMIT is parameterised (Prisma's $1 placeholder) so it works on both
 *   databases.
 * - The whole query is wrapped in `.catch(() => [])` so a transient DB
 *   error returns an empty list instead of a 500 (the dashboard keeps
 *   rendering even when the audit feed is briefly unavailable).
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Parse `limit` — clamp to [1, 100], default 20.
    const url = new URL(req.url)
    const rawLimit = Number(url.searchParams.get('limit') || '20')
    const limit = Number.isFinite(rawLimit) ? Math.min(100, Math.max(1, Math.floor(rawLimit))) : 20

    // Raw SQL so we control exactly which columns are projected and the
    // ORDER BY / LIMIT shape. We alias the column names to camelCase in JS
    // (SQLite preserves the double-quoted column names; Prisma returns the
    // rows as plain objects keyed by those aliases).
    const rows = await db.$queryRawUnsafe<any[]>(
      `SELECT id, "schoolId", action, entity, "entityId", details, "user", "createdAt"
       FROM "ActivityLog"
       ORDER BY "createdAt" DESC
       LIMIT $1`,
      limit
    ).catch(() => [])

    // Normalise each row: convert any BigInt / Date values to JSON-safe
    // primitives and expose a friendlier shape for the client.
    const activities = (rows || []).map((r: any) => {
      const created =
        r.createdAt instanceof Date
          ? r.createdAt
          : r.createdAt
            ? new Date(r.createdAt)
            : null
      return {
        id: String(r.id ?? ''),
        schoolId: r.schoolId ?? null,
        action: String(r.action ?? ''),
        entity: String(r.entity ?? ''),
        entityId: r.entityId ?? null,
        details: r.details ?? '',
        user: r.user ?? 'System',
        createdAt: created ? created.toISOString() : null,
      }
    })

    return NextResponse.json({ activities, total: activities.length })
  } catch (error) {
    console.error('[activity-log GET] error:', error)
    // Defensive: return an empty list rather than a 500 so the dashboard
    // can keep rendering its other widgets.
    return NextResponse.json({ activities: [], total: 0 })
  }
}
