import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const CATEGORIES = ['Salaries', 'Utilities', 'Maintenance', 'Supplies', 'Transport', 'Other']

// GET /api/finance/expenses?category=&month=&limit=
// Returns expenses + category summary + monthly trend + budget comparison
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') || ''
  const month = searchParams.get('month') // YYYY-MM
  const limit = Math.min(500, Math.max(1, parseInt(searchParams.get('limit') || '200', 10)))

  const where: any = {}
  if (category) where.category = category
  if (month) {
    const [y, m] = month.split('-').map(Number)
    const start = new Date(y, m - 1, 1)
    const end = new Date(y, m, 0, 23, 59, 59)
    where.date = { gte: start, lte: end }
  }

  const [expenses, byCategoryAgg, budgets, monthlyTrend, totalCount] = await Promise.all([
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
    db.budget.findMany(),
    db.expense.findMany({
      select: { date: true, amount: true, category: true },
    }),
    db.expense.count({ where }),
  ])

  // Build monthly trend (last 6 months)
  const trendMap: Record<string, number> = {}
  monthlyTrend.forEach(e => {
    const key = new Date(e.date).toISOString().slice(0, 7)
    trendMap[key] = (trendMap[key] || 0) + e.amount
  })
  const now = new Date()
  const monthly = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = d.toISOString().slice(0, 7)
    monthly.push({
      month: d.toLocaleDateString('en-KE', { month: 'short', year: '2-digit' }),
      amount: trendMap[key] || 0,
    })
  }

  // Budget vs actual comparison
  const budgetComparison = CATEGORIES.map(cat => {
    const budget = budgets.find(b => b.category === cat)
    const actual = byCategoryAgg.find(g => g.category === cat)
    const budgetAmount = budget?.amount || 0
    const actualAmount = actual?._sum.amount || 0
    const variance = budgetAmount - actualAmount
    const utilization = budgetAmount > 0 ? Math.round((actualAmount / budgetAmount) * 100) : 0
    return {
      category: cat,
      budget: budgetAmount,
      actual: actualAmount,
      variance,
      utilization,
      count: actual?._count._all || 0,
    }
  })

  const total = expenses.reduce((s, e) => s + e.amount, 0)
  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0)

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
    totalCount,
    byCategory: byCategoryAgg.map(g => ({
      category: g.category,
      total: g._sum.amount || 0,
      count: g._count._all,
    })),
    budgets: budgetComparison,
    monthlyTrend: monthly,
    totalBudget,
    totalActual: budgetComparison.reduce((s, b) => s + b.actual, 0),
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
