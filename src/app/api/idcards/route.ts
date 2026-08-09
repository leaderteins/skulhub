import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/idcards?type=students|staff&search=
// Returns people list for ID card generation + stats
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') || 'students'
  const search = searchParams.get('search')?.trim() || ''

  // Stats — always returned (both counts)
  const [totalStudents, totalStaff] = await Promise.all([
    db.student.count({ where: { status: 'Active' } }),
    db.staff.count({ where: { status: 'Active' } }),
  ])

  if (type === 'staff') {
    const where: any = { status: 'Active' }
    if (search) {
      where.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { employeeNo: { contains: search } },
        { email: { contains: search } },
      ]
    }

    const staff = await db.staff.findMany({
      where,
      include: { department: true },
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      take: 200,
    })

    return NextResponse.json({
      stats: {
        totalStudents,
        totalStaff,
        cardsGenerated: totalStudents + totalStaff,
      },
      people: staff.map(s => ({
        id: s.id,
        type: 'Staff' as const,
        employeeNo: s.employeeNo,
        firstName: s.firstName,
        lastName: s.lastName,
        fullName: `${s.firstName} ${s.lastName}`,
        gender: s.gender,
        role: s.role,
        department: s.department?.name || '—',
        email: s.email || null,
        phone: s.phone || null,
        bloodGroup: null,
        photoUrl: null,
        status: s.status,
      })),
    })
  }

  // Default: students
  const where: any = { status: 'Active' }
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { admissionNo: { contains: search } },
      { email: { contains: search } },
    ]
  }

  const students = await db.student.findMany({
    where,
    include: {
      enrollments: {
        include: { stream: { include: { classLevel: true } } },
        orderBy: { enrolledAt: 'desc' },
        take: 1,
      },
    },
    orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
    take: 200,
  })

  return NextResponse.json({
    stats: {
      totalStudents,
      totalStaff,
      cardsGenerated: totalStudents + totalStaff,
    },
    people: students.map(s => {
      const currentEnrollment = s.enrollments.find(e => e.status === 'Active') || s.enrollments[0]
      // Stream name already includes the class level prefix (e.g. "Form 1 East")
      const className = currentEnrollment?.stream?.name || currentEnrollment?.stream?.classLevel?.name || null
      return {
        id: s.id,
        type: 'Student' as const,
        admissionNo: s.admissionNo,
        firstName: s.firstName,
        lastName: s.lastName,
        fullName: `${s.firstName} ${s.lastName}`,
        gender: s.gender,
        className,
        bloodGroup: s.bloodGroup || null,
        email: s.email || null,
        phone: s.phone || null,
        photoUrl: s.photoUrl || null,
        status: s.status,
        boarding: s.boarding,
      }
    }),
  })
}
