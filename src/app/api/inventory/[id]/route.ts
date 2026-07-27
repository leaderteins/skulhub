import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/inventory/[id] — asset detail with maintenance history
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const asset = await db.asset.findUnique({
    where: { id },
    include: { maintenances: { orderBy: { date: 'desc' } } },
  })
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  return NextResponse.json(asset)
}

// PUT /api/inventory/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  const data: Record<string, unknown> = {}
  if (body.name !== undefined) data.name = body.name
  if (body.category !== undefined) data.category = body.category
  if (body.description !== undefined) data.description = body.description
  if (body.serialNumber !== undefined) data.serialNumber = body.serialNumber
  if (body.purchaseDate !== undefined) data.purchaseDate = body.purchaseDate ? new Date(body.purchaseDate) : null
  if (body.purchaseCost !== undefined) data.purchaseCost = Number(body.purchaseCost)
  if (body.currentValue !== undefined) data.currentValue = Number(body.currentValue)
  if (body.condition !== undefined) data.condition = body.condition
  if (body.status !== undefined) data.status = body.status
  if (body.location !== undefined) data.location = body.location
  if (body.assignedTo !== undefined) data.assignedTo = body.assignedTo
  if (body.quantity !== undefined) data.quantity = Number(body.quantity)
  if (body.notes !== undefined) data.notes = body.notes
  const asset = await db.asset.update({ where: { id }, data })
  return NextResponse.json(asset)
}

// DELETE /api/inventory/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.asset.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
