import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/exam-papers/[id]
 * Returns the full paper record INCLUDING `fileData` (base64 data URL) so the
 * client can construct an <a href={fileData} download={fileName}> link to
 * trigger a download.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const paper = await db.examPaper.findUnique({ where: { id } })
    if (!paper) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 })
    }
    return NextResponse.json({
      paper: {
        ...paper,
        createdAt: paper.createdAt?.toISOString?.() ?? paper.createdAt,
      },
    })
  } catch (e: any) {
    console.error('[exam-papers/[id] GET] error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

/**
 * DELETE /api/exam-papers/[id]
 * Permanently deletes a paper (and its base64 payload) from the database.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const existing = await db.examPaper.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Paper not found' }, { status: 404 })
    }
    await db.examPaper.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('[exam-papers/[id] DELETE] error:', e)
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
