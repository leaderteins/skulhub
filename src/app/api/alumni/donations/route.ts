import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/alumni/donations — record a new donation
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.alumnusId || !body.amount) {
    return NextResponse.json({ error: 'alumnusId and amount are required' }, { status: 400 })
  }
  const donation = await db.donation.create({
    data: {
      alumnusId: body.alumnusId,
      amount: Number(body.amount),
      method: body.method || 'M-Pesa',
      reference: body.reference || null,
      purpose: body.purpose || 'General',
      date: body.date ? new Date(body.date) : new Date(),
      notes: body.notes || null,
    },
    include: { alumnus: { select: { firstName: true, lastName: true } } },
  })
  await db.activityLog.create({
    data: { action: 'CREATE', entity: 'Donation', entityId: donation.id, user: 'Admin', details: `Donation of KES ${donation.amount} from ${donation.alumnus.firstName} ${donation.alumnus.lastName}` },
  })
  return NextResponse.json(donation, { status: 201 })
}
