import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/finance/budgets — list all budgets
export async function GET() {
  const budgets = await db.budget.findMany({ orderBy: { category: 'asc' } })
  return NextResponse.json({ budgets })
}

// POST /api/finance/budgets — create or update a budget (upsert by category)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.category || !body.amount) {
    return NextResponse.json({ error: 'category and amount are required' }, { status: 400 })
  }
  const existing = await db.budget.findFirst({ where: { category: body.category } })
  const budget = existing
    ? await db.budget.update({ where: { id: existing.id }, data: { amount: Number(body.amount), notes: body.notes || existing.notes } })
    : await db.budget.create({
        data: {
          category: body.category,
          amount: Number(body.amount),
          academicYear: body.academicYear || '2025',
          term: body.term || 'Term 1',
          notes: body.notes || null,
        },
      })
  return NextResponse.json(budget, { status: 201 })
}
