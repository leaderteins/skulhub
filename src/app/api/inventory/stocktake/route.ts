import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/inventory/stocktake?assetId=&status=&search=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const assetId = searchParams.get('assetId') || ''
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search')?.trim() || ''

  const where: {
    assetId?: string
    status?: string
    OR?: Array<Record<string, unknown>>
  } = {}
  if (assetId) where.assetId = assetId
  if (status) where.status = status
  if (search) {
    where.OR = [
      { assetName: { contains: search } },
      { recordNo: { contains: search } },
      { countedBy: { contains: search } },
      { notes: { contains: search } },
    ]
  }

  const [records, total, pendingReview, shortages, adjustments] = await Promise.all([
    db.stocktakeRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        asset: {
          select: { id: true, name: true, assetTag: true, category: true, quantityInStock: true },
        },
      },
    }),
    db.stocktakeRecord.count({ where }),
    db.stocktakeRecord.count({ where: { status: 'Recorded' } }),
    db.stocktakeRecord.count({ where: { discrepancy: { lt: 0 } } }),
    db.stocktakeRecord.count({ where: { status: 'Adjusted' } }),
  ])

  return NextResponse.json({
    stats: {
      total,
      pendingReview,
      shortages, // records where discrepancy < 0 (missing stock)
      adjustments,
      surplus: records.filter(r => r.discrepancy > 0).length,
    },
    records: records.map(r => ({
      id: r.id,
      recordNo: r.recordNo,
      assetId: r.assetId,
      assetName: r.assetName,
      category: r.category,
      assetTag: r.asset?.assetTag || null,
      systemQuantity: r.systemQuantity,
      countedQuantity: r.countedQuantity,
      discrepancy: r.discrepancy,
      notes: r.notes,
      status: r.status,
      countedBy: r.countedBy,
      stocktakeDate: r.stocktakeDate,
      createdAt: r.createdAt,
      currentStock: r.asset?.quantityInStock ?? null,
    })),
  })
}

// POST /api/inventory/stocktake
// Body: { assetId, countedQuantity, notes?, countedBy?, stocktakeDate?, adjustStock? }
// If adjustStock=true, the asset's quantityInStock is updated to the counted quantity
// and the record's status becomes "Adjusted".
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.assetId) {
    return NextResponse.json({ error: 'assetId is required' }, { status: 400 })
  }
  const asset = await db.asset.findUnique({ where: { id: body.assetId } })
  if (!asset) return NextResponse.json({ error: 'Asset not found' }, { status: 404 })

  const systemQuantity = Number(asset.quantityInStock) || 0
  const countedQuantity = Math.max(0, Number(body.countedQuantity) || 0)
  const discrepancy = countedQuantity - systemQuantity
  const adjustStock = body.adjustStock === true
  const status = adjustStock ? 'Adjusted' : (body.status || 'Recorded')

  const year = new Date().getFullYear()
  const yearCount = await db.stocktakeRecord.count({
    where: { recordNo: { startsWith: `ST-${year}-` } },
  })
  const recordNo = `ST-${year}-${String(yearCount + 1).padStart(4, '0')}`

  const record = await db.stocktakeRecord.create({
    data: {
      recordNo,
      assetId: asset.id,
      assetName: asset.name,
      category: asset.category,
      systemQuantity,
      countedQuantity,
      discrepancy,
      notes: body.notes || null,
      status,
      countedBy: body.countedBy || 'Store Keeper',
      stocktakeDate: body.stocktakeDate ? new Date(body.stocktakeDate) : new Date(),
    },
    include: { asset: { select: { id: true, name: true, assetTag: true, category: true, quantityInStock: true } } },
  })

  // If adjusting stock, apply the counted quantity as the new live stock level
  if (adjustStock) {
    await db.asset.update({
      where: { id: asset.id },
      data: { quantityInStock: countedQuantity },
    })
  }

  await db.activityLog.create({
    data: {
      action: 'CREATE',
      entity: 'StocktakeRecord',
      entityId: record.id,
      user: record.countedBy,
      details: `Stocktake ${recordNo} for ${asset.name}: system ${systemQuantity} vs counted ${countedQuantity} (Δ ${discrepancy >= 0 ? '+' : ''}${discrepancy})`,
    },
  })

  return NextResponse.json({
    ...record,
    currentStock: adjustStock ? countedQuantity : asset.quantityInStock,
  }, { status: 201 })
}
