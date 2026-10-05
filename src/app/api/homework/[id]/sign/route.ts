import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const { parentName, studentId } = body
    if (!parentName) return NextResponse.json({ error: 'Parent name required' }, { status: 400 })
    await db.$executeRawUnsafe('UPDATE "Homework" SET "parentSigned" = true, "parentSignedAt" = CURRENT_TIMESTAMP, "parentSignedBy" = $1, "parentSignedPhone" = $2 WHERE id = $3', parentName, user.name || '', id).catch(() => {})
    return NextResponse.json({ success: true, message: 'Homework signed by ' + parentName })
  } catch { return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 }) }
}

