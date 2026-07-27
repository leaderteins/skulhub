import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/library/[id] — book detail with active loans.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const book = await db.libraryBook.findUnique({
    where: { id },
    include: {
      loans: {
        orderBy: { borrowDate: 'desc' },
        take: 50,
        include: {
          student: {
            select: { id: true, firstName: true, lastName: true, admissionNo: true },
          },
        },
      },
    },
  })
  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }
  return NextResponse.json(book)
}

// PUT /api/library/[id]
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const existing = await db.libraryBook.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  if (body.isbn && body.isbn !== existing.isbn) {
    const dup = await db.libraryBook.findUnique({ where: { isbn: String(body.isbn).trim() } })
    if (dup && dup.id !== id) {
      return NextResponse.json({ error: 'ISBN already in use by another book' }, { status: 409 })
    }
  }

  const data: Record<string, unknown> = {}
  if (typeof body.isbn === 'string') data.isbn = body.isbn.trim() || null
  if (typeof body.title === 'string') data.title = body.title.trim()
  if (typeof body.author === 'string') data.author = body.author.trim()
  if (typeof body.category === 'string') data.category = body.category.trim()
  if (typeof body.publisher === 'string') data.publisher = body.publisher.trim() || null
  if (body.yearPublished !== undefined) data.yearPublished = body.yearPublished ? Number(body.yearPublished) : null
  if (typeof body.shelfLocation === 'string') data.shelfLocation = body.shelfLocation.trim() || null

  if (typeof body.copiesTotal === 'number') {
    const diff = body.copiesTotal - existing.copiesTotal
    data.copiesTotal = body.copiesTotal
    // Adjust available proportionally (don't go negative)
    const newAvailable = Math.max(0, existing.copiesAvailable + diff)
    data.copiesAvailable = newAvailable
    data.status = newAvailable > 0 ? 'Available' : 'Out of Stock'
  }

  const updated = await db.libraryBook.update({ where: { id }, data })

  await db.activityLog.create({
    data: {
      action: 'UPDATE',
      entity: 'LibraryBook',
      entityId: id,
      user: body.actor || 'Librarian',
      details: `Updated book "${updated.title}"`,
    },
  })

  return NextResponse.json(updated)
}

// DELETE /api/library/[id]
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const existing = await db.libraryBook.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }

  const activeLoans = await db.bookLoan.count({
    where: { bookId: id, status: { in: ['Borrowed', 'Overdue'] } },
  })
  if (activeLoans > 0) {
    return NextResponse.json(
      { error: `Cannot delete: ${activeLoans} active loan(s) for this book` },
      { status: 409 },
    )
  }

  await db.libraryBook.delete({ where: { id } })

  await db.activityLog.create({
    data: {
      action: 'DELETE',
      entity: 'LibraryBook',
      entityId: id,
      user: 'Librarian',
      details: `Deleted book "${existing.title}"`,
    },
  })

  return NextResponse.json({ success: true })
}
