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
      teacherComment = null, cbeStrand = null, cbeSubStrand = null,
      kjseaWeight = null, sbaWeight = null, kpseaWeight = null,
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

    const percentage = (numMarks / Number(totalMarks)) * 100

    // ── KCSE-style grade (8-4-4 backwards compatibility) ──
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

    // ── CBE Official 8-Level Achievement Level (AL) Scale ──
    // Kenya's official CBE grading (2025+):
    // AL 8 (Exceptional): 90-100% → EE1 (Exceeding Expectations 1)
    // AL 7 (Very Good):   75-89%  → EE2 (Exceeding Expectations 2)
    // AL 6 (Good):        58-74%  → ME1 (Meeting Expectations 1)
    // AL 5 (Fair):        41-57%  → ME2 (Meeting Expectations 2)
    // AL 4 (Needs Improvement): 31-40% → AE1 (Approaching Expectations 1)
    // AL 3 (Below Average):     21-30% → AE2 (Approaching Expectations 2)
    // AL 2 (Well Below Average): 11-20% → BE1 (Below Expectations 1)
    // AL 1 (Minimal):            1-10%  → BE2 (Below Expectations 2)
    let cbeAchievementLevel: number
    let cbeDescriptor: string
    let cbeDescriptorName: string

    if (percentage >= 90) {
      cbeAchievementLevel = 8; cbeDescriptor = 'EE1'; cbeDescriptorName = 'Exceeding Expectations'
    } else if (percentage >= 75) {
      cbeAchievementLevel = 7; cbeDescriptor = 'EE2'; cbeDescriptorName = 'Exceeding Expectations'
    } else if (percentage >= 58) {
      cbeAchievementLevel = 6; cbeDescriptor = 'ME1'; cbeDescriptorName = 'Meeting Expectations'
    } else if (percentage >= 41) {
      cbeAchievementLevel = 5; cbeDescriptor = 'ME2'; cbeDescriptorName = 'Meeting Expectations'
    } else if (percentage >= 31) {
      cbeAchievementLevel = 4; cbeDescriptor = 'AE1'; cbeDescriptorName = 'Approaching Expectations'
    } else if (percentage >= 21) {
      cbeAchievementLevel = 3; cbeDescriptor = 'AE2'; cbeDescriptorName = 'Approaching Expectations'
    } else if (percentage >= 11) {
      cbeAchievementLevel = 2; cbeDescriptor = 'BE1'; cbeDescriptorName = 'Below Expectations'
    } else {
      cbeAchievementLevel = 1; cbeDescriptor = 'BE2'; cbeDescriptorName = 'Below Expectations'
    }

    // ── KJSEA Placement Score (Grade 9 → Grade 10 transition) ──
    // Final = KJSEA (60%) + SBA (20%) + KPSEA (20%)
    let placementScore: number | null = null
    if (kjseaWeight != null && sbaWeight != null && kpseaWeight != null) {
      placementScore = (Number(kjseaWeight) * 0.60) + (Number(sbaWeight) * 0.20) + (Number(kpseaWeight) * 0.20)
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
        cbeAchievementLevel,
        cbeDescriptor,
        cbeDescriptorName,
        cbeStrand,
        cbeSubStrand,
        kjseaWeight: kjseaWeight != null ? Number(kjseaWeight) : null,
        sbaWeight: sbaWeight != null ? Number(sbaWeight) : null,
        kpseaWeight: kpseaWeight != null ? Number(kpseaWeight) : null,
        placementScore,
        source,
        externalSource,
      },
      update: {
        marks: numMarks,
        grade, points,
        remarks,
        teacherComment,
        cbeAchievementLevel,
        cbeDescriptor,
        cbeDescriptorName,
        cbeStrand,
        cbeSubStrand,
        kjseaWeight: kjseaWeight != null ? Number(kjseaWeight) : null,
        sbaWeight: sbaWeight != null ? Number(sbaWeight) : null,
        kpseaWeight: kpseaWeight != null ? Number(kpseaWeight) : null,
        placementScore,
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
