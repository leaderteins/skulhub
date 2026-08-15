import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/inventory/items
// Returns the list of all distinct item names already in the inventory
// (across ALL categories) so that the create-item dropdown can suggest
// reusing existing names. Optional `?category=` to filter within one category.
// Optional `?q=` to filter by name substring.
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') || ''
  const q = searchParams.get('q')?.trim().toLowerCase() || ''

  const where: { category?: string; name?: { contains: string } } = {}
  if (category) where.category = category
  if (q) where.name = { contains: q }

  const assets = await db.asset.findMany({
    where,
    select: { name: true, category: true },
    orderBy: { name: 'asc' },
    distinct: ['name'],
  })

  // Group names by their first-seen category for context
  const items = assets.map(a => ({ name: a.name, category: a.category }))

  return NextResponse.json({ items, count: items.length })
}
