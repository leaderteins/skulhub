import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/ai/report-comments
 *
 * AI Report Card Comments — generates personalized teacher remarks
 * and principal comments for each student based on their performance.
 *
 * Body: {
 *   studentId: string,   // student to generate comments for
 *   examId?: string,     // specific exam (optional — uses latest if not provided)
 * }
 *
 * Returns: { teacherComment, principalComment, summary }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      studentId: string
      examId?: string
    }

    if (!body.studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
    }

    // Fetch student + grades using raw SQL
    const students = await db.$queryRawUnsafe<any[]>(
      `SELECT s.*, sc.name as school_name
       FROM "Student" s
       LEFT JOIN "School" sc ON sc.id = s."schoolId"
       WHERE s.id = $1 LIMIT 1`, body.studentId
    ).catch(() => [])

    if (students.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    const student = students[0]

    // Fetch grades
    const grades = await db.$queryRawUnsafe<any[]>(
      `SELECT g.marks, g.grade, g.points, subj.name as subject_name
       FROM "Grade" g
       LEFT JOIN "Subject" subj ON subj.id = g."subjectId"
       WHERE g."studentId" = $1 ORDER BY subj.name ASC`, body.studentId
    ).catch(() => [])

    // Fetch attendance
    const attendance = await db.$queryRawUnsafe<any[]>(
      `SELECT status, COUNT(*)::int as count FROM "Attendance"
       WHERE "studentId" = $1 GROUP BY status`, body.studentId
    ).catch(() => [])

    // Compute summary
    const totalMarks = grades.reduce((s, g) => s + (g.marks || 0), 0)
    const meanScore = grades.length > 0 ? totalMarks / grades.length : 0
    let present = 0, absent = 0, late = 0
    for (const a of attendance) {
      if (a.status === 'Present') present = a.count
      else if (a.status === 'Absent') absent = a.count
      else if (a.status === 'Late') late = a.count
    }
    const totalAtt = present + absent + late
    const attRate = totalAtt > 0 ? Math.round((present / totalAtt) * 100) : 0

    const gradesText = grades.length > 0
      ? grades.map((g: any) => `${g.subject_name}: ${g.marks}% (Grade ${g.grade})`).join(', ')
      : 'No grades recorded.'

    const prompt = `You are a Kenyan school teacher writing report card comments for:

STUDENT: ${student.firstName} ${student.lastName}
CLASS: ${student.admissionNo}
GENDER: ${student.gender}

GRADES (this term):
${gradesText}

MEAN SCORE: ${meanScore.toFixed(1)}%
ATTENDANCE RATE: ${attRate}% (Present: ${present}, Absent: ${absent}, Late: ${late})

Generate TWO comments:

1. CLASS TEACHER'S COMMENT (2-3 sentences):
- Personalized to the student's name and performance
- Encouraging but honest
- Mention specific subjects if they excelled or need improvement
- Note attendance if it's below 80%
- Keep it professional and warm

2. PRINCIPAL'S COMMENT (1-2 sentences):
- Broader perspective on the student's progress
- Forward-looking with encouragement
- Appropriate for the performance level

Format:
TEACHER: [comment]
PRINCIPAL: [comment]`

    const { getZAI } = await import('@/lib/zai');
    const zai = await getZAI()

    // If AI isn't available, return template-based comments
    if (!zai) {
      const teacherComment = generateTemplateTeacherComment(student.firstName, meanScore, attRate, grades)
      const principalComment = generateTemplatePrincipalComment(meanScore)
      return NextResponse.json({
        teacherComment,
        principalComment,
        summary: { meanScore: Math.round(meanScore * 100) / 100, attendanceRate: attRate, totalSubjects: grades.length },
        fallback: true,
        generatedAt: new Date().toISOString(),
      })
    }

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an experienced Kenyan school teacher and principal who writes thoughtful, personalized report card comments.' },
        { role: 'user', content: prompt },
      ],
      thinking: { type: 'disabled' },
    })

    const response = completion.choices[0]?.message?.content || ''

    // Parse the response
    let teacherComment = response
    let principalComment = ''
    const teacherMatch = response.match(/TEACHER:\s*(.*?)(?=PRINCIPAL:|$)/s)
    const principalMatch = response.match(/PRINCIPAL:\s*(.*?)$/s)
    if (teacherMatch) teacherComment = teacherMatch[1].trim()
    if (principalMatch) principalComment = principalMatch[1].trim()

    return NextResponse.json({
      teacherComment,
      principalComment,
      summary: {
        meanScore: Math.round(meanScore * 100) / 100,
        attendanceRate: attRate,
        totalSubjects: grades.length,
      },
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[ai-report-comments] error:', error)
    return NextResponse.json(
      { error: 'Failed to generate comments.', details: error?.message?.slice(0, 200) },
      { status: 500 }
    )
  }
}

// Template-based comment generators (used when AI isn't available)
function generateTemplateTeacherComment(
  firstName: string,
  meanScore: number,
  attendanceRate: number,
  grades: any[]
): string {
  let comment = `${firstName} has `
  if (meanScore >= 80) {
    comment += `demonstrated excellent academic performance this term with a mean score of ${meanScore.toFixed(1)}%. `
    const topSubject = grades.sort((a, b) => (b.marks || 0) - (a.marks || 0))[0]
    if (topSubject) comment += `Particularly strong in ${topSubject.subject_name}. Keep up the outstanding work!`
  } else if (meanScore >= 65) {
    comment += `shown very good progress with a mean score of ${meanScore.toFixed(1)}%. `
    comment += `With a little more effort, ${firstName} can achieve excellence.`
  } else if (meanScore >= 50) {
    comment += `performed satisfactorily with a mean score of ${meanScore.toFixed(1)}%. `
    comment += `There is room for improvement — focus on weak areas.`
  } else {
    comment += `struggled this term with a mean score of ${meanScore.toFixed(1)}%. `
    comment += `Remedial classes and more dedicated study time are recommended.`
  }
  if (attendanceRate < 80) {
    comment += ` Note: Attendance rate of ${attendanceRate}% is below the required 80%.`
  }
  return comment
}

function generateTemplatePrincipalComment(meanScore: number): string {
  if (meanScore >= 80) return 'A model student. We are proud of your achievements. Continue striving for excellence.'
  if (meanScore >= 65) return 'Good work this term. Aim higher next term.'
  if (meanScore >= 50) return 'Satisfactory progress. Work harder to reach your full potential.'
  return 'Needs urgent academic intervention. Parents to see the principal.'
}
