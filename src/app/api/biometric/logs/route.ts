import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSchoolId, getSchoolIdAndUser } from '@/lib/school-resolver'
import crypto from 'crypto'

/**
 * GET /api/biometric/logs?limit=50&personId=xxx&from=ISO&to=ISO
 * Returns the biometric tap log.
 */
export async function GET(req: NextRequest) {
  try {
    const schoolId = await getSchoolId(req)
    if (!schoolId) {
      return NextResponse.json({ logs: [], count: 0, demo: true })
    }
    const sp = req.nextUrl.searchParams
    const limit = Math.min(parseInt(sp.get('limit') || '50'), 500)
    const personId = sp.get('personId')
    const from = sp.get('from')
    const to = sp.get('to')

    const where: any = { schoolId }
    if (personId) where.personId = personId
    if (from || to) {
      where.timestamp = {}
      if (from) where.timestamp.gte = new Date(from)
      if (to) where.timestamp.lte = new Date(to)
    }

    const logs = await db.biometricLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: limit,
    })

    return NextResponse.json({ logs, count: logs.length })
  } catch (e: any) {
    if (String(e?.message || '').includes('does not exist')) {
      return NextResponse.json({ logs: [], count: 0, demo: true })
    }
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

/**
 * POST /api/biometric/enroll
 * Enrolls a biometric template for a student or staff member.
 * Body: { personId, personType, fingerIndex? }
 */
export async function POST(req: NextRequest) {
  try {
    const { schoolId, user } = await getSchoolIdAndUser(req)
    if (!schoolId || !user) {
      return NextResponse.json({ error: 'No school configured' }, { status: 404 })
    }
    const body = await req.json() as {
      personId: string
      personType: string
      fingerIndex?: number
    }
    if (!body.personId || !body.personType) {
      return NextResponse.json(
        { error: 'personId and personType are required' },
        { status: 400 }
      )
    }

    const templateHash = crypto
      .createHash('sha256')
      .update(`${body.personId}-${body.personType}-${body.fingerIndex || 0}-${Date.now()}-${crypto.randomBytes(16).toString('hex')}`)
      .digest('hex')

    const template = await db.biometricTemplate.create({
      data: {
        schoolId,
        personId: body.personId,
        personType: body.personType,
        templateHash,
        fingerIndex: body.fingerIndex || 0,
        enrolledBy: user.id,
      },
    })

    return NextResponse.json({ template }, { status: 201 })
  } catch (e: any) {
    if (String(e?.message || '').includes('does not exist')) {
      return NextResponse.json(
        { error: 'Biometric tables not yet migrated. Run `bun run db:push` on the production DB.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
