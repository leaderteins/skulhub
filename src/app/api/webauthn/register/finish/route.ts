import { NextRequest, NextResponse } from 'next/server'
import {
  verifyRegistrationResponse,
} from '@simplewebauthn/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

function getRp(req: NextRequest): { rpID: string; origin: string } {
  const forwarded = req.headers.get('x-forwarded-host')
  const host = forwarded || req.headers.get('host') || 'localhost'
  const proto = req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  return { rpID: host.split(':')[0], origin: `${proto}://${host}` }
}

/**
 * POST /api/webauthn/register/finish
 * Body: { credential: AttestationResponseJSON, nickname? }
 *
 * Verifies the credential and persists it for the logged-in user.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const body = await req.json() as {
      credential: any
      nickname?: string
    }
    const challenge = req.cookies.get('webauthn-reg-challenge')?.value
    if (!challenge) {
      return NextResponse.json({ error: 'Missing challenge' }, { status: 400 })
    }
    const { rpID, origin } = getRp(req)
    const verification = await verifyRegistrationResponse({
      response: body.credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    })
    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
    }
    const info = verification.registrationInfo
    const credential = await db.webAuthnCredential.create({
      data: {
        userId: user.id,
        credentialId: info.credential.id,
        publicKey: Buffer.from(info.credential.publicKey).toString('base64url'),
        counter: info.credential.counter,
        deviceType: info.credentialDeviceType,
        transports: JSON.stringify(info.credential.transports || []),
        nickname: body.nickname || `${info.credentialDeviceType === 'singleDevice' ? 'This device' : 'Multi-device'}`,
      },
    })
    const res = NextResponse.json({ verified: true, credential })
    res.cookies.delete('webauthn-reg-challenge')
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
