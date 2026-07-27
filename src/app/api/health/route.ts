import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/health?search=&severity=&status=
// Returns clinic visits + medical records overview + stats.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() || ''
  const severity = searchParams.get('severity') || ''
  const status = searchParams.get('status') || ''

  const where: {
    OR?: Array<Record<string, unknown>>
    severity?: string
    status?: string
  } = {}
  if (severity) where.severity = severity
  if (status) where.status = status
  if (search) {
    where.OR = [
      { complaint: { contains: search } },
      { diagnosis: { contains: search } },
      { student: { firstName: { contains: search } } },
      { student: { lastName: { contains: search } } },
      { student: { admissionNo: { contains: search } } },
    ]
  }

  const [visits, totalRecords, totalVisits, severeVisits, referredVisits, recentVisits, bySeverity, byStatus] = await Promise.all([
    db.clinicVisit.findMany({
      where,
      orderBy: { visitDate: 'desc' },
      take: 50,
      include: {
        student: {
          select: {
            id: true, admissionNo: true, firstName: true, lastName: true, gender: true,
            enrollments: { take: 1, select: { stream: { select: { name: true, classLevel: { select: { name: true } } } } } },
          },
        },
      },
    }),
    db.medicalRecord.count(),
    db.clinicVisit.count(),
    db.clinicVisit.count({ where: { severity: 'Severe' } }),
    db.clinicVisit.count({ where: { status: 'Referred' } }),
    db.clinicVisit.count({ where: { visitDate: { gte: new Date(Date.now() - 7 * 86400000) } } }),
    db.clinicVisit.groupBy({ by: ['severity'], _count: true }),
    db.clinicVisit.groupBy({ by: ['status'], _count: true }),
  ])

  // Top complaints
  const allVisits = await db.clinicVisit.findMany({ select: { complaint: true } })
  const complaintMap: Record<string, number> = {}
  allVisits.forEach(v => { complaintMap[v.complaint] = (complaintMap[v.complaint] || 0) + 1 })
  const topComplaints = Object.entries(complaintMap).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count }))

  return NextResponse.json({
    stats: {
      totalRecords,
      totalVisits,
      severeVisits,
      referredVisits,
      recentVisits,
    },
    visits: visits.map(v => ({
      id: v.id,
      visitDate: v.visitDate,
      complaint: v.complaint,
      diagnosis: v.diagnosis,
      treatment: v.treatment,
      prescription: v.prescription,
      temperature: v.temperature,
      bloodPressure: v.bloodPressure,
      severity: v.severity,
      attendedBy: v.attendedBy,
      referredTo: v.referredTo,
      status: v.status,
      followUpDate: v.followUpDate,
      student: {
        id: v.student.id,
        admissionNo: v.student.admissionNo,
        firstName: v.student.firstName,
        lastName: v.student.lastName,
        gender: v.student.gender,
        stream: v.student.enrollments[0]?.stream?.name,
        classLevel: v.student.enrollments[0]?.stream?.classLevel?.name,
      },
    })),
    bySeverity: bySeverity.map(s => ({ name: s.severity, count: s._count })),
    byStatus: byStatus.map(s => ({ name: s.status, count: s._count })),
    topComplaints,
  })
}

// POST /api/health — create a clinic visit
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.studentId || !body.complaint) {
    return NextResponse.json({ error: 'studentId and complaint are required' }, { status: 400 })
  }
  const visit = await db.clinicVisit.create({
    data: {
      studentId: body.studentId,
      complaint: body.complaint,
      diagnosis: body.diagnosis || null,
      treatment: body.treatment || null,
      prescription: body.prescription || null,
      temperature: body.temperature ? Number(body.temperature) : null,
      bloodPressure: body.bloodPressure || null,
      severity: body.severity || 'Mild',
      attendedBy: body.attendedBy || null,
      referredTo: body.referredTo || null,
      status: body.status || 'Treated',
      followUpDate: body.followUpDate ? new Date(body.followUpDate) : null,
    },
  })
  await db.activityLog.create({
    data: { action: 'CREATE', entity: 'ClinicVisit', entityId: visit.id, user: body.attendedBy || 'Nurse', details: `Logged clinic visit: ${body.complaint}` },
  })
  return NextResponse.json(visit, { status: 201 })
}
