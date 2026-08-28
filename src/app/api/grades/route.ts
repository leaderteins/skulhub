import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

/**
 * POST /api/grades
 * Create or update a grade for a student in a subject/exam.
 * Body: { studentId, subjectId, examId, marks, totalMarks?, source?, externalSource?, remarks? }
 *
 * If a grade already exists for this student+subject+exam, it's updated (upsert).
 * The `grade` (A-E) and `points` (12-1 KCSE style) are auto-computed from marks.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const {
      studentId, subjectId, examId, marks, totalMarks = 100,
      source = 'internal', externalSource = null, remarks = null,
      teacherComment = null, cbcLevel = null, cbcStrand = null, cbcSubStrand = null,
    } = body

    if (!studentId || !subjectId || !examId || marks == null) {
      return NextResponse.json(
        { error: 'studentId, subjectId, examId, and marks are required' },
        { status: 400 }
      )
    }

    const numMarks = Number(marks)
    if (!Number.isFinite(numMarks) || numMarks < 0) {
      return NextResponse.json({ error: 'Invalid marks value' }, { status: 400 })
    }

    // Compute KCSE-style grade and points
    const percentage = (numMarks / Number(totalMarks)) * 100
    let grade: string, points: number
    if (percentage >= 80) { grade = 'A'; points = 12 }
    else if (percentage >= 75) { grade = 'A-'; points = 11 }
    else if (percentage >= 70) { grade = 'B+'; points = 10 }
    else if (percentage >= 65) { grade = 'B'; points = 9 }
    else if (percentage >= 60) { grade = 'B-'; points = 8 }
    else if (percentage >= 55) { grade = 'C+'; points = 7 }
    else if (percentage >= 50) { grade = 'C'; points = 6 }
    else if (percentage >= 45) { grade = 'C-'; points = 5 }
    else if (percentage >= 40) { grade = 'D+'; points = 4 }
    else if (percentage >= 35) { grade = 'D'; points = 3 }
    else if (percentage >= 30) { grade = 'D-'; points = 2 }
    else { grade = 'E'; points = 1 }

    // Compute CBC level if not provided
    let computedCbcLevel = cbcLevel
    if (!computedCbcLevel) {
      if (percentage >= 80) computedCbcLevel = '4' // Exceeding Expectations
      else if (percentage >= 50) computedCbcLevel = '3' // Meeting Expectations
      else if (percentage >= 30) computedCbcLevel = '2' // Approaching Expectations
      else computedCbcLevel = '1' // Below Expectations
    }

    const record = await db.grade.upsert({
      where: {
        studentId_subjectId_examId: { studentId, subjectId, examId },
      },
      create: {
        studentId, subjectId, examId,
        marks: numMarks,
        grade, points,
        remarks,
        teacherComment,
        cbcLevel: computedCbcLevel,
        cbcStrand,
        cbcSubStrand,
        source,
        externalSource,
      },
      update: {
        marks: numMarks,
        grade, points,
        remarks,
        teacherComment,
        cbcLevel: computedCbcLevel,
        cbcStrand,
        cbcSubStrand,
        source,
        externalSource,
      },
    })

    return NextResponse.json({ success: true, grade: record })
  } catch (error) {
    console.error('[grades POST] error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Failed to save grade', details: msg.slice(0, 200) },
      { status: 500 }
    )
  }
}

/**
 * GET /api/grades?examId=...&subjectId=...&studentId=...
 * Returns grades filtered by the provided query params.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const examId = searchParams.get('examId')
    const subjectId = searchParams.get('subjectId')
    const studentId = searchParams.get('studentId')
    const source = searchParams.get('source')

    const where: any = {}
    if (examId) where.examId = examId
    if (subjectId) where.subjectId = subjectId
    if (studentId) where.studentId = studentId
    if (source) where.source = source

    const grades = await db.grade.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
        subject: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ grades })
  } catch (error) {
    console.error('[grades GET] error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch grades' },
      { status: 500 }
    )
  }
}
