import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/notifications/seed
 * ----------------------------
 * Creates ~24 demo notifications of varying types/priorities/dates for the
 * currently signed-in school. Used to populate the redesigned Notifications
 * module UI for demonstration.
 *
 * Body (optional): { force?: boolean }
 *  - force: true  → wipe existing AppNotifications for the school first
 *  - force: false → only insert if no notifications exist (default)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as Record<string, unknown>))
    const force = !!(body && (body as Record<string, unknown>).force)

    // Resolve school
    let schoolId: string | null = null
    try {
      const school = await db.school.findFirst({ where: { slug: { not: 'platform' } } })
      if (school) schoolId = school.id
    } catch {}
    if (!schoolId) {
      return NextResponse.json({ error: 'No school found' }, { status: 404 })
    }

    if (force) {
      await db.appNotification.deleteMany({ where: { schoolId } })
    } else {
      const existing = await db.appNotification.count({ where: { schoolId } })
      if (existing > 0) {
        return NextResponse.json({
          ok: true,
          seeded: false,
          existing,
          message: `${existing} notifications already exist. Pass { force: true } to re-seed.`,
        })
      }
    }

    const now = new Date()
    const samples = buildSamples(schoolId, now)

    const created = await db.appNotification.createMany({
      data: samples,
    })

    // Broadcast the latest few to the realtime service (best-effort)
    try {
      const latest = samples.slice(0, 3)
      await Promise.all(latest.map(async (n) => {
        try {
          await fetch('http://localhost:3003/internal/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              schoolId: n.schoolId,
              type: n.type,
              priority: n.priority,
              title: n.title,
              message: n.message,
            }),
            signal: AbortSignal.timeout(1500),
          })
        } catch {}
      }))
    } catch {}

    return NextResponse.json({
      ok: true,
      seeded: true,
      count: created.count,
      schoolId,
    })
  } catch (e: unknown) {
    console.error('[notifications/seed] error:', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Seed failed' },
      { status: 500 },
    )
  }
}

/**
 * DELETE /api/notifications/seed
 * ------------------------------
 * Wipes all AppNotification rows for the current school (used by the
 * "Clear all" button's confirmation dialog).
 */
export async function DELETE() {
  try {
    let schoolId: string | null = null
    try {
      const school = await db.school.findFirst({ where: { slug: { not: 'platform' } } })
      if (school) schoolId = school.id
    } catch {}
    if (!schoolId) {
      return NextResponse.json({ ok: false, error: 'No school found' }, { status: 404 })
    }
    const deleted = await db.appNotification.deleteMany({ where: { schoolId } })
    return NextResponse.json({ ok: true, deleted: deleted.count })
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Failed to clear notifications' },
      { status: 500 },
    )
  }
}

// ---------------------------------------------------------------------------
// Sample data — covers 6 types, 4 priorities, last 7 days, some unread
// ---------------------------------------------------------------------------

interface Sample {
  schoolId: string
  userId: string | null
  role: string | null
  type: string
  priority: string
  title: string
  message: string
  metadata: string | null
  readAt: Date | null
  createdAt?: Date  // optional here; defaulted from readAt below if absent
}

function buildSamples(schoolId: string, now: Date): Sample[] {
  const ago = (hoursAgo: number) => {
    const d = new Date(now)
    d.setHours(d.getHours() - hoursAgo)
    return d
  }
  const withMeta = (m: Record<string, unknown>) => JSON.stringify(m)
  const typeDefaultMeta = (type: string) => withMeta({ type, source: 'auto' })

  const samples: Array<Omit<Sample, 'schoolId'>> = [
    // Today (urgent + high)
    { userId: null, role: null, type: 'fee', priority: 'urgent', title: 'Fee deadline today', message: 'Term 2 fees of KES 18,500 must be cleared by 5:00 PM today for 23 students.', metadata: withMeta({ count: 23, amount: 18500, term: 'Term 2' }), readAt: null, createdAt: ago(1) },
    { userId: null, role: null, type: 'attendance', priority: 'high', title: 'Form 3 East: 6 absent', message: '6 students absent in Form 3 East this morning. Parent SMS sent.', metadata: withMeta({ class: 'Form 3 East', absent: 6, total: 38 }), readAt: null, createdAt: ago(2) },
    { userId: null, role: null, type: 'exam', priority: 'normal', title: 'Math CAT 1 graded', message: 'Form 2 Mathematics CAT 1 results published. Average: 64%. Top: 92%.', metadata: withMeta({ subject: 'Mathematics', classLevel: 'Form 2', avg: 64, top: 92 }), readAt: null, createdAt: ago(3) },
    { userId: null, role: 'bursar', type: 'fee', priority: 'high', title: 'M-Pesa payment received', message: 'KES 45,000 received from parent of Wanjiru M. (Form 1 West). Invoice updated.', metadata: withMeta({ amount: 45000, method: 'M-Pesa', student: 'Wanjiru M.' }), readAt: null, createdAt: ago(4) },
    { userId: null, role: null, type: 'discipline', priority: 'high', title: 'Incident logged', message: 'Disciplinary incident reported in Form 4 South — involves 2 students. Requires principal review.', metadata: withMeta({ class: 'Form 4 South', severity: 'high' }), readAt: null, createdAt: ago(5) },
    { userId: null, role: null, type: 'system', priority: 'normal', title: 'Backup completed', message: 'Nightly database backup completed successfully. Size: 124 MB.', metadata: typeDefaultMeta('system'), readAt: ago(6) },
    { userId: null, role: null, type: 'message', priority: 'low', title: 'PTA meeting reminder', message: 'Reminder: PTA meeting this Friday 6 PM in the main hall. Agenda attached.', metadata: withMeta({ when: 'Friday 6 PM', venue: 'Main Hall' }), readAt: ago(7) },
    { userId: null, role: null, type: 'fee', priority: 'normal', title: '3 invoices overdue', message: '3 invoices passed their due date yesterday. Auto-reminders sent to parents.', metadata: withMeta({ count: 3, action: 'auto-reminder' }), readAt: null, createdAt: ago(9) },
    { userId: null, role: null, type: 'attendance', priority: 'normal', title: 'Daily attendance 96%', message: 'Whole-school attendance today: 96% present, 3% absent, 1% late.', metadata: withMeta({ present: 96, absent: 3, late: 1 }), readAt: ago(12) },

    // Yesterday
    { userId: null, role: null, type: 'exam', priority: 'normal', title: 'KCSE trial results', message: 'KCSE trial exams completed. Mean score: 8.42 (B plain). 14 students scored A.', metadata: withMeta({ mean: 8.42, grade: 'B', distinction: 14 }), readAt: ago(28) },
    { userId: null, role: 'bursar', type: 'fee', priority: 'high', title: 'Outstanding fees: KES 284,000', message: 'Total outstanding fees across 41 students. Generate statement for follow-up.', metadata: withMeta({ amount: 284000, count: 41 }), readAt: null, createdAt: ago(30) },
    { userId: null, role: null, type: 'discipline', priority: 'normal', title: '2 incidents resolved', message: 'Two minor incidents from last week resolved. Counselling sessions completed.', metadata: withMeta({ count: 2, action: 'resolved' }), readAt: ago(34) },
    { userId: null, role: null, type: 'system', priority: 'low', title: 'System update scheduled', message: 'SkulHub will be unavailable Sunday 2 AM - 4 AM for routine maintenance.', metadata: withMeta({ window: 'Sun 2-4 AM', type: 'maintenance' }), readAt: ago(40) },

    // 2 days ago
    { userId: null, role: null, type: 'attendance', priority: 'urgent', title: 'Boarding house: roll-call gap', message: 'Boarding house roll-call gap detected at 11 PM. 1 student unaccounted for 8 minutes.', metadata: withMeta({ house: 'Boarding', student: 1, gapMinutes: 8 }), readAt: ago(54) },
    { userId: null, role: null, type: 'exam', priority: 'normal', title: 'English essay marks uploaded', message: 'Form 3 English essay marks uploaded. Average: 71%. Best: 96%.', metadata: withMeta({ subject: 'English', classLevel: 'Form 3', avg: 71, best: 96 }), readAt: ago(60) },
    { userId: null, role: 'librarian', type: 'system', priority: 'normal', title: '5 books overdue', message: '5 library books past due date. Auto-fines of KES 50/day applied.', metadata: withMeta({ count: 5, fine: '50/day' }), readAt: ago(70) },

    // 3 days ago
    { userId: null, role: null, type: 'fee', priority: 'low', title: 'Scholarship approved', message: 'Scholarship request for Achieng G. approved. KES 35,000 waiver applied to next invoice.', metadata: withMeta({ student: 'Achieng G.', amount: 35000 }), readAt: ago(78) },
    { userId: null, role: null, type: 'discipline', priority: 'normal', title: 'Conduct review needed', message: 'Form 2 North: 4 students need conduct review. Behaviour log attached.', metadata: withMeta({ class: 'Form 2 North', count: 4 }), readAt: ago(84) },

    // 4 days ago
    { userId: null, role: null, type: 'message', priority: 'normal', title: 'Sports day announced', message: 'Annual sports day announced: 15th of next month. Sign-up sheet posted on notice board.', metadata: withMeta({ date: '15th next month' }), readAt: ago(102) },
    { userId: null, role: null, type: 'system', priority: 'low', title: 'Inventory low stock', message: '3 inventory items low on stock (A4 paper, board markers, lab gloves).', metadata: withMeta({ items: ['A4 paper', 'markers', 'gloves'] }), readAt: ago(110) },

    // 5-7 days ago
    { userId: null, role: null, type: 'attendance', priority: 'low', title: 'Weekly attendance summary', message: 'Last week average attendance: 94.2%. Form 1 best at 97.4%.', metadata: withMeta({ avg: 94.2, bestClass: 'Form 1', bestPct: 97.4 }), readAt: ago(120) },
    { userId: null, role: null, type: 'exam', priority: 'normal', title: 'CAT schedule published', message: 'End-of-term CAT schedule published. First paper: Monday 9 AM (Mathematics).', metadata: withMeta({ firstPaper: 'Mathematics', when: 'Mon 9 AM' }), readAt: ago(132) },
    { userId: null, role: null, type: 'fee', priority: 'normal', title: 'Term fee structure updated', message: 'Term 3 fee structure published. Total: KES 22,500 per student.', metadata: withMeta({ term: 'Term 3', amount: 22500 }), readAt: ago(144) },
    { userId: null, role: null, type: 'message', priority: 'low', title: 'Staff appraisals due', message: 'Term 2 staff appraisals due by end of month. 8 staff pending.', metadata: withMeta({ pending: 8, due: 'end of month' }), readAt: ago(168) },
  ]

  return samples.map(s => ({
    ...s,
    schoolId,
    // If createdAt wasn't specified, derive it from readAt (4 hours earlier)
    // so "read" notifications still show up in their original time bucket.
    createdAt: s.createdAt ?? (s.readAt ? new Date(s.readAt.getTime() - 4 * 3600_000) : new Date(now)),
  }))
}
