import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'
import { MODULE_ACCESS, type UserRole } from '@/lib/auth-store'

// ---------------------------------------------------------------------------
// Per-user module access overrides
// ---------------------------------------------------------------------------
//  GET  /api/users/[id]/modules  → list the user's modules with role defaults
//                                  + any overrides applied (and a flag showing
//                                  whether each module is granted by role or
//                                  overridden).
//  PUT  /api/users/[id]/modules  → bulk set the modules this user can access.
//                                  Body: { modules: ["finance","students",...] }
//                                  These are the ALLOWED modules — anything
//                                  not in the list is denied. We compute the
//                                  diff against role defaults so the DB only
//                                  stores the rows that actually override the
//                                  default behaviour (allowed: true|false).
// ---------------------------------------------------------------------------

const MANAGER_ROLES = new Set(['admin', 'principal', 'super_admin'])

// Canonical full list of modules (mirrors `ALL_MODULES` in auth-store.ts).
const ALL_MODULES: string[] = [
  'dashboard', 'admissions', 'students', 'staff', 'staffapprovals', 'alumni', 'academics',
  'attendance', 'exams', 'reportcards', 'lessonplans', 'homework',
  'health', 'events', 'discipline',
  'hostel', 'finance', 'communications', 'library', 'transport', 'inventory',
  'cafeteria', 'procurement', 'facilities', 'visitors', 'staffroom',
  'payroll', 'appraisals', 'feedback', 'idcards', 'dataimport', 'invrequests', 'reports', 'settings',
  // Platform-only modules — kept here for completeness; only super_admin sees "superadmin".
  'superadmin',
]

interface ModuleEntry {
  module: string
  allowed: boolean           // effective permission after applying overrides
  grantedByRole: boolean     // what the role default says
  overridden: boolean        // whether a UserModuleAccess row exists
  overrideAllowed: boolean | null  // value of the override (true|false) or null if no override
}

interface ModuleAccessResponse {
  userId: string
  userName: string
  userEmail: string
  userRole: UserRole
  userStatus: string
  schoolId: string | null
  schoolName: string | null
  modules: ModuleEntry[]
  // Computed "final" list of allowed modules. If no overrides exist for this
  // user, this matches MODULE_ACCESS[role]. If overrides exist, this is the
  // list after applying them.
  allowedModules: string[]
  hasOverrides: boolean
}

function computeAllowedModules(
  role: string,
  overrides: { module: string; allowed: boolean }[]
): { allowedModules: string[]; hasOverrides: boolean } {
  const roleModules = new Set<string>(
    (MODULE_ACCESS as Record<string, string[]>)[role] ?? []
  )
  const overrideMap = new Map<string, boolean>()
  for (const o of overrides) overrideMap.set(o.module, o.allowed)

  const allowed: string[] = []
  for (const m of ALL_MODULES) {
    if (overrideMap.has(m)) {
      if (overrideMap.get(m) === true) allowed.push(m)
    } else if (roleModules.has(m)) {
      allowed.push(m)
    }
  }
  return { allowedModules: allowed, hasOverrides: overrides.length > 0 }
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getUserFromRequest(req)
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (!MANAGER_ROLES.has(currentUser.role)) {
      return NextResponse.json(
        { error: 'Only administrators and principals can manage user module access' },
        { status: 403 }
      )
    }

    const { id: targetId } = await context.params

    const target = await db.userAccount.findUnique({
      where: { id: targetId },
      include: {
        school: { select: { id: true, name: true } },
        moduleAccessOverrides: true,
      },
    })

    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // School admins may only manage users in their own school.
    // Super admin can manage any user (platform-wide).
    if (currentUser.role !== 'super_admin' && target.schoolId !== currentUser.schoolId) {
      return NextResponse.json(
        { error: 'You can only manage module access for users in your own school' },
        { status: 403 }
      )
    }

    const roleModules = new Set<string>(
      (MODULE_ACCESS as Record<string, string[]>)[target.role] ?? []
    )
    const overrideMap = new Map<string, boolean>()
    for (const o of target.moduleAccessOverrides) {
      overrideMap.set(o.module, o.allowed)
    }

    const modules: ModuleEntry[] = ALL_MODULES.map((m) => {
      const grantedByRole = roleModules.has(m)
      const overridden = overrideMap.has(m)
      const overrideAllowed = overridden ? overrideMap.get(m)! : null
      const allowed = overridden ? overrideAllowed === true : grantedByRole
      return { module: m, allowed, grantedByRole, overridden, overrideAllowed }
    })

    const { allowedModules, hasOverrides } = computeAllowedModules(
      target.role,
      target.moduleAccessOverrides.map((o) => ({ module: o.module, allowed: o.allowed }))
    )

    const body: ModuleAccessResponse = {
      userId: target.id,
      userName: target.name,
      userEmail: target.email,
      userRole: target.role as UserRole,
      userStatus: target.status,
      schoolId: target.school?.id ?? null,
      schoolName: target.school?.name ?? null,
      modules,
      allowedModules,
      hasOverrides,
    }

    return NextResponse.json(body)
  } catch (error) {
    console.error('[users/[id]/modules GET] error:', error)
    return NextResponse.json(
      { error: 'Failed to load module access' },
      { status: 500 }
    )
  }
}

// ---------------------------------------------------------------------------
// PUT — bulk set the allowed modules for a user.
// Body: { modules: ["finance","students",...] }
//   - Modules in this list are ALLOWED.
//   - Modules NOT in this list are DENIED.
// We compute the diff against role defaults so the DB only stores rows that
// actually override the default behaviour:
//   - role default = true  & user wants deny  → row { allowed: false }
//   - role default = false & user wants allow → row { allowed: true  }
//   - role default == user wants              → no row (delete existing)
// ---------------------------------------------------------------------------

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = await getUserFromRequest(req)
    if (!currentUser) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }
    if (!MANAGER_ROLES.has(currentUser.role)) {
      return NextResponse.json(
        { error: 'Only administrators and principals can manage user module access' },
        { status: 403 }
      )
    }

    const { id: targetId } = await context.params

    const body = await req.json().catch(() => null)
    if (!body || !Array.isArray(body.modules)) {
      return NextResponse.json(
        { error: 'Request body must be { modules: string[] }' },
        { status: 400 }
      )
    }

    // Sanitise the incoming module list (drop unknown modules, dedupe).
    const knownSet = new Set(ALL_MODULES)
    const wanted = Array.from(
      new Set((body.modules as unknown[]).filter((m): m is string => typeof m === 'string' && knownSet.has(m)))
    )
    const wantedSet = new Set(wanted)

    const target = await db.userAccount.findUnique({
      where: { id: targetId },
      include: { school: { select: { id: true, name: true } } },
    })

    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (currentUser.role !== 'super_admin' && target.schoolId !== currentUser.schoolId) {
      return NextResponse.json(
        { error: 'You can only manage module access for users in your own school' },
        { status: 403 }
      )
    }

    const roleModules = new Set<string>(
      (MODULE_ACCESS as Record<string, string[]>)[target.role] ?? []
    )

    // Build the desired set of override rows.
    const desiredOverrides: { module: string; allowed: boolean }[] = []
    for (const m of ALL_MODULES) {
      const userWantsAllowed = wantedSet.has(m)
      const roleSaysAllowed = roleModules.has(m)
      if (userWantsAllowed === roleSaysAllowed) continue // no override needed
      desiredOverrides.push({ module: m, allowed: userWantsAllowed })
    }

    // Wipe existing overrides for this user and replace with the desired set.
    await db.$transaction(async (tx) => {
      await tx.userModuleAccess.deleteMany({ where: { userId: target.id } })
      if (desiredOverrides.length > 0) {
        await tx.userModuleAccess.createMany({
          data: desiredOverrides.map((o) => ({
            userId: target.id,
            module: o.module,
            allowed: o.allowed,
          })),
        })
      }
    })

    // Try to log the change (best-effort).
    try {
      await db.activityLog.create({
        data: {
          action: 'MODULE_ACCESS_UPDATED',
          entity: 'UserAccount',
          entityId: target.id,
          user: currentUser.name,
          details: `Updated module access for ${target.name} (${target.email}) — ${wanted.length} module(s) allowed`,
        },
      })
    } catch {
      /* ignore logging errors */
    }

    // Re-fetch and return the new merged view.
    const overrides = await db.userModuleAccess.findMany({
      where: { userId: target.id },
    })
    const { allowedModules, hasOverrides } = computeAllowedModules(
      target.role,
      overrides.map((o) => ({ module: o.module, allowed: o.allowed }))
    )

    return NextResponse.json({
      success: true,
      message: `Module access updated for ${target.name}`,
      userId: target.id,
      allowedModules,
      hasOverrides,
      overrideCount: overrides.length,
    })
  } catch (error) {
    console.error('[users/[id]/modules PUT] error:', error)
    return NextResponse.json(
      { error: 'Failed to update module access' },
      { status: 500 }
    )
  }
}
