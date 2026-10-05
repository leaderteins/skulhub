import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    await db.$executeRawUnsafe('ALTER TABLE "ActivityLog" ADD COLUMN IF NOT EXISTS "schoolId" TEXT').catch(() => {})
    const url = new URL(req.url)
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') || '20')))
    const rows = await db.$queryRawUnsafe<any[]>('SELECT id, "schoolId", action, entity, "entityId", details, "user", "createdAt" FROM "ActivityLog" ORDER BY "createdAt" DESC LIMIT $1', limit).catch(() => [])
    const activities = (rows || []).map((r:any) => ({ id: String(r.id||''), action: String(r.action||''), entity: String(r.entity||''), details: String(r.details||''), user: String(r.user||''), createdAt: r.createdAt instanceof Date ? r.createdAt : r.createdAt ? new Date(r.createdAt) : null }))
    return NextResponse.json({ activities, total: activities.length })
  } catch { return NextResponse.json({ activities: [], total: 0 }) }
}

