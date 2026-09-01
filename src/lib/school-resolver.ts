import { db } from '@/lib/db'

/**
 * Resolve the school ID from a request — with a fallback to the first
 * non-platform school if the user isn't authenticated.
 *
 * This keeps the biometric + bus tracking system working for demos on
 * Vercel previews where the session cookie may not be available.
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

  // Fallback: find the demo school by schoolCode (same query as /api/auth/school-code)
  try {
    const school = await db.school.findUnique({
      where: { schoolCode: 'SKH-2024-001' },
    })
    if (school) return school.id
  } catch (e) {
    // If that fails, try finding ANY school
    try {
      const school = await db.school.findFirst()
      if (school) return school.id
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
