import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/ai/chat
 *
 * AI Parent Assistant — answers parent questions about their child's
 * school record using the z-ai-web-dev-sdk LLM.
 *
 * Body: {
 *   message: string,         // parent's question
 *   studentId?: string,     // for context-aware answers
 *   history?: Array<{role, content}>,  // conversation history
 * }
 *
 * The AI is given the student's real data (attendance, fees, grades)
 * as context so it can answer questions like:
 *   "What's Hannah's attendance rate?"
 *   "How much fee balance is remaining?"
 *   "What were her latest exam results?"
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      message: string
      studentId?: string
      history?: Array<{ role: string; content: string }>
    }

    if (!body.message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Fetch student context if studentId is provided
    let contextPrompt = ''
    if (body.studentId) {
      try {
        const students = await db.$queryRawUnsafe<any[]>(
          `SELECT s.*, sc.name as school_name
           FROM "Student" s
           LEFT JOIN "School" sc ON sc.id = s."schoolId"
           WHERE s.id = $1 LIMIT 1`, body.studentId
        ).catch(() => [])

        if (students.length > 0) {
          const s = students[0]
          // Fetch fees summary
          const fees = await db.$queryRawUnsafe<any[]>(
            `SELECT COALESCE(SUM(amount), 0) as billed,
                    COALESCE(SUM("amountPaid"), 0) as paid,
                    COALESCE(SUM(balance), 0) as balance
             FROM "Invoice" WHERE "studentId" = $1`, body.studentId
          ).catch(() => [])

          // Fetch attendance summary
          const attendance = await db.$queryRawUnsafe<any[]>(
            `SELECT status, COUNT(*)::int as count FROM "Attendance"
             WHERE "studentId" = $1 GROUP BY status`, body.studentId
          ).catch(() => [])

          // Fetch recent grades
          const grades = await db.$queryRawUnsafe<any[]>(
            `SELECT g.marks, g.grade, g.points, subj.name as subject_name,
                    e.name as exam_name
             FROM "Grade" g
             LEFT JOIN "Subject" subj ON subj.id = g."subjectId"
             LEFT JOIN "Exam" e ON e.id = g."examId"
             WHERE g."studentId" = $1 ORDER BY g."createdAt" DESC LIMIT 10`, body.studentId
          ).catch(() => [])

          const feeData = fees[0] || { billed: 0, paid: 0, balance: 0 }
          let present = 0, absent = 0, late = 0
          for (const a of attendance) {
            if (a.status === 'Present') present = a.count
            else if (a.status === 'Absent') absent = a.count
            else if (a.status === 'Late') late = a.count
          }
          const totalAtt = present + absent + late
          const attRate = totalAtt > 0 ? Math.round((present / totalAtt) * 100) : 0

          contextPrompt = `You are an AI assistant for ${s.school_name || 'the school'}.
A parent is asking about their child. Here is the student's current data:

STUDENT:
- Name: ${s.firstName} ${s.lastName}
- Admission No: ${s.admissionNo}
- Gender: ${s.gender}
- Boarding: ${s.boarding ? 'Yes (Boarding)' : 'No (Day Scholar)'}
- Status: ${s.status}

FEES:
- Total Billed: KES ${Number(feeData.billed).toLocaleString()}
- Total Paid: KES ${Number(feeData.paid).toLocaleString()}
- Balance: KES ${Number(feeData.balance).toLocaleString()}

ATTENDANCE:
- Present: ${present} days
- Absent: ${absent} days
- Late: ${late} days
- Attendance Rate: ${attRate}%

RECENT GRADES:
${grades.length > 0
  ? grades.map((g: any) => `- ${g.subject_name || 'Subject'}: ${g.marks}% (Grade ${g.grade}) — ${g.exam_name || 'Exam'}`).join('\n')
  : 'No grades recorded yet.'}

Answer the parent's questions helpfully, concisely, and in a warm, professional tone.
Use the data above to give accurate answers. If asked about something not
in the data, say you don't have that information and suggest they contact
the school office. Keep responses under 3 sentences unless more detail
is specifically requested.`
        }
      } catch (e) {
        // If student data fetch fails, use generic prompt
        contextPrompt = 'You are an AI assistant for a Kenyan school. Answer parent questions helpfully and concisely.'
      }
    } else {
      contextPrompt = 'You are an AI assistant for a Kenyan school (SkulHub Academy). Answer parent questions helpfully and concisely. Keep responses under 3 sentences. If asked about specific student data, ask them to log into the parent portal first.'
    }

    // Build conversation messages
    const messages: any[] = [
      { role: 'assistant', content: contextPrompt },
      ...(body.history || []),
      { role: 'user', content: body.message },
    ]

    // Call the LLM
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages,
      thinking: { type: 'disabled' },
    })

    const response = completion.choices[0]?.message?.content || 'I apologize, I could not process your request.'

    return NextResponse.json({
      response,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[ai-chat] error:', error)
    return NextResponse.json(
      { error: 'AI assistant unavailable. Please try again.', details: error?.message?.slice(0, 200) },
      { status: 500 }
    )
  }
}
