import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ---------------------------------------------------------------------------
// GET /api/transport
// Returns:
//   - vehicles: list with route + driver relations
//   - routes:   list with vehicle + driver relations
//   - drivers:  list of staff whose role is "Driver" (for route assignment)
//   - summary:  totalVehicles, active, maintenance, totalCapacity, totalRoutes
// ---------------------------------------------------------------------------
export async function GET() {
  const [vehicles, routes, drivers] = await Promise.all([
    db.vehicle.findMany({
      orderBy: { registration: 'asc' },
      include: {
        route: {
          select: {
            id: true,
            name: true,
            startPoint: true,
            endPoint: true,
            distanceKm: true,
            fare: true,
          },
        },
      },
    }),
    db.transportRoute.findMany({
      orderBy: { name: 'asc' },
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
    }),
    db.staff.findMany({
      where: { role: 'Driver' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        employeeNo: true,
        status: true,
      },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    }),
  ])

  const totalVehicles = vehicles.length
  const active = vehicles.filter((v) => v.status === 'Active').length
  const maintenance = vehicles.filter((v) => v.status === 'Maintenance').length
  const totalCapacity = vehicles.reduce((s, v) => s + (v.capacity || 0), 0)
  const totalRoutes = routes.length

  return NextResponse.json({
    vehicles,
    routes,
    drivers,
    summary: {
      totalVehicles,
      active,
      maintenance,
      totalCapacity,
      totalRoutes,
    },
  })
}

// ---------------------------------------------------------------------------
// POST /api/transport
// body: { registration, type, capacity, make?, model?, year?, status? }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const body = await req.json()

  const registration = (body.registration || '').toString().trim().toUpperCase()
  if (!registration) {
    return NextResponse.json(
      { error: 'Vehicle registration is required' },
      { status: 400 },
    )
  }

  // Uniqueness check
  const existing = await db.vehicle.findUnique({ where: { registration } })
  if (existing) {
    return NextResponse.json(
      { error: `Vehicle with registration ${registration} already exists` },
      { status: 409 },
    )
  }

  const type = body.type || 'Bus'
  const capacity = Number(body.capacity) || 0
  const make = body.make?.toString().trim() || null
  const model = body.model?.toString().trim() || null
  const year = body.year ? Number(body.year) : null
  const status = body.status || 'Active'

  const vehicle = await db.vehicle.create({
    data: {
      registration,
      type,
      capacity,
      make,
      model,
      year,
      status,
    },
  })

  await db.activityLog.create({
    data: {
      action: 'CREATE',
      entity: 'Vehicle',
      entityId: vehicle.id,
      user: 'admin',
      details: `Registered vehicle ${registration} (${type})`,
    },
  })

  return NextResponse.json(vehicle, { status: 201 })
}
