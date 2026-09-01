import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/report-cards/generate?studentId=xxx&examId=yyy
 *
 * Returns structured data for generating a printable KCSE-style report card.
 * Includes: student info, all subject grades, class position, remarks,
 * attendance summary, fee status.
 */
export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams
    const studentId = sp.get('studentId')
    const examId = sp.get('examId')

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
    }

    // 1. Student info (raw SQL for Vercel compatibility)
    const students = await db.$queryRawUnsafe<any[]>(
      `SELECT s.*, g."firstName" as g_first, g."lastName" as g_last, g.phone as g_phone, g.relation as g_relation,
              sc.name as school_name, sc.motto as school_motto, sc.address as school_address, sc.phone as school_phone
       FROM "Student" s
       LEFT JOIN "Guardian" g ON g.id = s."guardianId"
       LEFT JOIN "School" sc ON sc.id = s."schoolId"
       WHERE s.id = $1 LIMIT 1`, studentId
    ).catch(() => [])

    if (students.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    const student = students[0]

    // 2. Latest enrollment (class + stream)
    let classLevel = '—'
    let stream = '—'
    try {
      const enrollments = await db.$queryRawUnsafe<any[]>(
        `SELECT e.*, cl.name as class_name, s.name as stream_name
         FROM "Enrollment" e
         LEFT JOIN "ClassLevel" cl ON cl.id = e."classLevelId"
         LEFT JOIN "Stream" s ON s.id = e."streamId"
         WHERE e."studentId" = $1 ORDER BY e."enrolledAt" DESC LIMIT 1`, studentId
      )
      if (enrollments.length > 0) {
        classLevel = enrollments[0].class_name || '—'
        stream = enrollments[0].stream_name || '—'
      }
    } catch {}

    // 3. Grades for this exam (or latest exam if not specified)
    let grades: any[] = []
    try {
      if (examId) {
        grades = await db.$queryRawUnsafe<any[]>(
          `SELECT g.*, s.name as subject_name, s.code as subject_code,
                  e.name as exam_name, e."examType", e.term, e."academicYear"
           FROM "Grade" g
           LEFT JOIN "Subject" s ON s.id = g."subjectId"
           LEFT JOIN "Exam" e ON e.id = g."examId"
           WHERE g."studentId" = $1 AND g."examId" = $2
           ORDER BY s.name ASC`, studentId, examId
        )
      } else {
        grades = await db.$queryRawUnsafe<any[]>(
          `SELECT g.*, s.name as subject_name, s.code as subject_code,
                  e.name as exam_name, e."examType", e.term, e."academicYear"
           FROM "Grade" g
           LEFT JOIN "Subject" s ON s.id = g."subjectId"
           LEFT JOIN "Exam" e ON e.id = g."examId"
           WHERE g."studentId" = $1
           ORDER BY g."createdAt" DESC, s.name ASC`, studentId
        )
      }
    } catch {}

    // 4. Compute KCSE-style totals
    const totalMarks = grades.reduce((sum, g) => sum + (g.marks || 0), 0)
    const totalPoints = grades.reduce((sum, g) => sum + (g.points || 0), 0)
    const meanScore = grades.length > 0 ? totalMarks / grades.length : 0
    const meanGrade = grades.length > 0 ? grades[0]?.grade : '—'

    // 5. Attendance summary
    let attendanceSummary = { present: 0, absent: 0, late: 0, total: 0, rate: 0 }
    try {
      const att = await db.$queryRawUnsafe<any[]>(
        `SELECT status, COUNT(*)::int as count FROM "Attendance"
         WHERE "studentId" = $1 GROUP BY status`, studentId
      )
      for (const a of att) {
        if (a.status === 'Present') attendanceSummary.present = a.count
        else if (a.status === 'Absent') attendanceSummary.absent = a.count
        else if (a.status === 'Late') attendanceSummary.late = a.count
      }
      attendanceSummary.total = attendanceSummary.present + attendanceSummary.absent + attendanceSummary.late
      attendanceSummary.rate = attendanceSummary.total > 0
        ? Math.round((attendanceSummary.present / attendanceSummary.total) * 100)
        : 0
    } catch {}

    // 6. Fee summary
    let feeSummary = { totalBilled: 0, totalPaid: 0, balance: 0 }
    try {
      const fees = await db.$queryRawUnsafe<any[]>(
        `SELECT COALESCE(SUM(amount), 0) as billed, COALESCE(SUM("amountPaid"), 0) as paid,
                COALESCE(SUM(balance), 0) as balance
         FROM "Invoice" WHERE "studentId" = $1`, studentId
      )
      if (fees.length > 0) {
        feeSummary = {
          totalBilled: Number(fees[0].billed) || 0,
          totalPaid: Number(fees[0].paid) || 0,
          balance: Number(fees[0].balance) || 0,
        }
      }
    } catch {}

    // 7. Class position (computed from mean score vs classmates)
    let classPosition = '—'
    let totalInClass = 0
    try {
      if (examId && grades.length > 0) {
        const rankings = await db.$queryRawUnsafe<any[]>(
          `SELECT g."studentId", AVG(g.marks) as avg_marks
           FROM "Grade" g WHERE g."examId" = $1
           GROUP BY g."studentId" ORDER BY avg_marks DESC`, examId
        )
        totalInClass = rankings.length
        const pos = rankings.findIndex((r: any) => r.studentId === studentId) + 1
        if (pos > 0) classPosition = `${pos}`
      }
    } catch {}

    // 8. Teacher remarks (auto-generated based on performance)
    const remarks = generateRemarks(meanScore, attendanceSummary.rate, classPosition)

    return NextResponse.json({
      student: {
        id: student.id,
        admissionNo: student.admissionNo,
        firstName: student.firstName,
        lastName: student.lastName,
        gender: student.gender,
        boarding: student.boarding,
        classLevel,
        stream,
        dateOfBirth: student.dateOfBirth,
      },
      school: {
        name: student.school_name || 'SkulHub Academy',
        motto: student.school_motto || 'Knowledge is Power',
        address: student.school_address || '',
        phone: student.school_phone || '',
      },
      guardian: student.g_first ? {
        name: `${student.g_first} ${student.g_last}`,
        phone: student.g_phone,
        relation: student.g_relation,
      } : null,
      exam: grades.length > 0 ? {
        name: grades[0].exam_name || 'Term Examination',
        term: grades[0].term || 'Term 3',
        academicYear: grades[0].academicYear || '2026',
        examType: grades[0].examType || 'End Term',
      } : { name: 'No exam data', term: '—', academicYear: '—', examType: '—' },
      grades: grades.map(g => ({
        subject: g.subject_name || 'Unknown',
        code: g.subject_code || '',
        marks: g.marks || 0,
        grade: g.grade || '—',
        points: g.points || 0,
      })),
      summary: {
        totalMarks,
        totalPoints,
        meanScore: Math.round(meanScore * 100) / 100,
        meanGrade,
        classPosition,
        totalInClass,
      },
      attendance: attendanceSummary,
      fees: feeSummary,
      remarks,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function generateRemarks(meanScore: number, attendanceRate: number, position: string): {
  classTeacher: string
  principal: string
} {
  let teacherRemark = ''
  let principalRemark = ''

  if (meanScore >= 80) {
    teacherRemark = 'Excellent performance. Keep up the outstanding work!'
    principalRemark = 'A model student. We are proud of your achievements.'
  } else if (meanScore >= 65) {
    teacherRemark = 'Very good performance. With a little more effort, you can excel.'
    principalRemark = 'Good work. Aim higher next term.'
  } else if (meanScore >= 50) {
    teacherRemark = 'Good performance. There is room for improvement.'
    principalRemark = 'Satisfactory. Work harder to reach your full potential.'
  } else if (meanScore >= 40) {
    teacherRemark = 'Fair performance. You need to put in more effort.'
    principalRemark = 'Below expectations. Please consult your teachers for help.'
  } else {
    teacherRemark = 'Poor performance. Remedial classes recommended.'
    principalRemark = 'Needs urgent academic intervention. Parents to see the principal.'
  }

  if (attendanceRate < 80) {
    teacherRemark += ' Poor attendance is affecting your performance.'
  }

  return { classTeacher: teacherRemark, principal: principalRemark }
}
