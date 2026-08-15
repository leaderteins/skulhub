import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { parseCallback } from '@/lib/mpesa'

/**
 * POST /api/mpesa/callback
 * Public Daraja callback endpoint. Daraja POSTs the result of an STK Push
 * here after the customer approves/declines the prompt on their phone.
 *
 * This route is unauthenticated — Daraja has no session token. We trust the
 * CheckoutRequestID match (which only Daraja + our DB know).
 *
 * Flow:
 *   1. Parse the callback body.
 *   2. Find the Payment by CheckoutRequestID.
 *   3. If ResultCode === 0 (success):
 *        - Update Payment: status=Completed, mpesaReceiptNumber, mpesaResultCode/Desc
 *        - Update linked Invoice: amountPaid += amount, balance = max(0, total-paid),
 *          status = Paid | Partially Paid | Unpaid
 *   4. If ResultCode !== 0 (failure / cancellation):
 *        - Update Payment: status=Failed, mpesaResultCode/Desc
 *        - Leave invoice untouched
 */
export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const parsed = parseCallback(body)
  if (!parsed || !parsed.checkoutRequestId) {
    // Still acknowledge so Daraja doesn't retry indefinitely
    return NextResponse.json({ ok: false, error: 'Could not parse callback' })
  }

  try {
    const payment = await db.payment.findFirst({
      where: { mpesaCheckoutRequestId: parsed.checkoutRequestId },
      include: { invoice: true },
    })

    if (!payment) {
      // Unknown CheckoutRequestID — likely a stale or test callback
      return NextResponse.json({ ok: false, error: 'Payment not found for CheckoutRequestID' })
    }

    // Idempotency: if already processed, just ack
    if (payment.status === 'Completed' || payment.status === 'Failed') {
      return NextResponse.json({ ok: true, message: 'Already processed', status: payment.status })
    }

    if (parsed.success && parsed.mpesaReceiptNumber) {
      // --- Success: complete the payment + update invoice --------------------
      const [updatedPayment, updatedInvoice] = await db.$transaction([
        db.payment.update({
          where: { id: payment.id },
          data: {
            status: 'Completed',
            reference: parsed.mpesaReceiptNumber,
            mpesaReceiptNumber: parsed.mpesaReceiptNumber,
            mpesaResultCode: String(parsed.resultCode),
            mpesaResultDesc: parsed.resultDesc,
            mpesaPhoneNumber: parsed.phoneNumber || payment.mpesaPhoneNumber,
            receivedAt: new Date(),
          },
        }),
        db.invoice.update({
          where: { id: payment.invoiceId },
          data: (() => {
            const newAmountPaid = payment.invoice.amountPaid + payment.amount
            const newBalance = Math.max(0, payment.invoice.amount - newAmountPaid)
            let status = payment.invoice.status
            if (payment.invoice.status !== 'Cancelled') {
              if (newBalance <= 0.0001) status = 'Paid'
              else if (newAmountPaid > 0) status = 'Partially Paid'
              else status = 'Unpaid'
            }
            return {
              amountPaid: newAmountPaid,
              balance: newBalance,
              status,
            }
          })(),
        }),
      ])

      try {
        await db.activityLog.create({
          data: {
            action: 'MPESA_CALLBACK_SUCCESS',
            entity: 'Payment',
            entityId: updatedPayment.id,
            user: 'Daraja Callback',
            details: `M-Pesa ${parsed.mpesaReceiptNumber} · KES ${payment.amount} · Invoice ${updatedInvoice.invoiceNo} → ${updatedInvoice.status}`,
          },
        })
      } catch {
        // ignore log errors
      }

      return NextResponse.json({
        ok: true,
        status: 'Completed',
        receipt: parsed.mpesaReceiptNumber,
        invoiceStatus: updatedInvoice.status,
      })
    } else {
      // --- Failure: customer declined, wrong PIN, timeout, etc. -------------
      const updated = await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'Failed',
          mpesaResultCode: String(parsed.resultCode),
          mpesaResultDesc: parsed.resultDesc,
        },
      })

      try {
        await db.activityLog.create({
          data: {
            action: 'MPESA_CALLBACK_FAILED',
            entity: 'Payment',
            entityId: updated.id,
            user: 'Daraja Callback',
            details: `STK Push failed: ${parsed.resultDesc} (code ${parsed.resultCode})`,
          },
        })
      } catch {
        // ignore log errors
      }

      return NextResponse.json({
        ok: false,
        status: 'Failed',
        resultCode: parsed.resultCode,
        resultDesc: parsed.resultDesc,
      })
    }
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || 'Callback processing failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/mpesa/callback
 * Health check — Daraja may probe the URL when you register it on the portal.
 */
export async function GET() {
  return NextResponse.json({
    ok: true,
    service: 'Daraja M-Pesa STK Push callback',
    method: 'POST',
    note: 'Register this URL as the CallbackURL on the Daraja portal.',
  })
}
