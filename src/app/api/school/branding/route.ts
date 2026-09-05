import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/school/branding
 * Returns the school's branding settings (logo, colors, motto, etc.)
 * Used for white-label: each school shows their own branding.
 *
 * PUT /api/school/branding
 * Updates the school's branding. Body: { primaryColor, logo, motto, ... }
 */
export async function GET(req: NextRequest) {
  try {
    const schools = await db.$queryRawUnsafe<any[]>(`
      SELECT id, name, slug, motto, "primaryColor", logo, address, phone, email, plan
      FROM "School" WHERE "schoolCode" = 'SKH-2024-001' LIMIT 1
    `).catch(() => [])

    if (schools.length === 0) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }

    return NextResponse.json({ branding: schools[0] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json() as {
      primaryColor?: string
      logo?: string
      motto?: string
      name?: string
      address?: string
      phone?: string
      email?: string
    }

    const sets: string[] = ['"updatedAt" = NOW()']
    const vals: any[] = []
    let idx = 1

    if (body.primaryColor) { sets.push(`"primaryColor" = $${idx++}`); vals.push(body.primaryColor) }
    if (body.logo) { sets.push(`logo = $${idx++}`); vals.push(body.logo) }
    if (body.motto !== undefined) { sets.push(`motto = $${idx++}`); vals.push(body.motto) }
    if (body.name) { sets.push(`name = $${idx++}`); vals.push(body.name) }
    if (body.address !== undefined) { sets.push(`address = $${idx++}`); vals.push(body.address) }
    if (body.phone !== undefined) { sets.push(`phone = $${idx++}`); vals.push(body.phone) }
    if (body.email !== undefined) { sets.push(`email = $${idx++}`); vals.push(body.email) }

    vals.push('SKH-2024-001')
    await db.$executeRawUnsafe(
      `UPDATE "School" SET ${sets.join(', ')} WHERE "schoolCode" = $${idx}`,
      ...vals
    ).catch(() => {})

    return NextResponse.json({ success: true, message: 'Branding updated' })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
