import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/alumni/[id] — alumnus detail with full donation history
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const alumnus = await db.alumnus.findUnique({
    where: { id },
    include: { donations: { orderBy: { date: 'desc' } } },
  })
  if (!alumnus) return NextResponse.json({ error: 'Alumnus not found' }, { status: 404 })

  const totalDonated = alumnus.donations.reduce((s, d) => s + d.amount, 0)
  const donationsByPurpose = alumnus.donations.reduce((acc, d) => {
    acc[d.purpose] = (acc[d.purpose] || 0) + d.amount
    return acc
  }, {} as Record<string, number>)

  return NextResponse.json({
    ...alumnus,
    totalDonated,
    donationCount: alumnus.donations.length,
    firstDonation: alumnus.donations[alumnus.donations.length - 1]?.date || null,
    lastDonation: alumnus.donations[0]?.date || null,
    donationsByPurpose,
  })
}

// PUT /api/alumni/[id] — update
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  const alumnus = await db.alumnus.update({
    where: { id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phone: body.phone,
      career: body.career,
      employer: body.employer,
      industry: body.industry,
      location: body.location,
      linkedin: body.linkedin,
      achievement: body.achievement,
      status: body.status,
    },
  })
  return NextResponse.json(alumnus)
}

// DELETE /api/alumni/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  await db.alumnus.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
