import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/inventory/restock-request?status=&priority=&search=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const priority = searchParams.get('priority') || ''
  const search = searchParams.get('search')?.trim() || ''

  const where: {
    status?: string
    priority?: string
    OR?: Array<Record<string, unknown>>
  } = {}
  if (status) where.status = status
  if (priority) where.priority = priority
  if (search) {
    where.OR = [
      { requestNo: { contains: search } },
      { assetName: { contains: search } },
      { requestedBy: { contains: search } },
      { suggestedSupplier: { contains: search } },
      { reason: { contains: search } },
    ]
  }

  const [requests, total, pending, approved, ordered, received, rejected, totalEstimate, pendingEstimate] = await Promise.all([
    db.restockRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        asset: {
          select: { id: true, name: true, assetTag: true, category: true, quantityInStock: true, reorderLevel: true, unitPrice: true, supplierName: true },
        },
      },
    }),
    db.restockRequest.count({ where }),
    db.restockRequest.count({ where: { status: 'Pending' } }),
    db.restockRequest.count({ where: { status: 'Approved' } }),
    db.restockRequest.count({ where: { status: 'Ordered' } }),
    db.restockRequest.count({ where: { status: 'Received' } }),
    db.restockRequest.count({ where: { status: 'Rejected' } }),
    db.restockRequest.aggregate({ _sum: { estimatedCost: true } }),
    db.restockRequest.aggregate({ where: { status: { in: ['Pending', 'Approved', 'Ordered'] } }, _sum: { estimatedCost: true } }),
  ])

  return NextResponse.json({
    stats: {
      total,
      pending,
      approved,
      ordered,
      received,
      rejected,
      totalEstimate: totalEstimate._sum.estimatedCost || 0,
      pendingEstimate: pendingEstimate._sum.estimatedCost || 0,
    },
    requests: requests.map(r => ({
      id: r.id,
      requestNo: r.requestNo,
      assetId: r.assetId,
      assetName: r.assetName,
      category: r.category,
      requestedQuantity: r.requestedQuantity,
      unitPrice: r.unitPrice,
      estimatedCost: r.estimatedCost,
      suggestedSupplierId: r.suggestedSupplierId,
      suggestedSupplier: r.suggestedSupplier,
      reason: r.reason,
      priority: r.priority,
      status: r.status,
      requestedBy: r.requestedBy,
      approvedBy: r.approvedBy,
      approvedAt: r.approvedAt,
      rejectedReason: r.rejectedReason,
      purchaseOrderId: r.purchaseOrderId,
      notes: r.notes,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      asset: r.asset,
    })),
  })
}

// POST /api/inventory/restock-request
// Body: { assetId, requestedQuantity, unitPrice?, suggestedSupplierId?, suggestedSupplier?,
//         reason?, priority?, requestedBy?, notes? }
// If assetId provided and reorder tracking is enabled, fetch live stock + unit price for context.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || (!body.assetId && !body.assetName)) {
    return NextResponse.json({ error: 'assetId or assetName is required' }, { status: 400 })
  }

  let asset = null
  if (body.assetId) {
    asset = await db.asset.findUnique({ where: { id: body.assetId } })
    if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
  }

  const requestedQuantity = Math.max(1, Number(body.requestedQuantity) || 1)
  // If unit price is not provided, fall back to the asset's stored unit price
  const unitPrice = body.unitPrice !== undefined
    ? Math.max(0, Number(body.unitPrice))
    : Number(asset?.unitPrice || 0)
  const estimatedCost = requestedQuantity * unitPrice

  const year = new Date().getFullYear()
  const yearCount = await db.restockRequest.count({
    where: { requestNo: { startsWith: `RR-${year}-` } },
  })
  const requestNo = `RR-${year}-${String(yearCount + 1).padStart(4, '0')}`

  const request = await db.restockRequest.create({
    data: {
      requestNo,
      assetId: asset?.id || body.assetId,
      assetName: asset?.name || body.assetName,
      category: asset?.category || body.category || 'Other',
      requestedQuantity,
      unitPrice,
      estimatedCost,
      suggestedSupplierId: body.suggestedSupplierId || null,
      suggestedSupplier: body.suggestedSupplier || asset?.supplierName || null,
      reason: body.reason || (asset && asset.quantityInStock <= asset.reorderLevel ? 'Low stock' : 'Manual request'),
      priority: body.priority || 'Normal',
      status: 'Pending',
      requestedBy: body.requestedBy || 'Store Keeper',
      notes: body.notes || null,
    },
    include: {
      asset: { select: { id: true, name: true, assetTag: true, category: true, quantityInStock: true, reorderLevel: true, unitPrice: true, supplierName: true } },
    },
  })

  await db.activityLog.create({
    data: {
      action: 'CREATE',
      entity: 'RestockRequest',
      entityId: request.id,
      user: request.requestedBy,
      details: `Restock request ${requestNo} for ${request.assetName}: ${requestedQuantity} units (est. ${estimatedCost})`,
    },
  })

  return NextResponse.json(request, { status: 201 })
}
