import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword, generateSlug, createSessionToken } from '@/lib/auth-utils'

// Default seed data — created globally (ClassLevel/Subject/Department have no
// schoolId in the current schema). Operations are idempotent so registering
// multiple schools won't conflict.
const DEFAULT_DEPARTMENTS = [
  'Mathematics',
  'Languages',
  'Sciences',
  'Humanities',
  'Religious Education',
  'Applied Sciences',
  'Business',
  'Technical',
  'Co-curricular',
]

const DEFAULT_SUBJECTS = [
  { name: 'Mathematics', code: 'MATH', department: 'Mathematics', category: 'Core' },
  { name: 'English', code: 'ENG', department: 'Languages', category: 'Core' },
  { name: 'Kiswahili', code: 'KIS', department: 'Languages', category: 'Core' },
  { name: 'Biology', code: 'BIO', department: 'Sciences', category: 'Core' },
  { name: 'Chemistry', code: 'CHE', department: 'Sciences', category: 'Core' },
  { name: 'Physics', code: 'PHY', department: 'Sciences', category: 'Core' },
  { name: 'History and Government', code: 'HIS', department: 'Humanities', category: 'Core' },
  { name: 'Geography', code: 'GEO', department: 'Humanities', category: 'Core' },
  { name: 'Christian Religious Education', code: 'CRE', department: 'Religious Education', category: 'Core' },
  { name: 'Islamic Religious Education', code: 'IRE', department: 'Religious Education', category: 'Optional' },
  { name: 'Agriculture', code: 'AGR', department: 'Applied Sciences', category: 'Optional' },
  { name: 'Business Studies', code: 'BST', department: 'Business', category: 'Core' },
  { name: 'Computer Studies', code: 'CST', department: 'Technical', category: 'Optional' },
  { name: 'Home Science', code: 'HSC', department: 'Applied Sciences', category: 'Optional' },
  { name: 'Physical Education', code: 'PED', department: 'Co-curricular', category: 'Co-curricular' },
]

const DEFAULT_CLASS_LEVELS = [
  { name: 'Form 1', stage: 'Senior School', order: 1, capacity: 40 },
  { name: 'Form 2', stage: 'Senior School', order: 2, capacity: 40 },
  { name: 'Form 3', stage: 'Senior School', order: 3, capacity: 40 },
  { name: 'Form 4', stage: 'Senior School', order: 4, capacity: 40 },
]

function emailIsValid(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map(s => s[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const {
      schoolName,
      schoolEmail,
      schoolPhone,
      county,
      adminName,
      adminEmail,
      adminPassword,
      level,
      knecCode,
      yearEstablished,
      category,
      gender,
      motto,
      primaryColor,
      address,
    } = body as Record<string, string>

    // --- Validation ---------------------------------------------------------
    if (!schoolName?.trim()) {
      return NextResponse.json({ error: 'School name is required' }, { status: 400 })
    }
    if (!adminName?.trim()) {
      return NextResponse.json({ error: 'Administrator name is required' }, { status: 400 })
    }
    if (!adminEmail?.trim() || !emailIsValid(adminEmail)) {
      return NextResponse.json({ error: 'A valid admin email is required' }, { status: 400 })
    }
    if (!adminPassword || adminPassword.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    const normalizedEmail = adminEmail.toLowerCase().trim()

    // Email uniqueness
    const existingUser = await db.userAccount.findUnique({
      where: { email: normalizedEmail },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }

    // --- Unique slug --------------------------------------------------------
    const baseSlug = generateSlug(schoolName)
    let slug = baseSlug
    let suffix = 1
    // Linear probe for uniqueness — collision unlikely with the cuid suffix
    while (await db.school.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${suffix++}`
    }

    // --- Hash password ------------------------------------------------------
    const passwordHash = await hashPassword(adminPassword)

    // --- Transaction: create school + admin + seed basic data --------------
    const { school, user } = await db.$transaction(async (tx) => {
      // --- Generate unique school code ----------------------------------------
    const schoolCount = await tx.school.count()
    const year = new Date().getFullYear()
    const schoolCode = `SKH-${year}-${String(schoolCount + 1).padStart(3, '0')}`

    const school = await tx.school.create({
        data: {
          name: schoolName.trim(),
          slug,
          schoolCode,
          email: schoolEmail?.trim() || null,
          phone: schoolPhone?.trim() || null,
          county: county?.trim() || null,
          level: level || 'Secondary',
          knecCode: knecCode?.trim() || null,
          yearEstablished: yearEstablished ? parseInt(yearEstablished) : null,
          category: category || 'Private',
          gender: gender || 'Mixed',
          motto: motto?.trim() || null,
          primaryColor: primaryColor || '#10b981',
          address: address?.trim() || null,
          plan: 'Starter',
          status: 'Trial',
          trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          maxStudents: 200,
        },
      })

      const user = await tx.userAccount.create({
        data: {
          schoolId: school.id,
          name: adminName.trim(),
          email: normalizedEmail,
          passwordHash,
          role: 'admin',
          status: 'Active',
          avatar: initialsOf(adminName),
          lastLoginAt: new Date(),
        },
      })

      // --- Seed default departments (idempotent) ----------------------------
      const deptMap = new Map<string, { id: string }>()
      for (const name of DEFAULT_DEPARTMENTS) {
        const existing = await tx.department.findUnique({ where: { name } })
        if (existing) {
          deptMap.set(name, existing)
        } else {
          const created = await tx.department.create({ data: { name } })
          deptMap.set(name, created)
        }
      }

      // --- Seed default subjects (idempotent) -------------------------------
      // Subject.name and Subject.code are BOTH unique, so we check either
      // before attempting an insert.
      for (const sub of DEFAULT_SUBJECTS) {
        const existing =
          (await tx.subject.findUnique({ where: { code: sub.code } })) ||
          (await tx.subject.findUnique({ where: { name: sub.name } }))
        if (existing) continue
        await tx.subject.create({
          data: {
            name: sub.name,
            code: sub.code,
            departmentId: deptMap.get(sub.department)?.id || null,
            category: sub.category,
          },
        })
      }

      // --- Seed class levels based on school level ---------------------------
      const schoolLevel = level || 'Secondary'
      let classLevelsToSeed = DEFAULT_CLASS_LEVELS
      if (schoolLevel === 'Primary') {
        classLevelsToSeed = [
          { name: 'Grade 1', stage: 'Primary', order: 1, capacity: 40 },
          { name: 'Grade 2', stage: 'Primary', order: 2, capacity: 40 },
          { name: 'Grade 3', stage: 'Primary', order: 3, capacity: 40 },
          { name: 'Grade 4', stage: 'Primary', order: 4, capacity: 40 },
          { name: 'Grade 5', stage: 'Primary', order: 5, capacity: 40 },
          { name: 'Grade 6', stage: 'Primary', order: 6, capacity: 40 },
          { name: 'Grade 7', stage: 'Junior Secondary', order: 7, capacity: 40 },
          { name: 'Grade 8', stage: 'Junior Secondary', order: 8, capacity: 40 },
        ]
      } else if (schoolLevel === 'Mixed') {
        classLevelsToSeed = [
          ...['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8'].map((n, i) => ({ name: n, stage: i < 6 ? 'Primary' : 'Junior Secondary', order: i + 1, capacity: 40 })),
          ...DEFAULT_CLASS_LEVELS.map((cl, i) => ({ ...cl, order: i + 9 })),
        ]
      }
      for (const cl of classLevelsToSeed) {
        const existing = await tx.classLevel.findUnique({ where: { name: cl.name } })
        if (existing) continue
        await tx.classLevel.create({ data: cl })
      }

      return { school, user }
    })

    const token = createSessionToken(user.id)

    // Build response (Set-Cookie for browser clients, plus token in body for
    // mobile / non-browser clients)
    const res = NextResponse.json(
      {
        school: {
          id: school.id,
          name: school.name,
          slug: school.slug,
          schoolCode: school.schoolCode,
          plan: school.plan,
          status: school.status,
          trialEndsAt: school.trialEndsAt,
        },
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          schoolId: user.schoolId,
          avatar: user.avatar,
        },
        token,
      },
      { status: 201 }
    )
    res.cookies.set('skulhub-token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    })
    return res
  } catch (error) {
    console.error('[register] error:', error)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
