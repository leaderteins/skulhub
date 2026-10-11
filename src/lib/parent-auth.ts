// Parent portal lightweight auth helper.
//
// Since the parent portal doesn't have a JWT session (parents don't have
// UserAccount records), we use a lightweight phone-match auth:
//
//   1. The parent calls POST /api/parent/lookup with schoolCode + admissionNo
//      + phone. That endpoint verifies the phone matches the guardian's phone
//      on record and returns the studentId.
//   2. The frontend then keeps the guardian phone in component state and
//      sends it as the `X-Parent-Phone` header on every subsequent request
//      that targets a specific student (dashboard, homework, mpesa pay,
//      homework comments).
//   3. Each backend route resolves the student, fetches its guardian's phone
//      and compares with the header. If they don't match we return 403.
//
// This isn't JWT-grade security but it stops the trivial "guess the cuid"
// attack where anyone with a studentId could read full dashboard data.

import { db } from '@/lib/db'
import { phonesMatch } from '@/lib/phone-utils'
import type { NextRequest } from 'next/server'

export interface ParentAuthResult {
  ok: boolean
  status?: number
  error?: string
  student?: any
}

/**
 * Read the parent phone from a request — either from the `X-Parent-Phone`
 * header or a `phone` query param. Returns '' if neither is present.
 */
export function getParentPhone(req: NextRequest | Request): string {
  const fromHeader = req.headers.get('x-parent-phone')
  if (fromHeader) return fromHeader.trim()
  try {
    const url = new URL(req.url)
    const fromQuery = url.searchParams.get('phone')
    if (fromQuery) return fromQuery.trim()
  } catch {
    // ignore — request.url may not always be a full URL
  }
  return ''
}

/**
 * Verify that the supplied parent phone matches the guardian of the given
 * student.  Returns a ParentAuthResult; on failure `ok` is false and
 * `status` + `error` are populated for direct use in a NextResponse.
 *
 * On success `student` is the resolved Student row including its guardian.
 */
export async function verifyParentForStudent(
  studentId: string,
  parentPhone: string
): Promise<ParentAuthResult> {
  if (!parentPhone) {
    return {
      ok: false,
      status: 401,
      error: 'Parent phone header is required for this request.',
    }
  }

  let student: any = null
  try {
    student = await db.student.findUnique({
      where: { id: studentId },
      include: { guardian: true, school: true },
    })
  } catch (e) {
    console.error('[parent-auth] student lookup failed:', e)
    // Fallback: raw SQL (Vercel/SQLite safe)
    try {
      const rows = await db.$queryRawUnsafe<any[]>(
        `SELECT s.*, g.phone as g_phone, g."firstName" as g_first, g."lastName" as g_last
         FROM "Student" s
         LEFT JOIN "Guardian" g ON g.id = s."guardianId"
         WHERE s.id = $1 LIMIT 1`,
        studentId
      )
      if (rows.length > 0) {
        const r = rows[0]
        student = {
          ...r,
          guardian: r.g_phone
            ? { firstName: r.g_first, lastName: r.g_last, phone: r.g_phone }
            : null,
        }
      }
    } catch (e2) {
      console.error('[parent-auth] raw-SQL student lookup failed:', e2)
    }
  }

  if (!student) {
    return { ok: false, status: 404, error: 'Student not found.' }
  }

  const guardian = student.guardian
  if (!guardian || !guardian.phone) {
    return {
      ok: false,
      status: 403,
      error: 'No guardian is linked to this student record.',
    }
  }

  if (!phonesMatch(parentPhone, guardian.phone)) {
    return {
      ok: false,
      status: 403,
      error: 'The phone number does not match the guardian on record.',
    }
  }

  return { ok: true, student }
}
