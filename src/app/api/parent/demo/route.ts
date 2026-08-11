import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Returns demo credentials for the parent portal. Picks the student
 * with the most invoices (so the fee summary card looks populated),
 * falling back to any active student with a linked guardian.
 *
 * Used only by the "Auto-fill demo credentials" button so the portal is
 * usable in environments with seeded data (where guardian phone numbers
 * are randomized).
 */
export async function GET() {
  try {
    // Prefer a student that actually has invoices, attendance or grades
    // — that way the demo dashboard isn't empty.
    const candidates = await db.student.findMany({
      where: {
        guardianId: { not: null },
        status: 'Active',
      },
      include: {
        school: true,
        guardian: true,
        _count: { select: { invoices: true, attendance: true, grades: true } },
      },
      take: 200,
    })

    const student =
      [...candidates]
        .sort(
          (a, b) =>
            b._count.invoices +
            b._count.attendance +
            b._count.grades -
            (a._count.invoices + a._count.attendance + a._count.grades)
        )
        .find(s => s.school && s.guardian) ?? null

    if (!student || !student.school || !student.guardian) {
      return NextResponse.json(
        { error: 'No demo student available. Seed the database first.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      schoolCode: student.school.schoolCode,
      admissionNo: student.admissionNo,
      phone: student.guardian.phone,
      schoolName: student.school.name,
      studentName: `${student.firstName} ${student.lastName}`,
    })
  } catch (error) {
    console.error('[parent-demo] error:', error)
    return NextResponse.json(
      { error: 'Failed to load demo credentials.' },
      { status: 500 }
    )
  }
}
