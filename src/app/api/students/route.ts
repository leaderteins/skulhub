import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/students — paginated list with filters
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() || ''
  const classLevel = searchParams.get('classLevel') || ''
  const gender = searchParams.get('gender') || ''
  const status = searchParams.get('status') || ''
  const boarding = searchParams.get('boarding') // 'true' | 'false' | null
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1)
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10) || 20))

  // Build where clause
  const where: any = {}
  if (search) {
    where.OR = [
      { admissionNo: { contains: search } },
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { phone: { contains: search } },
      { email: { contains: search } },
    ]
  }
  if (gender) where.gender = gender
  if (status) where.status = status
  if (boarding === 'true') where.boarding = true
  if (boarding === 'false') where.boarding = false
  if (classLevel) {
    where.enrollments = { some: { classLevelId: classLevel, status: 'Active' } }
  }

  const [students, total, allTotal, boardingTotal, newThisTerm, classLevels] = await Promise.all([
    db.student.findMany({
      where,
      include: {
        guardian: true,
        enrollments: {
          where: { status: 'Active' },
          include: {
            stream: { include: { classLevel: true } },
            classLevel: true,
          },
          orderBy: { enrolledAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ createdAt: 'desc' }, { lastName: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    db.student.count({ where }),
    db.student.count({ where: { status: 'Active' } }),
    db.student.count({ where: { boarding: true, status: 'Active' } }),
    db.student.count({
      where: { admissionDate: { gte: new Date(new Date().getFullYear(), 0, 1) } },
    }),
    db.classLevel.findMany({
      orderBy: { order: 'asc' },
      select: { id: true, name: true, stage: true },
    }),
  ])

  // Flatten currentEnrollment
  const shaped = students.map((s) => {
    const { enrollments, ...rest } = s
    return { ...rest, currentEnrollment: enrollments[0] || null }
  })

  return NextResponse.json({
    students: shaped,
    total,
    page,
    pageSize,
    stats: {
      total: allTotal,
      boarding: boardingTotal,
      dayScholars: Math.max(0, allTotal - boardingTotal),
      newThisTerm,
    },
    classLevels,
  })
}

// POST /api/students — admit a new student
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    if (!body.admissionNo || !body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: 'Missing required fields: admissionNo, firstName, lastName' },
        { status: 400 }
      )
    }

    // Check admissionNo uniqueness
    const existing = await db.student.findUnique({ where: { admissionNo: body.admissionNo } })
    if (existing) {
      return NextResponse.json(
        { error: `Admission number ${body.admissionNo} already exists` },
        { status: 409 }
      )
    }

    // Optionally create guardian inline
    let guardianId = body.guardianId || null
    if (!guardianId && body.guardian?.firstName && body.guardian?.phone) {
      const g = await db.guardian.create({
        data: {
          firstName: body.guardian.firstName,
          lastName: body.guardian.lastName || '',
          phone: body.guardian.phone,
          email: body.guardian.email || null,
          relation: body.guardian.relation || 'Parent',
          occupation: body.guardian.occupation || null,
          address: body.guardian.address || null,
        },
      })
      guardianId = g.id
    }

    const student = await db.student.create({
      data: {
        admissionNo: body.admissionNo,
        firstName: body.firstName,
        lastName: body.lastName,
        email: body.email || null,
        phone: body.phone || null,
        gender: body.gender || 'Male',
        dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
        bloodGroup: body.bloodGroup || null,
        nationality: body.nationality || 'Kenyan',
        county: body.county || null,
        photoUrl: body.photoUrl || null,
        boarding: !!body.boarding,
        status: body.status || 'Active',
        guardianId,
        admissionDate: body.admissionDate ? new Date(body.admissionDate) : new Date(),
      },
      include: { guardian: true },
    })

    // Log activity
    await db.activityLog.create({
      data: {
        action: 'CREATE',
        entity: 'Student',
        entityId: student.id,
        user: 'System',
        details: `Admitted student ${student.firstName} ${student.lastName} (${student.admissionNo})`,
      },
    })

    return NextResponse.json(student, { status: 201 })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to create student' },
      { status: 500 }
    )
  }
}
