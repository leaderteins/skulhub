import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/notifications/sms
 * Returns the SMS log (history of sent messages).
 */
export async function GET(req: NextRequest) {
  try {
    // Use raw SQL for Vercel compatibility
    const schools = await db.$queryRawUnsafe<Array<{id: string}>>(
      `SELECT id FROM "School" WHERE "schoolCode" = 'SKH-2024-001' LIMIT 1`
    ).catch(() => [])

    if (schools.length === 0) {
      return NextResponse.json({ logs: [], demo: true })
    }

    const logs = await db.$queryRawUnsafe<any[]>(
      `SELECT s.*, st."firstName", st."lastName", st."admissionNo"
       FROM "SmsLog" s
       LEFT JOIN "Student" st ON st.id = s."studentId"
       WHERE s."schoolId" = $1
       ORDER BY s."createdAt" DESC
       LIMIT 50`,
      schools[0].id
    ).catch(() => [])

    return NextResponse.json({ logs, count: logs.length })
  } catch (e: any) {
    // If table doesn't exist, return empty
    if (String(e?.message || '').includes('does not exist')) {
      return NextResponse.json({ logs: [], count: 0, demo: true })
    }
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

/**
 * POST /api/notifications/sms
 * Create the SmsLog table if it doesn't exist (migration helper).
 */
export async function POST(req: NextRequest) {
  try {
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SmsLog" (
        id TEXT PRIMARY KEY,
        "schoolId" TEXT,
        "studentId" TEXT,
        "eventType" TEXT,
        channel TEXT DEFAULT 'sms',
        "recipientPhone" TEXT,
        message TEXT,
        status TEXT DEFAULT 'demo',
        "providerMessageId" TEXT,
        "createdAt" TIMESTAMP(3) DEFAULT CURRENT_TIMESTAMP
      )
    `)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "SmsLog_schoolId_createdAt_idx" ON "SmsLog"("schoolId", "createdAt")`).catch(() => {})
    return NextResponse.json({ success: true, message: 'SmsLog table ready' })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
