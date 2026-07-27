import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/admissions?search=&status=&source=&priority=&classLevelId=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() || ''
  const status = searchParams.get('status') || ''
  const source = searchParams.get('source') || ''
  const priority = searchParams.get('priority') || ''
  const classLevelId = searchParams.get('classLevelId') || ''

  const where: {
    OR?: Array<Record<string, unknown>>
    status?: string
    source?: string
    priority?: string
    appliedClassLevelId?: string
  } = {}
  if (status) where.status = status
  if (source) where.source = source
  if (priority) where.priority = priority
  if (classLevelId) where.appliedClassLevelId = classLevelId
  if (search) {
    where.OR = [
      { applicantName: { contains: search } },
      { applicationNo: { contains: search } },
      { email: { contains: search } },
      { phone: { contains: search } },
      { guardianName: { contains: search } },
      { previousSchool: { contains: search } },
    ]
  }

  const [applications, total, byStatus, bySource, byPriority, classLevels, recentThisWeek] = await Promise.all([
    db.application.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      include: { appliedClassLevel: { select: { name: true } } },
    }),
    db.application.count({ where }),
    db.application.groupBy({ by: ['status'], _count: true }),
    db.application.groupBy({ by: ['source'], _count: true }),
    db.application.groupBy({ by: ['priority'], _count: true }),
    db.classLevel.findMany({ select: { id: true, name: true }, orderBy: { order: 'asc' } }),
    db.application.count({ where: { submittedAt: { gte: new Date(Date.now() - 7 * 86400000) } } }),
  ])

  // Upcoming interviews
  const upcomingInterviews = await db.application.findMany({
    where: {
      status: 'Interview Scheduled',
      interviewDate: { gte: new Date() },
    },
    orderBy: { interviewDate: 'asc' },
    take: 5,
    include: { appliedClassLevel: { select: { name: true } } },
  })

  return NextResponse.json({
    stats: {
      total,
      pending: byStatus.find(s => s.status === 'Pending')?._count || 0,
      reviewing: byStatus.find(s => s.status === 'Reviewing')?._count || 0,
      interviewScheduled: byStatus.find(s => s.status === 'Interview Scheduled')?._count || 0,
      accepted: byStatus.find(s => s.status === 'Accepted')?._count || 0,
      rejected: byStatus.find(s => s.status === 'Rejected')?._count || 0,
      waitlisted: byStatus.find(s => s.status === 'Waitlisted')?._count || 0,
      enrolled: byStatus.find(s => s.status === 'Enrolled')?._count || 0,
      recentThisWeek,
    },
    applications: applications.map(a => ({
      ...a,
      appliedClassName: a.appliedClassLevel?.name || null,
      appliedClassLevel: undefined,
    })),
    byStatus: byStatus.map(s => ({ name: s.status, count: s._count })),
    bySource: bySource.map(s => ({ name: s.source, count: s._count })),
    byPriority: byPriority.map(p => ({ name: p.priority, count: p._count })),
    upcomingInterviews: upcomingInterviews.map(a => ({
      id: a.id,
      applicationNo: a.applicationNo,
      applicantName: a.applicantName,
      interviewDate: a.interviewDate,
      appliedClassName: a.appliedClassLevel?.name || null,
      guardianPhone: a.guardianPhone,
    })),
    classLevels,
  })
}

// POST /api/admissions — create a new application
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.applicantName || !body.guardianName || !body.phone) {
    return NextResponse.json({ error: 'applicantName, guardianName and phone are required' }, { status: 400 })
  }
  // Generate application number
  const count = await db.application.count()
  const applicationNo = `APP/${7000 + count + 1}`

  const application = await db.application.create({
    data: {
      applicantName: body.applicantName,
      email: body.email || null,
      phone: body.phone,
      gender: body.gender || 'Male',
      dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : null,
      previousSchool: body.previousSchool || null,
      appliedClassLevelId: body.appliedClassLevelId || null,
      appliedYear: body.appliedYear || '2025',
      appliedTerm: body.appliedTerm || 'Term 1',
      boarding: body.boarding || false,
      guardianName: body.guardianName,
      guardianPhone: body.guardianPhone || body.phone,
      guardianEmail: body.guardianEmail || null,
      guardianOccupation: body.guardianOccupation || null,
      county: body.county || null,
      applicationNo,
      source: body.source || 'Walk-in',
      status: body.status || 'Pending',
      priority: body.priority || 'Normal',
      notes: body.notes || null,
    },
  })
  await db.activityLog.create({
    data: { action: 'CREATE', entity: 'Application', entityId: application.id, user: 'Admissions', details: `New application ${applicationNo} from ${application.applicantName}` },
  })
  return NextResponse.json(application, { status: 201 })
}
