import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/staff?search=&role=&departmentId=&status=&employmentType=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() || ''
  const role = searchParams.get('role') || ''
  const departmentId = searchParams.get('departmentId') || ''
  const status = searchParams.get('status') || ''
  const employmentType = searchParams.get('employmentType') || ''

  const where: any = {}
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { employeeNo: { contains: search } },
      { specialization: { contains: search } },
    ]
  }
  if (role) where.role = role
  if (departmentId) where.departmentId = departmentId
  if (status) where.status = status
  if (employmentType) where.employmentType = employmentType

  const [staff, total, allDepartments] = await Promise.all([
    db.staff.findMany({
      where,
      orderBy: [{ firstName: 'asc' }, { lastName: 'asc' }],
      include: {
        department: { select: { id: true, name: true } },
        taughtSubjects: {
          include: {
            subject: { select: { id: true, name: true, code: true } },
            classLevel: { select: { id: true, name: true } },
          },
        },
      },
    }),
    db.staff.count({ where }),
    db.department.findMany({
      orderBy: { name: 'asc' },
      select: { id: true, name: true },
    }),
  ])

  // Department distribution (for chart) — computed from current filter
  const deptGroups = await db.staff.groupBy({
    by: ['departmentId'],
    where,
    _count: true,
  })
  const deptIds = deptGroups.map((g) => g.departmentId).filter(Boolean) as string[]
  const depts = await db.department.findMany({
    where: { id: { in: deptIds } },
    select: { id: true, name: true },
  })
  const deptNameById = new Map(depts.map((d) => [d.id, d.name]))
  const byDepartment = deptGroups
    .map((g) => ({
      name: (g.departmentId && deptNameById.get(g.departmentId)) || 'Unassigned',
      count: g._count,
    }))
    .sort((a, b) => b.count - a.count)

  return NextResponse.json({ staff, total, byDepartment, departments: allDepartments })
}

// POST /api/staff — create a new staff member
export async function POST(req: NextRequest) {
  const body = await req.json()

  // Uniqueness check for employeeNo / email
  if (body.employeeNo) {
    const existing = await db.staff.findUnique({ where: { employeeNo: body.employeeNo } })
    if (existing) {
      return NextResponse.json(
        { error: 'Employee number already exists.' },
        { status: 400 },
      )
    }
  }
  if (body.email) {
    const existing = await db.staff.findUnique({ where: { email: body.email } })
    if (existing) {
      return NextResponse.json(
        { error: 'Email already in use.' },
        { status: 400 },
      )
    }
  }

  const data: any = {
    employeeNo: body.employeeNo,
    firstName: body.firstName,
    lastName: body.lastName,
    email: body.email || null,
    phone: body.phone || null,
    gender: body.gender || 'Male',
    role: body.role || 'Teacher',
    qualification: body.qualification || null,
    specialization: body.specialization || null,
    employmentType: body.employmentType || 'Permanent',
    salary: Number(body.salary) || 0,
    status: body.status || 'Active',
    address: body.address || null,
  }
  if (body.departmentId) data.departmentId = body.departmentId
  if (body.hireDate) data.hireDate = new Date(body.hireDate)

  const staff = await db.staff.create({ data })

  await db.activityLog.create({
    data: {
      action: 'CREATE',
      entity: 'Staff',
      entityId: staff.id,
      user: 'System',
      details: `Added staff ${staff.firstName} ${staff.lastName} (${staff.employeeNo})`,
    },
  })

  return NextResponse.json(staff, { status: 201 })
}
