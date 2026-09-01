import { NextRequest, NextResponse } from 'next/server'
import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { db } from '@/lib/db'

function getRp(req: NextRequest): { rpID: string; origin: string } {
  const forwarded = req.headers.get('x-forwarded-host')
  const host = forwarded || req.headers.get('host') || 'localhost'
  const proto = req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  return { rpID: host.split(':')[0], origin: `${proto}://${host}` }
}

/**
 * POST /api/webauthn/login/begin
 * Body: { email }  (identifies which user is trying to log in)
 *
 * Returns authentication options for the browser to call startAuthentication().
 * Uses discoverable credentials (resident keys) so the user doesn't need to
 * specify which credential to use.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({})) as { email?: string }
    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }
    const user = await db.userAccount.findUnique({
      where: { email: body.email.toLowerCase() },
    })
    if (!user) {
      return NextResponse.json({ error: 'No account with that email' }, { status: 404 })
    }
    const creds = await db.webAuthnCredential.findMany({
      where: { userId: user.id },
    }).catch(() => [])

    if (creds.length === 0) {
      return NextResponse.json({
        error: 'No biometric credential registered for this account. Please log in with your password first, then enable biometrics in Settings.',
      }, { status: 404 })
    }

    const { rpID, origin } = getRp(req)
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: creds.map((c) => ({
        id: c.credentialId,
        type: 'public-key' as const,
        transports: (() => {
          try { return JSON.parse(c.transports || '[]') } catch { return [] }
        })(),
      })),
      userVerification: 'preferred',
    })

    const res = NextResponse.json({ options, userId: user.id })
    res.cookies.set('webauthn-auth-challenge', options.challenge, {
      httpOnly: true,
      secure: origin.startsWith('https'),
      sameSite: 'strict',
      maxAge: 5 * 60,
      path: '/',
    })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
