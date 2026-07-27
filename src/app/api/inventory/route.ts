import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/inventory?category=&condition=&status=&search=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') || ''
  const condition = searchParams.get('condition') || ''
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search')?.trim() || ''

  const where: {
    category?: string
    condition?: string
    status?: string
    OR?: Array<Record<string, unknown>>
  } = {}
  if (category) where.category = category
  if (condition) where.condition = condition
  if (status) where.status = status
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { assetTag: { contains: search } },
      { serialNumber: { contains: search } },
      { location: { contains: search } },
      { assignedTo: { contains: search } },
    ]
  }

  const [assets, totalAssets, totalValue, purchaseValue, byCategory, byCondition, byStatus, underRepair, maintenanceDue] = await Promise.all([
    db.asset.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        maintenances: {
          orderBy: { date: 'desc' },
          take: 3,
          select: { id: true, date: true, type: true, description: true, cost: true, status: true, nextDueDate: true, vendor: true, technician: true },
        },
      },
    }),
    db.asset.count({ where }),
    db.asset.aggregate({ where, _sum: { currentValue: true } }),
    db.asset.aggregate({ where, _sum: { purchaseCost: true } }),
    db.asset.groupBy({ by: ['category'], _count: true, _sum: { currentValue: true } }),
    db.asset.groupBy({ by: ['condition'], _count: true }),
    db.asset.groupBy({ by: ['status'], _count: true }),
    db.asset.count({ where: { status: 'Under Repair' } }),
    db.assetMaintenance.count({ where: { status: { in: ['Scheduled', 'In Progress'] } } }),
  ])

  return NextResponse.json({
    stats: {
      totalAssets,
      totalValue: totalValue._sum.currentValue || 0,
      purchaseValue: purchaseValue._sum.purchaseCost || 0,
      depreciation: (purchaseValue._sum.purchaseCost || 0) - (totalValue._sum.currentValue || 0),
      underRepair,
      maintenanceDue,
    },
    assets: assets.map(a => ({
      ...a,
      maintenanceCount: a.maintenances.length,
      lastMaintenance: a.maintenances[0]?.date || null,
    })),
    byCategory: byCategory.map(c => ({ name: c.category, count: c._count, value: c._sum.currentValue || 0 })),
    byCondition: byCondition.map(c => ({ name: c.condition, count: c._count })),
    byStatus: byStatus.map(s => ({ name: s.status, count: s._count })),
  })
}

// POST /api/inventory — create a new asset
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.name) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }
  const count = await db.asset.count()
  const assetTag = `AST-${String(count + 1).padStart(3, '0')}`
  const asset = await db.asset.create({
    data: {
      assetTag,
      name: body.name,
      category: body.category || 'Other',
      description: body.description || null,
      serialNumber: body.serialNumber || null,
      purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
      purchaseCost: Number(body.purchaseCost) || 0,
      currentValue: Number(body.currentValue) || Number(body.purchaseCost) || 0,
      condition: body.condition || 'Good',
      status: body.status || 'In Use',
      location: body.location || null,
      assignedTo: body.assignedTo || null,
      quantity: Number(body.quantity) || 1,
      notes: body.notes || null,
    },
  })
  await db.activityLog.create({
    data: { action: 'CREATE', entity: 'Asset', entityId: asset.id, user: 'Admin', details: `Registered asset ${assetTag}: ${asset.name}` },
  })
  return NextResponse.json(asset, { status: 201 })
}
