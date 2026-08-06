import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/visitors?status=&purpose=&search=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const purpose = searchParams.get('purpose') || ''
  const search = searchParams.get('search')?.trim() || ''

  const where: any = {}
  if (status) where.status = status
  if (purpose) where.purpose = purpose
  if (search) {
    where.OR = [
      { visitorName: { contains: search } },
      { idNumber: { contains: search } },
      { phone: { contains: search } },
      { vehicleReg: { contains: search } },
      { personToSee: { contains: search } },
    ]
  }

  const [visitors, total, checkedIn, checkedOut, todayCount, byPurpose] = await Promise.all([
    db.visitor.findMany({ where, orderBy: { checkInTime: 'desc' }, take: 100 }),
    db.visitor.count({ where }),
    db.visitor.count({ where: { ...where, status: 'Checked In' } }),
    db.visitor.count({ where: { ...where, status: 'Checked Out' } }),
    db.visitor.count({ where: { checkInTime: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } } }),
    db.visitor.groupBy({ by: ['purpose'], _count: true }),
  ])

  return NextResponse.json({
    stats: { total, checkedIn, checkedOut, todayCount },
    visitors: visitors.map(v => ({ ...v })),
    byPurpose: byPurpose.map(p => ({ name: p.purpose, count: p._count })),
  })
}

// POST — check in a new visitor
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.visitorName) {
    return NextResponse.json({ error: 'visitorName is required' }, { status: 400 })
  }
  const visitor = await db.visitor.create({
    data: {
      visitorName: body.visitorName,
      idNumber: body.idNumber || null,
      phone: body.phone || null,
      purpose: body.purpose || 'Other',
      personToSee: body.personToSee || null,
      vehicleReg: body.vehicleReg || null,
      status: 'Checked In',
      notes: body.notes || null,
      recordedBy: body.recordedBy || null,
    },
  })
  return NextResponse.json(visitor, { status: 201 })
}
