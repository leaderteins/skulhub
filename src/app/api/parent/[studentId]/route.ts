import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Parent dashboard data — returns everything the parent portal needs to
 * render a student's record:
 *   - Student info (name, admission no, class, photo, boarding/day)
 *   - Fee summary (total billed, paid, balance, invoice history)
 *   - Recent attendance (last 10 records)
 *   - Recent grades (latest 20 exam results)
 *   - Announcements targeted at parents
 *   - Upcoming events targeted at parents
 *
 * NOTE: This route is intended for the parent portal, which has already
 * verified the guardian's identity via /api/parent/lookup. The studentId
 * is opaque to the parent (returned by the lookup step), so we don't
 * accept it from arbitrary query strings.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await ctx.params

    const student = await db.student.findUnique({
      where: { id: studentId },
      include: {
        guardian: true,
        school: true,
        enrollments: {
          include: {
            stream: { include: { classLevel: true } },
            classLevel: true,
          },
          orderBy: { enrolledAt: 'desc' },
          take: 1,
        },
        invoices: {
          orderBy: { issueDate: 'desc' },
        },
        attendance: {
          where: { personType: 'Student' },
          orderBy: { date: 'desc' },
          take: 10,
        },
        grades: {
          include: { subject: true, exam: true },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    })

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found.' },
        { status: 404 }
      )
    }

    const totalBilled = student.invoices.reduce((s, i) => s + i.amount, 0)
    const totalPaid = student.invoices.reduce((s, i) => s + i.amountPaid, 0)
    const totalBalance = student.invoices.reduce((s, i) => s + i.balance, 0)

    const latest = student.enrollments[0]
    const classLevel =
      latest?.classLevel?.name ?? latest?.stream?.classLevel?.name ?? '—'
    const stream = latest?.stream?.name ?? '—'

    const announcements = await db.announcement.findMany({
      where: { audience: { in: ['All', 'Parents'] } },
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      take: 6,
    })

    const events = await db.event.findMany({
      where: {
        audience: { in: ['All', 'Parents'] },
        startDate: { gte: new Date() },
        status: { in: ['Scheduled', 'Ongoing'] },
      },
      orderBy: { startDate: 'asc' },
      take: 6,
    })

    // Fetch timetable for the student's stream
    let timetable: any[] = []
    if (latest?.streamId) {
      timetable = await db.timetable.findMany({
        where: { streamId: latest.streamId },
        include: { subject: { select: { name: true } }, teacher: { select: { firstName: true, lastName: true } } },
        orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
      })
    }

    return NextResponse.json({
      student: {
        id: student.id,
        admissionNo: student.admissionNo,
        name: `${student.firstName} ${student.lastName}`,
        firstName: student.firstName,
        lastName: student.lastName,
        gender: student.gender,
        boarding: student.boarding,
        photo: student.photoUrl,
        classLevel,
        stream,
        status: student.status,
      },
      school: student.school
        ? {
            id: student.school.id,
            name: student.school.name,
            slug: student.school.slug,
          }
        : null,
      guardian: student.guardian
        ? {
            name: `${student.guardian.firstName} ${student.guardian.lastName}`,
            phone: student.guardian.phone,
            relation: student.guardian.relation,
          }
        : null,
      fees: {
        totalBilled,
        totalPaid,
        totalBalance,
        invoices: student.invoices.map(inv => ({
          id: inv.id,
          invoiceNo: inv.invoiceNo,
          academicYear: inv.academicYear,
          term: inv.term,
          amount: inv.amount,
          amountPaid: inv.amountPaid,
          balance: inv.balance,
          status: inv.status,
          dueDate: inv.dueDate,
          issueDate: inv.issueDate,
        })),
      },
      attendance: student.attendance.map(a => ({
        id: a.id,
        date: a.date,
        status: a.status,
      })),
      grades: student.grades.map(g => ({
        id: g.id,
        subject: g.subject.name,
        marks: g.marks,
        grade: g.grade,
        points: g.points,
        remarks: g.remarks,
        exam: g.exam.name,
        examType: g.exam.examType,
        term: g.exam.term,
      })),
      announcements: announcements.map(a => ({
        id: a.id,
        title: a.title,
        body: a.body,
        priority: a.priority,
        pinned: a.pinned,
        publishedAt: a.publishedAt,
        authorName: a.authorName,
      })),
      events: events.map(e => ({
        id: e.id,
        title: e.title,
        description: e.description,
        category: e.category,
        startDate: e.startDate,
        endDate: e.endDate,
        location: e.location,
        status: e.status,
      })),
      timetable: timetable.map(t => ({
        id: t.id,
        dayOfWeek: t.dayOfWeek,
        startTime: t.startTime,
        endTime: t.endTime,
        room: t.room,
        subject: { name: t.subject?.name || '—' },
        teacher: t.teacher ? { name: `${t.teacher.firstName} ${t.teacher.lastName}` } : null,
      })),
    })
  } catch (error) {
    console.error('[parent-dashboard] error:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard.' },
      { status: 500 }
    )
  }
}
