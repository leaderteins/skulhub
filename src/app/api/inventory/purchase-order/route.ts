import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/inventory/purchase-order?status=&search=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search')?.trim() || ''

  const where: {
    status?: string
    OR?: Array<Record<string, unknown>>
  } = {}
  if (status) where.status = status
  if (search) {
    where.OR = [
      { poNumber: { contains: search } },
      { item: { contains: search } },
      { description: { contains: search } },
      { requestedBy: { contains: search } },
      { supplier: { name: { contains: search } } },
    ]
  }

  const [orders, total, pending, approved, ordered, received, cancelled, totalValue, pendingValue] = await Promise.all([
    db.purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        supplier: { select: { id: true, name: true, category: true, phone: true, email: true } },
        items: true,
      },
    }),
    db.purchaseOrder.count({ where }),
    db.purchaseOrder.count({ where: { status: 'Pending' } }),
    db.purchaseOrder.count({ where: { status: 'Approved' } }),
    db.purchaseOrder.count({ where: { status: 'Ordered' } }),
    db.purchaseOrder.count({ where: { status: 'Received' } }),
    db.purchaseOrder.count({ where: { status: 'Cancelled' } }),
    db.purchaseOrder.aggregate({ _sum: { totalAmount: true } }),
    db.purchaseOrder.aggregate({ where: { status: { in: ['Pending', 'Approved', 'Ordered'] } }, _sum: { totalAmount: true } }),
  ])

  return NextResponse.json({
    stats: {
      total,
      pending,
      approved,
      ordered,
      received,
      cancelled,
      totalValue: totalValue._sum.totalAmount || 0,
      pendingValue: pendingValue._sum.totalAmount || 0,
    },
    orders: orders.map(po => ({
      id: po.id,
      poNumber: po.poNumber,
      supplierId: po.supplierId,
      supplier: po.supplier,
      item: po.item,
      description: po.description,
      quantity: po.quantity,
      unitPrice: po.unitPrice,
      totalAmount: po.totalAmount,
      status: po.status,
      requestedBy: po.requestedBy,
      approvedBy: po.approvedBy,
      orderDate: po.orderDate,
      deliveryDate: po.deliveryDate,
      receivedDate: po.receivedDate,
      restockRequestId: po.restockRequestId,
      notes: po.notes,
      createdAt: po.createdAt,
      items: po.items.map(it => ({
        id: it.id,
        assetId: it.assetId,
        itemName: it.itemName,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        totalPrice: it.totalPrice,
        receivedQuantity: it.receivedQuantity,
      })),
    })),
  })
}

// POST /api/inventory/purchase-order
// Two modes:
//   1. From an approved restock request: body = { restockRequestId, supplierId? }
//      (supplier falls back to suggestedSupplierId; the restock's asset becomes the single line item)
//   2. Free-form multi-item: body = { supplierId, items: [{ assetId?, itemName, quantity, unitPrice }],
//                                    requestedBy?, notes?, status?, orderDate?, deliveryDate? }
// Total is auto-calculated as sum(item.totalPrice) for multi-item, or quantity*unitPrice for single-line.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  // ----- Mode 1: from restock request -----
  if (body.restockRequestId) {
    const rr = await db.restockRequest.findUnique({
      where: { id: body.restockRequestId },
      include: { asset: true },
    })
    if (!rr) return NextResponse.json({ error: 'Restock request not found' }, { status: 404 })
    if (rr.status !== 'Approved') {
      return NextResponse.json({ error: 'Restock request must be Approved before creating a PO' }, { status: 400 })
    }

    const supplierId = body.supplierId || rr.suggestedSupplierId
    if (!supplierId) {
      return NextResponse.json({ error: 'Supplier is required (no suggested supplier on the restock request)' }, { status: 400 })
    }
    const supplier = await db.supplier.findUnique({ where: { id: supplierId } })
    if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })

    const year = new Date().getFullYear()
    const yearCount = await db.purchaseOrder.count({ where: { poNumber: { startsWith: `PO-${year}-` } } })
    const poNumber = `PO-${year}-${String(yearCount + 1).padStart(4, '0')}`

    const quantity = rr.requestedQuantity
    const unitPrice = rr.unitPrice
    const totalAmount = quantity * unitPrice

    const po = await db.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        item: rr.assetName,
        description: `Auto-generated from restock request ${rr.requestNo}`,
        quantity,
        unitPrice,
        totalAmount,
        status: body.status || 'Approved',
        requestedBy: rr.requestedBy,
        approvedBy: rr.approvedBy || 'Admin',
        orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
        deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
        restockRequestId: rr.id,
        notes: body.notes || rr.notes || null,
        items: {
          create: [{
            assetId: rr.assetId,
            itemName: rr.assetName,
            quantity,
            unitPrice,
            totalPrice: totalAmount,
          }],
        },
      },
      include: { supplier: { select: { id: true, name: true, category: true, phone: true, email: true } }, items: true },
    })

    // Link the restock request back to this PO and mark as Ordered
    await db.restockRequest.update({
      where: { id: rr.id },
      data: { status: 'Ordered', purchaseOrderId: po.id },
    })

    await db.activityLog.create({
      data: {
        action: 'CREATE',
        entity: 'PurchaseOrder',
        entityId: po.id,
        user: po.requestedBy || 'Admin',
        details: `Created ${po.poNumber} from restock ${rr.requestNo} for ${po.item} (${po.supplier.name}) — KES ${po.totalAmount}`,
      },
    })

    return NextResponse.json(po, { status: 201 })
  }

  // ----- Mode 2: free-form multi-item -----
  if (!body.supplierId) {
    return NextResponse.json({ error: 'supplierId (or restockRequestId) is required' }, { status: 400 })
  }
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ error: 'items[] is required (at least one line item)' }, { status: 400 })
  }

  const supplier = await db.supplier.findUnique({ where: { id: body.supplierId } })
  if (!supplier) return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })

  const year = new Date().getFullYear()
  const yearCount = await db.purchaseOrder.count({ where: { poNumber: { startsWith: `PO-${year}-` } } })
  const poNumber = `PO-${year}-${String(yearCount + 1).padStart(4, '0')}`

  const lineItems = body.items.map((it: any) => {
    const quantity = Math.max(1, Number(it.quantity) || 1)
    const unitPrice = Math.max(0, Number(it.unitPrice) || 0)
    return {
      assetId: it.assetId || null,
      itemName: it.itemName || (it.assetId ? '(asset)' : 'Item'),
      quantity,
      unitPrice,
      totalPrice: quantity * unitPrice,
    }
  })
  const totalAmount = lineItems.reduce((sum: number, it: any) => sum + it.totalPrice, 0)
  const firstItem = lineItems[0]

  const po = await db.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: body.supplierId,
      item: lineItems.length === 1 ? firstItem.itemName : `${lineItems.length} items`,
      description: body.description || (lineItems.length > 1 ? lineItems.map((i: any) => i.itemName).join(', ') : null),
      quantity: firstItem.quantity,
      unitPrice: firstItem.unitPrice,
      totalAmount,
      status: body.status || 'Pending',
      requestedBy: body.requestedBy || 'Admin',
      approvedBy: body.approvedBy || null,
      orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
      deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
      notes: body.notes || null,
      items: { create: lineItems },
    },
    include: { supplier: { select: { id: true, name: true, category: true, phone: true, email: true } }, items: true },
  })

  // If this PO was created from a restock request, mark it Ordered and link
  if (body.restockRequestId) {
    await db.restockRequest.update({
      where: { id: body.restockRequestId },
      data: { status: 'Ordered', purchaseOrderId: po.id },
    })
  }

  await db.activityLog.create({
    data: {
      action: 'CREATE',
      entity: 'PurchaseOrder',
      entityId: po.id,
      user: po.requestedBy || 'Admin',
      details: `Created ${po.poNumber} with ${lineItems.length} item(s) (${po.supplier.name}) — KES ${po.totalAmount}`,
    },
  })

  return NextResponse.json(po, { status: 201 })
}
