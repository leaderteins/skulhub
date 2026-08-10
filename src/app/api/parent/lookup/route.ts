import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { phonesMatch } from '@/lib/phone-utils'

/**
 * Parent portal login lookup.
 * POST body: { schoolCode, admissionNo, phone }
 *
 * Verifies that:
 *  1. The school exists (by schoolCode).
 *  2. A student with that admissionNo exists in that school.
 *  3. The provided phone matches the phone of the guardian linked to
 *     the student.
 *
 * On success returns the minimal student info needed for the parent
 * portal to load the full dashboard via /api/parent/[studentId].
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { schoolCode, admissionNo, phone } = body as {
      schoolCode?: string
      admissionNo?: string
      phone?: string
    }

    if (!schoolCode?.trim() || !admissionNo?.trim() || !phone?.trim()) {
      return NextResponse.json(
        { error: 'School code, admission number, and phone are required.' },
        { status: 400 }
      )
    }

    const code = schoolCode.trim()
    const school =
      (await db.school.findUnique({
        where: { schoolCode: code },
        select: { id: true, name: true, schoolCode: true },
      })) ??
      (await db.school.findUnique({
        where: { schoolCode: code.toUpperCase() },
        select: { id: true, name: true, schoolCode: true },
      }))

    if (!school) {
      return NextResponse.json(
        { error: 'School not found. Check the school code.' },
        { status: 404 }
      )
    }

    const student = await db.student.findFirst({
      where: {
        admissionNo: admissionNo.trim(),
        schoolId: school.id,
      },
      include: {
        guardian: true,
        enrollments: {
          include: {
            stream: { include: { classLevel: true } },
            classLevel: true,
          },
          orderBy: { enrolledAt: 'desc' },
          take: 1,
        },
      },
    })

    if (!student) {
      return NextResponse.json(
        { error: 'No student with that admission number at this school.' },
        { status: 404 }
      )
    }

    if (!student.guardian) {
      return NextResponse.json(
        { error: 'No guardian is linked to this student record.' },
        { status: 404 }
      )
    }

    if (!phonesMatch(phone, student.guardian.phone)) {
      return NextResponse.json(
        {
          error:
            'The phone number does not match the guardian on record for this student.',
        },
        { status: 403 }
      )
    }

    const latest = student.enrollments[0]
    return NextResponse.json({
      student: {
        id: student.id,
        name: `${student.firstName} ${student.lastName}`,
        admissionNo: student.admissionNo,
        classLevel:
          latest?.classLevel?.name ??
          latest?.stream?.classLevel?.name ??
          '—',
        stream: latest?.stream?.name ?? '—',
        photo: student.photoUrl,
      },
      schoolName: school.name,
    })
  } catch (error) {
    console.error('[parent-lookup] error:', error)
    return NextResponse.json(
      { error: 'Lookup failed. Please try again.' },
      { status: 500 }
    )
  }
}
