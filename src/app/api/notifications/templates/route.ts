import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/notifications/templates
 * Returns SMS/WhatsApp message templates for different events.
 */
export async function GET(req: NextRequest) {
  try {
    const schoolId = await getSchoolId(req)
    if (!schoolId) {
      return NextResponse.json({ templates: getDefaultTemplates() })
    }
    // For now, return default templates — in production these would be
    // customizable per school and stored in a NotificationTemplate table
    return NextResponse.json({ templates: getDefaultTemplates() })
  } catch {
    return NextResponse.json({ templates: getDefaultTemplates() })
  }
}

/**
 * POST /api/notifications/templates
 * Save a custom template (future — stores in DB)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    // For now, just return success — template storage would go here
    return NextResponse.json({ success: true, template: body })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}

function getDefaultTemplates() {
  return [
    {
      id: 'check_in',
      event: 'Student Check-In',
      channel: 'sms',
      enabled: true,
      template: 'Dear Parent, {studentName} has checked in at school at {time}. - {schoolName}',
    },
    {
      id: 'check_out',
      event: 'Student Check-Out',
      channel: 'sms',
      enabled: true,
      template: 'Dear Parent, {studentName} has left school at {time}. - {schoolName}',
    },
    {
      id: 'board_bus',
      event: 'Boarded Bus',
      channel: 'sms',
      enabled: true,
      template: 'Dear Parent, {studentName} boarded bus {busName} at {stopName} at {time}. - {schoolName}',
    },
    {
      id: 'alight_bus',
      event: 'Alighted Bus',
      channel: 'sms',
      enabled: true,
      template: 'Dear Parent, {studentName} alighted from bus at {stopName} at {time}. - {schoolName}',
    },
    {
      id: 'fee_reminder',
      event: 'Fee Payment Reminder',
      channel: 'sms',
      enabled: true,
      template: 'Dear Parent, {studentName} has a fee balance of KES {balance}. Due date: {dueDate}. Pay via M-Pesa Paybill 522522. - {schoolName}',
    },
    {
      id: 'fee_received',
      event: 'Fee Payment Received',
      channel: 'sms',
      enabled: true,
      template: 'Dear Parent, we have received KES {amount} for {studentName}. Balance: KES {balance}. Thank you. - {schoolName}',
    },
    {
      id: 'absent',
      event: 'Student Absent',
      channel: 'sms',
      enabled: false,
      template: 'Dear Parent, {studentName} was marked absent today. Please contact the school if this is unexpected. - {schoolName}',
    },
    {
      id: 'exam_results',
      event: 'Exam Results Published',
      channel: 'sms',
      enabled: false,
      template: 'Dear Parent, {examName} results for {studentName} are now available. Login to the parent portal to view. - {schoolName}',
    },
  ]
}

async function getSchoolId(req: Request): Promise<string | null> {
  try {
    const { getUserFromRequest } = await import('@/lib/auth-utils')
    const user = await getUserFromRequest(req)
    if (user?.school) return (user.school as any).id
  } catch {}
  try {
    const school = await db.school.findFirst({ where: { slug: { not: 'platform' } }, orderBy: { createdAt: 'asc' } })
    return school?.id || null
  } catch { return null }
}
