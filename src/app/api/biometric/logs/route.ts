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
    // Use raw SQL for school lookup (Prisma client may not work on Vercel)
    const schools = await db.$queryRawUnsafe<Array<{id: string}>>(
      `SELECT id FROM "School" WHERE "schoolCode" = 'SKH-2024-001' LIMIT 1`
    ).catch(() => [])
    if (schools.length === 0) {
      const anySchools = await db.$queryRawUnsafe<Array<{id: string}>>(
        `SELECT id FROM "School" LIMIT 1`
      ).catch(() => [])
      if (anySchools.length === 0) {
        return NextResponse.json({ logs: [], count: 0, demo: true })
      }
      var schoolId = anySchools[0].id
    } else {
      var schoolId = schools[0].id
    }

    // Use raw SQL to query biometric logs
    const sp = req.nextUrl.searchParams
    const limit = Math.min(parseInt(sp.get('limit') || '50'), 500)
    const personId = sp.get('personId')

    let query: string
    let params: any[]

    if (personId) {
      query = `SELECT * FROM "BiometricLog" WHERE "schoolId" = $1 AND "personId" = $2 ORDER BY timestamp DESC LIMIT $3`
      params = [schoolId, personId, limit]
    } else {
      query = `SELECT * FROM "BiometricLog" WHERE "schoolId" = $1 ORDER BY timestamp DESC LIMIT $2`
      params = [schoolId, limit]
    }

    const logs = await db.$queryRawUnsafe<any[]>(query, ...params).catch(() => [])

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
