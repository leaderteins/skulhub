import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSchoolId } from '@/lib/school-resolver'

/**
 * GET /api/biometric/devices
 * Lists all biometric devices for the school.
 */
export async function GET(req: NextRequest) {
  try {
    const schoolId = await getSchoolId(req)
    if (!schoolId) {
      return NextResponse.json({ devices: [], demo: true })
    }
    // Auto-create the table if it doesn't exist (production DB migration)
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "BiometricDevice" (
        id TEXT PRIMARY KEY,
        "schoolId" TEXT NOT NULL,
        name TEXT NOT NULL,
        "deviceType" TEXT NOT NULL DEFAULT 'fingerprint',
        location TEXT,
        "vehicleId" TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        "lastSeen" TIMESTAMP,
        secret TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {})
    const devices = await db.$queryRawUnsafe<any[]>(
      `SELECT * FROM "BiometricDevice" WHERE "schoolId" = $1 ORDER BY "createdAt" DESC`,
      schoolId
    ).catch(() => [])
    return NextResponse.json({ devices })
  } catch (e: any) {
    return NextResponse.json({ devices: [], demo: true })
  }
}

/**
 * POST /api/biometric/devices
 * Register a new biometric device.
 * Body: { name, deviceType?, location?, vehicleId? }
 */
export async function POST(req: NextRequest) {
  try {
    const schoolId = await getSchoolId(req)
    if (!schoolId) {
      return NextResponse.json({ error: 'No school configured' }, { status: 404 })
    }
    const body = await req.json() as {
      name: string
      deviceType?: string
      location?: string
      vehicleId?: string
    }
    if (!body.name) {
      return NextResponse.json({ error: 'Device name is required' }, { status: 400 })
    }
    const deviceId = `dev_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const secret = `sec_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`

    // Auto-create the BiometricDevice table if it doesn't exist (production DB
    // may not have been migrated yet). Uses CREATE TABLE IF NOT EXISTS which
    // works on both SQLite and PostgreSQL.
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "BiometricDevice" (
        id TEXT PRIMARY KEY,
        "schoolId" TEXT NOT NULL,
        name TEXT NOT NULL,
        "deviceType" TEXT NOT NULL DEFAULT 'fingerprint',
        location TEXT,
        "vehicleId" TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        "lastSeen" TIMESTAMP,
        secret TEXT NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {})

    // Insert the device — SQLite uses datetime('now'), PostgreSQL uses CURRENT_TIMESTAMP
    // Both are handled by the DB's default on updatedAt if we set it explicitly.
    await db.$executeRawUnsafe(`
      INSERT INTO "BiometricDevice" (id, "schoolId", name, "deviceType", location, "vehicleId", status, secret, "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, 'active', $7, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO NOTHING
    `, deviceId, schoolId, body.name, body.deviceType || 'fingerprint', body.location || null, body.vehicleId || null, secret).catch((e) => {
      throw new Error('Failed to register device: ' + e.message)
    })

    return NextResponse.json({
      device: {
        id: deviceId,
        schoolId,
        name: body.name,
        deviceType: body.deviceType || 'fingerprint',
        location: body.location || null,
        vehicleId: body.vehicleId || null,
        status: 'active',
        secret,
        createdAt: new Date().toISOString(),
      }
    }, { status: 201 })
  } catch (e: any) {
    if (String(e?.message || '').includes('does not exist')) {
      return NextResponse.json(
        { error: 'Biometric tables not yet migrated on this database. Run `bun run db:push` against the production DB.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

/**
 * PATCH /api/biometric/devices?id=xxx
 */
export async function PATCH(req: NextRequest) {
  try {
    const schoolId = await getSchoolId(req)
    if (!schoolId) {
      return NextResponse.json({ error: 'No school configured' }, { status: 404 })
    }
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Device id is required' }, { status: 400 })
    }
    const body = await req.json() as {
      status?: string
      name?: string
      location?: string
    }
    // SQLite-compatible: datetime('now') instead of PostgreSQL NOW()
    const sets: string[] = ["\"updatedAt\" = datetime('now')"]
    const params: any[] = []
    let paramIdx = 1
    if (body.status) { sets.push(`status = $${paramIdx++}`); params.push(body.status) }
    if (body.name) { sets.push(`name = $${paramIdx++}`); params.push(body.name) }
    if (body.location) { sets.push(`location = $${paramIdx++}`); params.push(body.location) }
    sets.push("\"lastSeen\" = datetime('now')")
    params.push(id)
    await db.$executeRawUnsafe(
      `UPDATE "BiometricDevice" SET ${sets.join(', ')} WHERE id = $${paramIdx}`,
      ...params
    ).catch(() => {})
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

/**
 * DELETE /api/biometric/devices?id=xxx
 */
export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Device id is required' }, { status: 400 })
    }
    await db.$executeRawUnsafe(`DELETE FROM "BiometricDevice" WHERE id = $1`, id).catch(() => {})
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
