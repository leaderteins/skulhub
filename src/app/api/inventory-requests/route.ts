import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/inventory-requests?status=&type=&urgency=&search=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const type = searchParams.get('type') || ''
  const urgency = searchParams.get('urgency') || ''
  const search = searchParams.get('search')?.trim() || ''

  const where: any = {}
  if (status) where.status = status
  if (type) where.requestType = type
  if (urgency) where.urgency = urgency
  if (search) {
    where.OR = [
      { itemName: { contains: search } },
      { requestNo: { contains: search } },
      { requestedBy: { contains: search } },
      { description: { contains: search } },
    ]
  }

  const [requests, total, pending, approved, fulfilled, rejected, urgent, byType, byDepartment] = await Promise.all([
    db.inventoryRequest.findMany({ where, orderBy: { createdAt: 'desc' }, take: 100 }),
    db.inventoryRequest.count({ where }),
    db.inventoryRequest.count({ where: { status: 'Pending' } }),
    db.inventoryRequest.count({ where: { status: 'Approved' } }),
    db.inventoryRequest.count({ where: { status: 'Fulfilled' } }),
    db.inventoryRequest.count({ where: { status: 'Rejected' } }),
    db.inventoryRequest.count({ where: { urgency: 'Urgent', status: 'Pending' } }),
    db.inventoryRequest.groupBy({ by: ['requestType'], _count: true }),
    db.inventoryRequest.groupBy({ by: ['department'], _count: true }),
  ])

  return NextResponse.json({
    stats: { total, pending, approved, fulfilled, rejected, urgent },
    requests,
    byType: byType.map(t => ({ name: t.requestType, count: t._count })),
    byDepartment: byDepartment.map(d => ({ name: d.department || 'Unknown', count: d._count })),
  })
}

// POST — create a new request
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.itemName || !body.quantity) {
    return NextResponse.json({ error: 'itemName and quantity are required' }, { status: 400 })
  }
  const count = await db.inventoryRequest.count()
  const requestNo = `REQ-${String(count + 1).padStart(4, '0')}`

  const request = await db.inventoryRequest.create({
    data: {
      requestNo,
      requestType: body.requestType || 'Kitchen',
      itemName: body.itemName,
      description: body.description || null,
      quantity: Number(body.quantity),
      unit: body.unit || 'pcs',
      urgency: body.urgency || 'Normal',
      requestedBy: body.requestedBy || 'Staff',
      requesterRole: body.requesterRole || 'Staff',
      department: body.department || null,
      notes: body.notes || null,
      status: 'Pending',
    },
  })

  await db.activityLog.create({
    data: { action: 'CREATE', entity: 'InventoryRequest', entityId: request.id, user: body.requestedBy || 'Staff', details: `Requested ${body.quantity} ${body.unit} of ${body.itemName}` },
  }).catch(() => {})

  return NextResponse.json(request, { status: 201 })
}
