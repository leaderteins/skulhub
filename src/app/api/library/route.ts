import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

/** GET /api/library?search=X — search books
 *  POST — check out or return a book. Body: { bookId, studentId, action: 'checkout'|'return' }
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const search = new URL(req.url).searchParams.get('search')
    const where = search ? { schoolId: user.schoolId, OR: [{ title: { contains: search } }, { author: { contains: search } }, { isbn: { contains: search } }] } : { schoolId: user.schoolId }
    const books = await db.libraryBook.findMany({ where, take: 100, orderBy: { title: 'asc' } }).catch(() => [])
    return NextResponse.json({ books, count: books.length })
  } catch { return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    const body = await req.json().catch(() => ({}))
    const { bookId, studentId, action } = body
    if (!bookId || !action) return NextResponse.json({ error: 'bookId and action required' }, { status: 400 })
    
    if (action === 'checkout') {
      const loan = await db.bookLoan.create({ data: { bookId, studentId, borrowedAt: new Date(), dueDate: new Date(Date.now() + 14 * 86400000), status: 'borrowed' } }).catch(() => null)
      if (loan) await db.libraryBook.update({ where: { id: bookId }, data: { available: false } }).catch(() => {})
      return NextResponse.json({ success: true, message: 'Book checked out', dueDate: loan?.dueDate })
    } else if (action === 'return') {
      await db.bookLoan.updateMany({ where: { bookId, studentId, status: 'borrowed' }, data: { status: 'returned', returnedAt: new Date() } }).catch(() => {})
      await db.libraryBook.update({ where: { id: bookId }, data: { available: true } }).catch(() => {})
      return NextResponse.json({ success: true, message: 'Book returned' })
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch { return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 }) }
}
