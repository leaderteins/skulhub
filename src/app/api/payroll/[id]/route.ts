import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/payroll/[id] — single payslip detail
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payslip = await db.payslip.findUnique({
    where: { id },
    include: {
      staff: {
        select: {
          id: true, employeeNo: true, firstName: true, lastName: true, email: true,
          phone: true, role: true, employmentType: true, salary: true,
          department: { select: { name: true } },
        },
      },
    },
  })
  if (!payslip) return NextResponse.json({ error: 'Payslip not found' }, { status: 404 })
  return NextResponse.json(payslip)
}

// PUT /api/payroll/[id] — update status (approve/pay) or edit fields
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  const data: Record<string, unknown> = {}

  if (body.status !== undefined) {
    const allowed = ['Pending', 'Approved', 'Paid']
    if (!allowed.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }
    data.status = body.status
    // When marking Paid, set payDate if not provided
    if (body.status === 'Paid') {
      data.payDate = body.payDate ? new Date(body.payDate) : new Date()
    }
  }

  if (body.basicSalary !== undefined) data.basicSalary = Number(body.basicSalary)
  if (body.allowances !== undefined) data.allowances = Number(body.allowances)
  if (body.deductions !== undefined) data.deductions = Number(body.deductions)
  if (body.taxPAYE !== undefined) data.taxPAYE = Number(body.taxPAYE)
  if (body.nssf !== undefined) data.nssf = Number(body.nssf)
  if (body.nhif !== undefined) data.nhif = Number(body.nhif)

  // Recalculate netPay if any money field changed
  if (
    body.basicSalary !== undefined ||
    body.allowances !== undefined ||
    body.deductions !== undefined ||
    body.taxPAYE !== undefined ||
    body.nssf !== undefined ||
    body.nhif !== undefined
  ) {
    const existing = await db.payslip.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Payslip not found' }, { status: 404 })
    const basic = Number(data.basicSalary ?? existing.basicSalary)
    const allowances = Number(data.allowances ?? existing.allowances)
    const deductions = Number(data.deductions ?? existing.deductions)
    const tax = Number(data.taxPAYE ?? existing.taxPAYE)
    const nssf = Number(data.nssf ?? existing.nssf)
    const nhif = Number(data.nhif ?? existing.nhif)
    data.netPay = basic + allowances - deductions - tax - nssf - nhif
  }

  const updated = await db.payslip.update({ where: { id }, data })

  await db.activityLog.create({
    data: {
      action: 'UPDATE',
      entity: 'Payslip',
      entityId: id,
      user: body.updatedBy || 'Bursar',
      details: body.status
        ? `Payslip ${updated.payslipNo} marked as ${body.status}`
        : `Payslip ${updated.payslipNo} updated`,
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/payroll/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const payslip = await db.payslip.delete({ where: { id } })
  await db.activityLog.create({
    data: {
      action: 'DELETE',
      entity: 'Payslip',
      entityId: id,
      user: 'Bursar',
      details: `Deleted payslip ${payslip.payslipNo}`,
    },
  })
  return NextResponse.json({ success: true })
}
