import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/feedback?category=&role=&status=&search=
// Returns feedback list + aggregate stats (total, avg rating, by category, by role, by status, rating distribution)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') || ''
  const role = searchParams.get('role') || ''
  const status = searchParams.get('status') || ''
  const search = searchParams.get('search')?.trim() || ''

  const where: any = {}
  if (category) where.category = category
  if (role) where.role = role
  if (status) where.status = status
  if (search) {
    where.OR = [
      { comment: { contains: search } },
      { submittedBy: { contains: search } },
    ]
  }

  const [
    feedback,
    total,
    newCount,
    reviewedCount,
    addressedCount,
    avgAgg,
    byCategory,
    byRole,
    byStatus,
    ratingDist,
  ] = await Promise.all([
    db.feedback.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 200,
    }),
    db.feedback.count({ where }),
    db.feedback.count({ where: { ...where, status: 'New' } }),
    db.feedback.count({ where: { ...where, status: 'Reviewed' } }),
    db.feedback.count({ where: { ...where, status: 'Addressed' } }),
    db.feedback.aggregate({ where, _avg: { rating: true } }),
    db.feedback.groupBy({ by: ['category'], where, _count: true }),
    db.feedback.groupBy({ by: ['role'], where, _count: true }),
    db.feedback.groupBy({ by: ['status'], where, _count: true }),
    db.feedback.groupBy({ by: ['rating'], where, _count: true }),
  ])

  // Build full rating distribution (1-5) — fill missing ratings with 0
  const ratingMap = new Map<number, number>()
  for (let r = 1; r <= 5; r++) ratingMap.set(r, 0)
  for (const r of ratingDist) ratingMap.set(r.rating, r._count)
  const ratingDistribution = Array.from(ratingMap.entries()).map(([rating, count]) => ({
    rating,
    count,
    label: `${rating}★`,
  }))

  return NextResponse.json({
    stats: {
      total,
      avgRating: Number(avgAgg._avg.rating?.toFixed(2) || 0),
      newCount,
      reviewedCount,
      addressedCount,
    },
    byCategory: byCategory.map(c => ({ name: c.category, count: c._count })),
    byRole: byRole.map(r => ({ name: r.role, count: r._count })),
    byStatus: byStatus.map(s => ({ name: s.status, count: s._count })),
    ratingDistribution,
    feedback: feedback.map(f => ({
      id: f.id,
      category: f.category,
      rating: f.rating,
      comment: f.comment,
      submittedBy: f.submittedBy,
      role: f.role,
      status: f.status,
      createdAt: f.createdAt,
    })),
  })
}

// POST — submit new feedback
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.comment || !body.comment.trim()) {
    return NextResponse.json({ error: 'Comment is required' }, { status: 400 })
  }

  const validCategories = ['General', 'Teaching', 'Facilities', 'Food', 'Transport']
  const validRoles = ['Parent', 'Student', 'Staff']

  const rating = Math.min(5, Math.max(1, Number(body.rating) || 5))
  const category = validCategories.includes(body.category) ? body.category : 'General'
  const role = validRoles.includes(body.role) ? body.role : 'Parent'

  const created = await db.feedback.create({
    data: {
      category,
      rating,
      comment: String(body.comment).trim(),
      submittedBy: body.submittedBy?.trim() || null,
      role,
      status: 'New',
    },
  })

  return NextResponse.json(created, { status: 201 })
}

// PUT — update feedback status (review / address)
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.id) {
    return NextResponse.json({ error: 'Feedback id is required' }, { status: 400 })
  }
  const validStatuses = ['New', 'Reviewed', 'Addressed']
  const status = validStatuses.includes(body.status) ? body.status : undefined
  if (!status) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const existing = await db.feedback.findUnique({ where: { id: body.id } })
  if (!existing) {
    return NextResponse.json({ error: 'Feedback not found' }, { status: 404 })
  }

  const updated = await db.feedback.update({
    where: { id: body.id },
    data: { status },
  })

  return NextResponse.json(updated)
}
