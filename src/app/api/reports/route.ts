import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// ---------------------------------------------------------------------------
// GET /api/reports
// Returns a comprehensive analytics bundle covering enrollment, attendance,
// academics, finance, library, staff distribution, and recent activity.
// ---------------------------------------------------------------------------
export async function GET() {
  const KCSE_ORDER = ['A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'E']

  const now = new Date()
  const last30 = new Date(now.getTime() - 29 * 86400000)
  const startOfToday = new Date(now)
  startOfToday.setHours(0, 0, 0, 0)
  const endOfToday = new Date(now)
  endOfToday.setHours(23, 59, 59, 999)

  // Six-month window for finance trends
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
  const startOfMonth6 = new Date(sixMonthsAgo.getFullYear(), sixMonthsAgo.getMonth(), 1)

  const [
    students,
    studentsByGender,
    classLevels,
    staffByRole,
    staffByDepartment,
    books,
    bookLoansThisMonth,
    overdueLoans,
    attendanceRecords,
    streams,
    invoices,
    payments,
    expenses,
    activities,
    exams,
    latestExamGrades,
  ] = await Promise.all([
    db.student.findMany({
      where: { status: 'Active' },
      select: {
        id: true,
        gender: true,
        boarding: true,
        enrollments: {
          where: { status: 'Active' },
          select: {
            classLevel: { select: { id: true, name: true, stage: true } },
          },
          take: 1,
        },
      },
    }),
    db.student.groupBy({ by: ['gender'], where: { status: 'Active' }, _count: true }),
    db.classLevel.findMany({
      orderBy: { order: 'asc' },
      select: {
        id: true,
        name: true,
        stage: true,
        order: true,
        capacity: true,
        enrollments: {
          where: { status: 'Active' },
          select: { studentId: true },
        },
      },
    }),
    db.staff.groupBy({ by: ['role'], _count: true }),
    db.staff.groupBy({ by: ['departmentId'], _count: true }),
    db.libraryBook.findMany({
      select: { category: true, copiesTotal: true, copiesAvailable: true },
    }),
    db.bookLoan.count({
      where: {
        borrowDate: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
      },
    }),
    db.bookLoan.count({
      where: {
        status: { in: ['Borrowed', 'Overdue'] },
        dueDate: { lt: now },
        returnDate: null,
      },
    }),
    db.attendance.findMany({
      where: {
        personType: 'Student',
        date: { gte: last30 },
      },
      select: { date: true, status: true },
    }),
    db.stream.findMany({
      select: {
        id: true,
        name: true,
        classLevel: { select: { name: true } },
        enrollments: {
          where: { status: 'Active' },
          select: { studentId: true },
        },
      },
    }),
    db.invoice.findMany({
      select: {
        id: true,
        amount: true,
        amountPaid: true,
        balance: true,
        status: true,
        issueDate: true,
        student: {
          select: {
            enrollments: {
              where: { status: 'Active' },
              select: {
                classLevel: { select: { name: true } },
              },
              take: 1,
            },
          },
        },
      },
    }),
    db.payment.findMany({
      where: { receivedAt: { gte: startOfMonth6 } },
      select: { amount: true, receivedAt: true },
    }),
    db.expense.findMany({
      where: { date: { gte: startOfMonth6 } },
      select: { amount: true, date: true, category: true },
    }),
    db.activityLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    db.exam.findMany({
      orderBy: { startDate: 'desc' },
      select: { id: true, name: true, academicYear: true, term: true, examType: true },
      take: 5,
    }),
    // Grades for the most recent exam (computed below)
    db.grade.findMany({
      select: {
        marks: true,
        grade: true,
        points: true,
        subjectId: true,
        subject: { select: { id: true, name: true, code: true } },
      },
    }),
  ])

  // -------------------------------------------------------------------------
  // 1. Enrollment trends
  // -------------------------------------------------------------------------
  const genderDist = studentsByGender.map((g) => ({
    gender: g.gender,
    count: g._count,
  }))

  const enrollmentByLevel = classLevels.map((cl) => ({
    id: cl.id,
    name: cl.name,
    stage: cl.stage,
    capacity: cl.capacity,
    enrolled: cl.enrollments.length,
  }))

  const boardingCount = students.filter((s) => s.boarding).length
  const dayScholarCount = students.length - boardingCount

  // -------------------------------------------------------------------------
  // 2. Attendance summary (last 30 days)
  // -------------------------------------------------------------------------
  const byDate: Record<string, { present: number; total: number }> = {}
  attendanceRecords.forEach((r) => {
    const key = new Date(r.date).toISOString().slice(0, 10)
    if (!byDate[key]) byDate[key] = { present: 0, total: 0 }
    byDate[key].total++
    if (r.status === 'Present') byDate[key].present++
  })
  const attendanceTrend = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      rate: v.total > 0 ? Math.round((v.present / v.total) * 1000) / 10 : 0,
    }))

  const totalAttRecords = attendanceRecords.length
  const totalPresent = attendanceRecords.filter((r) => r.status === 'Present').length
  const overallRate =
    totalAttRecords > 0
      ? Math.round((totalPresent / totalAttRecords) * 1000) / 10
      : 0

  // By stream: count distinct students present vs enrolled (last 30d, from same records aggregated above)
  // We approximate "by stream" using enrollments and attendance records — but since
  // attendance records lack stream here, we compute by total enrolled + today's rate.
  // For richer detail we re-query today's per-stream attendance:
  const todayAttendance = await db.attendance.findMany({
    where: {
      personType: 'Student',
      date: { gte: startOfToday, lte: endOfToday },
    },
    select: { studentId: true, status: true },
  })
  const todayByStudent = new Map<string, string>()
  todayAttendance.forEach((r) => {
    if (r.studentId) todayByStudent.set(r.studentId, r.status)
  })

  const attendanceByStream = streams.map((s) => {
    const ids = s.enrollments.map((e) => e.studentId)
    let present = 0
    let absent = 0
    let late = 0
    ids.forEach((sid) => {
      const st = todayByStudent.get(sid)
      if (st === 'Present') present++
      else if (st === 'Absent') absent++
      else if (st === 'Late') late++
    })
    const marked = present + absent + late
    return {
      streamId: s.id,
      streamName: s.name,
      classLevelName: s.classLevel?.name || '',
      enrolled: ids.length,
      present,
      absent,
      late,
      rate: marked > 0 ? Math.round(((present + late) / marked) * 1000) / 10 : 0,
    }
  })

  // -------------------------------------------------------------------------
  // 3. Academic performance
  // -------------------------------------------------------------------------
  const latestExam = exams[0] || null

  // Group grades by subject (compute avg marks) for top/bottom
  const subjectAgg: Record<
    string,
    { subjectId: string; subjectName: string; subjectCode: string; totalMarks: number; count: number }
  > = {}
  latestExamGrades.forEach((g) => {
    const sid = g.subjectId
    if (!subjectAgg[sid]) {
      subjectAgg[sid] = {
        subjectId: sid,
        subjectName: g.subject.name,
        subjectCode: g.subject.code,
        totalMarks: 0,
        count: 0,
      }
    }
    subjectAgg[sid].totalMarks += g.marks || 0
    subjectAgg[sid].count++
  })

  // Grade distribution for latest exam (KCSE order)
  let latestExamGradeRows = latestExamGrades
  if (latestExam) {
    // Fetch exam-scoped grades separately for distribution
    latestExamGradeRows = await db.grade.findMany({
      where: { examId: latestExam.id },
      select: {
        grade: true,
        marks: true,
        points: true,
        subjectId: true,
        subject: { select: { id: true, name: true, code: true } },
      },
    })
  }

  const gradeCount: Record<string, number> = {}
  KCSE_ORDER.forEach((g) => (gradeCount[g] = 0))
  latestExamGradeRows.forEach((g) => {
    const gr = (g.grade || '').toUpperCase()
    if (gradeCount[gr] !== undefined) gradeCount[gr]++
  })
  const gradeDistribution = KCSE_ORDER.map((g) => ({ grade: g, count: gradeCount[g] }))

  // Subject performance (avg marks) — for latest exam
  const subjectAggLatest: Record<
    string,
    { subjectId: string; subjectName: string; subjectCode: string; totalMarks: number; count: number }
  > = {}
  latestExamGradeRows.forEach((g) => {
    const sid = g.subject.id
    if (!subjectAggLatest[sid]) {
      subjectAggLatest[sid] = {
        subjectId: sid,
        subjectName: g.subject.name,
        subjectCode: g.subject.code,
        totalMarks: 0,
        count: 0,
      }
    }
    subjectAggLatest[sid].totalMarks += g.marks || 0
    subjectAggLatest[sid].count++
  })

  const subjectPerf = Object.values(subjectAggLatest)
    .map((s) => ({
      subjectId: s.subjectId,
      subjectName: s.subjectName,
      subjectCode: s.subjectCode,
      avg: s.count > 0 ? Math.round((s.totalMarks / s.count) * 10) / 10 : 0,
      count: s.count,
    }))
    .sort((a, b) => b.avg - a.avg)

  const topSubjects = subjectPerf.slice(0, 5)
  const bottomSubjects = [...subjectPerf].reverse().slice(0, 5)

  // Overall subject perf (across all grades) for additional context
  const subjectPerfAll = Object.values(subjectAgg)
    .map((s) => ({
      subjectId: s.subjectId,
      subjectName: s.subjectName,
      subjectCode: s.subjectCode,
      avg: s.count > 0 ? Math.round((s.totalMarks / s.count) * 10) / 10 : 0,
      count: s.count,
    }))
    .sort((a, b) => b.avg - a.avg)

  // -------------------------------------------------------------------------
  // 4. Financial summary
  // -------------------------------------------------------------------------
  const totalBilled = invoices.reduce((s, i) => s + i.amount, 0)
  const totalCollected = invoices.reduce((s, i) => s + i.amountPaid, 0)
  const totalOutstanding = invoices.reduce((s, i) => s + i.balance, 0)
  const collectionRate =
    totalBilled > 0 ? Math.round((totalCollected / totalBilled) * 1000) / 10 : 0

  // Monthly revenue vs expense (last 6 months)
  const monthLabels: { key: string; label: string }[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    monthLabels.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('en-KE', { month: 'short', year: '2-digit' }),
    })
  }
  monthLabels.reverse()

  const revByMonth: Record<string, number> = {}
  const expByMonth: Record<string, number> = {}
  payments.forEach((p) => {
    const d = new Date(p.receivedAt)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    revByMonth[key] = (revByMonth[key] || 0) + p.amount
  })
  expenses.forEach((e) => {
    const d = new Date(e.date)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    expByMonth[key] = (expByMonth[key] || 0) + e.amount
  })

  const monthlyFinance = monthLabels.map((m) => ({
    month: m.label,
    revenue: revByMonth[m.key] || 0,
    expense: expByMonth[m.key] || 0,
  }))

  // Outstanding by class level
  const outstandingByLevel: Record<string, number> = {}
  invoices.forEach((i) => {
    const lvl = i.student?.enrollments?.[0]?.classLevel?.name || 'Unassigned'
    outstandingByLevel[lvl] = (outstandingByLevel[lvl] || 0) + i.balance
  })
  const outstandingByClassLevel = Object.entries(outstandingByLevel)
    .map(([level, amount]) => ({ level, amount }))
    .sort((a, b) => b.amount - a.amount)

  // Expense breakdown by category (last 6 months)
  const expByCat: Record<string, number> = {}
  expenses.forEach((e) => {
    expByCat[e.category] = (expByCat[e.category] || 0) + e.amount
  })
  const expenseBreakdown = Object.entries(expByCat)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount)

  // -------------------------------------------------------------------------
  // 5. Library stats
  // -------------------------------------------------------------------------
  const bookByCat: Record<string, { total: number; available: number }> = {}
  books.forEach((b) => {
    if (!bookByCat[b.category]) bookByCat[b.category] = { total: 0, available: 0 }
    bookByCat[b.category].total += b.copiesTotal || 0
    bookByCat[b.category].available += b.copiesAvailable || 0
  })
  const booksByCategory = Object.entries(bookByCat)
    .map(([category, v]) => ({ category, total: v.total, available: v.available }))
    .sort((a, b) => b.total - a.total)

  // Loans trend (last 6 months — count by borrow month)
  const loansByMonthRaw = await db.bookLoan.findMany({
    where: { borrowDate: { gte: startOfMonth6 } },
    select: { borrowDate: true, status: true },
  })
  const loansByMonth: Record<string, number> = {}
  loansByMonthRaw.forEach((l) => {
    const d = new Date(l.borrowDate)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    loansByMonth[key] = (loansByMonth[key] || 0) + 1
  })
  const loansTrend = monthLabels.map((m) => ({
    month: m.label,
    loans: loansByMonth[m.key] || 0,
  }))

  // -------------------------------------------------------------------------
  // 6. Staff distribution
  // -------------------------------------------------------------------------
  const staffByRoleAgg = staffByRole
    .map((r) => ({ role: r.role, count: r._count }))
    .sort((a, b) => b.count - a.count)

  const deptIds = staffByDepartment
    .map((d) => d.departmentId)
    .filter(Boolean) as string[]
  const depts = await db.department.findMany({
    where: { id: { in: deptIds } },
    select: { id: true, name: true },
  })
  const deptNameById = new Map(depts.map((d) => [d.id, d.name]))
  const staffByDeptAgg = staffByDepartment
    .map((d) => ({
      name: (d.departmentId && deptNameById.get(d.departmentId)) || 'Unassigned',
      count: d._count,
    }))
    .sort((a, b) => b.count - a.count)

  // -------------------------------------------------------------------------
  // Build response
  // -------------------------------------------------------------------------
  return NextResponse.json({
    generatedAt: now.toISOString(),
    enrollment: {
      totalStudents: students.length,
      gender: genderDist,
      byClassLevel: enrollmentByLevel,
      boarding: boardingCount,
      dayScholars: dayScholarCount,
    },
    attendance: {
      overallRate,
      trend: attendanceTrend,
      byStream: attendanceByStream,
      totalRecords: totalAttRecords,
    },
    academics: {
      latestExam,
      gradeDistribution,
      topSubjects,
      bottomSubjects,
      subjectPerformanceAll: subjectPerfAll.slice(0, 10),
      totalGrades: latestExamGradeRows.length,
    },
    finance: {
      totalBilled,
      totalCollected,
      totalOutstanding,
      collectionRate,
      monthly: monthlyFinance,
      outstandingByClassLevel,
      expenseBreakdown,
      totalExpenses6M: expenses.reduce((s, e) => s + e.amount, 0),
    },
    library: {
      booksByCategory,
      loansThisMonth: bookLoansThisMonth,
      overdueCount: overdueLoans,
      loansTrend,
      totalCopies: books.reduce((s, b) => s + b.copiesTotal, 0),
      availableCopies: books.reduce((s, b) => s + b.copiesAvailable, 0),
    },
    staff: {
      byRole: staffByRoleAgg,
      byDepartment: staffByDeptAgg,
      total: staffByRoleAgg.reduce((s, r) => s + r.count, 0),
    },
    activities,
  })
}
