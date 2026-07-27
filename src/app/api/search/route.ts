import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/search?q=
// Global search across students, staff, books, announcements.
export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get('q')?.trim() || ''
  if (q.length < 2) {
    return NextResponse.json({ students: [], staff: [], books: [], announcements: [] })
  }

  const [students, staff, books, announcements] = await Promise.all([
    db.student.findMany({
      where: {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { admissionNo: { contains: q } },
          { phone: { contains: q } },
        ],
      },
      take: 6,
      select: {
        id: true, admissionNo: true, firstName: true, lastName: true, gender: true,
        enrollments: { take: 1, select: { stream: { select: { name: true, classLevel: { select: { name: true } } } } } },
      },
    }),
    db.staff.findMany({
      where: {
        OR: [
          { firstName: { contains: q } },
          { lastName: { contains: q } },
          { employeeNo: { contains: q } },
          { email: { contains: q } },
        ],
      },
      take: 6,
      select: { id: true, employeeNo: true, firstName: true, lastName: true, role: true, department: { select: { name: true } } },
    }),
    db.libraryBook.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { author: { contains: q } },
          { isbn: { contains: q } },
        ],
      },
      take: 5,
      select: { id: true, title: true, author: true, category: true, copiesAvailable: true },
    }),
    db.announcement.findMany({
      where: { OR: [{ title: { contains: q } }, { body: { contains: q } }] },
      take: 4,
      select: { id: true, title: true, body: true, audience: true, priority: true },
    }),
  ])

  return NextResponse.json({
    students: students.map(s => ({
      id: s.id, admissionNo: s.admissionNo, firstName: s.firstName, lastName: s.lastName, gender: s.gender,
      stream: s.enrollments[0]?.stream?.name, classLevel: s.enrollments[0]?.stream?.classLevel?.name,
    })),
    staff: staff.map(s => ({
      id: s.id, employeeNo: s.employeeNo, firstName: s.firstName, lastName: s.lastName, role: s.role, department: s.department?.name,
    })),
    books: books.map(b => ({ id: b.id, title: b.title, author: b.author, category: b.category, available: b.copiesAvailable })),
    announcements: announcements.map(a => ({ id: a.id, title: a.title, body: a.body, audience: a.audience, priority: a.priority })),
  })
}
