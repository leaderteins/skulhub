import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  initiateStkPush,
  normalizeMpesaPhone,
} from '@/lib/mpesa'

/**
 * POST /api/mpesa/parent-pay
 *
 * Parent-initiated M-Pesa STK Push — used by the parent portal.
 * Parents don't have a staff session, so they authenticate via
 * their child's studentId (already verified via /api/parent/lookup).
 *
 * Body: {
 *   studentId: string,    // the student whose fees are being paid
 *   invoiceId: string,    // which invoice to pay
 *   phone: string,        // M-Pesa phone number to charge
 * }
 *
 * Returns: { paymentId, checkoutRequestId, status: "pending" }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      studentId: string
      invoiceId: string
      phone: string
    }

    if (!body.studentId || !body.invoiceId || !body.phone) {
      return NextResponse.json(
        { error: 'studentId, invoiceId, and phone are required' },
        { status: 400 }
      )
    }

    // Get school from the student (raw SQL for Vercel compatibility)
    const students = await db.$queryRawUnsafe<Array<{
      schoolId: string
      firstName: string
      lastName: string
    }>>(
      `SELECT "schoolId", "firstName", "lastName" FROM "Student" WHERE id = $1 LIMIT 1`,
      body.studentId
    ).catch(() => [])

    if (students.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }
    const schoolId = students[0].schoolId

    // Fetch the invoice (raw SQL)
    const invoices = await db.$queryRawUnsafe<any[]>(
      `SELECT * FROM "Invoice" WHERE id = $1 AND "studentId" = $2 LIMIT 1`,
      body.invoiceId, body.studentId
    ).catch(() => [])

    if (invoices.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }
    const invoice = invoices[0]

    // Check if invoice is already fully paid
    if (invoice.status === 'Paid' || (Number(invoice.balance) || 0) <= 0) {
      return NextResponse.json({ error: 'This invoice is already fully paid' }, { status: 400 })
    }

    const amount = Number(invoice.balance) || Number(invoice.amount) || 0
    if (amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    // Fetch school's M-Pesa config
    const schools = await db.$queryRawUnsafe<any[]>(
      `SELECT "mpesaConsumerKey", "mpesaConsumerSecret", "mpesaPasskey",
              "mpesaShortcode", "mpesaEnv", "mpesaCallbackUrl"
       FROM "School" WHERE id = $1 LIMIT 1`, schoolId
    ).catch(() => [])

    if (schools.length === 0 || !schools[0].mpesaConsumerKey) {
      // Demo mode — no real STK Push, but log it
      const paymentId = `pay_demo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
      await db.$executeRawUnsafe(`
        INSERT INTO "Payment" (id, "schoolId", "invoiceId", "studentId", amount, method, status,
                                reference, "payerName", "payerPhone", "receivedBy", "receivedAt", "createdAt")
        VALUES ($1, $2, $3, $4, $5, 'M-Pesa', 'Demo', $6, $7, $8, 'Parent Portal', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING
      `, paymentId, schoolId, body.invoiceId, body.studentId, amount,
         `DEMO-${Date.now()}`,
         `${students[0].firstName} ${students[0].lastName}`,
         normalizeMpesaPhone(body.phone)
      ).catch(() => {})

      return NextResponse.json({
        paymentId,
        status: 'demo',
        message: 'M-Pesa not configured on this school. In demo mode — payment logged but no real STK Push sent. Configure Daraja credentials in Settings → M-Pesa to enable real payments.',
        amount,
        demo: true,
      })
    }

    const school = schools[0]
    const normalizedPhone = normalizeMpesaPhone(body.phone)

    // Initiate STK Push
    const stkResponse = await initiateStkPush({
      school: school as any,
      phone: normalizedPhone,
      amount,
      accountReference: invoice.invoiceNo,
      description: `Fees — ${students[0].firstName} ${students[0].lastName}`,
    }).catch((e: any) => {
      throw new Error(`STK Push failed: ${e?.message || 'Unknown error'}`)
    })

    // Create a Payment record (status = Pending)
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    await db.$executeRawUnsafe(`
      INSERT INTO "Payment" (id, "schoolId", "invoiceId", "studentId", amount, method, status,
                              reference, "payerName", "payerPhone", "receivedBy", "receivedAt", "createdAt")
      VALUES ($1, $2, $3, $4, $5, 'M-Pesa', 'Pending', $6, $7, $8, 'Parent Portal', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, paymentId, schoolId, body.invoiceId, body.studentId, amount,
       stkResponse.CheckoutRequestID || `STK-${Date.now()}`,
       `${students[0].firstName} ${students[0].lastName}`,
       normalizedPhone
    ).catch(() => {})

    return NextResponse.json({
      paymentId,
      checkoutRequestId: stkResponse.CheckoutRequestID,
      status: 'pending',
      message: 'STK Push sent to your phone. Enter your M-Pesa PIN to complete the payment.',
      amount,
      phone: normalizedPhone,
    })
  } catch (error: any) {
    console.error('[mpesa-parent-pay] error:', error)
    return NextResponse.json(
      { error: error?.message || 'Payment initiation failed' },
      { status: 500 }
    )
  }
}
