import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/alumni?search=&graduationYear=&industry=&status=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search')?.trim() || ''
  const graduationYear = searchParams.get('graduationYear') || ''
  const industry = searchParams.get('industry') || ''
  const status = searchParams.get('status') || ''

  const where: {
    OR?: Array<Record<string, unknown>>
    graduationYear?: number
    industry?: string
    status?: string
  } = {}
  if (graduationYear) where.graduationYear = Number(graduationYear)
  if (industry) where.industry = industry
  if (status) where.status = status
  if (search) {
    where.OR = [
      { firstName: { contains: search } },
      { lastName: { contains: search } },
      { admissionNo: { contains: search } },
      { email: { contains: search } },
      { career: { contains: search } },
      { employer: { contains: search } },
    ]
  }

  const [alumni, total, totalDonations, donationsByPurpose, byYear, byIndustry, byStatus, recentDonations, topDonors] = await Promise.all([
    db.alumnus.findMany({
      where,
      orderBy: { graduationYear: 'desc' },
      include: { donations: { select: { amount: true, date: true, purpose: true } } },
    }),
    db.alumnus.count({ where }),
    db.donation.aggregate({ _sum: { amount: true } }),
    db.donation.groupBy({ by: ['purpose'], _sum: { amount: true }, _count: true }),
    db.alumnus.groupBy({ by: ['graduationYear'], _count: true, orderBy: { graduationYear: 'asc' } }),
    db.alumnus.groupBy({ by: ['industry'], _count: true }),
    db.alumnus.groupBy({ by: ['status'], _count: true }),
    db.donation.findMany({
      orderBy: { date: 'desc' },
      take: 8,
      include: { alumnus: { select: { firstName: true, lastName: true, graduationYear: true, career: true } } },
    }),
    db.alumnus.findMany({
      include: { donations: { select: { amount: true } } },
      take: 200,
    }),
  ])

  // Compute top donors (sum donations per alumnus)
  const donorSums = topDonors.map(a => ({
    id: a.id,
    name: `${a.firstName} ${a.lastName}`,
    graduationYear: a.graduationYear,
    career: a.career,
    total: a.donations.reduce((s, d) => s + d.amount, 0),
  })).filter(d => d.total > 0).sort((a, b) => b.total - a.total).slice(0, 8)

  return NextResponse.json({
    stats: {
      total,
      totalDonations: totalDonations._sum.amount || 0,
      avgDonation: recentDonations.length > 0 ? (totalDonations._sum.amount || 0) / total : 0,
    },
    alumni: alumni.map(a => ({
      ...a,
      totalDonated: a.donations.reduce((s, d) => s + d.amount, 0),
      donationCount: a.donations.length,
      lastDonation: a.donations[0]?.date || null,
      donations: undefined,
    })),
    byYear: byYear.map(y => ({ year: y.graduationYear, count: y._count })),
    byIndustry: byIndustry.map(i => ({ name: i.industry || 'Unknown', count: i._count })),
    byStatus: byStatus.map(s => ({ name: s.status, count: s._count })),
    donationsByPurpose: donationsByPurpose.map(p => ({ name: p.purpose, amount: p._sum.amount || 0, count: p._count })),
    recentDonations: recentDonations.map(d => ({
      id: d.id,
      amount: d.amount,
      method: d.method,
      purpose: d.purpose,
      date: d.date,
      alumnus: d.alumnus,
    })),
    topDonors: donorSums,
    graduationYears: Array.from(new Set(byYear.map(y => y.graduationYear))).sort((a, b) => b - a),
  })
}

// POST /api/alumni — register a new alumnus
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.firstName || !body.lastName || !body.graduationYear) {
    return NextResponse.json({ error: 'firstName, lastName and graduationYear are required' }, { status: 400 })
  }
  const alumnus = await db.alumnus.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email || null,
      phone: body.phone || null,
      gender: body.gender || 'Male',
      admissionNo: body.admissionNo || null,
      graduationYear: Number(body.graduationYear),
      classLevel: body.classLevel || 'Form 4',
      career: body.career || null,
      employer: body.employer || null,
      industry: body.industry || null,
      location: body.location || null,
      linkedin: body.linkedin || null,
      achievement: body.achievement || null,
      status: body.status || 'Active',
    },
  })
  await db.activityLog.create({
    data: { action: 'CREATE', entity: 'Alumnus', entityId: alumnus.id, user: 'Admin', details: `Registered alumnus ${alumnus.firstName} ${alumnus.lastName} (${alumnus.graduationYear})` },
  })
  return NextResponse.json(alumnus, { status: 201 })
}
