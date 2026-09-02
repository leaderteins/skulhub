import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/ai/exam-questions
 *
 * AI Exam Question Generator — generates KCSE-style exam questions
 * for any subject and topic using the z-ai-web-dev-sdk LLM.
 *
 * Body: {
 *   subject: string,       // e.g. "Mathematics", "Biology", "English"
 *   topic: string,         // e.g. "Quadratic Equations", "Cell Division"
 *   level: string,         // "KCSE" | "KCPE" | "CBE" | "Form 1" etc.
 *   questionType: string,  // "multiple_choice" | "short_answer" | "essay" | "mixed"
 *   count: number,         // number of questions (1-20)
 * }
 *
 * Returns: { questions: [...], markingScheme: [...] }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      subject: string
      topic: string
      level: string
      questionType: string
      count: number
    }

    if (!body.subject || !body.topic) {
      return NextResponse.json({ error: 'Subject and topic are required' }, { status: 400 })
    }

    const count = Math.min(Math.max(body.count || 5, 1), 20)
    const level = body.level || 'KCSE'
    const type = body.questionType || 'mixed'

    const typeInstructions: Record<string, string> = {
      multiple_choice: 'Generate multiple-choice questions with 4 options (A, B, C, D) and indicate the correct answer.',
      short_answer: 'Generate short-answer questions that require 1-3 sentences.',
      essay: 'Generate essay questions that require detailed responses.',
      mixed: 'Generate a mix of multiple-choice, short-answer, and essay questions.',
    }

    const prompt = `You are an expert Kenyan education examiner. Generate ${count} ${level} ${body.subject} questions on the topic: "${body.topic}".

${typeInstructions[type] || typeInstructions.mixed}

Format each question as:

Q1. [Question text]
A) [Option A]
B) [Option B]
C) [Option C]
D) [Option D]
Answer: [Correct letter]
Explanation: [Brief explanation]

For short-answer/essay questions:
Q1. [Question text]
Answer: [Model answer]
Marks: [Number of marks]

After all questions, provide a MARKING SCHEME summary at the end.

Make the questions appropriate for the ${level} level in Kenya. Use clear, unambiguous language. Ensure the difficulty matches ${level} standards.`

    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'assistant', content: 'You are an expert Kenyan education examiner who creates high-quality exam questions.' },
        { role: 'user', content: prompt },
      ],
      thinking: { type: 'disabled' },
    })

    const questions = completion.choices[0]?.message?.content || 'Failed to generate questions.'

    return NextResponse.json({
      subject: body.subject,
      topic: body.topic,
      level,
      questionType: type,
      count,
      questions,
      generatedAt: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[ai-exam-questions] error:', error)
    return NextResponse.json(
      { error: 'Failed to generate questions. Please try again.', details: error?.message?.slice(0, 200) },
      { status: 500 }
    )
  }
}
