import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, canUserDelete } from '@/lib/auth-utils'

type Ctx = { params: Promise<{ id: string }> }

// GET /api/students/[id] — full profile
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params

  const student = await db.student.findUnique({
    where: { id },
    include: {
      guardian: true,
      enrollments: {
        include: {
          stream: { include: { classLevel: true } },
          classLevel: true,
        },
        orderBy: { enrolledAt: 'desc' },
      },
      attendance: {
        orderBy: { date: 'desc' },
        take: 10,
      },
      grades: {
        include: { subject: true, exam: true },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
      invoices: {
        include: { _count: { select: { payments: true } } },
        orderBy: { issueDate: 'desc' },
      },
    },
  })

  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  // Fee summary
  const totalBilled = student.invoices.reduce((s, i) => s + i.amount, 0)
  const totalPaid = student.invoices.reduce((s, i) => s + i.amountPaid, 0)
  const balance = student.invoices.reduce((s, i) => s + i.balance, 0)
  const paymentsCount = student.invoices.reduce((s, i) => s + i._count.payments, 0)

  // Attendance summary
  const attStats = student.attendance.reduce(
    (acc, a) => {
      acc.total++
      if (a.status === 'Present') acc.present++
      if (a.status === 'Absent') acc.absent++
      if (a.status === 'Late') acc.late++
      return acc
    },
    { present: 0, absent: 0, late: 0, total: 0 }
  )

  // Current enrollment
  const currentEnrollment =
    student.enrollments.find((e) => e.status === 'Active') || student.enrollments[0] || null

  return NextResponse.json({
    ...student,
    currentEnrollment,
    feeSummary: {
      totalBilled,
      totalPaid,
      balance,
      invoiceCount: student.invoices.length,
      paymentsCount,
    },
    attendanceStats: attStats,
  })
}

// PUT /api/students/[id] — update
export async function PUT(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  try {
    const body = await req.json()

    const existing = await db.student.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    if (body.admissionNo && body.admissionNo !== existing.admissionNo) {
      const dup = await db.student.findUnique({ where: { admissionNo: body.admissionNo } })
      if (dup) {
        return NextResponse.json(
          { error: `Admission number ${body.admissionNo} already exists` },
          { status: 409 }
        )
      }
    }

    const data: any = {}
    if (body.admissionNo !== undefined) data.admissionNo = body.admissionNo
    if (body.firstName !== undefined) data.firstName = body.firstName
    if (body.lastName !== undefined) data.lastName = body.lastName
    if (body.email !== undefined) data.email = body.email || null
    if (body.phone !== undefined) data.phone = body.phone || null
    if (body.gender !== undefined) data.gender = body.gender
    if (body.dateOfBirth !== undefined)
      data.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null
    if (body.bloodGroup !== undefined) data.bloodGroup = body.bloodGroup || null
    if (body.nationality !== undefined) data.nationality = body.nationality
    if (body.county !== undefined) data.county = body.county || null
    if (body.photoUrl !== undefined) data.photoUrl = body.photoUrl || null
    if (body.boarding !== undefined) data.boarding = !!body.boarding
    if (body.status !== undefined) data.status = body.status
    if (body.guardianId !== undefined) data.guardianId = body.guardianId || null

    const student = await db.student.update({
      where: { id },
      data,
      include: { guardian: true },
    })

    await db.activityLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Student',
        entityId: student.id,
        user: 'System',
        details: `Updated student ${student.firstName} ${student.lastName}`,
      },
    })

    return NextResponse.json(student)
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to update student' },
      { status: 500 }
    )
  }
}

// DELETE /api/students/[id]
export async function DELETE(req: NextRequest, { params }: Ctx) {
  const { id } = await params
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (!canUserDelete(user.role, 'students')) {
      return NextResponse.json({ error: 'You do not have permission to delete student records. Only admin and principal can delete.' }, { status: 403 })
    }

    const existing = await db.student.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    await db.student.delete({ where: { id } })

    await db.activityLog.create({
      data: {
        action: 'DELETE',
        entity: 'Student',
        entityId: id,
        user: 'System',
        details: `Deleted student ${existing.firstName} ${existing.lastName} (${existing.admissionNo})`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Failed to delete student' },
      { status: 500 }
    )
  }
}
