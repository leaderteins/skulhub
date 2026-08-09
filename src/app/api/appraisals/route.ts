import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/appraisals?staffId=&status=&period=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const staffId = searchParams.get('staffId') || ''
  const status = searchParams.get('status') || ''
  const period = searchParams.get('period') || ''

  const where: any = {}
  if (staffId) where.staffId = staffId
  if (status) where.status = status
  if (period) where.period = period

  const [appraisals, total, completed, reviewed, drafts, byStatus, byPeriod] = await Promise.all([
    db.appraisal.findMany({
      where,
      orderBy: [{ reviewDate: 'desc' }, { createdAt: 'desc' }],
      include: {
        staff: {
          select: {
            id: true, employeeNo: true, firstName: true, lastName: true,
            role: true, department: { select: { name: true } },
          },
        },
      },
    }),
    db.appraisal.count({ where }),
    db.appraisal.count({ where: { ...where, status: 'Completed' } }),
    db.appraisal.count({ where: { ...where, status: 'Reviewed' } }),
    db.appraisal.count({ where: { ...where, status: 'Draft' } }),
    db.appraisal.groupBy({ by: ['status'], _count: true }),
    db.appraisal.groupBy({ by: ['period'], _count: true, _avg: { overallScore: true } }),
  ])

  // Stats — compute average score and top performers
  const allAppraisals = await db.appraisal.findMany({
    select: { overallScore: true, staffId: true, status: true },
  })
  const completedAll = allAppraisals.filter(a => a.status === 'Completed' || a.status === 'Reviewed')
  const avgScore = completedAll.length
    ? Math.round((completedAll.reduce((s, a) => s + a.overallScore, 0) / completedAll.length) * 10) / 10
    : 0

  // Top performers — group by staff, take their latest score
  const byStaff = new Map<string, number>()
  for (const a of completedAll) {
    const cur = byStaff.get(a.staffId) ?? -1
    if (a.overallScore > cur) byStaff.set(a.staffId, a.overallScore)
  }
  const topPerformers = Array.from(byStaff.entries())
    .filter(([, score]) => score >= 8)
    .length

  return NextResponse.json({
    stats: {
      total,
      completed,
      reviewed,
      drafts,
      avgScore,
      topPerformers,
    },
    appraisals: appraisals.map(a => ({
      ...a,
      staffName: `${a.staff.firstName} ${a.staff.lastName}`,
      staffRole: a.staff.role,
      staffDept: a.staff.department?.name || '—',
      staff: undefined,
    })),
    byStatus: byStatus.map(s => ({ name: s.status, count: s._count })),
    byPeriod: byPeriod.map(p => ({
      name: p.period,
      count: p._count,
      avg: p._avg.overallScore ? Math.round(p._avg.overallScore * 10) / 10 : 0,
    })),
  })
}

// POST /api/appraisals — create appraisal (auto-calculate overallScore)
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  if (!body.staffId || !body.period) {
    return NextResponse.json({ error: 'staffId and period are required' }, { status: 400 })
  }

  const punctuality = Math.min(10, Math.max(0, Number(body.punctuality) || 0))
  const teamwork = Math.min(10, Math.max(0, Number(body.teamwork) || 0))
  const studentResults = Math.min(10, Math.max(0, Number(body.studentResults) || 0))
  const professionalism = Math.min(10, Math.max(0, Number(body.professionalism) || 0))
  const innovation = Math.min(10, Math.max(0, Number(body.innovation) || 0))

  // overallScore = average of 5 criteria, rounded to nearest integer
  const overallScore = Math.round(
    (punctuality + teamwork + studentResults + professionalism + innovation) / 5,
  )

  const appraisal = await db.appraisal.create({
    data: {
      staffId: body.staffId,
      period: body.period,
      reviewDate: body.reviewDate ? new Date(body.reviewDate) : new Date(),
      punctuality,
      teamwork,
      studentResults,
      professionalism,
      innovation,
      overallScore,
      strengths: body.strengths || null,
      improvements: body.improvements || null,
      goals: body.goals || null,
      reviewerName: body.reviewerName || null,
      status: body.status || 'Completed',
    },
  })

  await db.activityLog.create({
    data: {
      action: 'CREATE',
      entity: 'Appraisal',
      entityId: appraisal.id,
      user: body.reviewerName || 'Reviewer',
      details: `Appraisal for ${body.period} — overall score ${overallScore}/10`,
    },
  })

  return NextResponse.json(appraisal, { status: 201 })
}
