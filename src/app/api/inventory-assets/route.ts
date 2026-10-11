import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

/** GET /api/inventory-assets — list all assets
 *  POST — create/update asset. Body: { name, category, serialNumber, condition, location, value }
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const category = new URL(req.url).searchParams.get('category')
    const assets = await db.$queryRawUnsafe<any[]>(`
      SELECT * FROM "Asset" WHERE "schoolId" = $1 ${category ? 'AND category = $2' : ''} ORDER BY name ASC
    `, user.schoolId, ...(category ? [category] : [])).catch(() => [])
    const categories = await db.$queryRawUnsafe<any[]>(`SELECT DISTINCT category FROM "Asset" WHERE "schoolId" = $1`, user.schoolId).catch(() => [])
    return NextResponse.json({ assets: (assets || []), categories: ((categories || []) || []).map(c => c.category) })
  } catch { return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const { name, category, serialNumber, condition, location, value } = body
    if (!name) return NextResponse.json({ error: 'Asset name required' }, { status: 400 })
    const assetId = `asset_${Date.now()}_${Math.random().toString(36).slice(2,8)}`
    await db.$executeRawUnsafe(`
      INSERT INTO "Asset" (id, "schoolId", name, category, "serialNumber", condition, location, value, status, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'Active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO NOTHING
    `, assetId, user.schoolId, name, category || 'General', serialNumber || '', condition || 'Good', location || '', value || 0).catch(() => {})
    return NextResponse.json({ success: true, assetId, message: 'Asset added' })
  } catch { return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 }) }
}
