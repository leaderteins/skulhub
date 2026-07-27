import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const ACADEMIC_YEAR = '2025'
const TERM = 'Term 1'

// GET /api/finance/scholarships
// Returns scholarships with student info.
export async function GET() {
  const scholarships = await db.scholarship.findMany({
    orderBy: { createdAt: 'desc' },
  })

  // Fetch related students separately (Scholarship has no relation field)
  const studentIds = Array.from(new Set(scholarships.map(s => s.studentId).filter(Boolean) as string[]))
  const students = studentIds.length
    ? await db.student.findMany({
        where: { id: { in: studentIds } },
        select: {
          id: true,
          admissionNo: true,
          firstName: true,
          lastName: true,
          boarding: true,
          enrollments: {
            where: { academicYear: ACADEMIC_YEAR, term: TERM },
            take: 1,
            select: { stream: { select: { name: true, classLevel: { select: { name: true } } } } },
          },
        },
      })
    : []
  const studentMap = new Map(students.map(s => [s.id, s]))

  // Coverage summary
  const byCoverage = await db.scholarship.groupBy({
    by: ['coverage'],
    _sum: { amount: true },
    _count: { _all: true },
  })
  const byStatus = await db.scholarship.groupBy({
    by: ['status'],
    _sum: { amount: true },
    _count: { _all: true },
  })

  const result = scholarships.map(s => {
    const st = s.studentId ? studentMap.get(s.studentId) : null
    const enrollment = st?.enrollments[0]
    return {
      id: s.id,
      name: s.name,
      provider: s.provider || '',
      amount: s.amount,
      coverage: s.coverage,
      academicYear: s.academicYear,
      status: s.status,
      startDate: s.startDate,
      endDate: s.endDate,
      studentId: st?.id || null,
      admissionNo: st?.admissionNo || '',
      studentName: st ? `${st.firstName} ${st.lastName}` : 'Unassigned',
      boarding: st?.boarding || false,
      classLevel: enrollment?.stream?.classLevel?.name || '—',
      stream: enrollment?.stream?.name || '—',
    }
  })

  return NextResponse.json({
    scholarships: result,
    total: result.length,
    totalAmount: result.reduce((s, r) => s + r.amount, 0),
    byCoverage: byCoverage.map(c => ({ coverage: c.coverage, total: c._sum.amount || 0, count: c._count._all })),
    byStatus: byStatus.map(s => ({ status: s.status, total: s._sum.amount || 0, count: s._count._all })),
  })
}

// POST /api/finance/scholarships
// Body: { studentId?, name, provider?, amount, coverage, academicYear?, status?, startDate?, endDate? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { studentId, name, provider, amount, coverage, academicYear, status, startDate, endDate } = body as {
      studentId?: string
      name: string
      provider?: string
      amount: number
      coverage?: string
      academicYear?: string
      status?: string
      startDate?: string
      endDate?: string
    }

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
    }

    if (studentId) {
      const st = await db.student.findUnique({ where: { id: studentId } })
      if (!st) return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const scholarship = await db.scholarship.create({
      data: {
        studentId: studentId || null,
        name: name.trim(),
        provider: provider || null,
        amount: amt,
        coverage: coverage || 'Full',
        academicYear: academicYear || ACADEMIC_YEAR,
        status: status || 'Active',
        startDate: startDate ? new Date(startDate) : new Date(),
        endDate: endDate ? new Date(endDate) : null,
      },
    })

    try {
      await db.activityLog.create({
        data: {
          action: 'CREATE',
          entity: 'Scholarship',
          entityId: scholarship.id,
          user: 'Bursar',
          details: `Created scholarship ${name} for KES ${amt}`,
        },
      })
    } catch {
      // ignore log errors
    }

    return NextResponse.json({
      id: scholarship.id,
      name: scholarship.name,
      provider: scholarship.provider || '',
      amount: scholarship.amount,
      coverage: scholarship.coverage,
      academicYear: scholarship.academicYear,
      status: scholarship.status,
      startDate: scholarship.startDate,
      endDate: scholarship.endDate,
      studentId: scholarship.studentId,
    }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create scholarship' }, { status: 500 })
  }
}
