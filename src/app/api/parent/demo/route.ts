import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Returns demo credentials for the parent portal. Picks the student
 * with the most invoices (so the fee summary card looks populated),
 * falling back to any active student with a linked guardian.
 *
 * Uses raw SQL for Vercel compatibility (Prisma client may not work).
 */
export async function GET() {
  try {
    // Use raw SQL to find a student with a guardian + school
    const students = await db.$queryRawUnsafe<Array<{
      id: string
      admissionNo: string
      firstName: string
      lastName: string
      guardianId: string
      schoolId: string
      school_name: string
      school_code: string
      g_firstName: string
      g_lastName: string
      g_phone: string
      invoice_count: bigint
    }>>(`
      SELECT s.id, s."admissionNo", s."firstName", s."lastName",
             s."guardianId", s."schoolId",
             sc.name as school_name, sc."schoolCode" as school_code,
             g."firstName" as g_firstName, g."lastName" as g_lastName, g.phone as g_phone,
             (SELECT COUNT(*) FROM "Invoice" i WHERE i."studentId" = s.id) as invoice_count
      FROM "Student" s
      LEFT JOIN "School" sc ON sc.id = s."schoolId"
      LEFT JOIN "Guardian" g ON g.id = s."guardianId"
      WHERE s."guardianId" IS NOT NULL
        AND s.status = 'Active'
      ORDER BY invoice_count DESC
      LIMIT 50
    `).catch(() => [])

    if (students.length === 0) {
      // Fallback: any student
      const anyStudents = await db.$queryRawUnsafe<Array<any>>(`
        SELECT s.id, s."admissionNo", s."firstName", s."lastName",
               s."guardianId", s."schoolId",
               sc.name as school_name, sc."schoolCode" as school_code,
               g."firstName" as g_firstName, g."lastName" as g_lastName, g.phone as g_phone
        FROM "Student" s
        LEFT JOIN "School" sc ON sc.id = s."schoolId"
        LEFT JOIN "Guardian" g ON g.id = s."guardianId"
        LIMIT 1
      `).catch(() => [])

      if (anyStudents.length === 0) {
        return NextResponse.json(
          { error: 'No demo student available. Seed the database first.' },
          { status: 404 }
        )
      }
      students.push(...(anyStudents as any))
    }

    const s = students[0]
    return NextResponse.json({
      schoolCode: s.school_code,
      admissionNo: s.admissionNo,
      phone: s.g_phone || '',
      studentName: `${s.firstName} ${s.lastName}`,
      schoolName: s.school_name,
    })
  } catch (error) {
    console.error('[parent-demo] error:', error)
    return NextResponse.json(
      { error: 'Failed to load demo credentials.' },
      { status: 500 }
    )
  }
}
