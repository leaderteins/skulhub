import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/report-cards/[id]?examId=
// Returns a full printable report card for a single student.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: studentId } = await params
  const { searchParams } = new URL(req.url)
  const examId = searchParams.get('examId')

  const student = await db.student.findUnique({
    where: { id: studentId },
    include: {
      guardian: true,
      enrollments: {
        orderBy: { enrolledAt: 'desc' },
        take: 1,
        include: { stream: { include: { classLevel: true } } },
      },
    },
  })
  if (!student) {
    return NextResponse.json({ error: 'Student not found' }, { status: 404 })
  }

  const where = examId ? { studentId, examId } : { studentId }
  const grades = await db.grade.findMany({
    where,
    include: { subject: true, exam: true },
    orderBy: { subject: { name: 'asc' } },
  })

  if (grades.length === 0) {
    return NextResponse.json({ error: 'No grades found for this student' }, { status: 404 })
  }

  const exam = grades[0].exam

  // Attendance summary for the term
  const attendance = await db.attendance.findMany({
    where: {
      studentId,
      date: { gte: exam.startDate, lte: exam.endDate || new Date() },
    },
  })
  const attSummary = {
    total: attendance.length,
    present: attendance.filter(a => a.status === 'Present').length,
    absent: attendance.filter(a => a.status === 'Absent').length,
    late: attendance.filter(a => a.status === 'Late').length,
    excused: attendance.filter(a => a.status === 'Excused').length,
  }
  attSummary.present = attSummary.present || 0

  // Compute totals & mean
  const totalMarks = grades.reduce((s, g) => s + g.marks, 0)
  const totalPoints = grades.reduce((s, g) => s + g.points, 0)
  const avgMarks = totalMarks / grades.length
  const meanPoints = totalPoints / grades.length

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

  // Rank in stream
  const streamId = student.enrollments[0]?.streamId
  let streamRank: number | null = null
  let streamSize = 0
  if (streamId) {
    const streamGrades = await db.grade.findMany({
      where: { examId: exam.id, student: { enrollments: { some: { streamId } } } },
      include: { student: true },
    })
    const byStu = new Map<string, number>()
    streamGrades.forEach(g => {
      byStu.set(g.studentId, (byStu.get(g.studentId) || 0) + g.points)
    })
    const sorted = Array.from(byStu.entries()).sort((a, b) => b[1] - a[1])
    streamSize = sorted.length
    const idx = sorted.findIndex(([sid]) => sid === studentId)
    streamRank = idx >= 0 ? idx + 1 : null
  }

  // Auto-remarks based on performance
  const remarks = meanGrade.startsWith('A')
    ? 'Excellent performance. Keep up the outstanding work!'
    : meanGrade.startsWith('B')
    ? 'Very good performance. Aim higher next term.'
    : meanGrade.startsWith('C')
    ? 'Satisfactory. More effort needed to reach your potential.'
    : meanGrade.startsWith('D')
    ? 'Below average. Requires serious improvement and extra support.'
    : 'Poor performance. Urgent intervention and remedial teaching required.'

  const promotion = avgMarks >= 50
    ? `Promoted to ${nextClassLevel(student.enrollments[0]?.stream?.classLevel?.name || '')}`
    : 'To repeat current class — needs to improve academic standing.'

  return NextResponse.json({
    student: {
      ...student,
      currentStream: student.enrollments[0]?.stream,
      classLevel: student.enrollments[0]?.stream?.classLevel,
    },
    exam,
    grades: grades.map(g => ({
      subjectName: g.subject.name,
      subjectCode: g.subject.code,
      category: g.subject.category,
      marks: g.marks,
      grade: g.grade,
      points: g.points,
      remarks: g.remarks || autoSubjectRemark(g.marks),
    })),
    summary: {
      totalMarks: Math.round(totalMarks * 10) / 10,
      totalPoints,
      avgMarks: Math.round(avgMarks * 10) / 10,
      meanPoints: Math.round(meanPoints * 100) / 100,
      meanGrade,
      streamRank,
      streamSize,
    },
    attendance: attSummary,
    classTeacherRemarks: remarks,
    promotionStatus: promotion,
    generatedAt: new Date().toISOString(),
  })
}

function autoSubjectRemark(marks: number): string {
  if (marks >= 80) return 'Excellent'
  if (marks >= 65) return 'Good'
  if (marks >= 50) return 'Fair'
  if (marks >= 40) return 'Poor'
  return 'Very Poor'
}

function nextClassLevel(current: string): string {
  const m = current.match(/(\d+)/)
  if (!m) return current
  const n = parseInt(m[1], 10) + 1
  return current.replace(/\d+/, String(n))
}
