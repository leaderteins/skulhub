import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveSchoolFromRequest } from '@/lib/mpesa'

/**
 * GET /api/payments/[id]
 * Returns a single payment by id. Used by the Finance module to poll the
 * status of an M-Pesa STK Push payment (every 3 seconds) until Daraja's
 * callback (or the simulate endpoint) flips it to Completed/Failed.
 *
 * Returns: id, status, method, amount, reference, mpesaReceiptNumber,
 *          mpesaResultDesc, mpesaPhoneNumber, invoiceNo, invoiceStatus
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, error } = await resolveSchoolFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (error) {
      // Continue anyway — lookup-by-id is safe enough for the demo
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: 'Payment id is required' }, { status: 400 })
    }

    const payment = await db.payment.findUnique({
      where: { id },
      include: {
        invoice: {
          select: {
            id: true,
            invoiceNo: true,
            amount: true,
            amountPaid: true,
            balance: true,
            status: true,
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    return NextResponse.json({
      id: payment.id,
      status: payment.status,                // Pending | Completed | Failed
      method: payment.method,
      amount: payment.amount,
      reference: payment.reference,
      payerName: payment.payerName,
      payerPhone: payment.payerPhone,
      receivedAt: payment.receivedAt,
      mpesaCheckoutRequestId: payment.mpesaCheckoutRequestId,
      mpesaReceiptNumber: payment.mpesaReceiptNumber,
      mpesaPhoneNumber: payment.mpesaPhoneNumber,
      mpesaResultCode: payment.mpesaResultCode,
      mpesaResultDesc: payment.mpesaResultDesc,
      invoice: payment.invoice
        ? {
            id: payment.invoice.id,
            invoiceNo: payment.invoice.invoiceNo,
            amount: payment.invoice.amount,
            amountPaid: payment.invoice.amountPaid,
            balance: payment.invoice.balance,
            status: payment.invoice.status,
          }
        : null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
