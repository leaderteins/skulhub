import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/procurement?status=&category=&search=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const category = searchParams.get('category') || ''
  const search = searchParams.get('search')?.trim() || ''

  const poWhere: {
    status?: string
    supplier?: { category?: string }
    OR?: Array<Record<string, unknown>>
  } = {}
  if (status) poWhere.status = status
  if (category) poWhere.supplier = { category }
  if (search) {
    poWhere.OR = [
      { poNumber: { contains: search } },
      { item: { contains: search } },
      { description: { contains: search } },
      { requestedBy: { contains: search } },
      { supplier: { name: { contains: search } } },
    ]
  }

  const supplierWhere: {
    category?: string
    status?: string
    OR?: Array<Record<string, unknown>>
  } = {}
  if (category) supplierWhere.category = category
  if (search) {
    supplierWhere.OR = [
      { name: { contains: search } },
      { contact: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
    ]
  }

  const [
    suppliers,
    purchaseOrders,
    totalSuppliers,
    totalOrders,
    pendingOrders,
    approvedOrders,
    deliveredOrders,
    cancelledOrders,
    totalValue,
    pendingValue,
    byCategory,
    byStatus,
  ] = await Promise.all([
    db.supplier.findMany({
      where: supplierWhere,
      orderBy: { createdAt: 'desc' },
      include: {
        orders: { select: { id: true, totalAmount: true, status: true }, orderBy: { createdAt: 'desc' } },
      },
    }),
    db.purchaseOrder.findMany({
      where: poWhere,
      orderBy: { createdAt: 'desc' },
      include: { supplier: { select: { id: true, name: true, category: true, phone: true, email: true } } },
    }),
    db.supplier.count(),
    db.purchaseOrder.count(),
    db.purchaseOrder.count({ where: { status: 'Pending' } }),
    db.purchaseOrder.count({ where: { status: 'Approved' } }),
    db.purchaseOrder.count({ where: { status: 'Delivered' } }),
    db.purchaseOrder.count({ where: { status: 'Cancelled' } }),
    db.purchaseOrder.aggregate({ _sum: { totalAmount: true } }),
    db.purchaseOrder.aggregate({ where: { status: { in: ['Pending', 'Approved'] } }, _sum: { totalAmount: true } }),
    db.supplier.groupBy({ by: ['category'], _count: true }),
    db.purchaseOrder.groupBy({ by: ['status'], _count: true, _sum: { totalAmount: true } }),
  ])

  return NextResponse.json({
    stats: {
      totalOrders,
      pendingOrders,
      approvedOrders,
      deliveredOrders,
      cancelledOrders,
      totalSuppliers,
      totalValue: totalValue._sum.totalAmount || 0,
      pendingValue: pendingValue._sum.totalAmount || 0,
      deliveredValue: (byStatus.find(s => s.status === 'Delivered')?._sum.totalAmount) || 0,
    },
    suppliers: suppliers.map(s => ({
      id: s.id,
      name: s.name,
      category: s.category,
      contact: s.contact,
      phone: s.phone,
      email: s.email,
      address: s.address,
      status: s.status,
      createdAt: s.createdAt,
      orderCount: s.orders.length,
      totalSpent: s.orders.reduce((sum, o) => sum + o.totalAmount, 0),
      pendingCount: s.orders.filter(o => o.status === 'Pending' || o.status === 'Approved').length,
    })),
    purchaseOrders: purchaseOrders.map(po => ({
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
      createdAt: po.createdAt,
    })),
    byCategory: byCategory.map(c => ({ name: c.category, count: c._count })),
    byStatus: byStatus.map(s => ({ name: s.status, count: s._count, value: s._sum.totalAmount || 0 })),
  })
}

// POST /api/procurement — create supplier OR purchase order
//   body.type === 'supplier' → create supplier
//   body.type === 'po' (default) → create purchase order
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // ---- Create supplier ----
  if (body.type === 'supplier') {
    if (!body.name) {
      return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 })
    }
    const supplier = await db.supplier.create({
      data: {
        name: body.name,
        category: body.category || 'Other',
        contact: body.contact || null,
        phone: body.phone || null,
        email: body.email || null,
        address: body.address || null,
        status: body.status || 'Active',
      },
    })
    await db.activityLog.create({
      data: { action: 'CREATE', entity: 'Supplier', entityId: supplier.id, user: 'Admin', details: `Added supplier ${supplier.name}` },
    })
    return NextResponse.json(supplier, { status: 201 })
  }

  // ---- Create purchase order ----
  if (!body.supplierId || !body.item) {
    return NextResponse.json({ error: 'supplierId and item are required' }, { status: 400 })
  }
  const supplier = await db.supplier.findUnique({ where: { id: body.supplierId } })
  if (!supplier) {
    return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
  }

  const quantity = Math.max(1, Number(body.quantity) || 1)
  const unitPrice = Math.max(0, Number(body.unitPrice) || 0)
  const totalAmount = quantity * unitPrice

  // Auto-generate poNumber: PO-YYYY-XXXX
  const year = new Date().getFullYear()
  const yearCount = await db.purchaseOrder.count({
    where: { poNumber: { startsWith: `PO-${year}-` } },
  })
  const poNumber = `PO-${year}-${String(yearCount + 1).padStart(4, '0')}`

  const po = await db.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: body.supplierId,
      item: body.item,
      description: body.description || null,
      quantity,
      unitPrice,
      totalAmount,
      status: body.status || 'Pending',
      requestedBy: body.requestedBy || 'Admin',
      approvedBy: body.approvedBy || null,
      orderDate: body.orderDate ? new Date(body.orderDate) : new Date(),
      deliveryDate: body.deliveryDate ? new Date(body.deliveryDate) : null,
    },
    include: { supplier: { select: { id: true, name: true, category: true, phone: true, email: true } } },
  })

  await db.activityLog.create({
    data: { action: 'CREATE', entity: 'PurchaseOrder', entityId: po.id, user: 'Admin', details: `Created ${po.poNumber} for ${po.item} (${po.supplier.name}) — KES ${po.totalAmount}` },
  })

  return NextResponse.json(po, { status: 201 })
}

// PUT /api/procurement — update PO status (approve/deliver/cancel)
//   body.id (required), body.status, body.approvedBy, body.deliveryDate
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.id) {
    return NextResponse.json({ error: 'PO id is required' }, { status: 400 })
  }
  const existing = await db.purchaseOrder.findUnique({ where: { id: body.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
  }

  const data: {
    status?: string
    approvedBy?: string | null
    deliveryDate?: Date | null
  } = {}
  if (body.status) {
    data.status = body.status
    // Auto-set approvedBy when approving
    if (body.status === 'Approved' && !existing.approvedBy) {
      data.approvedBy = body.approvedBy || 'Admin'
    }
    // Auto-set deliveryDate when delivered
    if (body.status === 'Delivered' && !existing.deliveryDate) {
      data.deliveryDate = body.deliveryDate ? new Date(body.deliveryDate) : new Date()
    }
  }
  if (body.approvedBy !== undefined) data.approvedBy = body.approvedBy || null
  if (body.deliveryDate !== undefined) data.deliveryDate = body.deliveryDate ? new Date(body.deliveryDate) : null

  const updated = await db.purchaseOrder.update({
    where: { id: body.id },
    data,
    include: { supplier: { select: { id: true, name: true, category: true, phone: true, email: true } } },
  })

  await db.activityLog.create({
    data: { action: 'UPDATE', entity: 'PurchaseOrder', entityId: updated.id, user: 'Admin', details: `${updated.poNumber} status → ${updated.status}` },
  })

  return NextResponse.json(updated)
}
