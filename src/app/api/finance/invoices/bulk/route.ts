import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

/**
 * POST /api/finance/invoices/bulk
 * Generate invoices for all students in a class level (auto-billing).
 *
 * Body: {
 *   classLevelId: string,     // which class/grade to bill
 *   amount: number,           // fee amount per student
 *   term: string,             // e.g. "Term 1"
 *   academicYear: string,     // e.g. "2025"
 *   dueDate: string,          // ISO date
 *   description?: string,     // optional description
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const body = await req.json()
    const { classLevelId, amount, term, academicYear, dueDate, description } = body

    if (!classLevelId || !amount || !term || !academicYear || !dueDate) {
      return NextResponse.json(
        { error: 'classLevelId, amount, term, academicYear, and dueDate are required' },
        { status: 400 }
      )
    }

    // Find all active students in this class level
    const students = await db.student.findMany({
      where: {
        status: 'Active',
        enrollments: { some: { classLevelId } },
      },
      select: { id: true, admissionNo: true, firstName: true, lastName: true },
    })

    if (students.length === 0) {
      return NextResponse.json({ error: 'No active students found in this class level' }, { status: 404 })
    }

    // Get the highest invoice number to continue from
    const lastInvoice = await db.invoice.findFirst({
      orderBy: { invoiceNo: 'desc' },
      select: { invoiceNo: true },
    })
    let invNum = lastInvoice ? parseInt(lastInvoice.invoiceNo.replace(/\D/g, '')) + 1 : 10001

    const issueDate = new Date()
    const parsedDueDate = new Date(dueDate)
    const feeAmount = Number(amount)
    const desc = description || `School Fees — ${term} ${academicYear}`

    // Create invoices for each student
    const created = []
    for (const student of students) {
      const invoiceNo = `INV/${invNum++}`
      try {
        const invoice = await db.invoice.create({
          data: {
            invoiceNo,
            studentId: student.id,
            schoolId: user.schoolId,
            amount: feeAmount,
            amountPaid: 0,
            balance: feeAmount,
            status: 'Unpaid',
            academicYear,
            term,
            issueDate,
            dueDate: parsedDueDate,
          },
        })
        created.push(invoice)
      } catch (e) {
        console.error(`Failed to create invoice for ${student.admissionNo}:`, e)
      }
    }

    await db.activityLog.create({
      data: {
        action: 'CREATE',
        entity: 'Invoice',
        entityId: null,
        user: user.name,
        details: `Generated ${created.length} invoices for ${term} ${academicYear}`,
      },
    }).catch(() => {})

    return NextResponse.json({
      success: true,
      count: created.length,
      totalAmount: created.length * feeAmount,
      message: `${created.length} invoices generated for ${term} ${academicYear} (KES ${created.length * feeAmount} total)`,
    }, { status: 201 })
  } catch (error) {
    console.error('[bulk invoices POST] error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Failed to generate invoices', details: msg.slice(0, 200) },
      { status: 500 }
    )
  }
}
