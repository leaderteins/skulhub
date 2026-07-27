import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const CATEGORIES = ['Salaries', 'Utilities', 'Maintenance', 'Supplies', 'Transport', 'Other']

// GET /api/finance/expenses?category=
// Returns expenses with optional filter by category, plus a category summary.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') || ''
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '200', 10)))

  const where: any = {}
  if (category) where.category = category

  const [expenses, byCategoryAgg] = await Promise.all([
    db.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      take: limit,
    }),
    db.expense.groupBy({
      by: ['category'],
      _sum: { amount: true },
      _count: { _all: true },
    }),
  ])

  const byCategory = byCategoryAgg.map(g => ({
    category: g.category,
    total: g._sum.amount || 0,
    count: g._count._all,
  }))

  const total = expenses.reduce((s, e) => s + e.amount, 0)

  return NextResponse.json({
    expenses: expenses.map(e => ({
      id: e.id,
      category: e.category,
      description: e.description,
      amount: e.amount,
      date: e.date,
      paymentMethod: e.paymentMethod,
      recipient: e.recipient || '',
    })),
    total,
    byCategory,
  })
}

// POST /api/finance/expenses
// Body: { category, description, amount, date, paymentMethod, recipient }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { category, description, amount, date, paymentMethod, recipient } = body as {
      category: string
      description: string
      amount: number
      date?: string
      paymentMethod?: string
      recipient?: string
    }

    if (!category || !CATEGORIES.includes(category)) {
      return NextResponse.json({ error: 'category is required and must be one of: ' + CATEGORIES.join(', ') }, { status: 400 })
    }
    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'description is required' }, { status: 400 })
    }
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
    }

    const expense = await db.expense.create({
      data: {
        category,
        description: description.trim(),
        amount: amt,
        date: date ? new Date(date) : new Date(),
        paymentMethod: paymentMethod || 'Cash',
        recipient: recipient || null,
      },
    })

    try {
      await db.activityLog.create({
        data: {
          action: 'CREATE',
          entity: 'Expense',
          entityId: expense.id,
          user: 'Bursar',
          details: `Recorded ${category} expense of KES ${amt}`,
        },
      })
    } catch {
      // ignore log errors
    }

    return NextResponse.json({
      id: expense.id,
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      date: expense.date,
      paymentMethod: expense.paymentMethod,
      recipient: expense.recipient || '',
    }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create expense' }, { status: 500 })
  }
}
