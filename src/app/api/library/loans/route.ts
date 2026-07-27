import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

const FINE_PER_DAY = 20 // KES
const LOAN_PERIOD_DAYS = 14

// GET /api/library/loans?status=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''

  // First, mark any overdue loans automatically
  const now = new Date()
  await db.bookLoan.updateMany({
    where: {
      status: 'Borrowed',
      dueDate: { lt: now },
      returnDate: null,
    },
    data: { status: 'Overdue' },
  })

  const where: { status?: string } = {}
  if (status) where.status = status

  const loans = await db.bookLoan.findMany({
    where,
    orderBy: { borrowDate: 'desc' },
    take: 500,
    include: {
      book: {
        select: { id: true, title: true, author: true, isbn: true },
      },
      student: {
        select: { id: true, firstName: true, lastName: true, admissionNo: true },
      },
    },
  })

  // Attach computed fine for overdue loans not yet returned
  const enriched = loans.map((l) => {
    let computedFine = l.fine
    if (l.status === 'Overdue' && !l.returnDate) {
      const due = new Date(l.dueDate)
      const daysOverdue = Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))
      computedFine = daysOverdue * FINE_PER_DAY
    }
    return { ...l, computedFine }
  })

  const summary = {
    total: enriched.length,
    borrowed: enriched.filter((l) => l.status === 'Borrowed').length,
    overdue: enriched.filter((l) => l.status === 'Overdue').length,
    returned: enriched.filter((l) => l.status === 'Returned').length,
    lost: enriched.filter((l) => l.status === 'Lost').length,
    totalFines: enriched.reduce((sum, l) => sum + (l.computedFine || 0), 0),
  }

  return NextResponse.json({ loans: enriched, summary })
}

// POST /api/library/loans
// Body: { bookId, studentId?, borrowerName }
// Creates a loan (borrowDate=now, dueDate=now+14d), decrements book.copiesAvailable.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.bookId || !body.borrowerName) {
    return NextResponse.json({ error: 'bookId and borrowerName are required' }, { status: 400 })
  }

  const book = await db.libraryBook.findUnique({ where: { id: body.bookId } })
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }
  if (book.copiesAvailable <= 0) {
    return NextResponse.json({ error: 'No copies available for loan' }, { status: 409 })
  }

  const borrowDate = new Date()
  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + LOAN_PERIOD_DAYS)

  const loan = await db.bookLoan.create({
    data: {
      bookId: book.id,
      studentId: body.studentId || null,
      borrowerName: String(body.borrowerName).trim(),
      borrowDate,
      dueDate,
      status: 'Borrowed',
      fine: 0,
    },
    include: {
      book: { select: { id: true, title: true, author: true } },
      student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
    },
  })

  // Decrement copiesAvailable; mark out of stock if 0
  const newAvailable = book.copiesAvailable - 1
  await db.libraryBook.update({
    where: { id: book.id },
    data: {
      copiesAvailable: newAvailable,
      status: newAvailable <= 0 ? 'Out of Stock' : 'Available',
    },
  })

  await db.activityLog.create({
    data: {
      action: 'CREATE',
      entity: 'BookLoan',
      entityId: loan.id,
      user: body.actor || 'Librarian',
      details: `Issued "${book.title}" to ${loan.borrowerName} (due ${dueDate.toISOString().slice(0, 10)})`,
    },
  })

  return NextResponse.json(loan, { status: 201 })
}

// PUT /api/library/loans  — handle book return
// Body: { loanId, action: 'return' }
export async function PUT(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.loanId || body.action !== 'return') {
    return NextResponse.json({ error: 'loanId and action="return" required' }, { status: 400 })
  }

  const loan = await db.bookLoan.findUnique({
    where: { id: body.loanId },
    include: { book: true },
  })
  if (!loan) {
    return NextResponse.json({ error: 'Loan not found' }, { status: 404 })
  }
  if (loan.returnDate) {
    return NextResponse.json({ error: 'Book already returned' }, { status: 409 })
  }

  const now = new Date()
  const due = new Date(loan.dueDate)
  const isOverdue = now > due
  const daysOverdue = isOverdue
    ? Math.max(0, Math.floor((now.getTime() - due.getTime()) / (1000 * 60 * 60 * 24)))
    : 0
  const fine = daysOverdue * FINE_PER_DAY
  const status = isOverdue ? 'Returned' : 'Returned' // returned regardless; fine indicates overdue

  const updated = await db.bookLoan.update({
    where: { id: loan.id },
    data: {
      returnDate: now,
      status,
      fine,
    },
    include: {
      book: { select: { id: true, title: true, author: true } },
      student: { select: { id: true, firstName: true, lastName: true, admissionNo: true } },
    },
  })

  // Increment book.copiesAvailable
  const newAvailable = Math.min(loan.book.copiesTotal, loan.book.copiesAvailable + 1)
  await db.libraryBook.update({
    where: { id: loan.book.id },
    data: {
      copiesAvailable: newAvailable,
      status: 'Available',
    },
  })

  await db.activityLog.create({
    data: {
      action: 'UPDATE',
      entity: 'BookLoan',
      entityId: loan.id,
      user: body.actor || 'Librarian',
      details: `Returned "${loan.book.title}"${fine > 0 ? ` (overdue ${daysOverdue}d, fine KES ${fine})` : ''}`,
    },
  })

  return NextResponse.json({ ...updated, daysOverdue, fine })
}
