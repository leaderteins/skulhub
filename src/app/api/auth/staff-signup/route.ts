import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth-utils'

// ---------------------------------------------------------------------------
// Staff self-signup — a staff member registers themselves; their account is
// created with status "Pending" until the principal approves it.
// ---------------------------------------------------------------------------

// Map UI role values (lowercase, matching auth-store UserRole) to the display
// names used by the Staff.role column (e.g. "Teacher", "Librarian", …).
const STAFF_ROLE_DISPLAY: Record<string, string> = {
  teacher: 'Teacher',
  hod: 'HOD',
  librarian: 'Librarian',
  nurse: 'Nurse',
  matron: 'Matron',
  secretary: 'Secretary',
  admissions: 'Clerk',
  bursar: 'Bursar',
  bus_driver: 'Driver',
  gate_man: 'Security',
  cook: 'Cook',
  deputy_principal: 'Deputy Principal',
}

const ALLOWED_ROLES = new Set(Object.keys(STAFF_ROLE_DISPLAY))

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

/** Split a full name into first + last. "Jane Wanjiru Kamau" → Jane / Wanjiru Kamau */
function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { firstName: '', lastName: '' }
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

/** Generate a unique employee number, e.g. "EMP-2025-001AB12" */
async function generateEmployeeNo(schoolId: string): Promise<string> {
  const year = new Date().getFullYear()
  const staffCount = await db.staff.count({ where: { schoolId } })
  for (let attempt = 0; attempt < 5; attempt++) {
    const seq = (staffCount + attempt + 1).toString().padStart(3, '0')
    const rand = Math.random().toString(36).slice(2, 5).toUpperCase()
    const candidate = `EMP-${year}-${seq}${rand}`
    const exists = await db.staff.findUnique({ where: { employeeNo: candidate } })
    if (!exists) return candidate
  }
  return `EMP-${year}-${Date.now().toString(36).toUpperCase()}`
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    const {
      schoolCode,
      name,
      email,
      password,
      phone,
      role,
      gender,
      qualification,
      specialization,
    } = body as Record<string, string>

    // --- Validation ---------------------------------------------------------
    if (!schoolCode?.trim()) {
      return NextResponse.json({ error: 'School code is required' }, { status: 400 })
    }
    if (!name?.trim() || name.trim().length < 3) {
      return NextResponse.json({ error: 'Please enter your full name' }, { status: 400 })
    }
    if (!email?.trim() || !emailIsValid(email)) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 })
    }
    if (!password || password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }
    if (!role || !ALLOWED_ROLES.has(role)) {
      return NextResponse.json(
        { error: 'Please select a valid role' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // --- School lookup ------------------------------------------------------
    const school = await db.school.findUnique({
      where: { schoolCode: schoolCode.trim().toUpperCase() },
    })
    if (!school) {
      return NextResponse.json(
        { error: 'School code not found. Please confirm with your principal.' },
        { status: 404 }
      )
    }
    if (school.status === 'Suspended') {
      return NextResponse.json(
        { error: 'This school is currently suspended. Please contact support.' },
        { status: 403 }
      )
    }

    // --- Email uniqueness --------------------------------------------------
    const existingUser = await db.userAccount.findUnique({
      where: { email: normalizedEmail },
    })
    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      )
    }
    const existingStaffEmail = await db.staff.findUnique({
      where: { email: normalizedEmail },
    })
    if (existingStaffEmail) {
      return NextResponse.json(
        { error: 'A staff record with this email already exists' },
        { status: 409 }
      )
    }

    // --- Hash password -----------------------------------------------------
    const passwordHash = await hashPassword(password)
    const { firstName, lastName } = splitName(name)
    const employeeNo = await generateEmployeeNo(school.id)
    const staffRoleDisplay = STAFF_ROLE_DISPLAY[role] || 'Teacher'
    const resolvedGender =
      gender === 'Female' ? 'Female' : gender === 'Male' ? 'Male' : 'Male'

    // --- Transaction: create Staff + Pending UserAccount -------------------
    const { user, staff } = await db.$transaction(async (tx) => {
      const staff = await tx.staff.create({
        data: {
          employeeNo,
          firstName,
          lastName,
          email: normalizedEmail,
          phone: phone?.trim() || null,
          gender: resolvedGender,
          role: staffRoleDisplay,
          schoolId: school.id,
          qualification: qualification?.trim() || null,
          specialization: specialization?.trim() || null,
          employmentType: 'Permanent',
          salary: 0,
          status: 'Inactive',
          hireDate: new Date(),
        },
      })

      const user = await tx.userAccount.create({
        data: {
          schoolId: school.id,
          name: name.trim(),
          email: normalizedEmail,
          passwordHash,
          role,
          phone: phone?.trim() || null,
          avatar: initialsOf(name),
          status: 'Pending',
          staffId: staff.id,
        },
      })

      return { user, staff }
    })

    // --- Activity log (best-effort) ---------------------------------------
    try {
      await db.activityLog.create({
        data: {
          action: 'STAFF_SIGNUP',
          entity: 'UserAccount',
          entityId: user.id,
          user: name.trim(),
          details: `Self-registration as ${staffRoleDisplay} (employee #${staff.employeeNo}) — awaiting approval`,
        },
      })
    } catch {
      /* ignore logging errors */
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'Your registration has been submitted. The principal will review and approve your account.',
        userId: user.id,
        employeeNo: staff.employeeNo,
        schoolName: school.name,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('[staff-signup] error:', error)
    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    )
  }
}
