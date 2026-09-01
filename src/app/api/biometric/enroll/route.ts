import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveSchoolFromRequest } from '@/lib/mpesa'

/**
 * GET /api/biometric/enroll?personId=xxx&personType=student
 * Returns all enrolled templates for a person.
 */
export async function GET(req: NextRequest) {
  try {
    const { school } = await resolveSchoolFromRequest(req)
    if (!school) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const personId = req.nextUrl.searchParams.get('personId')
    if (!personId) {
      return NextResponse.json({ error: 'personId is required' }, { status: 400 })
    }
    const templates = await db.biometricTemplate.findMany({
      where: { schoolId: school.id, personId },
      orderBy: { enrolledAt: 'desc' },
    })
    return NextResponse.json({ templates })
  } catch (e: any) {
    if (String(e?.message || '').includes('does not exist')) {
      return NextResponse.json({ templates: [], demo: true })
    }
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
