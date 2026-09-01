import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSchoolId } from '@/lib/school-resolver'

/**
 * GET /api/biometric/enroll?personId=xxx&personType=student
 * Returns all enrolled templates for a person.
 */
export async function GET(req: NextRequest) {
  try {
    const schoolId = await getSchoolId(req)
    if (!schoolId) {
      return NextResponse.json({ templates: [], demo: true })
    }
    const personId = req.nextUrl.searchParams.get('personId')
    if (!personId) {
      return NextResponse.json({ error: 'personId is required' }, { status: 400 })
    }
    const templates = await db.biometricTemplate.findMany({
      where: { schoolId, personId },
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
