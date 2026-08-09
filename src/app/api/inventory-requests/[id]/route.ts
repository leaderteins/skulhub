import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PUT — approve, reject, or fulfill a request
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))

  const data: any = {}
  if (body.status !== undefined) data.status = body.status
  if (body.approvedBy !== undefined) data.approvedBy = body.approvedBy
  if (body.fulfilledBy !== undefined) data.fulfilledBy = body.fulfilledBy
  if (body.fulfilledQty !== undefined) data.fulfilledQty = Number(body.fulfilledQty)
  if (body.rejectionReason !== undefined) data.rejectionReason = body.rejectionReason
  if (body.notes !== undefined) data.notes = body.notes

  // Set timestamps based on status
  if (body.status === 'Approved' || body.status === 'Rejected') {
    data.approvedAt = new Date()
  }
  if (body.status === 'Fulfilled' || body.status === 'Partially Fulfilled') {
    data.fulfilledAt = new Date()
    if (!data.fulfilledQty) data.fulfilledQty = 0
  }

  const request = await db.inventoryRequest.update({ where: { id }, data })

  await db.activityLog.create({
    data: { action: 'UPDATE', entity: 'InventoryRequest', entityId: id, user: body.approvedBy || body.fulfilledBy || 'Admin', details: `Request ${request.requestNo} → ${body.status}` },
  }).catch(() => {})

  return NextResponse.json(request)
}

// DELETE
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.inventoryRequest.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
