import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import {
  verifyPassword,
  createSessionToken,
  ensureSuperAdmin,
  SUPER_ADMIN_EMAIL,
} from '@/lib/auth-utils'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const { email, password } = body as { email?: string; password?: string }
    if (!email?.trim() || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Auto-provision the platform super-admin the first time it's requested
    if (normalizedEmail === SUPER_ADMIN_EMAIL) {
      await ensureSuperAdmin()
    }

    const user = await db.userAccount.findUnique({
      where: { email: normalizedEmail },
      include: { school: true },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    const passwordOk = await verifyPassword(password, user.passwordHash)
    if (!passwordOk) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    if (user.status === 'Suspended') {
      return NextResponse.json(
        { error: 'Your account has been suspended. Contact your administrator.' },
        { status: 403 }
      )
    }

    // Update last login timestamp
    await db.userAccount.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    const token = createSessionToken(user.id)
    const isSuperAdmin = user.role === 'super_admin'

    const res = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
        schoolName: user.school?.name ?? null,
        schoolSlug: user.school?.slug ?? null,
        avatar: user.avatar,
        isSuperAdmin,
      },
      token,
    })

    res.cookies.set('edumanage-token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })
    return res
  } catch (error) {
    console.error('[login] error:', error)
    return NextResponse.json(
      { error: 'Login failed. Please try again.' },
      { status: 500 }
    )
  }
}
