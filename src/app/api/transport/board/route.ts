import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveSchoolFromRequest } from '@/lib/mpesa'

/**
 * GET /api/transport/board?tripId=xxx
 * Returns the boarding manifest for a trip.
 */
export async function GET(req: NextRequest) {
  try {
    const { school } = await resolveSchoolFromRequest(req)
    if (!school) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const tripId = req.nextUrl.searchParams.get('tripId')
    if (!tripId) {
      return NextResponse.json({ error: 'tripId is required' }, { status: 400 })
    }
    const boardings = await db.busBoarding.findMany({
      where: { schoolId: school.id, tripId },
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
 * Log a student boarding or alighting a bus.
 * Body: { tripId, studentId, action, stopName?, gps? }
 */
export async function POST(req: NextRequest) {
  try {
    const { school } = await resolveSchoolFromRequest(req)
    if (!school) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const body = await req.json() as {
      tripId: string
      studentId: string
      action: string // "board" | "alight"
      stopName?: string
      gps?: string
    }
    if (!body.tripId || !body.studentId || !body.action) {
      return NextResponse.json(
        { error: 'tripId, studentId, and action are required' },
        { status: 400 }
      )
    }
    const boarding = await db.busBoarding.create({
      data: {
        schoolId: school.id,
        tripId: body.tripId,
        studentId: body.studentId,
        action: body.action,
        stopName: body.stopName,
        gps: body.gps,
      },
    })

    // Update trip's boarding count
    if (body.action === 'board') {
      await db.busTrip.update({
        where: { id: body.tripId },
        data: { boardingCount: { increment: 1 } },
      })
    }

    return NextResponse.json({ boarding }, { status: 201 })
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
