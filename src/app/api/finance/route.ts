import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/finance — Finance overview
// Returns: total billed, collected, outstanding, today's collection,
// expenses total, collection rate, invoices by status, payments by method
// (last 30 days grouped), monthly revenue vs expenses trend (last 6 months).
export async function GET() {
  // ---- Invoices: billed / collected / outstanding ----
  const invoices = await db.invoice.findMany({
    where: { status: { not: 'Cancelled' } },
    select: { amount: true, amountPaid: true, balance: true, status: true },
  })
  const totalBilled = invoices.reduce((s, i) => s + i.amount, 0)
  const totalCollected = invoices.reduce((s, i) => s + i.amountPaid, 0)
  const totalOutstanding = invoices.reduce((s, i) => s + i.balance, 0)

  // ---- Invoices by status ----
  const statusBuckets: Record<string, number> = {}
  for (const i of invoices) statusBuckets[i.status] = (statusBuckets[i.status] || 0) + 1

  // ---- Today's collection ----
  const startToday = new Date()
  startToday.setHours(0, 0, 0, 0)
  const endToday = new Date()
  endToday.setHours(23, 59, 59, 999)
  const todayPayments = await db.payment.findMany({
    where: { receivedAt: { gte: startToday, lte: endToday } },
    select: { amount: true, method: true },
  })
  const todayCollection = todayPayments.reduce((s, p) => s + p.amount, 0)

  // ---- Payments by method (last 30 days) ----
  const since30 = new Date()
  since30.setDate(since30.getDate() - 30)
  since30.setHours(0, 0, 0, 0)
  const recentPayments = await db.payment.findMany({
    where: { receivedAt: { gte: since30 } },
    select: { amount: true, method: true },
  })
  const methodBuckets: Record<string, { count: number; total: number }> = {}
  for (const p of recentPayments) {
    if (!methodBuckets[p.method]) methodBuckets[p.method] = { count: 0, total: 0 }
    methodBuckets[p.method].count += 1
    methodBuckets[p.method].total += p.amount
  }
  const paymentsByMethod = Object.entries(methodBuckets).map(([method, v]) => ({
    method,
    count: v.count,
    total: v.total,
  }))

  // ---- Expenses total ----
  const expensesAgg = await db.expense.aggregate({ _sum: { amount: true } })
  const totalExpenses = expensesAgg._sum.amount || 0

  // ---- Monthly revenue vs expenses (last 6 months) ----
  const months: { label: string; key: string; year: number; month: number }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      label: d.toLocaleString('en-KE', { month: 'short' }),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      year: d.getFullYear(),
      month: d.getMonth(),
    })
  }

  // Revenue: sum of payments in each month
  const allPayments = await db.payment.findMany({
    where: { receivedAt: { gte: new Date(months[0].year, months[0].month, 1) } },
    select: { amount: true, receivedAt: true },
  })
  const revenueByMonth: Record<string, number> = {}
  for (const p of allPayments) {
    const key = `${p.receivedAt.getFullYear()}-${String(p.receivedAt.getMonth() + 1).padStart(2, '0')}`
    revenueByMonth[key] = (revenueByMonth[key] || 0) + p.amount
  }

  const allExpenses = await db.expense.findMany({
    where: { date: { gte: new Date(months[0].year, months[0].month, 1) } },
    select: { amount: true, date: true },
  })
  const expenseByMonth: Record<string, number> = {}
  for (const e of allExpenses) {
    const key = `${e.date.getFullYear()}-${String(e.date.getMonth() + 1).padStart(2, '0')}`
    expenseByMonth[key] = (expenseByMonth[key] || 0) + e.amount
  }

  const trend = months.map(m => ({
    month: m.label,
    revenue: Math.round(revenueByMonth[m.key] || 0),
    expenses: Math.round(expenseByMonth[m.key] || 0),
  }))

  // ---- Collection rate ----
  const collectionRate = totalBilled > 0
    ? Math.round((totalCollected / totalBilled) * 100)
    : 0

  // ---- Expenses by category (extra context for the UI) ----
  const expensesByCategoryAgg = await db.expense.groupBy({
    by: ['category'],
    _sum: { amount: true },
    _count: { _all: true },
  })
  const expensesByCategory = expensesByCategoryAgg.map(g => ({
    category: g.category,
    total: g._sum.amount || 0,
    count: g._count._all,
  }))

  return NextResponse.json({
    totalBilled: Math.round(totalBilled),
    totalCollected: Math.round(totalCollected),
    totalOutstanding: Math.round(totalOutstanding),
    todayCollection: Math.round(todayCollection),
    totalExpenses: Math.round(totalExpenses),
    collectionRate,
    invoicesByStatus: Object.entries(statusBuckets).map(([status, count]) => ({ status, count })),
    paymentsByMethod,
    trend,
    expensesByCategory,
    counts: {
      invoices: invoices.length,
      payments: recentPayments.length,
    },
  })
}
