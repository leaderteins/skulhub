import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest) {
  const [
    totalStudents, totalStaff, totalClasses, activeStreams,
    invoices, paymentsToday, expenses, totalBooks, activeLoans,
    announcements, activities, studentsByGender, studentsByLevel,
    attendanceRecent, feeStats, gradeDistribution
  ] = await Promise.all([
    db.student.count({ where: { status: 'Active' } }),
    db.staff.count({ where: { status: 'Active' } }),
    db.classLevel.count(),
    db.stream.count(),
    db.invoice.findMany({ select: { amount: true, amountPaid: true, balance: true, status: true } }),
    db.payment.findMany({ where: { receivedAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } }, select: { amount: true } }),
    db.expense.aggregate({ _sum: { amount: true } }),
    db.libraryBook.aggregate({ _sum: { copiesTotal: true, copiesAvailable: true }, _count: true }),
    db.bookLoan.count({ where: { status: { in: ['Borrowed', 'Overdue'] } } }),
    db.announcement.findMany({ orderBy: { publishedAt: 'desc' }, take: 6, include: {} }),
    db.activityLog.findMany({ orderBy: { createdAt: 'desc' }, take: 8 }),
    db.student.groupBy({ by: ['gender'], where: { status: 'Active' }, _count: true }),
    db.student.findMany({
      where: { status: 'Active' },
      select: { enrollments: { select: { classLevel: { select: { name: true } } } } }
    }),
    db.attendance.findMany({
      where: { date: { gte: new Date(Date.now() - 14 * 86400000) }, personType: 'Student' },
      select: { date: true, status: true }
    }),
    db.invoice.groupBy({ by: ['status'], _sum: { amount: true, balance: true }, _count: true }),
    db.grade.groupBy({ by: ['grade'], _count: true }),
  ])

  const totalBilled = invoices.reduce((s, i) => s + i.amount, 0)
  const totalCollected = invoices.reduce((s, i) => s + i.amountPaid, 0)
  const totalOutstanding = invoices.reduce((s, i) => s + i.balance, 0)
  const collectionRate = totalBilled > 0 ? (totalCollected / totalBilled) * 100 : 0
  const todayCollection = paymentsToday.reduce((s, p) => s + p.amount, 0)

  // Students by class level
  const levelCount: Record<string, number> = {}
  studentsByLevel.forEach(s => {
    const lvl = s.enrollments[0]?.classLevel?.name || 'Unassigned'
    levelCount[lvl] = (levelCount[lvl] || 0) + 1
  })

  // Attendance trend (last 14 days)
  const attByDate: Record<string, { present: number; total: number }> = {}
  attendanceRecent.forEach(a => {
    const key = new Date(a.date).toISOString().slice(0, 10)
    if (!attByDate[key]) attByDate[key] = { present: 0, total: 0 }
    attByDate[key].total++
    if (a.status === 'Present') attByDate[key].present++
  })
  const attendanceTrend = Object.entries(attByDate).sort().map(([date, v]) => ({
    date,
    rate: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0,
  }))

  // Gender distribution
  const genderDist = studentsByGender.reduce((acc, g) => {
    acc[g.gender] = g._count
    return acc
  }, {} as Record<string, number>)

  return NextResponse.json({
    stats: {
      totalStudents,
      totalStaff,
      totalClasses,
      activeStreams,
      totalBooks: totalBooks._sum.copiesTotal || 0,
      availableBooks: totalBooks._sum.copiesAvailable || 0,
      activeLoans,
    },
    finance: {
      totalBilled,
      totalCollected,
      totalOutstanding,
      collectionRate: Math.round(collectionRate * 10) / 10,
      todayCollection,
      totalExpenses: expenses._sum.amount || 0,
      feeStats: feeStats.map(f => ({ status: f.status, amount: f._sum.amount || 0, balance: f._sum.balance || 0, count: f._count })),
    },
    studentsByLevel: Object.entries(levelCount).map(([name, count]) => ({ name, count })),
    studentsByGender: Object.entries(genderDist).map(([gender, count]) => ({ gender, count })),
    attendanceTrend,
    gradeDistribution: gradeDistribution.map(g => ({ grade: g.grade, count: g._count })),
    announcements,
    activities,
  })
}
