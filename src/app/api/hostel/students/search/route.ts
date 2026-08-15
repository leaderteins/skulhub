import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/hostel/students/search?search=&gender=&boarding=&limit=
// Lightweight endpoint for the bed-assignment student search box.
// Returns students matching the search (by name or admission number), including
// their CURRENT bed assignment (if any) and class info.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() || ''
  const gender = searchParams.get('gender') || '' // Male | Female
  const boarding = searchParams.get('boarding') // 'true' | 'false' | null
  const limit = Math.min(50, Math.max(5, parseInt(searchParams.get('limit') || '20', 10) || 20))

  const where: {
    OR?: Array<Record<string, unknown>>
    gender?: string
    boarding?: boolean
    status: string
  } = { status: 'Active' }
  if (search) {
    where.OR = [
      { admissionNo: { contains: search } },
      { firstName: { contains: search } },
      { lastName: { contains: search } },
    ]
  }
  if (gender) where.gender = gender
  if (boarding === 'true') where.boarding = true
  if (boarding === 'false') where.boarding = false

  const students = await db.student.findMany({
    where,
    orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
    take: limit,
    select: {
      id: true,
      admissionNo: true,
      firstName: true,
      lastName: true,
      gender: true,
      phone: true,
      boarding: true,
      status: true,
      photoUrl: true,
      enrollments: {
        where: { status: 'Active' },
        take: 1,
        select: { stream: { select: { name: true, classLevel: { select: { name: true } } } } },
      },
      beds: {
        where: { status: 'Occupied' },
        take: 1,
        select: {
          id: true, bedNumber: true, status: true,
          room: { select: { id: true, roomNumber: true, dormitoryId: true, dormitory: { select: { name: true, gender: true } } } },
        },
      },
    },
  })

  const shaped = students.map(s => {
    const { beds, enrollments, ...rest } = s
    return {
      ...rest,
      currentEnrollment: enrollments[0] || null,
      currentBed: beds[0] || null,
    }
  })

  return NextResponse.json({ students: shaped, count: shaped.length })
}
