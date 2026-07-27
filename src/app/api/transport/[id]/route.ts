import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ---------------------------------------------------------------------------
// PUT /api/transport/[id]
// body: partial vehicle fields — e.g. { registration?, type?, capacity?,
//   make?, model?, year?, status?, assignedRouteId? }
// Notes:
//   - assignedRouteId is a unique field. Pass null to clear assignment.
//   - status can be set to Active | Maintenance | Inactive.
// ---------------------------------------------------------------------------
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const body = await req.json()

  const existing = await db.vehicle.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
  }

  // Uniqueness check on registration if changing
  if (body.registration) {
    const registration = body.registration.toString().trim().toUpperCase()
    const clash = await db.vehicle.findUnique({ where: { registration } })
    if (clash && clash.id !== id) {
      return NextResponse.json(
        { error: `Registration ${registration} is already in use` },
        { status: 409 },
      )
    }
    body.registration = registration
  }

  // Validate assignedRouteId uniqueness if setting
  if (body.assignedRouteId) {
    const other = await db.vehicle.findUnique({
      where: { assignedRouteId: body.assignedRouteId },
    })
    if (other && other.id !== id) {
      return NextResponse.json(
        { error: 'Selected route is already assigned to another vehicle' },
        { status: 409 },
      )
    }
  }

  // Build update payload (only provided fields)
  const data: Record<string, unknown> = {}
  for (const key of [
    'registration',
    'type',
    'capacity',
    'make',
    'model',
    'year',
    'status',
    'assignedRouteId',
  ]) {
    if (key in body) {
      let value = body[key]
      if (key === 'capacity' || key === 'year') {
        value = value === null ? null : Number(value)
      }
      data[key] = value
    }
  }

  const updated = await db.vehicle.update({
    where: { id },
    data,
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
  })

  await db.activityLog.create({
    data: {
      action: 'UPDATE',
      entity: 'Vehicle',
      entityId: id,
      user: 'admin',
      details: `Updated vehicle ${updated.registration}`,
    },
  })

  return NextResponse.json(updated)
}

// ---------------------------------------------------------------------------
// DELETE /api/transport/[id]
// Removes the vehicle. Detaches any route that points at it first.
// ---------------------------------------------------------------------------
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const existing = await db.vehicle.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Vehicle not found' }, { status: 404 })
  }

  // Detach any route that uses this vehicle
  await db.transportRoute.updateMany({
    where: { vehicleId: id },
    data: { vehicleId: null },
  })

  await db.vehicle.delete({ where: { id } })

  await db.activityLog.create({
    data: {
      action: 'DELETE',
      entity: 'Vehicle',
      entityId: id,
      user: 'admin',
      details: `Deleted vehicle ${existing.registration}`,
    },
  })

  return NextResponse.json({ success: true })
}
