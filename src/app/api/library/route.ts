import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/library?search=&category=
// Returns books list with active loan counts + summary stats.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() || ''
  const category = searchParams.get('category') || ''

  const where: {
    OR?: Array<Record<string, unknown>>
    category?: string
  } = {}
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { author: { contains: search } },
      { isbn: { contains: search } },
      { publisher: { contains: search } },
    ]
  }
  if (category) where.category = category

  const [books, totalTitles, allCopies, availableCopies, borrowedCopies, overdueCopies, categories] = await Promise.all([
    db.libraryBook.findMany({
      where,
      orderBy: [{ title: 'asc' }],
      include: {
        loans: {
          where: { status: { in: ['Borrowed', 'Overdue'] } },
          select: { id: true, status: true, dueDate: true },
        },
      },
    }),
    db.libraryBook.count({ where }),
    db.libraryBook.aggregate({ where, _sum: { copiesTotal: true } }),
    db.libraryBook.aggregate({ where, _sum: { copiesAvailable: true } }),
    db.bookLoan.count({
      where: {
        status: { in: ['Borrowed', 'Overdue'] },
        book: where.category || where.OR ? { ...where } : undefined,
      },
    }),
    db.bookLoan.count({
      where: {
        status: 'Overdue',
        book: where.category || where.OR ? { ...where } : undefined,
      },
    }),
    db.libraryBook.findMany({
      distinct: ['category'],
      orderBy: { category: 'asc' },
      select: { category: true },
    }),
  ])

  const booksWithCounts = books.map((b) => ({
    ...b,
    activeLoans: b.loans.length,
    overdueLoans: b.loans.filter((l) => l.status === 'Overdue').length,
    loans: undefined,
  }))

  return NextResponse.json({
    books: booksWithCounts,
    categories: categories.map((c) => c.category),
    stats: {
      totalTitles,
      totalCopies: allCopies._sum.copiesTotal || 0,
      availableCopies: availableCopies._sum.copiesAvailable || 0,
      borrowedCopies,
      overdueCopies,
    },
  })
}

// POST /api/library
// Body: { isbn?, title, author, category, publisher?, yearPublished?, copiesTotal, shelfLocation? }
// copiesAvailable = copiesTotal.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.title || !body.author) {
    return NextResponse.json({ error: 'title and author are required' }, { status: 400 })
  }
  const copiesTotal = Number(body.copiesTotal) || 1
  if (copiesTotal < 1) {
    return NextResponse.json({ error: 'copiesTotal must be at least 1' }, { status: 400 })
  }

  if (body.isbn) {
    const dup = await db.libraryBook.findUnique({ where: { isbn: String(body.isbn).trim() } })
    if (dup) {
      return NextResponse.json({ error: 'A book with this ISBN already exists' }, { status: 409 })
    }
  }

  const book = await db.libraryBook.create({
    data: {
      isbn: body.isbn ? String(body.isbn).trim() : null,
      title: String(body.title).trim(),
      author: String(body.author).trim(),
      category: body.category ? String(body.category).trim() : 'General',
      publisher: body.publisher ? String(body.publisher).trim() : null,
      yearPublished: body.yearPublished ? Number(body.yearPublished) : null,
      copiesTotal,
      copiesAvailable: copiesTotal,
      shelfLocation: body.shelfLocation ? String(body.shelfLocation).trim() : null,
      status: 'Available',
    },
  })

  await db.activityLog.create({
    data: {
      action: 'CREATE',
      entity: 'LibraryBook',
      entityId: book.id,
      user: body.actor || 'Librarian',
      details: `Added book "${book.title}" (${copiesTotal} copies)`,
    },
  })

  return NextResponse.json(book, { status: 201 })
}
