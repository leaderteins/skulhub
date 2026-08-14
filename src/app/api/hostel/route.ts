import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/hostel?gender=&status=&search=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const gender = searchParams.get('gender') || ''
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search')?.trim() || ''

  const where: {
    gender?: string
    status?: string
    OR?: Array<Record<string, unknown>>
  } = {}
  if (gender) where.gender = gender
  if (status) where.status = status
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { location: { contains: search } },
    ]
  }

  const [dormitories, totalDorms, totalCapacity, totalRooms, totalAllocations, activeAllocations, totalInspections, byGender, totalBeds, occupiedBeds] = await Promise.all([
    db.dormitory.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        warden: { select: { id: true, firstName: true, lastName: true, phone: true, employeeNo: true } },
        rooms: { select: { id: true, roomNumber: true, floor: true, capacity: true, occupied: true, status: true } },
        allocations: { where: { status: 'Active' }, select: { id: true, studentId: true, bedNumber: true, student: { select: { id: true, admissionNo: true, firstName: true, lastName: true, gender: true } } } },
        inspections: { orderBy: { date: 'desc' }, take: 3, select: { id: true, date: true, overallScore: true, cleanliness: true, organization: true, discipline: true, findings: true, inspectedBy: true } },
      },
    }),
    db.dormitory.count({ where }),
    db.dormitory.aggregate({ where, _sum: { capacity: true } }),
    db.room.count(),
    db.bedAllocation.count(),
    db.bedAllocation.count({ where: { status: 'Active' } }),
    db.dormInspection.count(),
    db.dormitory.groupBy({ by: ['gender'], _count: true }),
    db.bed.count(),
    db.bed.count({ where: { status: 'Occupied' } }),
  ])

  return NextResponse.json({
    stats: {
      totalDorms,
      totalCapacity: totalCapacity._sum.capacity || 0,
      totalRooms,
      totalBeds,
      occupiedBeds,
      totalAllocations: activeAllocations,
      occupancyRate: totalCapacity._sum.capacity ? Math.round((activeAllocations / totalCapacity._sum.capacity) * 100) : 0,
      totalInspections,
    },
    dormitories: dormitories.map(d => ({
      ...d,
      activeAllocations: d.allocations.length,
      roomCount: d.rooms.length,
      fullRooms: d.rooms.filter(r => r.status === 'Full').length,
      availableRooms: d.rooms.filter(r => r.status === 'Available').length,
      latestInspection: d.inspections[0] || null,
      avgInspectionScore: d.inspections.length > 0 ? Math.round(d.inspections.reduce((s, i) => s + i.overallScore, 0) / d.inspections.length) : null,
    })),
    byGender: byGender.map(g => ({ name: g.gender, count: g._count })),
  })
}

// POST /api/hostel — create a new dormitory
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  const dorm = await db.dormitory.create({
    data: {
      name: body.name,
      gender: body.gender || 'Boys',
      capacity: Number(body.capacity) || 40,
      wardenId: body.wardenId || null,
      location: body.location || null,
      floors: Number(body.floors) || 1,
      status: body.status || 'Active',
    },
  })
  await db.activityLog.create({
    data: { action: 'CREATE', entity: 'Dormitory', entityId: dorm.id, user: 'Admin', details: `Created dormitory ${dorm.name}` },
  })
  return NextResponse.json(dorm, { status: 201 })
}
