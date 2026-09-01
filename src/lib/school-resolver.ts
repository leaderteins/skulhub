import { db } from '@/lib/db'

/**
 * Resolve the school ID from a request — with a fallback to the first
 * non-platform school if the user isn't authenticated.
 *
 * Uses RAW SQL (not Prisma client) because the Prisma client on Vercel
 * doesn't know about the full schema. Raw SQL always works.
 *
 * Returns the schoolId (or null if no school exists at all).
 */
export async function getSchoolId(req: Request): Promise<string | null> {
  // Try auth first
  try {
    const { getUserFromRequest } = await import('@/lib/auth-utils')
    const user = await getUserFromRequest(req)
    if (user?.school) {
      return (user.school as any).id
    }
  } catch {
    // ignore auth errors — fall through to fallback
  }

  // Fallback: use RAW SQL (same approach as /api/biometric/sync which works)
  try {
    const schools = await db.$queryRawUnsafe<Array<{id: string}>>(
      `SELECT id FROM "School" WHERE "schoolCode" = 'SKH-2024-001' LIMIT 1`
    )
    if (schools.length > 0) return schools[0].id
  } catch {
    // try without filter
    try {
      const schools = await db.$queryRawUnsafe<Array<{id: string}>>(
        `SELECT id FROM "School" LIMIT 1`
      )
      if (schools.length > 0) return schools[0].id
    } catch {
      // give up
    }
  }
  return null
}

/**
 * Same as getSchoolId but also returns the user (or a demo user if
 * not authenticated). Used by endpoints that need to record who
 * performed an action (e.g., enrolling a fingerprint).
 */
export async function getSchoolIdAndUser(req: Request): Promise<{
  schoolId: string | null
  user: { id: string; name: string; role: string } | null
}> {
  let userId = 'demo'
  let userName = 'Demo User'
  let userRole = 'admin'

  try {
    const { getUserFromRequest } = await import('@/lib/auth-utils')
    const user = await getUserFromRequest(req)
    if (user?.school) {
      return {
        schoolId: (user.school as any).id,
        user: { id: user.id, name: user.name, role: user.role },
      }
    }
    if (user) {
      userId = user.id
      userName = user.name
      userRole = user.role
    }
  } catch {
    // ignore
  }

  const schoolId = await getSchoolId(req)
  return {
    schoolId,
    user: { id: userId, name: userName, role: userRole },
  }
}
