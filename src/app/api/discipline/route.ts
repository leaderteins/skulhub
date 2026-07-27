import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/discipline?search=&category=&severity=&status=&studentId=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() || ''
  const category = searchParams.get('category') || ''
  const severity = searchParams.get('severity') || ''
  const status = searchParams.get('status') || ''
  const studentId = searchParams.get('studentId') || ''

  const where: {
    OR?: Array<Record<string, unknown>>
    category?: string
    severity?: string
    status?: string
    studentId?: string
  } = {}
  if (category) where.category = category
  if (severity) where.severity = severity
  if (status) where.status = status
  if (studentId) where.studentId = studentId
  if (search) {
    where.OR = [
      { incidentNo: { contains: search } },
      { description: { contains: search } },
      { student: { firstName: { contains: search } } },
      { student: { lastName: { contains: search } } },
      { student: { admissionNo: { contains: search } } },
      { reportedBy: { contains: search } },
    ]
  }

  const [incidents, total, bySeverity, byCategory, byStatus, recentThisWeek, criticalOpen] = await Promise.all([
    db.incident.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        student: {
          select: {
            id: true, admissionNo: true, firstName: true, lastName: true, gender: true,
            enrollments: { take: 1, select: { stream: { select: { name: true, classLevel: { select: { name: true } } } } } },
          },
        },
      },
    }),
    db.incident.count({ where }),
    db.incident.groupBy({ by: ['severity'], _count: true }),
    db.incident.groupBy({ by: ['category'], _count: true }),
    db.incident.groupBy({ by: ['status'], _count: true }),
    db.incident.count({ where: { date: { gte: new Date(Date.now() - 7 * 86400000) } } }),
    db.incident.count({ where: { severity: 'Critical', status: { in: ['Open', 'Investigating'] } } }),
  ])

  // Repeat offenders (students with 3+ incidents)
  const allIncidents = await db.incident.findMany({ select: { studentId: true } })
  const offenderMap: Record<string, number> = {}
  allIncidents.forEach(i => { offenderMap[i.studentId] = (offenderMap[i.studentId] || 0) + 1 })
  const repeatOffenderIds = Object.entries(offenderMap).filter(([, c]) => c >= 3).map(([id]) => id).slice(0, 10)
  const repeatOffenders = await db.student.findMany({
    where: { id: { in: repeatOffenderIds } },
    select: {
      id: true, admissionNo: true, firstName: true, lastName: true,
      enrollments: { take: 1, select: { stream: { select: { name: true, classLevel: { select: { name: true } } } } } },
    },
  })
  const repeatOffenderData = repeatOffenders.map(s => ({
    ...s,
    incidentCount: offenderMap[s.id] || 0,
    stream: s.enrollments[0]?.stream?.name,
    classLevel: s.enrollments[0]?.stream?.classLevel?.name,
    enrollments: undefined,
  })).sort((a, b) => b.incidentCount - a.incidentCount)

  return NextResponse.json({
    stats: {
      total,
      open: byStatus.find(s => s.status === 'Open')?._count || 0,
      investigating: byStatus.find(s => s.status === 'Investigating')?._count || 0,
      resolved: byStatus.find(s => s.status === 'Resolved')?._count || 0,
      closed: byStatus.find(s => s.status === 'Closed')?._count || 0,
      critical: bySeverity.find(s => s.severity === 'Critical')?._count || 0,
      recentThisWeek,
      criticalOpen,
    },
    incidents: incidents.map(i => ({
      ...i,
      student: {
        ...i.student,
        stream: i.student.enrollments[0]?.stream?.name,
        classLevel: i.student.enrollments[0]?.stream?.classLevel?.name,
        enrollments: undefined,
      },
    })),
    bySeverity: bySeverity.map(s => ({ name: s.severity, count: s._count })),
    byCategory: byCategory.map(c => ({ name: c.category, count: c._count })),
    byStatus: byStatus.map(s => ({ name: s.status, count: s._count })),
    repeatOffenders: repeatOffenderData,
  })
}

// POST /api/discipline — create a new incident
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.studentId || !body.description || !body.category) {
    return NextResponse.json({ error: 'studentId, category and description are required' }, { status: 400 })
  }
  const count = await db.incident.count()
  const incidentNo = `INC/${8000 + count + 1}`

  const incident = await db.incident.create({
    data: {
      incidentNo,
      studentId: body.studentId,
      date: body.date ? new Date(body.date) : new Date(),
      location: body.location || null,
      category: body.category,
      severity: body.severity || 'Minor',
      description: body.description,
      reportedBy: body.reportedBy || null,
      witnesses: body.witnesses || null,
      status: body.status || 'Open',
      sanction: body.sanction || null,
      sanctionDetails: body.sanctionDetails || null,
      sanctionStartDate: body.sanctionStartDate ? new Date(body.sanctionStartDate) : null,
      sanctionEndDate: body.sanctionEndDate ? new Date(body.sanctionEndDate) : null,
      parentNotified: body.parentNotified || false,
      parentNotificationDate: body.parentNotified ? new Date() : null,
    },
  })
  await db.activityLog.create({
    data: { action: 'CREATE', entity: 'Incident', entityId: incident.id, user: body.reportedBy || 'Staff', details: `Logged incident ${incidentNo}: ${body.category}` },
  })
  return NextResponse.json(incident, { status: 201 })
}
