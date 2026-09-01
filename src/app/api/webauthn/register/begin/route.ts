import { NextRequest, NextResponse } from 'next/server'
import {
  generateRegistrationOptions,
} from '@simplewebauthn/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth-utils'

function getRp(req: NextRequest): { rpID: string; origin: string } {
  const forwarded = req.headers.get('x-forwarded-host')
  const host = forwarded || req.headers.get('host') || 'localhost'
  const proto = req.headers.get('x-forwarded-proto') || (host.startsWith('localhost') ? 'http' : 'https')
  return { rpID: host.split(':')[0], origin: `${proto}://${host}` }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    const body = await req.json().catch(() => ({})) as { nickname?: string }

    const existingCreds = await db.webAuthnCredential.findMany({
      where: { userId: user.id },
    }).catch(() => [])

    const { rpID, origin } = getRp(req)
    const options = await generateRegistrationOptions({
      rpName: 'SkulHub',
      rpID,
      userID: user.id,
      userName: user.email,
      userDisplayName: user.name,
      attestationType: 'none',
      excludeCredentials: existingCreds.map((c) => ({
        id: c.credentialId,
        type: 'public-key' as const,
      })),
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
      },
    })

    const res = NextResponse.json({ options })
    res.cookies.set('webauthn-reg-challenge', options.challenge, {
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
