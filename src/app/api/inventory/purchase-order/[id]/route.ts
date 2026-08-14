import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// PATCH or PUT /api/inventory/purchase-order/[id]
// Use cases:
//   { status: 'Approved' | 'Ordered' | 'Cancelled', approvedBy? }
//   { status: 'Received', receivedDate?, autoAdjustStock?: true }
//        -> for each line item that has an assetId, adds `quantity` to asset.quantityInStock
//          and marks the linked restock request as Received.
//        -> if the PO has a single legacy line (no items[]), updates quantityInStock by po.quantity
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body || !body.status) {
    return NextResponse.json({ error: 'status is required' }, { status: 400 })
  }

  const existing = await db.purchaseOrder.findUnique({
    where: { id },
    include: { items: true },
  })
  if (!existing) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })

  const data: {
    status: string
    approvedBy?: string | null
    deliveryDate?: Date | null
    receivedDate?: Date | null
    notes?: string | null
  } = { status: body.status }

  if (body.status === 'Approved' && !existing.approvedBy) {
    data.approvedBy = body.approvedBy || 'Admin'
  }
  if (body.status === 'Ordered' && !existing.deliveryDate) {
    // leave deliveryDate null until received
  }
  if (body.deliveryDate !== undefined) {
    data.deliveryDate = body.deliveryDate ? new Date(body.deliveryDate) : null
  }
  if (body.status === 'Received') {
    data.receivedDate = body.receivedDate ? new Date(body.receivedDate) : new Date()
  }
  if (body.notes !== undefined) data.notes = body.notes || null

  // Update the PO itself first
  const updated = await db.purchaseOrder.update({
    where: { id },
    data,
    include: {
      supplier: { select: { id: true, name: true, category: true, phone: true, email: true } },
      items: true,
    },
  })

  // ---- Stock adjustment on receipt ----
  if (body.status === 'Received' && body.autoAdjustStock !== false) {
    // For multi-item POs: bump each linked asset's quantityInStock by the line item quantity
    if (existing.items.length > 0) {
      for (const item of existing.items) {
        if (item.assetId) {
          const asset = await db.asset.findUnique({ where: { id: item.assetId } })
          if (asset) {
            const newStock = (asset.quantityInStock || 0) + item.quantity
            await db.asset.update({
              where: { id: asset.id },
              data: { quantityInStock: newStock },
            })
          }
        }
        // Mark item as fully received
        await db.purchaseOrderItem.update({
          where: { id: item.id },
          data: { receivedQuantity: item.quantity },
        })
      }
    } else {
      // Legacy single-line PO: use po.item and po.quantity to bump matching asset by name
      const matching = await db.asset.findFirst({ where: { name: existing.item } })
      if (matching) {
        const newStock = (matching.quantityInStock || 0) + existing.quantity
        await db.asset.update({
          where: { id: matching.id },
          data: { quantityInStock: newStock },
        })
      }
    }

    // Mark the linked restock request as Received
    if (existing.restockRequestId) {
      await db.restockRequest.update({
        where: { id: existing.restockRequestId },
        data: { status: 'Received' },
      })
    }
  }

  await db.activityLog.create({
    data: {
      action: 'UPDATE',
      entity: 'PurchaseOrder',
      entityId: updated.id,
      user: data.approvedBy || existing.approvedBy || 'Admin',
      details: `PO ${updated.poNumber} status → ${updated.status}`,
    },
  })

  return NextResponse.json(updated)
}

// Alias PUT → PATCH so the existing apiPut helper (method: 'PUT') works the same way
export const PUT = PATCH

// GET single PO
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const po = await db.purchaseOrder.findUnique({
    where: { id },
    include: {
      supplier: { select: { id: true, name: true, category: true, phone: true, email: true } },
      items: { include: { asset: { select: { id: true, name: true, assetTag: true, quantityInStock: true } } } },
    },
  })
  if (!po) return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
  return NextResponse.json(po)
}
