import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest, canUserDelete } from '@/lib/auth-utils'

// DELETE /api/finance/expenses/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const user = await getUserFromRequest(req)
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    if (!canUserDelete(user.role, 'finance')) {
      return NextResponse.json({ error: 'You do not have permission to delete financial records. Only admin and principal can delete.' }, { status: 403 })
    }
    await db.expense.delete({ where: { id } })
    await db.activityLog.create({
      data: { action: 'DELETE', entity: 'Expense', entityId: id, user: 'Bursar', details: 'Deleted expense record' },
    }).catch(() => {})
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
  }
}
