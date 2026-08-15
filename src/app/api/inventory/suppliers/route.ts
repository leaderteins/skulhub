import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/inventory/suppliers — simple list of active suppliers for dropdowns
export async function GET() {
  const suppliers = await db.supplier.findMany({
    where: { status: 'Active' },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, category: true, phone: true, email: true },
  })
  return NextResponse.json({ suppliers })
}
