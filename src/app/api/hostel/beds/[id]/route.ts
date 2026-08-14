import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH /api/hostel/beds/[id] — update bed status (and optionally vacate occupant)
// Body: { status?: "Available" | "Occupied" | "Maintenance", vacateIfOccupied?: boolean }
//
// If status changes to "Maintenance":
//   - if vacateIfOccupied=true → vacate current occupant (BedAllocation → Vacated, bed → Available first then Maintenance)
//   - else if occupant exists → 409 with current occupant info
// If status changes to "Available" → vacate occupant if any (effectively a vacate operation)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const { status, vacateIfOccupied } = body as { status?: string; vacateIfOccupied?: boolean }

  if (!status && status !== '') {
    return NextResponse.json({ error: 'status is required' }, { status: 400 })
  }
  const validStatuses = ['Available', 'Occupied', 'Maintenance']
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: `status must be one of: ${validStatuses.join(', ')}` }, { status: 400 })
  }

  const bed = await db.bed.findUnique({
    where: { id },
    include: { room: true, student: true },
  })
  if (!bed) return NextResponse.json({ error: 'Bed not found' }, { status: 404 })

  // If we are putting the bed into Maintenance and it has an occupant:
  if (status === 'Maintenance' && bed.studentId && !vacateIfOccupied) {
    return NextResponse.json(
      {
        error: 'Bed is currently occupied. Confirm to vacate the student before marking as maintenance.',
        code: 'BED_OCCUPIED',
        currentOccupant: bed.student
          ? { id: bed.student.id, admissionNo: bed.student.admissionNo, firstName: bed.student.firstName, lastName: bed.student.lastName }
          : null,
      },
      { status: 409 },
    )
  }

  // If status === "Available" and bed has occupant → vacate them (same as /vacate endpoint)
  if (status === 'Available' && bed.studentId) {
    await db.$transaction(async (tx) => {
      await tx.bedAllocation.updateMany({
        where: { bedId: bed.id, status: 'Active' },
        data: { status: 'Vacated', vacatedAt: new Date() },
      })
      await tx.bed.update({ where: { id: bed.id }, data: { studentId: null, status: 'Available' } })
      const activeBeds = await tx.bed.count({ where: { roomId: bed.roomId, status: 'Occupied' } })
      await tx.room.update({
        where: { id: bed.roomId },
        data: { occupied: activeBeds, status: activeBeds >= bed.room.capacity ? 'Full' : 'Available' },
      })
      // Check if student still has any active beds elsewhere
      const stillBoarding = await tx.bed.count({ where: { studentId: bed.studentId!, status: 'Occupied' } })
      if (stillBoarding === 0) {
        await tx.student.update({ where: { id: bed.studentId! }, data: { boarding: false } })
      }
      await tx.activityLog.create({
        data: {
          action: 'VACATE',
          entity: 'Bed',
          entityId: bed.id,
          user: 'Boarding Master',
          details: `Bed ${bed.bedNumber} set to Available — ${bed.student ? bed.student.firstName + ' ' + bed.student.lastName : 'unknown'} checked out`,
        },
      })
    })
    const refreshed = await db.bed.findUnique({ where: { id }, include: { room: true } })
    return NextResponse.json({ success: true, bed: refreshed })
  }

  // If status === "Maintenance" and bed has occupant and vacateIfOccupied=true → vacate first, then mark Maintenance
  if (status === 'Maintenance' && bed.studentId && vacateIfOccupied) {
    await db.$transaction(async (tx) => {
      await tx.bedAllocation.updateMany({
        where: { bedId: bed.id, status: 'Active' },
        data: { status: 'Vacated', vacatedAt: new Date() },
      })
      await tx.bed.update({ where: { id: bed.id }, data: { studentId: null, status: 'Maintenance' } })
      const activeBeds = await tx.bed.count({ where: { roomId: bed.roomId, status: 'Occupied' } })
      const maintBeds = await tx.bed.count({ where: { roomId: bed.roomId, status: 'Maintenance' } })
      await tx.room.update({
        where: { id: bed.roomId },
        data: {
          occupied: activeBeds,
          status: maintBeds > 0 ? 'Maintenance' : (activeBeds >= bed.room.capacity ? 'Full' : 'Available'),
        },
      })
      const stillBoarding = await tx.bed.count({ where: { studentId: bed.studentId!, status: 'Occupied' } })
      if (stillBoarding === 0) {
        await tx.student.update({ where: { id: bed.studentId! }, data: { boarding: false } })
      }
      await tx.activityLog.create({
        data: {
          action: 'MAINTENANCE',
          entity: 'Bed',
          entityId: bed.id,
          user: 'Boarding Master',
          details: `Bed ${bed.bedNumber} marked Maintenance — occupant ${bed.student ? bed.student.firstName + ' ' + bed.student.lastName : 'unknown'} vacated`,
        },
      })
    })
    const refreshed = await db.bed.findUnique({ where: { id }, include: { room: true } })
    return NextResponse.json({ success: true, bed: refreshed })
  }

  // Default: just update the bed status (e.g. going from Maintenance → Available)
  const updated = await db.bed.update({ where: { id }, data: { status }, include: { room: true } })

  // If bed is going from Maintenance → Available, room might come out of Maintenance if no other beds are under maintenance
  if (status === 'Available' && !bed.studentId) {
    const maintBeds = await db.bed.count({ where: { roomId: bed.roomId, status: 'Maintenance' } })
    if (maintBeds === 0 && bed.room.status === 'Maintenance') {
      const activeBeds = await db.bed.count({ where: { roomId: bed.roomId, status: 'Occupied' } })
      await db.room.update({
        where: { id: bed.roomId },
        data: { status: activeBeds >= bed.room.capacity ? 'Full' : 'Available' },
      })
    }
  }

  await db.activityLog.create({
    data: {
      action: 'UPDATE',
      entity: 'Bed',
      entityId: bed.id,
      user: 'Boarding Master',
      details: `Bed ${bed.bedNumber} status changed from ${bed.status} to ${status}`,
    },
  })

  return NextResponse.json({ success: true, bed: updated })
}
