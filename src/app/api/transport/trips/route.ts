import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSchoolId } from '@/lib/school-resolver'

/**
 * GET /api/transport/trips?status=in_progress
 */
export async function GET(req: NextRequest) {
  try {
    const schoolId = await getSchoolId(req)
    if (!schoolId) {
      return NextResponse.json({ trips: [], demo: true })
    }
    const status = req.nextUrl.searchParams.get('status')
    const where: any = { schoolId }
    if (status) where.status = status

    const trips = await db.busTrip.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        boardings: {
          orderBy: { timestamp: 'desc' },
          take: 5,
        },
      },
    })

    return NextResponse.json({ trips })
  } catch (e: any) {
    if (String(e?.message || '').includes('does not exist')) {
      return NextResponse.json({ trips: [], demo: true })
    }
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

/**
 * POST /api/transport/trips
 */
export async function POST(req: NextRequest) {
  try {
    const schoolId = await getSchoolId(req)
    if (!schoolId) {
      return NextResponse.json({ error: 'No school configured' }, { status: 404 })
    }
    const body = await req.json() as {
      routeId?: string
      vehicleId?: string
      driverId?: string
      direction?: string
    }
    const tripId = `trip_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // Use raw SQL — Prisma client on Vercel doesn't know about BusTrip table
    await db.$executeRawUnsafe(`
      INSERT INTO "BusTrip" (id, "schoolId", "routeId", "vehicleId", "driverId", direction, status, "departureAt", "boardingCount", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, 'in_progress', NOW(), 0, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, tripId, schoolId, body.routeId || null, body.vehicleId || null, body.driverId || null, body.direction || 'to_school').catch((e) => {
      throw new Error('Failed to create trip: ' + e.message)
    })

    return NextResponse.json({
      trip: {
        id: tripId,
        schoolId,
        routeId: body.routeId || null,
        vehicleId: body.vehicleId || null,
        driverId: body.driverId || null,
        direction: body.direction || 'to_school',
        status: 'in_progress',
        departureAt: new Date().toISOString(),
        boardingCount: 0,
      }
    }, { status: 201 })
  } catch (e: any) {
    if (String(e?.message || '').includes('does not exist')) {
      return NextResponse.json(
        { error: 'Bus tracking tables not yet migrated. Run `bun run db:push` on the production DB.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

/**
 * PATCH /api/transport/trips?id=xxx
 */
export async function PATCH(req: NextRequest) {
  try {
    const schoolId = await getSchoolId(req)
    if (!schoolId) {
      return NextResponse.json({ error: 'No school configured' }, { status: 404 })
    }
    const id = req.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'Trip id is required' }, { status: 400 })
    }
    const body = await req.json() as {
      status?: string
      gpsTrail?: string
      boardingCount?: number
    }
    const trip = await db.busTrip.update({
      where: { id },
      data: {
        ...(body.status && { status: body.status }),
        ...(body.gpsTrail && { gpsTrail: body.gpsTrail }),
        ...(typeof body.boardingCount === 'number' && { boardingCount: body.boardingCount }),
        ...(body.status === 'completed' && { arrivalAt: new Date() }),
      },
    })
    return NextResponse.json({ trip })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
