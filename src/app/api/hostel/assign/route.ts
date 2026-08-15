import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/hostel/assign — assign (or reassign) a student to a specific bed
// Body: { bedId, studentId, force?: boolean, notes?: string }
//
// Behavior:
//  - 404 if bed or student not found
//  - 409 if bed is in Maintenance (cannot assign)
//  - 409 if bed already occupied by *another* student AND force !== true (returns warning + current occupant)
//  - If student is already on another bed, vacate the previous bed (reassign)
//  - On success: set bed.studentId + bed.status="Occupied", create active BedAllocation,
//    update room.occupied + room.status, set student.boarding=true
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.bedId || !body.studentId) {
    return NextResponse.json({ error: 'bedId and studentId are required' }, { status: 400 })
  }

  const { bedId, studentId, force, notes } = body as { bedId: string; studentId: string; force?: boolean; notes?: string }

  const [bed, student] = await Promise.all([
    db.bed.findUnique({
      where: { id: bedId },
      include: { room: { include: { dormitory: true } } },
    }),
    db.student.findUnique({ where: { id: studentId } }),
  ])

  if (!bed) return NextResponse.json({ error: 'Bed not found' }, { status: 404 })
  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  // Bed in Maintenance cannot be assigned
  if (bed.status === 'Maintenance') {
    return NextResponse.json(
      { error: 'Bed is under maintenance and cannot be assigned', code: 'BED_MAINTENANCE' },
      { status: 409 },
    )
  }

  // Room in Maintenance cannot be assigned
  if (bed.room.status === 'Maintenance') {
    return NextResponse.json(
      { error: 'Room is under maintenance and cannot be assigned', code: 'ROOM_MAINTENANCE' },
      { status: 409 },
    )
  }

  // Gender check (dormitory.gender) — warn
  const dormGender = bed.room.dormitory.gender
  if (dormGender !== 'Mixed') {
    const studentGender = student.gender === 'Female' ? 'Girls' : 'Boys'
    if (studentGender !== dormGender) {
      return NextResponse.json(
        {
          error: `Gender mismatch: ${bed.room.dormitory.name} is a ${dormGender} dormitory but ${student.firstName} ${student.lastName} is ${student.gender}.`,
          code: 'GENDER_MISMATCH',
          currentOccupant: null,
        },
        { status: 409 },
      )
    }
  }

  // Already occupied by the SAME student → no-op success
  if (bed.studentId === studentId) {
    return NextResponse.json({ success: true, bed, message: 'Student already assigned to this bed', noOp: true })
  }

  // Check if student is currently on ANOTHER bed — warn unless force=true
  if (!force) {
    const studentCurrentBed = await db.bed.findFirst({
      where: { studentId, status: 'Occupied' },
      include: { room: { include: { dormitory: true } } },
    })
    if (studentCurrentBed && studentCurrentBed.id !== bedId) {
      return NextResponse.json(
        {
          error: `${student.firstName} ${student.lastName} is already assigned to ${studentCurrentBed.bedNumber} in ${studentCurrentBed.room.roomNumber}, ${studentCurrentBed.room.dormitory.name}. Reassigning will vacate that bed.`,
          code: 'STUDENT_ALREADY_ASSIGNED',
          previousBed: {
            id: studentCurrentBed.id,
            bedNumber: studentCurrentBed.bedNumber,
            roomNumber: studentCurrentBed.room.roomNumber,
            dormitoryName: studentCurrentBed.room.dormitory.name,
          },
        },
        { status: 409 },
      )
    }
  }

  // Bed occupied by ANOTHER student — warn unless force=true
  if (bed.studentId && !force) {
    const currentOccupant = await db.student.findUnique({
      where: { id: bed.studentId },
      select: { id: true, admissionNo: true, firstName: true, lastName: true, gender: true },
    })
    return NextResponse.json(
      {
        error: 'Bed is already occupied. Confirm to reassign and vacate the current occupant.',
        code: 'BED_OCCUPIED',
        currentOccupant,
      },
      { status: 409 },
    )
  }

  // All checks passed — proceed with assignment (transactional)
  const result = await db.$transaction(async (tx) => {
    // 1. If student is currently on another bed, vacate it
    const previousBed = await tx.bed.findFirst({
      where: { studentId, status: 'Occupied' },
      include: { room: true },
    })
    if (previousBed && previousBed.id !== bedId) {
      await tx.bed.update({
        where: { id: previousBed.id },
        data: { studentId: null, status: 'Available' },
      })
      // Mark active allocation(s) on previous bed as Transferred
      await tx.bedAllocation.updateMany({
        where: { bedId: previousBed.id, status: 'Active' },
        data: { status: 'Transferred', vacatedAt: new Date() },
      })
      // Recompute previous room's occupancy
      const prevActive = await tx.bed.count({ where: { roomId: previousBed.roomId, status: 'Occupied' } })
      await tx.room.update({
        where: { id: previousBed.roomId },
        data: { occupied: prevActive, status: prevActive >= previousBed.room.capacity ? 'Full' : 'Available' },
      })
    }

    // 2. If bed currently has another occupant (force=true), vacate them too
    if (bed.studentId && bed.studentId !== studentId) {
      await tx.bedAllocation.updateMany({
        where: { bedId, status: 'Active' },
        data: { status: 'Vacated', vacatedAt: new Date() },
      })
    }

    // 3. Set bed.studentId = new student, status = Occupied
    const updatedBed = await tx.bed.update({
      where: { id: bedId },
      data: { studentId, status: 'Occupied' },
      include: {
        room: { include: { dormitory: true } },
        student: { select: { id: true, admissionNo: true, firstName: true, lastName: true, gender: true } },
      },
    })

    // 4. Create a new active BedAllocation record (history)
    await tx.bedAllocation.create({
      data: {
        studentId,
        dormitoryId: bed.room.dormitoryId,
        roomId: bed.roomId,
        bedId: bed.id,
        bedNumber: bed.bedNumber,
        status: 'Active',
        notes: notes || null,
      },
    })

    // 5. Update room occupancy
    const activeBeds = await tx.bed.count({ where: { roomId: bed.roomId, status: 'Occupied' } })
    await tx.room.update({
      where: { id: bed.roomId },
      data: {
        occupied: activeBeds,
        status: activeBeds >= bed.room.capacity ? 'Full' : 'Available',
      },
    })

    // 6. Mark student as boarder
    await tx.student.update({ where: { id: studentId }, data: { boarding: true } })

    // 7. Activity log
    await tx.activityLog.create({
      data: {
        action: 'ASSIGN',
        entity: 'Bed',
        entityId: bed.id,
        user: 'Boarding Master',
        details: `Assigned ${student.firstName} ${student.lastName} (${student.admissionNo}) to ${bed.bedNumber} in ${bed.room.roomNumber}, ${bed.room.dormitory.name}`,
      },
    })

    return updatedBed
  })

  return NextResponse.json({ success: true, bed: result }, { status: 201 })
}
