import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/hostel/vacate — vacate a bed (check out the current occupant)
// Body: { bedId?: string, studentId?: string, reason?: string }
//
// Either bedId OR studentId must be provided. The endpoint will:
//  - find the bed(s) currently occupied by the student (or the explicit bed)
//  - mark active BedAllocation(s) as Vacated with vacatedAt=now
//  - set bed.studentId=null, bed.status="Available"
//  - decrement room.occupied and recompute room.status
//  - set student.boarding=false if the student has no other active beds
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || (!body.bedId && !body.studentId)) {
    return NextResponse.json({ error: 'Either bedId or studentId is required' }, { status: 400 })
  }

  const { bedId, studentId, reason } = body as { bedId?: string; studentId?: string; reason?: string }

  // Build the bed filter
  const bedWhere: { id?: string; studentId?: string; status: string } = { status: 'Occupied' }
  if (bedId) bedWhere.id = bedId
  if (studentId) bedWhere.studentId = studentId

  const bedsToVacate = await db.bed.findMany({
    where: bedWhere,
    include: { room: { include: { dormitory: true } }, student: true },
  })

  if (bedsToVacate.length === 0) {
    return NextResponse.json(
      { error: 'No occupied bed found matching the criteria', code: 'NOT_OCCUPIED' },
      { status: 404 },
    )
  }

  const vacatedStudentIds = new Set<string>()

  await db.$transaction(async (tx) => {
    for (const bed of bedsToVacate) {
      // Mark active allocation(s) on this bed as Vacated
      await tx.bedAllocation.updateMany({
        where: { bedId: bed.id, status: 'Active' },
        data: { status: 'Vacated', vacatedAt: new Date() },
      })
      // Set bed back to Available
      await tx.bed.update({
        where: { id: bed.id },
        data: { studentId: null, status: 'Available' },
      })
      // Recompute room occupancy
      const activeBeds = await tx.bed.count({ where: { roomId: bed.roomId, status: 'Occupied' } })
      await tx.room.update({
        where: { id: bed.roomId },
        data: { occupied: activeBeds, status: activeBeds >= bed.room.capacity ? 'Full' : 'Available' },
      })
      // Activity log
      if (bed.student) {
        vacatedStudentIds.add(bed.student.id)
        await tx.activityLog.create({
          data: {
            action: 'VACATE',
            entity: 'Bed',
            entityId: bed.id,
            user: 'Boarding Master',
            details: `Vacated ${bed.bedNumber} in ${bed.room.roomNumber}, ${bed.room.dormitory.name} — ${bed.student.firstName} ${bed.student.lastName} (${bed.student.admissionNo}). Reason: ${reason || 'Checkout'}`,
          },
        })
      }
    }

    // For each vacated student, check if they still have any other active bed; if not, set boarding=false
    for (const sid of vacatedStudentIds) {
      const stillBoarding = await tx.bed.count({ where: { studentId: sid, status: 'Occupied' } })
      if (stillBoarding === 0) {
        await tx.student.update({ where: { id: sid }, data: { boarding: false } })
      }
    }
  })

  return NextResponse.json({
    success: true,
    vacatedCount: bedsToVacate.length,
    beds: bedsToVacate.map(b => ({ id: b.id, bedNumber: b.bedNumber, roomId: b.roomId })),
  })
}
