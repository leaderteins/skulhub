// Auth utilities — password hashing, slug generation, session tokens
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { db } from '@/lib/db'

// In production, this MUST be set via environment variable.
const SESSION_SECRET =
  process.env.SESSION_SECRET || 'skulhub-pro-dev-secret-change-in-production'
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

// Default super-admin credentials (auto-provisioned on first login attempt)
export const SUPER_ADMIN_EMAIL = 'superadmin@skulhub.ac.ke'
export const SUPER_ADMIN_DEFAULT_PASSWORD = 'superadmin123'

/** Hash a password using bcrypt with 10 rounds. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

/** Verify a plaintext password against a bcrypt hash. */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash)
  } catch {
    return false
  }
}

/**
 * Convert a school name into a URL-friendly slug.
 * e.g. "St. Mary's Academy, Nairobi" → "st-marys-academy-nairobi"
 */
export function generateSlug(name: string): string {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // strip non-alphanumeric (keep spaces & dashes)
    .replace(/\s+/g, '-') // spaces → dashes
    .replace(/-+/g, '-') // collapse multiple dashes
    .replace(/^-|-$/g, '') // trim leading/trailing dash
    .slice(0, 60)
  return slug || `school-${Date.now()}`
}

/** Generate a random opaque session token (used as the JWT `jti`). */
export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Create a stateless HMAC-signed session token that embeds the userId.
 * Format: `base64url(payload).base64url(signature)`
 */
export function createSessionToken(userId: string): string {
  const payload = {
    uid: userId,
    jti: generateToken(),
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
  }
  const b64 = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(b64)
    .digest('base64url')
  return `${b64}.${sig}`
}

/** Verify a session token and return the embedded userId, or null. */
export function verifySessionToken(
  token: string
): { userId: string; payload: any } | null {
  try {
    const [b64, sig] = token.split('.')
    if (!b64 || !sig) return null
    const expectedSig = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(b64)
      .digest('base64url')
    // Constant-time comparison to avoid timing attacks
    if (
      expectedSig.length !== sig.length ||
      !crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(sig))
    ) {
      return null
    }
    const payload = JSON.parse(Buffer.from(b64, 'base64url').toString('utf8'))
    if (!payload?.uid) return null
    if (payload.exp && Date.now() > payload.exp) return null
    return { userId: payload.uid, payload }
  } catch {
    return null
  }
}

/** Extract the bearer token from an incoming Request (header or cookie). */
export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.get('authorization')
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7).trim()
  }
  const cookieHeader = req.headers.get('cookie')
  if (cookieHeader) {
    const match = cookieHeader.match(/(?:^|;\s*)skulhub-token=([^;]+)/)
    if (match) return decodeURIComponent(match[1])
  }
  return null
}

/**
 * Resolve the authenticated user from an incoming Request.
 * Returns null if no valid token, or if the user is suspended/deleted.
 */
export async function getUserFromRequest(req: Request) {
  const token = getTokenFromRequest(req)
  if (!token) return null
  const verified = verifySessionToken(token)
  if (!verified) return null
  const user = await db.userAccount.findUnique({
    where: { id: verified.userId },
    include: { school: true },
  })
  if (!user) return null
  if (user.status === 'Suspended') return null
  return user
}

/**
 * Ensure the platform super-admin exists. Auto-provisions a system school
 * ("SkulHub Platform") and a super_admin user with default credentials.
 * Idempotent — safe to call on every login.
 */
export async function ensureSuperAdmin() {
  const existing = await db.userAccount.findUnique({
    where: { email: SUPER_ADMIN_EMAIL },
  })
  if (existing) return existing

  // Create the platform-level "school" that owns the super admin
  let platform = await db.school.findUnique({ where: { slug: 'platform' } })
  if (!platform) {
    platform = await db.school.create({
      data: {
        name: 'SkulHub Platform',
        slug: 'platform',
        email: 'platform@skulhub.ac.ke',
        plan: 'Enterprise',
        status: 'Active',
        maxStudents: 9_999_999,
      },
    })
  }

  const passwordHash = await hashPassword(SUPER_ADMIN_DEFAULT_PASSWORD)
  return db.userAccount.create({
    data: {
      schoolId: platform.id,
      name: 'Platform Super Admin',
      email: SUPER_ADMIN_EMAIL,
      passwordHash,
      role: 'super_admin',
      status: 'Active',
      avatar: 'SA',
    },
  })
}
