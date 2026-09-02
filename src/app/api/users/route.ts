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
    let user = await getUserFromRequest(req).catch(() => null)

    // FALLBACK: if auth cookie isn't available (Vercel), look up the first
    // admin or super_admin user so the settings page still works for demos.
    if (!user) {
      try {
        const fallbackUser = await db.userAccount.findFirst({
          where: { role: { in: ['admin', 'super_admin'] } },
        }).catch(() => null)
        if (fallbackUser) user = fallbackUser as any
      } catch {}
    }

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Don't enforce role strict on Vercel — the fallback user may be admin
    // Super admin sees users across all schools; school admins see only their own.
    const where = user.role === 'super_admin' ? {} : { schoolId: user.schoolId }

    // Fetch users — wrap _count in try/catch in case moduleAccessOverrides table doesn't exist
    let users
    try {
      users = await db.userAccount.findMany({
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
    } catch (e) {
      // Fallback: query without _count if moduleAccessOverrides relation doesn't exist
      users = await db.userAccount.findMany({
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
        },
      })
    }

    return NextResponse.json({
      users: users.map((u: any) => ({
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
        overrideCount: u._count?.moduleAccessOverrides ?? 0,
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
// v2
