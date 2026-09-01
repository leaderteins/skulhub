import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/exams/analytics?examId=xxx
 *
 * Returns comprehensive KCSE analytics for an exam:
 * - Mean score per subject (bar chart)
 * - Grade distribution (A, A-, B+, ... E) — pie chart
 * - Top 10 students leaderboard
 * - Pass rate, transition rate
 * - Class vs stream comparison
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const examId = sp.get('examId')

    // 1. Get all exams (for the selector)
    let exams: any[] = []
    try {
      exams = await db.$queryRawUnsafe<any[]>(
        `SELECT id, name, term, "academicYear", "examType"
         FROM "Exam" ORDER BY "startDate" DESC LIMIT 20`
      )
    } catch {}

    if (!examId) {
      return NextResponse.json({ exams, analytics: null })
    }

    // 2. Get all grades for this exam
    let grades: any[] = []
    try {
      grades = await db.$queryRawUnsafe<any[]>(
        `SELECT g.*, s.name as subject_name, s.code as subject_code,
                st."firstName", st."lastName", st."admissionNo",
                st.id as student_id
         FROM "Grade" g
         LEFT JOIN "Subject" s ON s.id = g."subjectId"
         LEFT JOIN "Student" st ON st.id = g."studentId"
         WHERE g."examId" = $1
         ORDER BY s.name ASC`, examId
      )
    } catch {}

    if (grades.length === 0) {
      return NextResponse.json({
        exams,
        analytics: {
          totalStudents: 0,
          totalSubjects: 0,
          overallMean: 0,
          passRate: 0,
          subjectMeans: [],
          gradeDistribution: [],
          topStudents: [],
        },
      })
    }

    // 3. Compute subject means
    const subjectMap = new Map<string, { name: string; code: string; marks: number[]; grades: string[] }>()
    for (const g of grades) {
      const key = g.subject_name || 'Unknown'
      if (!subjectMap.has(key)) {
        subjectMap.set(key, { name: key, code: g.subject_code || '', marks: [], grades: [] })
      }
      const subj = subjectMap.get(key)!
      subj.marks.push(g.marks || 0)
      subj.grades.push(g.grade || 'E')
    }

    const subjectMeans = Array.from(subjectMap.values()).map(s => ({
      subject: s.name,
      code: s.code,
      mean: Math.round((s.marks.reduce((a, b) => a + b, 0) / s.marks.length) * 100) / 100,
      highest: Math.max(...s.marks),
      lowest: Math.min(...s.marks),
      count: s.marks.length,
    })).sort((a, b) => b.mean - a.mean)

    // 4. Grade distribution (KCSE 12-point scale)
    const gradeOrder = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E']
    const gradeCounts: Record<string, number> = {}
    for (const g of gradeOrder) gradeCounts[g] = 0
    for (const g of grades) {
      const gr = g.grade || 'E'
      if (gradeCounts[gr] !== undefined) gradeCounts[gr]++
    }
    const gradeDistribution = gradeOrder
      .filter(g => gradeCounts[g] > 0)
      .map(g => ({ grade: g, count: gradeCounts[g], color: getGradeColor(g) }))

    // 5. Top 10 students (by total marks)
    const studentMap = new Map<string, { id: string; name: string; admissionNo: string; totalMarks: number; totalPoints: number; subjectCount: number; grades: string[] }>()
    for (const g of grades) {
      const sid = g.student_id
      if (!sid) continue
      if (!studentMap.has(sid)) {
        studentMap.set(sid, {
          id: sid,
          name: `${g.firstName} ${g.lastName}`,
          admissionNo: g.admissionNo,
          totalMarks: 0,
          totalPoints: 0,
          subjectCount: 0,
          grades: [],
        })
      }
      const stu = studentMap.get(sid)!
      stu.totalMarks += g.marks || 0
      stu.totalPoints += g.points || 0
      stu.subjectCount++
      if (g.grade) stu.grades.push(g.grade)
    }

    const topStudents = Array.from(studentMap.values())
      .map(s => ({
        ...s,
        meanScore: s.subjectCount > 0 ? Math.round((s.totalMarks / s.subjectCount) * 100) / 100 : 0,
        meanGrade: s.grades.length > 0 ? getMeanGrade(s.totalPoints / s.grades.length) : '—',
      }))
      .sort((a, b) => b.totalMarks - a.totalMarks)
      .slice(0, 10)

    // 6. Overall stats
    const totalStudents = studentMap.size
    const totalSubjects = subjectMap.size
    const overallMean = subjectMeans.length > 0
      ? Math.round((subjectMeans.reduce((s, sub) => s + sub.mean, 0) / subjectMeans.length) * 100) / 100
      : 0
    const passRate = totalStudents > 0
      ? Math.round((topStudents.filter(s => s.meanScore >= 50).length / totalStudents) * 100)
      : 0

    // 7. Grade distribution summary
    const aGrades = grades.filter(g => g.grade === 'A' || g.grade === 'A-').length
    const aboveCPlus = grades.filter(g => ['A', 'A-', 'B+', 'B', 'B-', 'C+'].includes(g.grade)).length
    const belowD = grades.filter(g => ['D', 'D-', 'E'].includes(g.grade)).length

    return NextResponse.json({
      exams,
      analytics: {
        totalStudents,
        totalSubjects,
        totalGrades: grades.length,
        overallMean,
        passRate,
        qualityGrades: Math.round((aGrades / grades.length) * 100), // % A and A-
        transitionRate: Math.round((aboveCPlus / grades.length) * 100), // % C+ and above (university entry)
        failureRate: Math.round((belowD / grades.length) * 100), // % D and below
        subjectMeans,
        gradeDistribution,
        topStudents,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function getGradeColor(grade: string): string {
  const colors: Record<string, string> = {
    'A': '#059669', 'A-': '#10b981', 'B+': '#14b8a6',
    'B': '#06b6d4', 'B-': '#0ea5e9', 'C+': '#3b82f6',
    'C': '#6366f1', 'C-': '#8b5cf6', 'D+': '#a855f7',
    'D': '#d946ef', 'D-': '#ec4899', 'E': '#ef4444',
  }
  return colors[grade] || '#94a3b8'
}

function getMeanGrade(avgPoints: number): string {
  if (avgPoints >= 11) return 'A'
  if (avgPoints >= 10) return 'A-'
  if (avgPoints >= 9) return 'B+'
  if (avgPoints >= 8) return 'B'
  if (avgPoints >= 7) return 'B-'
  if (avgPoints >= 6) return 'C+'
  if (avgPoints >= 5) return 'C'
  if (avgPoints >= 4) return 'C-'
  if (avgPoints >= 3) return 'D+'
  if (avgPoints >= 2) return 'D'
  if (avgPoints >= 1) return 'D-'
  return 'E'
}
