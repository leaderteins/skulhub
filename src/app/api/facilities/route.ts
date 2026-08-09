import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/facilities?type=&status=&search=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || ''
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search')?.trim() || ''

  const facilityWhere: {
    type?: string
    status?: string
    OR?: Array<Record<string, unknown>>
  } = {}
  if (type) facilityWhere.type = type
  if (status) facilityWhere.status = status
  if (search) {
    facilityWhere.OR = [
      { name: { contains: search } },
      { location: { contains: search } },
    ]
  }

  // Today's date range (UTC midnight to UTC end-of-day, then compare to startDate/endDate)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)

  const [
    facilities,
    bookings,
    totalFacilities,
    availableFacilities,
    bookedToday,
    pendingApprovals,
    approvedBookings,
    completedBookings,
    rejectedBookings,
    byType,
    byStatus,
  ] = await Promise.all([
    db.facility.findMany({
      where: facilityWhere,
      orderBy: { name: 'asc' },
      include: {
        bookings: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, status: true, startDate: true, endDate: true, bookedBy: true, purpose: true },
        },
      },
    }),
    db.facilityBooking.findMany({
      orderBy: { createdAt: 'desc' },
      include: { facility: { select: { id: true, name: true, type: true, location: true, capacity: true } } },
    }),
    db.facility.count({ where: facilityWhere }),
    db.facility.count({ where: { ...facilityWhere, status: 'Available' } }),
    db.facilityBooking.count({
      where: {
        status: { in: ['Approved', 'Pending'] },
        startDate: { lte: endOfToday },
        endDate: { gte: startOfToday },
      },
    }),
    db.facilityBooking.count({ where: { status: 'Pending' } }),
    db.facilityBooking.count({ where: { status: 'Approved' } }),
    db.facilityBooking.count({ where: { status: 'Completed' } }),
    db.facilityBooking.count({ where: { status: 'Rejected' } }),
    db.facility.groupBy({ by: ['type'], _count: true }),
    db.facilityBooking.groupBy({ by: ['status'], _count: true }),
  ])

  return NextResponse.json({
    stats: {
      totalFacilities,
      availableFacilities,
      bookedToday,
      pendingApprovals,
      approvedBookings,
      completedBookings,
      rejectedBookings,
      totalBookings: bookings.length,
      totalCapacity: facilities.reduce((s, f) => s + f.capacity, 0),
    },
    facilities: facilities.map(f => ({
      id: f.id,
      name: f.name,
      type: f.type,
      capacity: f.capacity,
      location: f.location,
      status: f.status,
      bookingCount: f.bookings.length,
      upcomingBookings: f.bookings.filter(b =>
        b.status !== 'Rejected' && b.status !== 'Completed' && new Date(b.endDate) >= now
      ).length,
      latestBooking: f.bookings[0] || null,
    })),
    bookings: bookings.map(b => ({
      id: b.id,
      facilityId: b.facilityId,
      facility: b.facility,
      bookedBy: b.bookedBy,
      purpose: b.purpose,
      startDate: b.startDate,
      endDate: b.endDate,
      status: b.status,
      createdAt: b.createdAt,
    })),
    byType: byType.map(t => ({ name: t.type, count: t._count })),
    byStatus: byStatus.map(s => ({ name: s.status, count: s._count })),
  })
}

// POST /api/facilities — create facility OR booking
//   body.type === 'facility' → create facility
//   body.type === 'booking' (default) → create booking
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // ---- Create facility ----
  if (body.type === 'facility') {
    if (!body.name) {
      return NextResponse.json({ error: 'Facility name is required' }, { status: 400 })
    }
    const existing = await db.facility.findUnique({ where: { name: body.name } })
    if (existing) {
      return NextResponse.json({ error: 'A facility with this name already exists' }, { status: 409 })
    }
    const facility = await db.facility.create({
      data: {
        name: body.name,
        type: body.type_facility || body.facilityType || 'Hall',
        capacity: Math.max(1, Number(body.capacity) || 50),
        location: body.location || null,
        status: body.status || 'Available',
      },
    })
    await db.activityLog.create({
      data: { action: 'CREATE', entity: 'Facility', entityId: facility.id, user: 'Admin', details: `Added facility ${facility.name} (${facility.type})` },
    })
    return NextResponse.json(facility, { status: 201 })
  }

  // ---- Create booking ----
  if (!body.facilityId || !body.purpose || !body.startDate || !body.endDate) {
    return NextResponse.json({ error: 'facilityId, purpose, startDate and endDate are required' }, { status: 400 })
  }
  const facility = await db.facility.findUnique({ where: { id: body.facilityId } })
  if (!facility) {
    return NextResponse.json({ error: 'Facility not found' }, { status: 404 })
  }
  const startDate = new Date(body.startDate)
  const endDate = new Date(body.endDate)
  if (endDate < startDate) {
    return NextResponse.json({ error: 'endDate must be after startDate' }, { status: 400 })
  }

  // Check for booking conflicts (any non-rejected booking overlapping)
  const conflict = await db.facilityBooking.findFirst({
    where: {
      facilityId: body.facilityId,
      status: { notIn: ['Rejected', 'Cancelled'] },
      startDate: { lte: endDate },
      endDate: { gte: startDate },
    },
  })
  if (conflict) {
    return NextResponse.json({ error: 'Facility is already booked for the selected time range' }, { status: 409 })
  }

  const booking = await db.facilityBooking.create({
    data: {
      facilityId: body.facilityId,
      bookedBy: body.bookedBy || 'Admin',
      purpose: body.purpose,
      startDate,
      endDate,
      status: body.status || 'Pending',
    },
    include: { facility: { select: { id: true, name: true, type: true, location: true, capacity: true } } },
  })

  await db.activityLog.create({
    data: { action: 'CREATE', entity: 'FacilityBooking', entityId: booking.id, user: 'Admin', details: `Booked ${booking.facility.name} for "${booking.purpose}"` },
  })

  return NextResponse.json(booking, { status: 201 })
}

// PUT /api/facilities — update booking status (approve/reject/complete)
//   body.id (required), body.status
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.id) {
    return NextResponse.json({ error: 'Booking id is required' }, { status: 400 })
  }
  const existing = await db.facilityBooking.findUnique({ where: { id: body.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
  }

  const updated = await db.facilityBooking.update({
    where: { id: body.id },
    data: { status: body.status || existing.status },
    include: { facility: { select: { id: true, name: true, type: true, location: true, capacity: true } } },
  })

  await db.activityLog.create({
    data: { action: 'UPDATE', entity: 'FacilityBooking', entityId: updated.id, user: 'Admin', details: `Booking for ${updated.facility.name} → ${updated.status}` },
  })

  return NextResponse.json(updated)
}
