import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveSchoolFromRequest } from '@/lib/mpesa'

/**
 * POST /api/mpesa/simulate
 * Dev/demo helper that simulates a Daraja callback for a pending STK Push
 * payment. In a real deployment Daraja would POST to /api/mpesa/callback
 * itself — but because the sandbox runs locally and Daraja cannot reach a
 * localhost URL, this endpoint lets the full STK Push → callback → invoice
 * settlement flow be demonstrated end-to-end.
 *
 * Body: { paymentId: string, success?: boolean (default true) }
 *
 * Restricted to admin/principal/bursar/super_admin roles.
 */
export async function POST(req: NextRequest) {
  try {
    const { school, user, error } = await resolveSchoolFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    if (!school) {
      return NextResponse.json({ error: error || 'No school configured' }, { status: 404 })
    }
    if (!['admin', 'principal', 'bursar', 'super_admin'].includes(user.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to simulate M-Pesa callbacks' },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => ({})) as {
      paymentId?: string
      success?: boolean
    }

    if (!body.paymentId) {
      return NextResponse.json({ error: 'paymentId is required' }, { status: 400 })
    }

    const payment = await db.payment.findUnique({
      where: { id: body.paymentId },
      include: { invoice: true },
    })
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }
    if (payment.status !== 'Pending') {
      return NextResponse.json(
        { error: `Payment is already ${payment.status} (only Pending payments can be simulated)` },
        { status: 400 }
      )
    }
    if (!payment.mpesaCheckoutRequestId) {
      return NextResponse.json(
        { error: 'Payment has no CheckoutRequestID — was STK Push actually initiated?' },
        { status: 400 }
      )
    }

    const success = body.success !== false
    // Build a fake-but-realistic Daraja receipt number
    const fakeReceipt = success
      ? Array.from({ length: 10 }, () =>
          'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 36)]
        ).join('')
      : null

    if (success) {
      const [updatedPayment, updatedInvoice] = await db.$transaction([
        db.payment.update({
          where: { id: payment.id },
          data: {
            status: 'Completed',
            reference: fakeReceipt,
            mpesaReceiptNumber: fakeReceipt,
            mpesaResultCode: '0',
            mpesaResultDesc: 'The service request is processed successfully.',
            mpesaPhoneNumber: payment.mpesaPhoneNumber,
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
            return { amountPaid: newAmountPaid, balance: newBalance, status }
          })(),
        }),
      ])

      try {
        await db.activityLog.create({
          data: {
            action: 'MPESA_SIMULATE_SUCCESS',
            entity: 'Payment',
            entityId: updatedPayment.id,
            user: user.name,
            details: `[SIMULATED] M-Pesa ${fakeReceipt} · KES ${payment.amount} · Invoice ${updatedInvoice.invoiceNo} → ${updatedInvoice.status}`,
          },
        })
      } catch {
        // ignore log errors
      }

      return NextResponse.json({
        ok: true,
        status: 'Completed',
        receipt: fakeReceipt,
        invoiceStatus: updatedInvoice.status,
        message: 'Simulated successful M-Pesa payment',
      })
    } else {
      const updated = await db.payment.update({
        where: { id: payment.id },
        data: {
          status: 'Failed',
          mpesaResultCode: '1032',
          mpesaResultDesc: 'Request cancelled by user',
        },
      })
      try {
        await db.activityLog.create({
          data: {
            action: 'MPESA_SIMULATE_FAIL',
            entity: 'Payment',
            entityId: updated.id,
            user: user.name,
            details: `[SIMULATED] STK Push declined: Request cancelled by user`,
          },
        })
      } catch {
        // ignore log errors
      }
      return NextResponse.json({
        ok: false,
        status: 'Failed',
        message: 'Simulated declined M-Pesa payment',
      })
    }
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Simulation failed' },
      { status: 500 }
    )
  }
}
