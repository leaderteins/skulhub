import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  resolveSchoolFromRequest,
  initiateStkPush,
  normalizeMpesaPhone,
  buildAccountReference,
  getMpesaConfigStatus,
} from '@/lib/mpesa'

/**
 * POST /api/mpesa/stk-push
 * Body: { invoiceId: string, phone: string, amount?: number }
 *
 * Flow:
 *  1. Resolve the authenticated user's school.
 *  2. Fetch the invoice (must belong to that school).
 *  3. Validate that Daraja credentials are configured.
 *  4. Call Daraja STK Push with password = base64(shortcode + passkey + timestamp).
 *  5. Create a Payment record (status="Pending") and store the CheckoutRequestID.
 *  6. Return the Payment id so the client can poll /api/payments/[id].
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

    const body = await req.json().catch(() => ({})) as {
      invoiceId?: string
      phone?: string
      amount?: number
    }

    const { invoiceId, phone } = body
    if (!invoiceId) {
      return NextResponse.json({ error: 'invoiceId is required' }, { status: 400 })
    }
    if (!phone) {
      return NextResponse.json({ error: 'phone is required' }, { status: 400 })
    }

    const normalizedPhone = normalizeMpesaPhone(phone)
    if (!normalizedPhone || !/^254[17]\d{8}$/.test(normalizedPhone)) {
      return NextResponse.json(
        {
          error:
            'Invalid phone number. Use format 0712345678, 0112345678 or +254712345678.',
        },
        { status: 400 }
      )
    }

    // --- Fetch invoice -------------------------------------------------------
    const invoice = await db.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        student: {
          select: {
            id: true,
            admissionNo: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    if (invoice.status === 'Paid' || invoice.status === 'Cancelled') {
      return NextResponse.json(
        { error: `Invoice is ${invoice.status.toLowerCase()} — cannot request payment` },
        { status: 400 }
      )
    }

    // Amount defaults to outstanding balance
    const amount =
      body.amount != null && Number.isFinite(body.amount) && body.amount > 0
        ? Number(body.amount)
        : invoice.balance

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Invoice has no outstanding balance' },
        { status: 400 }
      )
    }
    if (amount > invoice.balance + 0.01) {
      return NextResponse.json(
        {
          error: `Amount exceeds outstanding balance of KES ${invoice.balance.toFixed(2)}`,
        },
        { status: 400 }
      )
    }

    // --- Validate Daraja config ---------------------------------------------
    const status = getMpesaConfigStatus(school)
    if (!status.configured) {
      return NextResponse.json(
        {
          error:
            'M-Pesa STK Push not configured. Go to Settings → M-Pesa to add your Daraja API credentials.',
          missing: status.missing,
        },
        { status: 400 }
      )
    }

    // --- Initiate STK Push ---------------------------------------------------
    const accountRef = buildAccountReference(invoice.invoiceNo, invoice.student?.admissionNo)
    const transactionDesc = `Fees ${invoice.invoiceNo}`.slice(0, 13)

    let stkResponse
    try {
      stkResponse = await initiateStkPush({
        school,
        phone: normalizedPhone,
        amount,
        accountReference: accountRef,
        transactionDesc,
      })
    } catch (e: any) {
      return NextResponse.json(
        {
          error: e?.message || 'Failed to initiate Daraja STK Push',
          env: status.env,
          shortcode: status.shortcode,
        },
        { status: 502 }
      )
    }

    // --- Persist Payment record (status="Pending") --------------------------
    const payment = await db.payment.create({
      data: {
        invoiceId: invoice.id,
        studentId: invoice.studentId,
        amount,
        method: 'M-Pesa',
        reference: null,
        payerName: invoice.student
          ? `${invoice.student.firstName} ${invoice.student.lastName} Guardian`
          : null,
        payerPhone: normalizedPhone,
        receivedBy: user.name,
        receivedAt: new Date(),
        status: 'Pending',
        schoolId: school.id,
        mpesaCheckoutRequestId: stkResponse.CheckoutRequestID,
        mpesaPhoneNumber: normalizedPhone,
        mpesaResultCode: null,
        mpesaResultDesc: 'STK Push sent — awaiting customer confirmation',
      },
    })

    try {
      await db.activityLog.create({
        data: {
          action: 'MPESA_STK_PUSH',
          entity: 'Payment',
          entityId: payment.id,
          user: user.name,
          details: `STK Push for ${invoice.invoiceNo} (KES ${amount}) → ${stkResponse.CheckoutRequestID}`,
        },
      })
    } catch {
      // ignore log errors
    }

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      merchantRequestId: stkResponse.MerchantRequestID,
      customerMessage: stkResponse.CustomerMessage,
      phone: normalizedPhone,
      amount,
    }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || 'Failed to initiate STK Push' },
      { status: 500 }
    )
  }
}
