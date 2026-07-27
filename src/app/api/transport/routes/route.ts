import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ---------------------------------------------------------------------------
// POST /api/transport/routes
// body: { name, startPoint, endPoint, stops?, distanceKm, fare, driverId? }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const body = await req.json()

  const name = (body.name || '').toString().trim()
  if (!name) {
    return NextResponse.json({ error: 'Route name is required' }, { status: 400 })
  }
  const startPoint = (body.startPoint || '').toString().trim()
  const endPoint = (body.endPoint || '').toString().trim()
  if (!startPoint || !endPoint) {
    return NextResponse.json(
      { error: 'Start point and end point are required' },
      { status: 400 },
    )
  }

  const distanceKm = Number(body.distanceKm) || 0
  const fare = Number(body.fare) || 0
  const stops = body.stops?.toString().trim() || null
  const driverId = body.driverId || null

  // Validate driver exists if provided
  if (driverId) {
    const driver = await db.staff.findUnique({ where: { id: driverId } })
    if (!driver) {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 })
    }
  }

  const route = await db.transportRoute.create({
    data: {
      name,
      startPoint,
      endPoint,
      stops,
      distanceKm,
      fare,
      driverId,
    },
    include: {
      vehicle: { select: { id: true, registration: true, type: true, capacity: true } },
      driver: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          employeeNo: true,
        },
      },
    },
  })

  await db.activityLog.create({
    data: {
      action: 'CREATE',
      entity: 'TransportRoute',
      entityId: route.id,
      user: 'admin',
      details: `Created route ${name} (${startPoint} → ${endPoint})`,
    },
  })

  return NextResponse.json(route, { status: 201 })
}
