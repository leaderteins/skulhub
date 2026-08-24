import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@prisma/client'
import { db } from '@/lib/db'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function splitName(full: string): { first: string; last: string } {
  const parts = full.trim().split(/\s+/)
  const first = parts[0] || full
  const last = parts.slice(1).join(' ') || first
  return { first, last }
}

// Compute the next sequential ADM/XXXX by scanning existing admission numbers.
async function nextAdmissionNumber(): Promise<string> {
  const students = await db.student.findMany({
    where: { admissionNo: { startsWith: 'ADM/' } },
    select: { admissionNo: true },
  })
  const max = students.reduce((acc, s) => {
    const m = s.admissionNo.match(/^ADM\/(\d+)$/)
    return m ? Math.max(acc, parseInt(m[1], 10)) : acc
  }, 4999)
  return `ADM/${max + 1}`
}

// Compute the next sequential INV/XXXX by scanning existing invoice numbers.
async function nextInvoiceNumber(): Promise<string> {
  const invoices = await db.invoice.findMany({
    where: { invoiceNo: { startsWith: 'INV/' } },
    select: { invoiceNo: true },
  })
  const max = invoices.reduce((acc, i) => {
    const m = i.invoiceNo.match(/^INV\/(\d+)$/)
    return m ? Math.max(acc, parseInt(m[1], 10)) : acc
  }, 9999)
  return `INV/${max + 1}`
}

// ---------------------------------------------------------------------------
// GET /api/admissions/[id]/enroll — enrollment preview
// Returns: canEnroll, nextAdmissionNo, appliedClassLevel, streams[],
//          feeStructure (matching class/boarding/year/term),
//          alreadyEnrolled + enrolledAdmissionNo + enrolledInvoiceNo
// ---------------------------------------------------------------------------
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const application = await db.application.findUnique({
    where: { id },
    include: {
      appliedClassLevel: { include: { streams: { orderBy: { name: 'asc' } } } },
    },
  })
  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  // If already enrolled, look up the linked student & invoice via ActivityLog
  let enrolledAdmissionNo: string | null = null
  let enrolledInvoiceNo: string | null = null
  let enrolledStudentId: string | null = null
  if (application.status === 'Enrolled') {
    const log = await db.activityLog.findFirst({
      where: {
        entity: 'Student',
        details: { contains: application.applicationNo },
      },
      orderBy: { createdAt: 'desc' },
    })
    if (log?.entityId) {
      const s = await db.student.findUnique({ where: { id: log.entityId } })
      if (s) {
        enrolledAdmissionNo = s.admissionNo
        enrolledStudentId = s.id
        const inv = await db.invoice.findFirst({
          where: { studentId: s.id },
          orderBy: { createdAt: 'desc' },
        })
        if (inv) enrolledInvoiceNo = inv.invoiceNo
      }
    }
  }

  const nextAdmissionNo = await nextAdmissionNumber()

  const streams = (application.appliedClassLevel?.streams || []).map(s => ({
    id: s.id,
    name: s.name,
    capacity: s.capacity,
  }))

  // Matching fee structure
  let feeStructure: {
    id: string
    name: string
    totalAmount: number
    tuitionFee: number
    boardingFee: number
    examFee: number
    libraryFee: number
    activityFee: number
    otherFee: number
    dueDate: string | null
  } | null = null

  if (application.appliedClassLevelId) {
    const fs = await db.feeStructure.findFirst({
      where: {
        classLevelId: application.appliedClassLevelId,
        boarding: application.boarding,
        academicYear: application.appliedYear,
        term: application.appliedTerm,
      },
    })
    if (fs) {
      feeStructure = {
        id: fs.id,
        name: fs.name,
        totalAmount: fs.totalAmount,
        tuitionFee: fs.tuitionFee,
        boardingFee: fs.boardingFee,
        examFee: fs.examFee,
        libraryFee: fs.libraryFee,
        activityFee: fs.activityFee,
        otherFee: fs.otherFee,
        dueDate: fs.dueDate ? fs.dueDate.toISOString() : null,
      }
    }
  }

  const canEnroll =
    application.status === 'Accepted' &&
    !!feeStructure &&
    streams.length > 0 &&
    !!application.appliedClassLevelId

  return NextResponse.json({
    canEnroll,
    status: application.status,
    nextAdmissionNo,
    boarding: application.boarding,
    academicYear: application.appliedYear,
    term: application.appliedTerm,
    appliedClassLevel: application.appliedClassLevel
      ? { id: application.appliedClassLevel.id, name: application.appliedClassLevel.name }
      : null,
    streams,
    feeStructure,
    alreadyEnrolled: application.status === 'Enrolled',
    enrolledAdmissionNo,
    enrolledInvoiceNo,
    enrolledStudentId,
  })
}

// ---------------------------------------------------------------------------
// POST /api/admissions/[id]/enroll — commit the enrollment in a transaction
// Body: { streamId?: string, decisionBy?: string }
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => ({}))
  const streamId: string | undefined = body?.streamId
  const decisionBy: string = body?.decisionBy || 'Admissions Office'

  // 1. Load the application with class level + streams
  const application = await db.application.findUnique({
    where: { id },
    include: {
      appliedClassLevel: { include: { streams: { orderBy: { name: 'asc' } } } },
    },
  })
  if (!application) {
    return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  }

  // 2. Guard: only Accepted applications can be enrolled
  if (application.status !== 'Accepted') {
    return NextResponse.json(
      {
        error: `Cannot enroll application with status "${application.status}". Only "Accepted" applications can be enrolled.`,
      },
      { status: 400 },
    )
  }

  // 3. Resolve the target stream
  if (!application.appliedClassLevelId) {
    return NextResponse.json(
      { error: 'Application has no applied class level. Update the application before enrolling.' },
      { status: 400 },
    )
  }
  const availableStreams = application.appliedClassLevel?.streams || []
  let targetStreamId = streamId
  if (!targetStreamId) {
    const first = availableStreams[0]
    if (!first) {
      return NextResponse.json(
        { error: 'No streams available for the applied class level' },
        { status: 400 },
      )
    }
    targetStreamId = first.id
  } else if (!availableStreams.some(s => s.id === targetStreamId)) {
    return NextResponse.json(
      { error: 'Selected stream does not belong to the applied class level' },
      { status: 400 },
    )
  }

  // 4. Find the matching fee structure
  const feeStructure = await db.feeStructure.findFirst({
    where: {
      classLevelId: application.appliedClassLevelId,
      boarding: application.boarding,
      academicYear: application.appliedYear,
      term: application.appliedTerm,
    },
  })
  if (!feeStructure) {
    return NextResponse.json(
      {
        error:
          'No fee structure found for this class level, boarding type, academic year, and term. Set up a fee structure first.',
      },
      { status: 400 },
    )
  }

  // 5. Generate admission & invoice numbers
  const admissionNo = await nextAdmissionNumber()
  const invoiceNo = await nextInvoiceNumber()

  // 6. Split names
  const { first: firstName, last: lastName } = splitName(application.applicantName)
  const { first: gFirst, last: gLast } = splitName(application.guardianName)

  try {
    // 7. Execute the enrollment as a single atomic transaction
    const result = await db.$transaction(async (tx) => {
      // 7a. Create the guardian from application data
      const guardian = await tx.guardian.create({
        data: {
          firstName: gFirst,
          lastName: gLast,
          phone: application.guardianPhone || application.phone,
          email: application.guardianEmail || application.email || null,
          relation: 'Parent',
          occupation: application.guardianOccupation || null,
        },
      })

      // 7b. Create the student
      const student = await tx.student.create({
        data: {
          admissionNo,
          firstName,
          lastName,
          email: application.email || null,
          phone: application.phone || null,
          gender: application.gender || 'Male',
          dateOfBirth: application.dateOfBirth || null,
          county: application.county || null,
          nationality: 'Kenyan',
          status: 'Active',
          boarding: application.boarding,
          guardianId: guardian.id,
        },
      })

      // 7c. Create the enrollment (student → stream)
      const enrollment = await tx.enrollment.create({
        data: {
          studentId: student.id,
          streamId: targetStreamId!,
          academicYear: application.appliedYear,
          term: application.appliedTerm,
          status: 'Active',
          classLevelId: application.appliedClassLevelId,
        },
      })

      // 7d. Create the invoice (amount = fee structure totalAmount)
      const dueDate = feeStructure.dueDate || new Date(Date.now() + 30 * 86400000)
      const invoice = await tx.invoice.create({
        data: {
          invoiceNo,
          studentId: student.id,
          feeStructureId: feeStructure.id,
          academicYear: application.appliedYear,
          term: application.appliedTerm,
          amount: feeStructure.totalAmount,
          amountPaid: 0,
          balance: feeStructure.totalAmount,
          status: 'Unpaid',
          dueDate,
        },
      })

      // 7e. Update application status → Enrolled
      await tx.application.update({
        where: { id },
        data: {
          status: 'Enrolled',
          decisionDate: new Date(),
          decisionBy,
        },
      })

      // 7f. Activity log: student creation + invoice generation + enrollment
      await tx.activityLog.createMany({
        data: [
          {
            action: 'CREATE',
            entity: 'Student',
            entityId: student.id,
            user: decisionBy,
            details: `Enrolled student ${admissionNo} (${firstName} ${lastName}) from application ${application.applicationNo}`,
          },
          {
            action: 'CREATE',
            entity: 'Invoice',
            entityId: invoice.id,
            user: decisionBy,
            details: `Generated invoice ${invoiceNo} (KES ${feeStructure.totalAmount}) for student ${admissionNo} from application ${application.applicationNo}`,
          },
          {
            action: 'ENROLL',
            entity: 'Enrollment',
            entityId: enrollment.id,
            user: decisionBy,
            details: `Enrolled ${admissionNo} into ${application.appliedYear} ${application.appliedTerm} stream from application ${application.applicationNo}`,
          },
        ],
      })

      // 7g. Notifications — SMS + Email to guardian, SMS to applicant
      const notificationsData: Array<{
        recipient: string
        channel: string
        subject?: string
        message: string
        status: string
      }> = []

      const guardianPhone = application.guardianPhone || application.phone
      if (guardianPhone) {
        notificationsData.push({
          recipient: guardianPhone,
          channel: 'SMS',
          message: `EduManage Pro: ${firstName} ${lastName} has been enrolled as ${admissionNo}. Invoice ${invoiceNo} for KES ${feeStructure.totalAmount.toLocaleString()} is now due. Welcome!`,
          status: 'Queued',
        })
      }
      const guardianEmail = application.guardianEmail || application.email
      if (guardianEmail) {
        notificationsData.push({
          recipient: guardianEmail,
          channel: 'Email',
          subject: `Enrollment Confirmation — ${admissionNo}`,
          message: [
            `Dear ${gFirst},`,
            ``,
            `We are pleased to confirm that ${firstName} ${lastName} has been successfully enrolled at EduManage Pro.`,
            ``,
            `Admission Number: ${admissionNo}`,
            `Invoice Number: ${invoiceNo}`,
            `Amount Due: KES ${feeStructure.totalAmount.toLocaleString()}`,
            `Due Date: ${new Date(dueDate).toLocaleDateString('en-KE')}`,
            ``,
            `Please log in to the parent portal to view fee details and make payments.`,
            ``,
            `Regards,`,
            `Admissions Office`,
          ].join('\n'),
          status: 'Queued',
        })
      }
      if (application.phone && application.phone !== guardianPhone) {
        notificationsData.push({
          recipient: application.phone,
          channel: 'SMS',
          message: `EduManage Pro: You have been enrolled as ${admissionNo}. Welcome aboard!`,
          status: 'Queued',
        })
      }
      if (notificationsData.length > 0) {
        await tx.notification.createMany({ data: notificationsData })
      }

      return { student, invoice, admissionNo, invoiceNo }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (e: unknown) {
    // 409 on admission/invoice number unique constraint conflict
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return NextResponse.json(
        { error: 'Admission or invoice number conflict. Please retry the enrollment.' },
        { status: 409 },
      )
    }
    console.error('[enroll] error:', e)
    const msg = e instanceof Error ? e.message : 'Enrollment failed'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
