import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const ACADEMIC_YEAR = '2025'
const TERM = 'Term 1'

function startOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00.000Z`)
}
function endOfDay(dateStr: string): Date {
  return new Date(`${dateStr}T23:59:59.999Z`)
}

// GET /api/finance/payments?from=&to=&method=
// Returns recent payments with invoice + student info.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''
  const method = searchParams.get('method') || ''

  const where: any = {}
  if (from || to) {
    where.receivedAt = {}
    if (from) where.receivedAt.gte = startOfDay(from)
    if (to) where.receivedAt.lte = endOfDay(to)
  }
  if (method) where.method = method

  const payments = await db.payment.findMany({
    where,
    orderBy: { receivedAt: 'desc' },
    take: 200,
    include: {
      invoice: {
        select: {
          id: true,
          invoiceNo: true,
          student: {
            select: {
              id: true,
              admissionNo: true,
              firstName: true,
              lastName: true,
              enrollments: {
                where: { academicYear: ACADEMIC_YEAR, term: TERM },
                take: 1,
                select: { stream: { select: { name: true, classLevel: { select: { name: true } } } } },
              },
            },
          },
        },
      },
    },
  })

  // Method summary for the filter range
  const methodAgg = await db.payment.groupBy({
    by: ['method'],
    where,
    _sum: { amount: true },
    _count: { _all: true },
  })

  const result = payments.map(p => {
    const st = p.invoice?.student
    const enrollment = st?.enrollments[0]
    return {
      id: p.id,
      amount: p.amount,
      method: p.method,
      reference: p.reference || '',
      payerName: p.payerName || '',
      payerPhone: p.payerPhone || '',
      receivedBy: p.receivedBy || '',
      receivedAt: p.receivedAt,
      invoiceId: p.invoiceId,
      invoiceNo: p.invoice?.invoiceNo || '',
      studentId: st?.id || null,
      admissionNo: st?.admissionNo || '',
      studentName: st ? `${st.firstName} ${st.lastName}` : '',
      classLevel: enrollment?.stream?.classLevel?.name || '—',
      stream: enrollment?.stream?.name || '—',
    }
  })

  return NextResponse.json({
    payments: result,
    total: result.length,
    methodSummary: methodAgg.map(m => ({
      method: m.method,
      total: m._sum.amount || 0,
      count: m._count._all,
    })),
  })
}

// POST /api/finance/payments
// Records a payment against an invoice.
// Body: { invoiceId, amount, method, reference, payerName, payerPhone }
// Updates invoice.amountPaid, balance, status accordingly. Returns updated invoice + payment.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { invoiceId, amount, method, reference, payerName, payerPhone } = body as {
      invoiceId: string
      amount: number
      method: string
      reference?: string
      payerName?: string
      payerPhone?: string
    }

    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 })
    }
    const amt = Number(amount)
    if (!Number.isFinite(amt) || amt <= 0) {
      return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 })
    }

    const invoice = await db.invoice.findUnique({ where: { id: invoiceId } })
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const newAmountPaid = invoice.amountPaid + amt
    const newBalance = Math.max(0, invoice.amount - newAmountPaid)

    // Determine new status
    let status = invoice.status
    if (invoice.status !== 'Cancelled') {
      if (newBalance <= 0.0001) status = 'Paid'
      else if (newAmountPaid > 0) status = 'Partially Paid'
      else status = 'Unpaid'
    }

    // Run payment creation + invoice update in a transaction
    const [payment, updatedInvoice] = await db.$transaction([
      db.payment.create({
        data: {
          invoiceId: invoice.id,
          studentId: invoice.studentId,
          amount: amt,
          method: method || 'Cash',
          reference: reference || null,
          payerName: payerName || null,
          payerPhone: payerPhone || null,
          receivedBy: 'Bursar',
          receivedAt: new Date(),
        },
      }),
      db.invoice.update({
        where: { id: invoice.id },
        data: {
          amountPaid: newAmountPaid,
          balance: newBalance,
          status,
        },
      }),
    ])

    try {
      await db.activityLog.create({
        data: {
          action: 'PAYMENT',
          entity: 'Payment',
          entityId: payment.id,
          user: 'Bursar',
          details: `Recorded ${method} payment of KES ${amt} for ${invoice.invoiceNo}`,
        },
      })
    } catch {
      // ignore log errors
    }

    return NextResponse.json({
      payment: {
        id: payment.id,
        amount: payment.amount,
        method: payment.method,
        reference: payment.reference,
        payerName: payment.payerName,
        payerPhone: payment.payerPhone,
        receivedBy: payment.receivedBy,
        receivedAt: payment.receivedAt,
      },
      invoice: {
        id: updatedInvoice.id,
        invoiceNo: updatedInvoice.invoiceNo,
        amount: updatedInvoice.amount,
        amountPaid: updatedInvoice.amountPaid,
        balance: updatedInvoice.balance,
        status: updatedInvoice.status,
      },
    }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to record payment' }, { status: 500 })
  }
}
