import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveSchoolFromRequest } from '@/lib/mpesa'

/**
 * GET /api/biometric/devices
 * Lists all biometric devices for the school.
 */
export async function GET(req: NextRequest) {
  try {
    const { school } = await resolveSchoolFromRequest(req)
    if (!school) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const devices = await db.biometricDevice.findMany({
      where: { schoolId: school.id },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ devices })
  } catch (e: any) {
    // Graceful fallback: if the table doesn't exist on the live Postgres DB
    // (schema not yet migrated), return empty list instead of crashing.
    if (String(e?.message || '').includes('does not exist')) {
      return NextResponse.json({ devices: [], demo: true })
    }
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

/**
 * POST /api/biometric/devices
 * Register a new biometric device.
 * Body: { name, deviceType?, location?, vehicleId? }
 */
export async function POST(req: NextRequest) {
  try {
    const { school, user } = await resolveSchoolFromRequest(req)
    if (!school || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const device = await db.biometricDevice.create({
      data: {
        schoolId: school.id,
        name: body.name,
        deviceType: body.deviceType || 'fingerprint',
        location: body.location,
        vehicleId: body.vehicleId,
        status: 'active',
      },
    })
    return NextResponse.json({ device }, { status: 201 })
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
 * Update a device's status or lastSeen.
 */
export async function PATCH(req: NextRequest) {
  try {
    const { school } = await resolveSchoolFromRequest(req)
    if (!school) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
    const device = await db.biometricDevice.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.name && { name: body.name }),
        ...(body.location && { location: body.location }),
        lastSeen: new Date(),
      },
    })
    return NextResponse.json({ device })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

/**
 * DELETE /api/biometric/devices?id=xxx
 */
export async function DELETE(req: NextRequest) {
  try {
    const { school } = await resolveSchoolFromRequest(req)
    if (!school) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Device id is required' }, { status: 400 })
    }
    await db.biometricDevice.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
