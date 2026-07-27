import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/cafeteria/[id] — meal detail with attendance
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const menu = await db.mealMenu.findUnique({
    where: { id },
    include: { attendances: { orderBy: { createdAt: 'desc' } } },
  })
  if (!menu) return NextResponse.json({ error: 'Menu not found' }, { status: 404 })
  return NextResponse.json(menu)
}

// PUT /api/cafeteria/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  const data: Record<string, unknown> = {}
  if (body.item !== undefined) data.item = body.item
  if (body.mealType !== undefined) data.mealType = body.mealType
  if (body.accompaniment !== undefined) data.accompaniment = body.accompaniment
  if (body.beverage !== undefined) data.beverage = body.beverage
  if (body.notes !== undefined) data.notes = body.notes
  if (body.servingsPlanned !== undefined) data.servingsPlanned = Number(body.servingsPlanned)
  if (body.servingsServed !== undefined) data.servingsServed = Number(body.servingsServed)
  if (body.status !== undefined) data.status = body.status
  if (body.cook !== undefined) data.cook = body.cook
  const menu = await db.mealMenu.update({ where: { id }, data })
  return NextResponse.json(menu)
}

// DELETE /api/cafeteria/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.mealMenu.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
