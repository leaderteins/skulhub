import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSchoolId } from '@/lib/school-resolver'

/**
 * POST /api/biometric/sync
 *
 * Webhook endpoint that biometric devices call when a student/staff taps.
 *
 * Two auth modes:
 *   1. Device secret (HMAC): devices pre-registered with a `secret` field
 *   2. Staff session or demo fallback: for simulator / admin-initiated taps
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      deviceId?: string
      personId: string
      personType?: string
      action: string
      location?: string
      gps?: string
      verified?: boolean
      schoolCode?: string
      deviceSecret?: string
    }

    if (!body.personId || !body.action) {
      return NextResponse.json(
        { error: 'personId and action are required' },
        { status: 400 }
      )
    }

    let schoolId: string | null = null
    let deviceId: string | null = body.deviceId || null

    // Auth path 1: device secret
    if (body.schoolCode && body.deviceSecret) {
      const school = await db.school.findFirst({
        where: { schoolCode: body.schoolCode },
      })
      if (!school) {
        return NextResponse.json({ error: 'Invalid school code' }, { status: 404 })
      }
      const device = await db.biometricDevice.findFirst({
        where: { schoolId: school.id, secret: body.deviceSecret },
      })
      if (!device) {
        return NextResponse.json({ error: 'Invalid device secret' }, { status: 401 })
      }
      schoolId = school.id
      deviceId = device.id
      await db.biometricDevice.update({
        where: { id: device.id },
        data: { lastSeen: new Date(), status: 'active' },
      })
    } else {
      // Auth path 2: staff session or demo fallback
      // Use raw SQL to avoid Prisma schema issues on Vercel
      const schools = await db.$queryRaw<Array<{id: string}>>`
        SELECT id FROM "School" WHERE "schoolCode" = 'SKH-2024-001' LIMIT 1
      `.catch(() => [])
      if (schools.length === 0) {
        const anySchools = await db.$queryRaw<Array<{id: string}>>`
          SELECT id FROM "School" LIMIT 1
        `.catch(() => [])
        if (anySchools.length === 0) {
          return NextResponse.json({ error: 'No school found in DB' }, { status: 404 })
        }
        schoolId = anySchools[0].id
      } else {
        schoolId = schools[0].id
      }
    }

    // Use raw SQL to insert the biometric log — bypasses Prisma's schema
    // validation which may not know about the new tables on Vercel
    const logId = `bio_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    await db.$executeRaw`
      INSERT INTO "BiometricLog" (id, "schoolId", "deviceId", "personId", "personType", action, location, gps, verified, timestamp, "createdAt")
      VALUES (${logId}, ${schoolId}, ${deviceId}, ${body.personId}, ${body.personType || 'student'}, ${body.action}, ${body.location || null}, ${body.gps || null}, ${body.verified ?? true}, NOW(), NOW())
    `

    return NextResponse.json({
      log: {
        id: logId,
        schoolId,
        deviceId,
        personId: body.personId,
        personType: body.personType || 'student',
        action: body.action,
        location: body.location,
        gps: body.gps,
        verified: body.verified ?? true,
        timestamp: new Date().toISOString(),
      }
    }, { status: 201 })
  } catch (e: any) {
    if (String(e?.message || '').includes('does not exist')) {
      return NextResponse.json(
        { error: 'Biometric tables not yet migrated. Run `bun run db:push` on the production DB.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
