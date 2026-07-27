import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const streamId = searchParams.get('streamId')
  const examId = searchParams.get('examId')
  const statsOnly = searchParams.get('stats') === 'true'

  // ---------------------------------------------------------------
  // Stats mode: grade distribution for an exam (optionally stream)
  // ---------------------------------------------------------------
  if (statsOnly) {
    if (!examId) {
      return NextResponse.json({ error: 'examId is required when stats=true' }, { status: 400 })
    }
    const where: any = { examId }
    if (streamId) {
      where.student = { enrollments: { some: { streamId, status: 'Active' } } }
    }
    const [dist, avg, count, subjectPerf, streamAgg] = await Promise.all([
      db.grade.groupBy({ by: ['grade'], where, _count: true, orderBy: { grade: 'asc' } }),
      db.grade.aggregate({ where, _avg: { marks: true }, _sum: { points: true }, _count: true }),
      db.grade.count({ where }),
      db.grade.groupBy({
        by: ['subjectId'],
        where,
        _avg: { marks: true },
        _count: true,
        orderBy: { subjectId: 'asc' },
      }),
      streamId
        ? Promise.resolve([])
        : db.grade.groupBy({
            by: ['studentId'],
            where,
            _avg: { marks: true },
            _sum: { points: true },
            _count: true,
          }),
    ])

    // Order: A, A-, B+, B, B-, C+, C, C-, D+, D, D-, E (KCSE-style)
    const KCSE_ORDER = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E']
    const gradeDistribution = KCSE_ORDER.map((g) => ({
      grade: g,
      count: dist.find((d) => d.grade === g)?._count || 0,
    })).filter((g) => g.count > 0 || KCSE_ORDER.includes(g.grade))

    // Subject performance — need names
    const subjectIds = subjectPerf.map((s) => s.subjectId)
    const subjects = await db.subject.findMany({
      where: { id: { in: subjectIds } },
      select: { id: true, name: true, code: true },
    })
    const subjectMap = new Map(subjects.map((s) => [s.id, s]))
    const subjectPerformance = subjectPerf
      .map((s) => {
        const sub = subjectMap.get(s.subjectId)
        return {
          subjectId: s.subjectId,
          subjectName: sub?.name || 'Unknown',
          subjectCode: sub?.code || '',
          avgMarks: s._avg.marks ? Math.round(s._avg.marks * 10) / 10 : 0,
          count: s._count,
        }
      })
      .sort((a, b) => b.avgMarks - a.avgMarks)

    // Top performers — fetch student names for top 10
    const topStudentIds = streamAgg
      .sort((a, b) => (b._avg.marks || 0) - (a._avg.marks || 0))
      .slice(0, 10)
      .map((s) => s.studentId)

    let topPerformers: any[] = []
    if (topStudentIds.length) {
      const students = await db.student.findMany({
        where: { id: { in: topStudentIds } },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNo: true,
          enrollments: {
            where: { status: 'Active' },
            select: { stream: { select: { name: true } } },
            take: 1,
          },
        },
      })
      const studentMap = new Map(students.map((s) => [s.id, s]))
      topPerformers = streamAgg
        .filter((s) => studentMap.has(s.studentId))
        .sort((a, b) => (b._avg.marks || 0) - (a._avg.marks || 0))
        .slice(0, 10)
        .map((s, idx) => {
          const st = studentMap.get(s.studentId)!
          const meanGrade = meanGradeFromPoints(s._sum.points || 0, s._count)
          return {
            rank: idx + 1,
            studentId: s.studentId,
            studentName: `${st.firstName} ${st.lastName}`,
            admissionNo: st.admissionNo,
            stream: st.enrollments[0]?.stream?.name || '—',
            totalMarks: Math.round((s._avg.marks || 0) * s._count),
            meanMarks: s._avg.marks ? Math.round(s._avg.marks * 10) / 10 : 0,
            totalPoints: s._sum.points || 0,
            subjectsCount: s._count,
            meanGrade,
          }
        })
    }

    return NextResponse.json({
      examId,
      streamId,
      totalGrades: count,
      averageMarks: avg._avg.marks ? Math.round(avg._avg.marks * 10) / 10 : 0,
      totalPoints: avg._sum.points || 0,
      gradeDistribution,
      subjectPerformance,
      topPerformers,
    })
  }

  // ---------------------------------------------------------------
  // List mode: grades for an exam (optionally filtered by stream)
  // ---------------------------------------------------------------
  if (!examId) {
    return NextResponse.json({ error: 'examId is required' }, { status: 400 })
  }
  const where: any = { examId }
  if (streamId) {
    where.student = { enrollments: { some: { streamId, status: 'Active' } } }
  }

  const grades = await db.grade.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNo: true,
          enrollments: {
            where: { status: 'Active' },
            select: { stream: { select: { id: true, name: true } } },
            take: 1,
          },
        },
      },
      subject: { select: { id: true, name: true, code: true } },
    },
    orderBy: [{ student: { lastName: 'asc' } }, { subject: { name: 'asc' } }],
    take: 500,
  })

  const data = grades.map((g) => ({
    id: g.id,
    studentId: g.studentId,
    subjectId: g.subjectId,
    examId: g.examId,
    marks: g.marks,
    grade: g.grade,
    points: g.points,
    remarks: g.remarks,
    student: {
      id: g.student.id,
      name: `${g.student.firstName} ${g.student.lastName}`,
      admissionNo: g.student.admissionNo,
      stream: g.student.enrollments[0]?.stream?.name || '—',
    },
    subject: g.subject,
  }))

  return NextResponse.json({ grades: data, count: data.length })
}

// Compute mean grade from total KCSE points and subject count
function meanGradeFromPoints(totalPoints: number, count: number): string {
  if (!count) return 'E'
  const meanPoints = totalPoints / count
  // KCSE points: A=12, A-=11, B+=10, B=9, B-=8, C+=7, C=6, C-=5, D+=4, D=3, D-=2, E=1
  if (meanPoints >= 11.5) return 'A'
  if (meanPoints >= 10.5) return 'A-'
  if (meanPoints >= 9.5) return 'B+'
  if (meanPoints >= 8.5) return 'B'
  if (meanPoints >= 7.5) return 'B-'
  if (meanPoints >= 6.5) return 'C+'
  if (meanPoints >= 5.5) return 'C'
  if (meanPoints >= 4.5) return 'C-'
  if (meanPoints >= 3.5) return 'D+'
  if (meanPoints >= 2.5) return 'D'
  if (meanPoints >= 1.5) return 'D-'
  return 'E'
}
