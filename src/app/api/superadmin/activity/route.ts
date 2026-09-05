import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/superadmin/activity
 *
 * Cross-school activity feed — shows what's happening across ALL schools:
 * - Recent payments across all schools
 * - Recent student admissions
 * - Recent invoice generation
 * - Recent biometric taps
 * - Recent SMS notifications
 * - Recent bus trips started
 *
 * Returns a unified timeline of events, newest first.
 */
export async function GET() {
  try {
    // 1. Recent payments (across all schools)
    const payments = await db.$queryRawUnsafe<any[]>(`
      SELECT p.id, p.amount, p.method, p."payerName", p."receivedAt",
             s.name as "schoolName", s.slug, 'payment' as type
      FROM "Payment" p
      JOIN "School" s ON s.id = p."schoolId"
      WHERE s.slug != 'platform'
      ORDER BY p."receivedAt" DESC LIMIT 10
    `).catch(() => [])

    // 2. Recent students admitted
    const students = await db.$queryRawUnsafe<any[]>(`
      SELECT st.id, st."firstName", st."lastName", st."admissionNo", st."createdAt",
             s.name as "schoolName", s.slug, 'admission' as type
      FROM "Student" st
      JOIN "School" s ON s.id = st."schoolId"
      WHERE s.slug != 'platform'
      ORDER BY st."createdAt" DESC LIMIT 10
    `).catch(() => [])

    // 3. Recent invoices
    const invoices = await db.$queryRawUnsafe<any[]>(`
      SELECT i.id, i."invoiceNo", i.amount, i.status, i."issueDate",
             s.name as "schoolName", s.slug, 'invoice' as type
      FROM "Invoice" i
      JOIN "School" s ON s.id = i."schoolId"
      WHERE s.slug != 'platform'
      ORDER BY i."issueDate" DESC LIMIT 10
    `).catch(() => [])

    // 4. Recent biometric taps
    const biometric = await db.$queryRawUnsafe<any[]>(`
      SELECT b.id, b.action, b.location, b."timestamp",
             s.name as "schoolName", s.slug, 'biometric' as type
      FROM "BiometricLog" b
      JOIN "School" s ON s.id = b."schoolId"
      WHERE s.slug != 'platform'
      ORDER BY b."timestamp" DESC LIMIT 10
    `).catch(() => [])

    // 5. Recent SMS/Email notifications
    const notifications = await db.$queryRawUnsafe<any[]>(`
      SELECT n.id, n."eventType", n.channel, n.status, n."createdAt",
             s.name as "schoolName", s.slug, 'notification' as type
      FROM "SmsLog" n
      JOIN "School" s ON s.id = n."schoolId"
      WHERE s.slug != 'platform'
      ORDER BY n."createdAt" DESC LIMIT 10
    `).catch(() => [])

    // 6. Recent bus trips
    const trips = await db.$queryRawUnsafe<any[]>(`
      SELECT t.id, t.direction, t.status, t."departureAt", t."boardingCount",
             s.name as "schoolName", s.slug, 'bus' as type
      FROM "BusTrip" t
      JOIN "School" s ON s.id = t."schoolId"
      WHERE s.slug != 'platform'
      ORDER BY t."createdAt" DESC LIMIT 5
    `).catch(() => [])

    // Merge and sort by timestamp
    const allEvents = [
      ...payments.map((p: any) => ({ ...p, timestamp: p.receivedAt, title: `Payment of KES ${Number(p.amount).toLocaleString()}`, desc: `${p.payerName || 'Unknown'} · ${p.method}`, icon: 'dollar' })),
      ...students.map((s: any) => ({ ...s, timestamp: s.createdAt, title: `Student Admitted`, desc: `${s.firstName} ${s.lastName} (${s.admissionNo})`, icon: 'user' })),
      ...invoices.map((i: any) => ({ ...i, timestamp: i.issueDate, title: `Invoice ${i.invoiceNo}`, desc: `KES ${Number(i.amount).toLocaleString()} · ${i.status}`, icon: 'file' })),
      ...biometric.map((b: any) => ({ ...b, timestamp: b.timestamp, title: `Biometric Tap`, desc: `${b.action} at ${b.location || '—'}`, icon: 'fingerprint' })),
      ...notifications.map((n: any) => ({ ...n, timestamp: n.createdAt, title: `${n.channel.toUpperCase()} Sent`, desc: `${n.eventType} · ${n.status}`, icon: 'bell' })),
      ...trips.map((t: any) => ({ ...t, timestamp: t.departureAt, title: `Bus Trip Started`, desc: `${t.direction} · ${t.boardingCount} boarded`, icon: 'bus' })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json({
      events: allEvents.slice(0, 50),
      total: allEvents.length,
      breakdown: {
        payments: payments.length,
        admissions: students.length,
        invoices: invoices.length,
        biometric: biometric.length,
        notifications: notifications.length,
        trips: trips.length,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
