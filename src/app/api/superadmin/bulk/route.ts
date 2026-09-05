import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/** POST /api/superadmin/bulk — Bulk operations on schools
 * Body: { action: 'suspend'|'activate'|'upgrade'|'extend_trial', schoolIds: string[], plan?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { action, schoolIds, plan } = await req.json() as { action: string; schoolIds: string[]; plan?: string }
    if (!action || !schoolIds || !Array.isArray(schoolIds) || schoolIds.length === 0)
      return NextResponse.json({ error: 'action and schoolIds required' }, { status: 400 })

    let affected = 0
    for (const id of schoolIds) {
      if (action === 'suspend') {
        await db.$executeRawUnsafe(`UPDATE "School" SET status = 'Suspended', "updatedAt" = NOW() WHERE id = $1 AND slug != 'platform'`, id).catch(() => {})
      } else if (action === 'activate') {
        await db.$executeRawUnsafe(`UPDATE "School" SET status = 'Active', "updatedAt" = NOW() WHERE id = $1 AND slug != 'platform'`, id).catch(() => {})
      } else if (action === 'upgrade' && plan) {
        const maxStudents: Record<string, number> = { Starter: 200, Standard: 500, Premium: 2000, Enterprise: 10000 }
        await db.$executeRawUnsafe(`UPDATE "School" SET plan = $1, "maxStudents" = $2, status = 'Active', "updatedAt" = NOW() WHERE id = $3 AND slug != 'platform'`, plan, maxStudents[plan] || 200, id).catch(() => {})
      } else if (action === 'extend_trial') {
        await db.$executeRawUnsafe(`UPDATE "School" SET "trialEndsAt" = NOW() + INTERVAL '30 days', status = 'Trial', "updatedAt" = NOW() WHERE id = $1 AND slug != 'platform'`, id).catch(() => {})
      }
      affected++
    }

    return NextResponse.json({ success: true, action, affected, message: `Bulk ${action} applied to ${affected} school(s)` })
  } catch (e: any) { return NextResponse.json({ error: e?.message }, { status: 500 }) }
}
