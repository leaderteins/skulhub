import { NextRequest, NextResponse } from 'next/server'
import { verifyAuthenticationResponse } from '@simplewebauthn/server'
import { db } from '@/lib/db'
import { createSessionToken } from '@/lib/auth-utils'

function getRp(req: NextRequest): { rpID: string; origin: string } {
  const forwarded = req.headers.get('x-forwarded-host')
  const host = forwarded || req.headers.get('host') || 'localhost'
  const proto = req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  return { rpID: host.split(':')[0], origin: `${proto}://${host}` }
}

/**
 * POST /api/webauthn/login/finish
 * Body: { userId, credential: AuthenticatorResponseJSON }
 *
 * Verifies the assertion, updates the credential counter (replay protection),
 * and returns a session token (same shape as password login).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      userId: string
      credential: any
    }
    if (!body.userId || !body.credential) {
      return NextResponse.json({ error: 'userId and credential are required' }, { status: 400 })
    }
    const challenge = req.cookies.get('webauthn-auth-challenge')?.value
    if (!challenge) {
      return NextResponse.json({ error: 'Missing challenge' }, { status: 400 })
    }

    const cred = await db.webAuthnCredential.findFirst({
      where: { userId: body.userId, credentialId: body.credential.id },
    })
    if (!cred) {
      return NextResponse.json({ error: 'Credential not found' }, { status: 404 })
    }

    const { rpID, origin } = getRp(req)
    const verification = await verifyAuthenticationResponse({
      response: body.credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: cred.credentialId,
        publicKey: Buffer.from(cred.publicKey, 'base64url'),
        counter: cred.counter,
        transports: (() => {
          try { return JSON.parse(cred.transports || '[]') } catch { return [] }
        })(),
      },
    })

    if (!verification.verified) {
      return NextResponse.json({ error: 'Authentication failed' }, { status: 401 })
    }

    // Update counter (replay-attack protection)
    await db.webAuthnCredential.update({
      where: { id: cred.id },
      data: {
        counter: verification.authenticationInfo.newCounter,
        lastUsedAt: new Date(),
      },
    })

    // Issue session token — same as password login
    const user = await db.userAccount.findUnique({
      where: { id: body.userId },
      include: { school: true },
    })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    const token = createSessionToken(user.id)

    const res = NextResponse.json({
      verified: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar || user.name.split(' ').map((s: string) => s[0]).join('').slice(0, 2).toUpperCase(),
        schoolId: user.schoolId,
        schoolName: user.school?.name,
        schoolSlug: user.school?.slug,
        isSuperAdmin: user.role === 'super_admin',
      },
      token,
    })
    res.cookies.set('skulhub-token', token, {
      httpOnly: true,
      secure: origin.startsWith('https'),
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })
    res.cookies.delete('webauthn-auth-challenge')
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
