import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH or PUT /api/inventory/restock-request/[id]
// Body: { status, approvedBy?, rejectedReason?, purchaseOrderId?, notes? }
// Status flow: Pending -> Approved | Rejected | Ordered | Received
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body || !body.status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 })
  }

  const existing = await db.restockRequest.findUnique({ where: { id } })
  if (!existing) return NextResponse.json({ error: 'Restock request not found' }, { status: 404 })

  const data: {
    status: string
    approvedBy?: string | null
    approvedAt?: Date
    rejectedReason?: string | null
    purchaseOrderId?: string | null
    notes?: string | null
  } = { status: body.status }

  if (body.status === 'Approved') {
    if (!existing.approvedBy) {
      data.approvedBy = body.approvedBy || 'Admin'
      data.approvedAt = new Date()
    }
    data.rejectedReason = null
  }
  if (body.status === 'Rejected') {
    data.rejectedReason = body.rejectedReason || 'Rejected by approver'
  }
  if (body.status === 'Ordered' && body.purchaseOrderId) {
    data.purchaseOrderId = body.purchaseOrderId
  }
  if (body.status === 'Received' && body.purchaseOrderId) {
    data.purchaseOrderId = body.purchaseOrderId
  }
  if (body.notes !== undefined) data.notes = body.notes || null

  const updated = await db.restockRequest.update({
    where: { id },
    data,
    include: {
      asset: { select: { id: true, name: true, assetTag: true, category: true, quantityInStock: true, reorderLevel: true, unitPrice: true, supplierName: true } },
    },
  })

  await db.activityLog.create({
    data: {
      action: 'UPDATE',
      entity: 'RestockRequest',
      entityId: updated.id,
      user: data.approvedBy || existing.approvedBy || 'Admin',
      details: `Restock ${updated.requestNo} status → ${updated.status}`,
    },
  })

  return NextResponse.json(updated)
}

// Alias PUT → PATCH so the existing apiPut helper (method: 'PUT') works the same way
export const PUT = PATCH

// GET single — for inspection
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const r = await db.restockRequest.findUnique({
    where: { id },
    include: {
      asset: { select: { id: true, name: true, assetTag: true, category: true, quantityInStock: true, reorderLevel: true, unitPrice: true, supplierName: true } },
    },
  })
  if (!r) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(r)
}
