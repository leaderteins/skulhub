import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Parent dashboard data — returns everything the parent portal needs.
 *
 * Defensive design: each section is wrapped in its own try/catch so that
 * a failure in one area (e.g., missing Grade table column) doesn't crash
 * the whole endpoint. The parent sees what's available.
 */
export async function GET(
  _req: NextRequest,
  ctx: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await ctx.params

    // 1. Student core info (with safe includes)
    let student: any = null
    try {
      student = await db.student.findUnique({
        where: { id: studentId },
        include: {
          guardian: true,
          school: true,
        },
      })
    } catch (e) {
      console.error('[parent-dashboard] student query failed:', e)
      // Fallback: raw SQL
      const rows = await db.$queryRawUnsafe<any[]>(
        `SELECT s.*, g."firstName" as g_first, g."lastName" as g_last, g.phone as g_phone, g.relation as g_relation,
                sc.name as school_name, sc.slug as school_slug
         FROM "Student" s
         LEFT JOIN "Guardian" g ON g.id = s."guardianId"
         LEFT JOIN "School" sc ON sc.id = s."schoolId"
         WHERE s.id = $1 LIMIT 1`,
        studentId
      ).catch(() => [])
      if (rows.length > 0) {
        const r = rows[0]
        student = {
          ...r,
          guardian: r.g_first ? { firstName: r.g_first, lastName: r.g_last, phone: r.g_phone, relation: r.g_relation } : null,
          school: r.school_name ? { id: r.schoolId, name: r.school_name, slug: r.school_slug } : null,
        }
      }
    }

    if (!student) {
      return NextResponse.json(
        { error: 'Student not found.' },
        { status: 404 }
      )
    }

    // 2. Latest enrollment (class + stream)
    let latestEnrollment: any = null
    try {
      const enrollments = await db.enrollment.findMany({
        where: { studentId },
        include: {
          stream: { include: { classLevel: true } },
          classLevel: true,
        },
        orderBy: { enrolledAt: 'desc' },
        take: 1,
      })
      latestEnrollment = enrollments[0]
    } catch {
      // enrollment table might not exist — fallback
    }

    const classLevel =
      latestEnrollment?.classLevel?.name ??
      latestEnrollment?.stream?.classLevel?.name ?? '—'
    const stream = latestEnrollment?.stream?.name ?? '—'

    // 3. Invoices (fees)
    let invoices: any[] = []
    try {
      invoices = await db.invoice.findMany({
        where: { studentId },
        orderBy: { issueDate: 'desc' },
      })
    } catch {
      // fallback to raw SQL
      invoices = await db.$queryRawUnsafe<any[]>(
        `SELECT * FROM "Invoice" WHERE "studentId" = $1 ORDER BY "issueDate" DESC`,
        studentId
      ).catch(() => [])
    }

    const totalBilled = invoices.reduce((s: number, i: any) => s + (i.amount || 0), 0)
    const totalPaid = invoices.reduce((s: number, i: any) => s + (i.amountPaid || 0), 0)
    const totalBalance = invoices.reduce((s: number, i: any) => s + (i.balance || 0), 0)

    // 4. Recent attendance
    let attendance: any[] = []
    try {
      attendance = await db.attendance.findMany({
        where: { studentId, personType: 'Student' },
        orderBy: { date: 'desc' },
        take: 10,
      })
    } catch {
      attendance = await db.$queryRawUnsafe<any[]>(
        `SELECT * FROM "Attendance" WHERE "studentId" = $1 ORDER BY date DESC LIMIT 10`,
        studentId
      ).catch(() => [])
    }

    // 5. Recent grades
    let grades: any[] = []
    try {
      grades = await db.grade.findMany({
        where: { studentId },
        include: { subject: true, exam: true },
        orderBy: { createdAt: 'desc' },
        take: 20,
      })
    } catch {
      grades = await db.$queryRawUnsafe<any[]>(
        `SELECT g.*, s.name as subject_name, e.name as exam_name
         FROM "Grade" g
         LEFT JOIN "Subject" s ON s.id = g."subjectId"
         LEFT JOIN "Exam" e ON e.id = g."examId"
         WHERE g."studentId" = $1 ORDER BY g."createdAt" DESC LIMIT 20`,
        studentId
      ).catch(() => [])
    }

    // 6. Announcements
    let announcements: any[] = []
    try {
      announcements = await db.announcement.findMany({
        where: { audience: { in: ['All', 'Parents'] } },
        orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
        take: 6,
      })
    } catch {
      announcements = []
    }

    // 7. Upcoming events
    let events: any[] = []
    try {
      events = await db.event.findMany({
        where: {
          audience: { in: ['All', 'Parents'] },
          startDate: { gte: new Date() },
          status: { in: ['Scheduled', 'Ongoing'] },
        },
        orderBy: { startDate: 'asc' },
        take: 6,
      })
    } catch {
      events = []
    }

    // 8. Timetable
    let timetable: any[] = []
    if (latestEnrollment?.streamId) {
      try {
        timetable = await db.timetable.findMany({
          where: { streamId: latestEnrollment.streamId },
          include: { subject: { select: { name: true } }, teacher: { select: { firstName: true, lastName: true } } },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        })
      } catch {
        timetable = []
      }
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
        invoices: invoices.map((inv: any) => ({
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
      attendance: attendance.map((a: any) => ({
        id: a.id,
        date: a.date,
        status: a.status,
      })),
      grades: grades.map((g: any) => ({
        id: g.id,
        subject: g.subject?.name || g.subject_name || '—',
        exam: g.exam?.name || g.exam_name || '—',
        marks: g.marks,
        grade: g.grade,
        points: g.points,
        term: g.term,
        academicYear: g.academicYear,
      })),
      announcements: announcements.map((a: any) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        priority: a.priority,
        pinned: a.pinned,
        publishedAt: a.publishedAt,
        authorName: a.authorName,
      })),
      events: events.map((e: any) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        category: e.category,
        startDate: e.startDate,
        endDate: e.endDate,
        location: e.location,
        status: e.status,
      })),
      timetable: timetable.map((t: any) => ({
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
    console.error('[parent-dashboard] fatal error:', error)
    return NextResponse.json(
      { error: 'Failed to load dashboard.', details: String(error) },
      { status: 500 }
    )
  }
}
