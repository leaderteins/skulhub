import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSchoolId } from '@/lib/school-resolver'

/**
 * GET /api/transport/board?tripId=xxx
 */
export async function GET(req: NextRequest) {
  try {
    const schoolId = await getSchoolId(req)
    if (!schoolId) {
      return NextResponse.json({ boardings: [], count: 0, demo: true })
    }
    const tripId = req.nextUrl.searchParams.get('tripId')
    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 })
    }
    const boardings = await db.busBoarding.findMany({
      where: { schoolId, tripId },
      orderBy: { timestamp: 'desc' },
    })
    return NextResponse.json({ boardings, count: boardings.length })
  } catch (e: any) {
    if (String(e?.message || '').includes('does not exist')) {
      return NextResponse.json({ boardings: [], count: 0, demo: true })
    }
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

/**
 * POST /api/transport/board
 */
export async function POST(req: NextRequest) {
  try {
    const schoolId = await getSchoolId(req)
    if (!schoolId) {
      return NextResponse.json({ error: 'No school configured' }, { status: 404 })
    }
    const body = await req.json() as {
      tripId: string
      studentId: string
      action: string
      stopName?: string
      gps?: string
    }
    if (!body.tripId || !body.studentId || !body.action) {
      return NextResponse.json(
        { error: 'tripId, studentId, and action are required' },
        { status: 400 }
      )
    }
    const boardingId = `board_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    // Use raw SQL — Prisma client on Vercel doesn't know about BusBoarding table
    await db.$executeRawUnsafe(`
      INSERT INTO "BusBoarding" (id, "schoolId", "tripId", "studentId", action, "stopName", gps, timestamp, "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, boardingId, schoolId, body.tripId, body.studentId, body.action, body.stopName || null, body.gps || null).catch((e) => {
      throw new Error('Failed to log boarding: ' + e.message)
    })

    // Update trip's boarding count if this is a 'board' action
    if (body.action === 'board') {
      await db.$executeRawUnsafe(`UPDATE "BusTrip" SET "boardingCount" = "boardingCount" + 1 WHERE id = $1`, body.tripId).catch(() => {})
    }

    return NextResponse.json({
      boarding: {
        id: boardingId,
        schoolId,
        tripId: body.tripId,
        studentId: body.studentId,
        action: body.action,
        stopName: body.stopName || null,
        gps: body.gps || null,
        timestamp: new Date().toISOString(),
      }
    }, { status: 201 })
  } catch (e: any) {
    if (String(e?.message || '').includes('does not exist')) {
      return NextResponse.json(
        { error: 'Bus tracking tables not yet migrated. Run `bun run db:push` on the production DB.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
