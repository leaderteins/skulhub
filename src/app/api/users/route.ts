import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

// ---------------------------------------------------------------------------
// GET /api/users
// List all user accounts in the current school.
// Only admin / principal / super_admin may call this.
// Used by Settings → Module Access section to pick a user to configure.
// ---------------------------------------------------------------------------

const MANAGER_ROLES = new Set(['admin', 'principal', 'super_admin'])

export async function GET(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (!MANAGER_ROLES.has(user.role)) {
      return NextResponse.json(
        { error: 'Only administrators and principals can manage user module access' },
        { status: 403 }
      )
    }

    // Super admin sees users across all schools (they manage platform-wide).
    // School admins see only their own school.
    const where = user.role === 'super_admin' ? {} : { schoolId: user.schoolId }

    const users = await db.userAccount.findMany({
      where,
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        status: true,
        phone: true,
        schoolId: true,
        lastLoginAt: true,
        createdAt: true,
        school: { select: { id: true, name: true, slug: true } },
        _count: { select: { moduleAccessOverrides: true } },
      },
    })

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        status: u.status,
        phone: u.phone,
        schoolId: u.schoolId,
        schoolName: u.school?.name ?? null,
        schoolSlug: u.school?.slug ?? null,
        lastLoginAt: u.lastLoginAt ? u.lastLoginAt.toISOString() : null,
        createdAt: u.createdAt.toISOString(),
        overrideCount: u._count.moduleAccessOverrides,
      })),
      total: users.length,
    })
  } catch (error) {
    console.error('[users GET] error:', error)
    const msg = error instanceof Error ? error.message : String(error)
    return NextResponse.json(
      { error: 'Failed to load users', details: msg.slice(0, 300) },
      { status: 500 }
    )
  }
}
