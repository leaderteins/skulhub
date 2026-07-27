import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const ACADEMIC_YEAR = '2025'
const TERM = 'Term 1'

// GET /api/finance/invoices?status=&search=&classLevel=&page=&pageSize=
// Paginated invoices with student (admissionNo, name, classLevel via enrollment)
// + feeStructure. Returns { invoices, total, page, pageSize }.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''
  const search = (searchParams.get('search') || '').trim().toLowerCase()
  const classLevel = searchParams.get('classLevel') || ''
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const pageSize = Math.min(200, Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10)))

  // Build where clause
  const where: any = {}
  if (status) where.status = status

  if (search) {
    where.OR = [
      { invoiceNo: { contains: search } },
      { student: { admissionNo: { contains: search } } },
      { student: { firstName: { contains: search } } },
      { student: { lastName: { contains: search } } },
    ]
  }

  if (classLevel) {
    // Match by current enrollment's class level
    where.student = {
      enrollments: {
        some: { classLevelId: classLevel, academicYear: ACADEMIC_YEAR, term: TERM },
      },
    }
  }

  const [total, rows] = await Promise.all([
    db.invoice.count({ where }),
    db.invoice.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            admissionNo: true,
            firstName: true,
            lastName: true,
            boarding: true,
            enrollments: {
              where: { academicYear: ACADEMIC_YEAR, term: TERM },
              take: 1,
              select: {
                stream: { select: { id: true, name: true, classLevel: { select: { id: true, name: true } } } },
              },
            },
          },
        },
        feeStructure: { select: { id: true, name: true, boarding: true, totalAmount: true } },
        _count: { select: { payments: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  const invoices = rows.map(r => {
    const enrollment = r.student.enrollments[0]
    const stream = enrollment?.stream
    return {
      id: r.id,
      invoiceNo: r.invoiceNo,
      studentId: r.student.id,
      admissionNo: r.student.admissionNo,
      studentName: `${r.student.firstName} ${r.student.lastName}`,
      boarding: r.student.boarding,
      classLevel: stream?.classLevel?.name || '—',
      stream: stream?.name || '—',
      feeStructure: r.feeStructure
        ? { id: r.feeStructure.id, name: r.feeStructure.name, boarding: r.feeStructure.boarding }
        : null,
      academicYear: r.academicYear,
      term: r.term,
      amount: r.amount,
      amountPaid: r.amountPaid,
      balance: r.balance,
      status: r.status,
      dueDate: r.dueDate,
      issueDate: r.issueDate,
      paymentsCount: r._count.payments,
    }
  })

  // Also return class levels for the filter dropdown
  const [classLevels, feeStructures, statusCounts] = await Promise.all([
    db.classLevel.findMany({
      orderBy: { order: 'asc' },
      select: { id: true, name: true, stage: true },
    }),
    db.feeStructure.findMany({
      where: { academicYear: ACADEMIC_YEAR, term: TERM },
      orderBy: { name: 'asc' },
      select: {
        id: true, name: true, boarding: true, totalAmount: true,
        academicYear: true, term: true, dueDate: true,
        classLevelId: true,
      },
    }),
    db.invoice.groupBy({
      by: ['status'],
      _count: { _all: true },
    }),
  ])

  const classLevelMap = new Map(classLevels.map(c => [c.id, c.name]))

  return NextResponse.json({
    invoices,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    classLevels,
    feeStructures: feeStructures.map(f => ({
      id: f.id,
      name: f.name,
      boarding: f.boarding,
      totalAmount: f.totalAmount,
      academicYear: f.academicYear,
      term: f.term,
      dueDate: f.dueDate,
      classLevel: f.classLevelId ? classLevelMap.get(f.classLevelId) || 'All' : 'All',
    })),
    statusCounts: statusCounts.map(s => ({ status: s.status, count: s._count._all })),
  })
}

// POST /api/finance/invoices
// Creates an invoice. Generates invoiceNo like INV/10001.
// Body: { studentId, feeStructureId?, academicYear?, term?, amount, dueDate, boarding? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { studentId, feeStructureId, academicYear, term, amount, dueDate } = body as {
      studentId: string
      feeStructureId?: string
      academicYear?: string
      term?: string
      amount?: number
      dueDate?: string
    }

    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
    }

    const student = await db.student.findUnique({ where: { id: studentId } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Resolve fee structure (if provided) to default amount/year/term/dueDate
    let fs: { id: string; totalAmount: number; academicYear: string; term: string; dueDate: Date | null } | null = null
    if (feeStructureId) {
      fs = await db.feeStructure.findUnique({
        where: { id: feeStructureId },
        select: { id: true, totalAmount: true, academicYear: true, term: true, dueDate: true },
      })
      if (!fs) return NextResponse.json({ error: 'Fee structure not found' }, { status: 404 })
    }

    const ay = academicYear || fs?.academicYear || ACADEMIC_YEAR
    const tm = term || fs?.term || TERM
    const amt = typeof amount === 'number' && amount > 0 ? amount : fs?.totalAmount || 0
    const dd = dueDate ? new Date(dueDate) : fs?.dueDate || new Date(Date.now() + 30 * 24 * 3600 * 1000)

    // Generate next invoice number: INV/{max+1}, starting from 10001
    const last = await db.invoice.findFirst({
      orderBy: { invoiceNo: 'desc' },
      select: { invoiceNo: true },
    })
    let nextNum = 10001
    if (last?.invoiceNo) {
      const m = last.invoiceNo.match(/(\d+)$/)
      if (m) nextNum = Math.max(10001, parseInt(m[1], 10) + 1)
    }
    const invoiceNo = `INV/${nextNum}`

    const invoice = await db.invoice.create({
      data: {
        invoiceNo,
        studentId,
        feeStructureId: fs?.id || null,
        academicYear: ay,
        term: tm,
        amount: amt,
        amountPaid: 0,
        balance: amt,
        status: 'Unpaid',
        dueDate: dd,
      },
      include: {
        student: {
          select: {
            id: true, admissionNo: true, firstName: true, lastName: true, boarding: true,
            enrollments: {
              where: { academicYear: ay, term: tm },
              take: 1,
              select: { stream: { select: { name: true, classLevel: { select: { name: true } } } } },
            },
          },
        },
        feeStructure: { select: { id: true, name: true, boarding: true, totalAmount: true } },
      },
    })

    try {
      await db.activityLog.create({
        data: {
          action: 'CREATE',
          entity: 'Invoice',
          entityId: invoice.id,
          user: 'Bursar',
          details: `Created invoice ${invoiceNo} for ${student.admissionNo}`,
        },
      })
    } catch {
      // ignore log errors
    }

    const enrollment = invoice.student.enrollments[0]
    return NextResponse.json({
      id: invoice.id,
      invoiceNo: invoice.invoiceNo,
      studentId: invoice.student.id,
      admissionNo: invoice.student.admissionNo,
      studentName: `${invoice.student.firstName} ${invoice.student.lastName}`,
      boarding: invoice.student.boarding,
      classLevel: enrollment?.stream?.classLevel?.name || '—',
      stream: enrollment?.stream?.name || '—',
      feeStructure: invoice.feeStructure
        ? { id: invoice.feeStructure.id, name: invoice.feeStructure.name, boarding: invoice.feeStructure.boarding }
        : null,
      academicYear: invoice.academicYear,
      term: invoice.term,
      amount: invoice.amount,
      amountPaid: invoice.amountPaid,
      balance: invoice.balance,
      status: invoice.status,
      dueDate: invoice.dueDate,
      issueDate: invoice.issueDate,
      paymentsCount: 0,
    }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to create invoice' }, { status: 500 })
  }
}
