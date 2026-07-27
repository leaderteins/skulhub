import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/hostel/[id] — dormitory detail with rooms, allocations, inspections
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const dorm = await db.dormitory.findUnique({
    where: { id },
    include: {
      warden: { select: { id: true, firstName: true, lastName: true, phone: true, employeeNo: true, email: true } },
      rooms: {
        orderBy: { roomNumber: 'asc' },
        include: {
          allocations: {
            where: { status: 'Active' },
            include: {
              student: {
                select: {
                  id: true, admissionNo: true, firstName: true, lastName: true, gender: true,
                  enrollments: { take: 1, select: { stream: { select: { name: true, classLevel: { select: { name: true } } } } } },
                },
              },
            },
          },
        },
      },
      inspections: { orderBy: { date: 'desc' } },
    },
  })
  if (!dorm) return NextResponse.json({ error: 'Dormitory not found' }, { status: 404 })
  return NextResponse.json(dorm)
}

// PUT /api/hostel/[id] — update dormitory
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.gender !== undefined) data.gender = body.gender
  if (body.capacity !== undefined) data.capacity = Number(body.capacity)
  if (body.wardenId !== undefined) data.wardenId = body.wardenId
  if (body.location !== undefined) data.location = body.location
  if (body.floors !== undefined) data.floors = Number(body.floors)
  if (body.status !== undefined) data.status = body.status
  const dorm = await db.dormitory.update({ where: { id }, data })
  return NextResponse.json(dorm)
}

// DELETE /api/hostel/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.dormitory.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
