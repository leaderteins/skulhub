import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/report-cards?examId=&streamId=
// Returns the merit list for an exam (optionally filtered by stream) with
// computed totals, mean grades (KCSE 12-point), points, and rank.
// If no examId is provided, defaults to the most recent exam.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  let examId = searchParams.get('examId')
  const streamId = searchParams.get('streamId')

  // Default to the most recent exam if none specified
  if (!examId) {
    const latest = await db.exam.findFirst({ orderBy: { startDate: 'desc' } })
    if (!latest) {
      return NextResponse.json({ error: 'No exams found' }, { status: 404 })
    }
    examId = latest.id
  }

  const exam = await db.exam.findUnique({ where: { id: examId } })
  if (!exam) {
    return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
  }

  // Fetch all grades for this exam
  const grades = await db.grade.findMany({
    where: { examId },
    include: {
      student: {
        include: {
          enrollments: {
            where: { academicYear: exam.academicYear, term: exam.term },
            include: { stream: { include: { classLevel: true } } },
          },
          guardian: true,
        },
      },
      subject: true,
    },
  })

  // Group grades by student
  const byStudent = new Map<string, {
    student: typeof grades[number]['student']
    grades: typeof grades
  }>()

  for (const g of grades) {
    if (streamId) {
      const enr = g.student.enrollments[0]
      if (!enr || enr.streamId !== streamId) continue
    }
    if (!byStudent.has(g.studentId)) {
      byStudent.set(g.studentId, { student: g.student, grades: [] })
    }
    byStudent.get(g.studentId)!.grades.push(g)
  }

  // Compute aggregates per student
  const KCSE_POINTS: Record<string, number> = {
    A: 12, 'A-': 11, 'B+': 10, B: 9, 'B-': 8, 'C+': 7, C: 6, 'C-': 5,
    'D+': 4, D: 3, 'D-': 2, E: 1,
  }

  const meritList = Array.from(byStudent.values()).map(({ student, grades: sg }) => {
    const totalMarks = sg.reduce((s, g) => s + g.marks, 0)
    const totalPoints = sg.reduce((s, g) => s + (g.points || KCSE_POINTS[g.grade] || 0), 0)
    const count = sg.length
    const avgMarks = count > 0 ? totalMarks / count : 0
    const meanPoints = count > 0 ? totalPoints / count : 0
    // Mean grade from mean points (KCSE style)
    let meanGrade = 'E'
    if (meanPoints >= 11.5) meanGrade = 'A'
    else if (meanPoints >= 10.5) meanGrade = 'A-'
    else if (meanPoints >= 9.5) meanGrade = 'B+'
    else if (meanPoints >= 8.5) meanGrade = 'B'
    else if (meanPoints >= 7.5) meanGrade = 'B-'
    else if (meanPoints >= 6.5) meanGrade = 'C+'
    else if (meanPoints >= 5.5) meanGrade = 'C'
    else if (meanPoints >= 4.5) meanGrade = 'C-'
    else if (meanPoints >= 3.5) meanGrade = 'D+'
    else if (meanPoints >= 2.5) meanGrade = 'D'
    else if (meanPoints >= 1.5) meanGrade = 'D-'

    const enr = student.enrollments[0]
    return {
      student: {
        id: student.id,
        admissionNo: student.admissionNo,
        firstName: student.firstName,
        lastName: student.lastName,
        gender: student.gender,
        boarding: student.boarding,
        stream: enr?.stream,
        classLevel: enr?.stream?.classLevel,
        guardian: student.guardian,
      },
      subjectGrades: sg.map(g => ({
        subjectId: g.subjectId,
        subjectName: g.subject.name,
        subjectCode: g.subject.code,
        marks: g.marks,
        grade: g.grade,
        points: g.points,
        remarks: g.remarks,
      })),
      totalMarks: Math.round(totalMarks * 10) / 10,
      totalPoints,
      avgMarks: Math.round(avgMarks * 10) / 10,
      meanPoints: Math.round(meanPoints * 100) / 100,
      meanGrade,
      subjectCount: count,
    }
  })

  // Rank by total points (descending), tie-break by total marks
  meritList.sort((a, b) => b.totalPoints - a.totalPoints || b.totalMarks - a.totalMarks)
  meritList.forEach((m, i) => {
    ;(m as any).rank = i + 1
  })

  // Compute grade distribution of mean grades
  const gradeDistribution: Record<string, number> = {}
  meritList.forEach(m => {
    gradeDistribution[m.meanGrade] = (gradeDistribution[m.meanGrade] || 0) + 1
  })

  // Subject performance summary
  const subjectMap = new Map<string, { name: string; code: string; marks: number[]; grades: Record<string, number> }>()
  grades.forEach(g => {
    if (streamId && g.student.enrollments[0]?.streamId !== streamId) return
    if (!subjectMap.has(g.subjectId)) {
      subjectMap.set(g.subjectId, { name: g.subject.name, code: g.subject.code, marks: [], grades: {} })
    }
    const s = subjectMap.get(g.subjectId)!
    s.marks.push(g.marks)
    s.grades[g.grade] = (s.grades[g.grade] || 0) + 1
  })
  const subjectPerformance = Array.from(subjectMap.entries()).map(([id, s]) => ({
    subjectId: id,
    subjectName: s.name,
    subjectCode: s.code,
    avgMarks: Math.round((s.marks.reduce((a, b) => a + b, 0) / s.marks.length) * 10) / 10,
    entries: s.marks.length,
    topGrade: Object.entries(s.grades).sort((a, b) => b[1] - a[1])[0]?.[0] || '-',
    gradeDist: s.grades,
  }))

  // Streams list for the selector
  const streams = await db.stream.findMany({
    include: { classLevel: true },
    orderBy: { name: 'asc' },
  })

  // Exams list for the selector
  const exams = await db.exam.findMany({
    orderBy: { startDate: 'desc' },
    select: { id: true, name: true, academicYear: true, term: true, examType: true, startDate: true, endDate: true },
  })

  return NextResponse.json({
    exam,
    meritList,
    gradeDistribution: Object.entries(gradeDistribution).map(([grade, count]) => ({ grade, count })),
    subjectPerformance,
    totalStudents: meritList.length,
    streams: streams.map(s => ({ id: s.id, name: s.name, classLevel: s.classLevel.name })),
    exams,
  })
}

// GET single student report card: /api/report-cards?studentId=&examId=
// handled in [id] route below for the detailed printable card
