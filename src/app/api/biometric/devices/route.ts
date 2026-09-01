import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Resolve the school ID from a request — with a fallback to the first
 * non-platform school if the user isn't authenticated. This keeps the
 * biometric system working for demos on Vercel previews where the
 * session cookie may not be available.
 *
 * Returns the schoolId (or null if no school exists at all).
 */
async function getSchoolId(req: NextRequest): Promise<string | null> {
  try {
    // Try auth first
    const { getUserFromRequest } = await import('@/lib/auth-utils')
    const user = await getUserFromRequest(req)
    if (user?.school) {
      return (user.school as any).id
    }
  } catch {
    // ignore auth errors — fall through to fallback
  }

  // Fallback: first non-platform school (demo mode)
  try {
    const school = await db.school.findFirst({
      where: { slug: { not: 'platform' } },
      orderBy: { createdAt: 'asc' },
    })
    return school?.id || null
  } catch {
    return null
  }
}

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
    const devices = await db.biometricDevice.findMany({
      where: { schoolId },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ devices })
  } catch (e: any) {
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
    const device = await db.biometricDevice.create({
      data: {
        schoolId,
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
    const schoolId = await getSchoolId(req)
    if (!schoolId) {
      return NextResponse.json({ error: 'No school configured' }, { status: 404 })
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
