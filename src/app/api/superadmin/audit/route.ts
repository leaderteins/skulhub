import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/** GET /api/superadmin/audit — Audit log of all super admin actions
 * Uses the SmsLog table (which stores all system events) + ActivityLog
 */
export async function GET(req: NextRequest) {
  try {
    const logs = await db.$queryRawUnsafe<any[]>(`
      SELECT a.id, a.action, a.entity, a."entityId", a.user as "userName", a.details, a."createdAt",
             s.name as "schoolName"
      FROM "ActivityLog" a
      LEFT JOIN "School" s ON s.id = a."entityId"
      ORDER BY a."createdAt" DESC LIMIT 100
    `).catch(() => [])

    // Also get recent payment/invoice events as audit trail
    const payments = await db.$queryRawUnsafe<any[]>(`
      SELECT p.id, 'Payment' as entity, p.amount, p.method, p."receivedBy" as "userName",
             p."receivedAt" as "createdAt", s.name as "schoolName",
             'payment_recorded' as action
      FROM "Payment" p
      LEFT JOIN "School" s ON s.id = p."schoolId"
      WHERE s.slug != 'platform'
      ORDER BY p."receivedAt" DESC LIMIT 50
    `).catch(() => [])

    const allLogs = [
      ...logs.map((l: any) => ({ ...l, type: 'system' })),
      ...payments.map((p: any) => ({ ...p, type: 'payment', details: `KES ${Number(p.amount).toLocaleString()} via ${p.method}` })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return NextResponse.json({ logs: allLogs.slice(0, 100), total: allLogs.length })
  } catch (e: any) { return NextResponse.json({ error: e?.message }, { status: 500 }) }
}
