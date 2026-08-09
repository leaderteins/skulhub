import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

// GET /api/payroll?staffId=&status=&month=&year=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const staffId = searchParams.get('staffId') || ''
  const status = searchParams.get('status') || ''
  const month = searchParams.get('month') || ''
  const year = searchParams.get('year') || ''

  const where: any = {}
  if (staffId) where.staffId = staffId
  if (status) where.status = status
  if (month) where.month = month
  if (year) where.year = Number(year)

  const [payslips, total, pending, paid, byStatus, byMonth] = await Promise.all([
    db.payslip.findMany({
      where,
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      include: {
        staff: {
          select: {
            id: true, employeeNo: true, firstName: true, lastName: true,
            role: true, department: { select: { name: true } },
            employmentType: true,
          },
        },
      },
    }),
    db.payslip.count({ where }),
    db.payslip.count({ where: { ...where, status: 'Pending' } }),
    db.payslip.count({ where: { ...where, status: 'Paid' } }),
    db.payslip.groupBy({ by: ['status'], _count: true, _sum: { netPay: true } }),
    db.payslip.groupBy({ by: ['month', 'year'], _sum: { netPay: true }, _count: true }),
  ])

  const allPayslips = await db.payslip.findMany({
    select: { netPay: true, basicSalary: true, allowances: true, deductions: true, taxPAYE: true, nssf: true, nhif: true, status: true },
  })
  const totalPayroll = allPayslips.reduce((s, p) => s + p.netPay, 0)
  const paidTotal = allPayslips.filter(p => p.status === 'Paid').reduce((s, p) => s + p.netPay, 0)
  const avgNetPay = allPayslips.length ? Math.round(totalPayroll / allPayslips.length) : 0
  const totalTax = allPayslips.reduce((s, p) => s + p.taxPAYE + p.nssf + p.nhif, 0)

  // Active staff count for reference
  const activeStaff = await db.staff.count({ where: { status: 'Active' } })

  return NextResponse.json({
    stats: {
      total,
      pending,
      paid,
      totalPayroll,
      paidTotal,
      avgNetPay,
      totalTax,
      activeStaff,
    },
    payslips: payslips.map(p => ({
      ...p,
      staffName: `${p.staff.firstName} ${p.staff.lastName}`,
      staffRole: p.staff.role,
      staffDept: p.staff.department?.name || '—',
      staff: undefined,
    })),
    byStatus: byStatus.map(s => ({
      name: s.status,
      count: s._count,
      total: s._sum.netPay || 0,
    })),
    byMonth: byMonth
      .map(m => ({ name: `${m.month} ${m.year}`, total: m._sum.netPay || 0, count: m._count }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 8),
  })
}

// POST /api/payroll — create a payslip (auto-generate payslipNo, compute netPay)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  if (!body.staffId || !body.month || !body.year) {
    return NextResponse.json({ error: 'staffId, month, and year are required' }, { status: 400 })
  }

  const basic = Number(body.basicSalary) || 0
  const allowances = Number(body.allowances) || 0
  const deductions = Number(body.deductions) || 0
  const tax = Number(body.taxPAYE) || 0
  const nssf = Number(body.nssf) || 0
  const nhif = Number(body.nhif) || 0
  const netPay = basic + allowances - deductions - tax - nssf - nhif

  // Auto-generate payslipNo: PSL-YYYYMM-XXXX
  const monthIdx = MONTHS.indexOf(body.month) + 1
  const ym = `${body.year}${String(monthIdx).padStart(2, '0')}`
  const existing = await db.payslip.count({ where: { year: Number(body.year), month: body.month } })
  const seq = String(existing + 1).padStart(4, '0')
  const payslipNo = `PSL-${ym}-${seq}`

  // Prevent duplicate payslip for same staff/month/year
  const dup = await db.payslip.findFirst({
    where: { staffId: body.staffId, month: body.month, year: Number(body.year) },
  })
  if (dup) {
    return NextResponse.json(
      { error: 'A payslip already exists for this staff member in the selected month/year.' },
      { status: 400 },
    )
  }

  const payslip = await db.payslip.create({
    data: {
      payslipNo,
      staffId: body.staffId,
      month: body.month,
      year: Number(body.year),
      basicSalary: basic,
      allowances,
      deductions,
      taxPAYE: tax,
      nssf,
      nhif,
      netPay,
      status: body.status || 'Pending',
      payDate: body.payDate ? new Date(body.payDate) : null,
    },
  })

  await db.activityLog.create({
    data: {
      action: 'CREATE',
      entity: 'Payslip',
      entityId: payslip.id,
      user: body.createdBy || 'Bursar',
      details: `Generated payslip ${payslipNo} (${body.month} ${body.year}) — net ${netPay}`,
    },
  })

  return NextResponse.json(payslip, { status: 201 })
}
