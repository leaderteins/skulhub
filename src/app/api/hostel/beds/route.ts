import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/hostel/beds?roomId=... — list beds for a room (with occupant)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const roomId = searchParams.get('roomId')
  const dormitoryId = searchParams.get('dormitoryId')
  const status = searchParams.get('status') // Available | Occupied | Maintenance

  const where: {
    roomId?: string
    status?: string
    room?: { dormitoryId: string }
  } = {}
  if (roomId) where.roomId = roomId
  if (status) where.status = status
  if (dormitoryId) where.room = { dormitoryId }

  const beds = await db.bed.findMany({
    where,
    orderBy: [{ roomId: 'asc' }, { bedNumber: 'asc' }],
    include: {
      room: { select: { id: true, roomNumber: true, capacity: true, occupied: true, status: true, dormitoryId: true } },
      student: {
        select: {
          id: true, admissionNo: true, firstName: true, lastName: true, gender: true,
          enrollments: { take: 1, select: { stream: { select: { name: true, classLevel: { select: { name: true } } } } } },
        },
      },
    },
  })
  return NextResponse.json({ beds })
}
