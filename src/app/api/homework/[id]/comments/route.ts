import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

/**
 * GET /api/homework/[id]/comments
 * Returns all comments for a homework assignment (teacher-parent diary)
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const comments = await db.homeworkComment.findMany({
      where: { homeworkId: id },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json({ comments })
  } catch (error) {
    console.error('[homework comments GET] error:', error)
    return NextResponse.json({ comments: [] })
  }
}

/**
 * POST /api/homework/[id]/comments
 * Add a comment to a homework assignment (teacher or parent)
 * Body: { authorName, authorRole, message }
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { authorName, authorRole, message } = body

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const comment = await db.homeworkComment.create({
      data: {
        homeworkId: id,
        authorName: authorName || 'Anonymous',
        authorRole: authorRole || 'parent',
        message: message.trim().slice(0, 1000),
      },
    })

    return NextResponse.json({ success: true, comment }, { status: 201 })
  } catch (error) {
    console.error('[homework comments POST] error:', error)
    return NextResponse.json({ error: 'Failed to add comment' }, { status: 500 })
  }
}
