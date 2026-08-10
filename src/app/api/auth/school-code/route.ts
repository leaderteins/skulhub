import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * School code lookup — the first step of the multi-tenant login flow.
 * POST body: { schoolCode: string }
 * Returns:   { found: true, school: { id, name, slug, level, logo, schoolCode } }
 *          | { found: false }
 *
 * The schoolCode column is case-sensitive in SQLite, so we try the raw
 * input first, then the uppercased variant (the seed data uses
 * uppercase codes like "SKH-2024-001").
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json(
        { found: false, error: 'Invalid request body' },
        { status: 400 }
      )
    }

    const { schoolCode } = body as { schoolCode?: string }
    if (!schoolCode?.trim()) {
      return NextResponse.json(
        { found: false, error: 'School code is required' },
        { status: 400 }
      )
    }

    const code = schoolCode.trim()
    const school =
      (await db.school.findUnique({
        where: { schoolCode: code },
        select: {
          id: true,
          name: true,
          slug: true,
          level: true,
          logo: true,
          schoolCode: true,
        },
      })) ??
      (await db.school.findUnique({
        where: { schoolCode: code.toUpperCase() },
        select: {
          id: true,
          name: true,
          slug: true,
          level: true,
          logo: true,
          schoolCode: true,
        },
      }))

    if (!school) {
      return NextResponse.json({ found: false })
    }

    return NextResponse.json({
      found: true,
      school: {
        id: school.id,
        name: school.name,
        slug: school.slug,
        level: school.level,
        logo: school.logo,
        schoolCode: school.schoolCode,
      },
    })
  } catch (error) {
    console.error('[school-code] error:', error)
    return NextResponse.json(
      { found: false, error: 'Lookup failed. Please try again.' },
      { status: 500 }
    )
  }
}
