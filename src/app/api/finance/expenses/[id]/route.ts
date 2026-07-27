import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// DELETE /api/finance/expenses/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    await db.expense.delete({ where: { id } })
    await db.activityLog.create({
      data: { action: 'DELETE', entity: 'Expense', entityId: id, user: 'Bursar', details: 'Deleted expense record' },
    }).catch(() => {})
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
  }
}
