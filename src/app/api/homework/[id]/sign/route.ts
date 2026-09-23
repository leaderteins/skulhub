import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { phonesMatch } from '@/lib/phone-utils'

/**
 * POST /api/homework/[id]/sign
 * Parent digitally signs a homework entry, replacing the physical diary
 * acknowledgment.
 *
 * Body:   { studentId, parentName }
 * Header: X-Parent-Phone — must match the student's guardian phone on file.
 *
 * Returns the updated homework record (with the parent signature fields
 * populated so the UI can show the green "Signed by X on Y" badge).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: homeworkId } = await params

    // --- Auth: parent phone header -------------------------------------------------
    const phoneHeader = req.headers.get('x-parent-phone') || ''
    if (!phoneHeader) {
      return NextResponse.json(
        { error: 'Missing X-Parent-Phone header — not authenticated' },
        { status: 401 },
      )
    }

    // --- Parse body ---------------------------------------------------------------
    const body = await req.json().catch(() => null)
    if (!body || !body.studentId || !body.parentName) {
      return NextResponse.json(
        { error: 'studentId and parentName are required' },
        { status: 400 },
      )
    }
    const { studentId, parentName } = body as { studentId: string; parentName: string }

    // --- Find the homework --------------------------------------------------------
    const homework = await db.homework.findUnique({ where: { id: homeworkId } })
    if (!homework) {
      return NextResponse.json({ error: 'Homework not found' }, { status: 404 })
    }

    // --- Verify parent phone matches the student's guardian -----------------------
    const student = await db.student.findUnique({
      where: { id: studentId },
      include: { guardian: { select: { phone: true, firstName: true, lastName: true } } },
    })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    const guardianPhone = student.guardian?.phone || ''
    if (!guardianPhone || !phonesMatch(phoneHeader, guardianPhone)) {
      return NextResponse.json(
        {
          error: 'Phone verification failed — the X-Parent-Phone header does not match the guardian phone on file',
        },
        { status: 403 },
      )
    }

    // --- Sign it ------------------------------------------------------------------
    const now = new Date()
    const updated = await db.homework.update({
      where: { id: homeworkId },
      data: {
        parentSigned: true,
        parentSignedAt: now,
        parentSignedBy: parentName,
        parentSignedPhone: phoneHeader,
      },
    })

    return NextResponse.json({
      success: true,
      homework: {
        id: updated.id,
        parentSigned: updated.parentSigned,
        parentSignedAt: updated.parentSignedAt
          ? updated.parentSignedAt.toISOString()
          : null,
        parentSignedBy: updated.parentSignedBy,
        parentSignedPhone: updated.parentSignedPhone,
      },
    })
  } catch (e: any) {
    console.error('[homework/[id]/sign] error:', e)
    return NextResponse.json(
      { error: e?.message || 'Failed to sign homework' },
      { status: 500 },
    )
  }
}
