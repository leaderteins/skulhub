import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT — update visitor (check-out)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  if (body.checkOut) {
    const visitor = await db.visitor.update({
      where: { id },
      data: { checkOutTime: new Date(), status: 'Checked Out' },
    })
    return NextResponse.json(visitor)
  }

  const data: any = {}
  if (body.status !== undefined) data.status = body.status
  if (body.notes !== undefined) data.notes = body.notes

  const visitor = await db.visitor.update({ where: { id }, data })
  return NextResponse.json(visitor)
}

// DELETE
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.visitor.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
