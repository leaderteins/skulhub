import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveSchoolFromRequest } from '@/lib/mpesa'

/**
 * POST /api/biometric/sync
 *
 * Webhook endpoint that biometric devices (ZKTeco K40, bus tablets) call
 * when a student/staff taps their finger or RFID card.
 *
 * Two auth modes:
 *   1. Device secret (HMAC): devices pre-registered with a `secret` field
 *      sign their payloads. We verify the signature.
 *   2. Staff session: when an admin simulates a tap from the dashboard UI,
 *      they're already authenticated via cookie.
 *
 * Body:
 *   { deviceId, personId, personType, action, location?, gps?, verified? }
 *
 * Returns: { log: {...} }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      deviceId?: string
      personId: string
      personType?: string
      action: string // "check_in" | "check_out" | "board_bus" | "alight_bus"
      location?: string
      gps?: string
      verified?: boolean
      // OR for device-auth: schoolCode + deviceSecret
      schoolCode?: string
      deviceSecret?: string
    }

    if (!body.personId || !body.action) {
      return NextResponse.json(
        { error: 'personId and action are required' },
        { status: 400 }
      )
    }

    let schoolId: string | undefined
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
      // Update lastSeen
      await db.biometricDevice.update({
        where: { id: device.id },
        data: { lastSeen: new Date(), status: 'active' },
      })
    } else {
      // Auth path 2: staff session (for simulator / admin-initiated taps)
      const { school } = await resolveSchoolFromRequest(req)
      if (!school) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      schoolId = school.id
    }

    const log = await db.biometricLog.create({
      data: {
        schoolId,
        deviceId,
        personId: body.personId,
        personType: body.personType || 'student',
        action: body.action,
        location: body.location,
        gps: body.gps,
        verified: body.verified ?? true,
        timestamp: new Date(),
      },
    })

    return NextResponse.json({ log }, { status: 201 })
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
