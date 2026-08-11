import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

// ---------------------------------------------------------------------------
// Staff approvals — principal/admin reviews pending self-signup requests.
// ---------------------------------------------------------------------------

const APPROVER_ROLES = new Set(['admin', 'principal', 'super_admin'])

interface PendingStaffRow {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  avatar: string | null
  submittedAt: string
  staff: {
    id: string
    employeeNo: string
    firstName: string
    lastName: string
    gender: string
    qualification: string | null
    specialization: string | null
    staffRole: string | null
  } | null
}

interface RecentDecisionRow extends PendingStaffRow {
  status: string
  rejectionReason: string | null
  decidedAt: string | null
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (!APPROVER_ROLES.has(user.role)) {
      return NextResponse.json(
        { error: 'Only administrators and principals can review staff signups' },
        { status: 403 }
      )
    }

    // Super admin sees nothing here — they don't belong to a single school.
    if (user.role === 'super_admin') {
      return NextResponse.json({ pending: [], recent: [], summary: { pending: 0, approved: 0, rejected: 0 } })
    }

    const schoolId = user.schoolId

    // Pending signups, newest first.
    const pending = await db.userAccount.findMany({
      where: { schoolId, status: 'Pending' },
      include: { staff: true },
      orderBy: { createdAt: 'desc' },
    })

    // Recent decisions (Approved/Rejected) — last 30 days.
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const recent = await db.userAccount.findMany({
      where: {
        schoolId,
        status: { in: ['Active', 'Rejected'] },
        updatedAt: { gte: since },
      },
      include: { staff: true },
      orderBy: { updatedAt: 'desc' },
      take: 20,
    })

    // Summary counts.
    const [pendingCount, approvedCount, rejectedCount] = await Promise.all([
      db.userAccount.count({ where: { schoolId, status: 'Pending' } }),
      db.userAccount.count({ where: { schoolId, status: 'Active', staffId: { not: null } } }),
      db.userAccount.count({ where: { schoolId, status: 'Rejected' } }),
    ])

    return NextResponse.json({
      pending: pending.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        avatar: u.avatar,
        submittedAt: u.createdAt.toISOString(),
        staff: u.staff
          ? {
              id: u.staff.id,
              employeeNo: u.staff.employeeNo,
              firstName: u.staff.firstName,
              lastName: u.staff.lastName,
              gender: u.staff.gender,
              qualification: u.staff.qualification,
              specialization: u.staff.specialization,
              staffRole: u.staff.role,
            }
          : null,
      })) as PendingStaffRow[],
      recent: recent.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        role: u.role,
        avatar: u.avatar,
        submittedAt: u.createdAt.toISOString(),
        status: u.status,
        rejectionReason: u.rejectionReason,
        decidedAt: u.updatedAt.toISOString(),
        staff: u.staff
          ? {
              id: u.staff.id,
              employeeNo: u.staff.employeeNo,
              firstName: u.staff.firstName,
              lastName: u.staff.lastName,
              gender: u.staff.gender,
              qualification: u.staff.qualification,
              specialization: u.staff.specialization,
              staffRole: u.staff.role,
            }
          : null,
      })) as RecentDecisionRow[],
      summary: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
      },
    })
  } catch (error) {
    console.error('[staff-approvals GET] error:', error)
    return NextResponse.json(
      { error: 'Failed to load staff approvals' },
      { status: 500 }
    )
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (!APPROVER_ROLES.has(user.role)) {
      return NextResponse.json(
        { error: 'Only administrators and principals can approve or reject staff' },
        { status: 403 }
      )
    }

    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { userId, action, rejectionReason } = body as {
      userId?: string
      action?: string
      rejectionReason?: string
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }
    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Action must be "approve" or "reject"' },
        { status: 400 }
      )
    }

    const target = await db.userAccount.findUnique({
      where: { id: userId },
      include: { staff: true, school: true },
    })
    if (!target) {
      return NextResponse.json({ error: 'Signup request not found' }, { status: 404 })
    }
    if (target.status !== 'Pending') {
      return NextResponse.json(
        { error: `This request has already been ${target.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Super admin can't approve staff in another tenant — they have no school.
    if (user.role !== 'super_admin' && target.schoolId !== user.schoolId) {
      return NextResponse.json(
        { error: 'You can only review staff from your own school' },
        { status: 403 }
      )
    }

    if (action === 'approve') {
      await db.$transaction(async (tx) => {
        await tx.userAccount.update({
          where: { id: userId },
          data: {
            status: 'Active',
            rejectionReason: null,
          },
        })
        if (target.staff) {
          await tx.staff.update({
            where: { id: target.staff.id },
            data: { status: 'Active' },
          })
        }
      })

      try {
        await db.activityLog.create({
          data: {
            action: 'STAFF_APPROVED',
            entity: 'UserAccount',
            entityId: userId,
            user: user.name,
            details: `Approved staff signup for ${target.name} (${target.email})`,
          },
        })
      } catch {
        /* ignore logging errors */
      }

      return NextResponse.json({
        success: true,
        message: `${target.name} has been approved. They can now log in.`,
      })
    } else {
      // Reject
      const reason = (rejectionReason || '').trim() || 'Your registration was not approved at this time.'
      await db.$transaction(async (tx) => {
        await tx.userAccount.update({
          where: { id: userId },
          data: {
            status: 'Rejected',
            rejectionReason: reason,
          },
        })
        if (target.staff) {
          await tx.staff.update({
            where: { id: target.staff.id },
            data: { status: 'Inactive' },
          })
        }
      })

      try {
        await db.activityLog.create({
          data: {
            action: 'STAFF_REJECTED',
            entity: 'UserAccount',
            entityId: userId,
            user: user.name,
            details: `Rejected staff signup for ${target.name} (${target.email}) — ${reason}`,
          },
        })
      } catch {
        /* ignore logging errors */
      }

      return NextResponse.json({
        success: true,
        message: `${target.name}'s registration has been rejected.`,
      })
    }
  } catch (error) {
    console.error('[staff-approvals PUT] error:', error)
    return NextResponse.json(
      { error: 'Failed to update approval status' },
      { status: 500 }
    )
  }
}
