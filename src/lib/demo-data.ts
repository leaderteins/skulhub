// Demo data — used as a fallback when the database is unreachable (e.g., on Vercel
// without a Postgres DATABASE_URL configured). This allows the system to "just work"
// for demonstrations without requiring database setup.
//
// All IDs are deterministic (hardcoded) so that login tokens and session lookups
// work consistently across requests.

import fs from 'fs'

export const DEMO_SCHOOL = {
  id: 'demo-school-001',
  name: 'SkulHub Academy',
  slug: 'skulhub-academy',
  email: 'info@skulhub.ac.ke',
  phone: '+254700123456',
  address: 'Karen, Nairobi',
  county: 'Nairobi',
  level: 'Mixed',
  knecCode: '1234567',
  yearEstablished: '2005',
  category: 'Private',
  gender: 'Mixed',
  motto: 'Education for Excellence',
  primaryColor: '#059669',
  logo: null,
  schoolCode: 'SKH-2024-001',
  plan: 'Premium',
  status: 'Active',
  trialEndsAt: null,
  maxStudents: 1000,
  createdAt: '2024-01-15T10:00:00.000Z',
}

export const DEMO_USERS = [
  {
    id: 'demo-user-admin',
    schoolId: 'demo-school-001',
    name: 'Moses Kinyanjui',
    email: 'admin@skulhub.ac.ke',
    passwordHash: '$2b$10$demo-hash-not-real', // not used — demo mode skips password verification
    role: 'admin',
    phone: '+254700123456',
    avatar: 'MK',
    status: 'Active',
    rejectionReason: null,
    staffId: null,
    lastLoginAt: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'demo-user-principal',
    schoolId: 'demo-school-001',
    name: 'Mary Wanjiru',
    email: 'principal@skulhub.ac.ke',
    passwordHash: '$2b$10$demo-hash-not-real',
    role: 'principal',
    phone: '+254700123457',
    avatar: 'MW',
    status: 'Active',
    rejectionReason: null,
    staffId: null,
    lastLoginAt: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'demo-user-bursar',
    schoolId: 'demo-school-001',
    name: 'Peter Kamau',
    email: 'bursar@skulhub.ac.ke',
    passwordHash: '$2b$10$demo-hash-not-real',
    role: 'bursar',
    phone: '+254700123458',
    avatar: 'PK',
    status: 'Active',
    rejectionReason: null,
    staffId: null,
    lastLoginAt: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'demo-user-teacher',
    schoolId: 'demo-school-001',
    name: 'Grace Achieng',
    email: 'teacher@skulhub.ac.ke',
    passwordHash: '$2b$10$demo-hash-not-real',
    role: 'teacher',
    phone: '+254700123459',
    avatar: 'GA',
    status: 'Active',
    rejectionReason: null,
    staffId: null,
    lastLoginAt: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
  {
    id: 'demo-user-superadmin',
    schoolId: 'demo-school-001',
    name: 'Platform Super Admin',
    email: 'superadmin@skulhub.ac.ke',
    passwordHash: '$2b$10$demo-hash-not-real',
    role: 'super_admin',
    phone: '+254700123460',
    avatar: 'SA',
    status: 'Active',
    rejectionReason: null,
    staffId: null,
    lastLoginAt: null,
    createdAt: '2024-01-15T10:00:00.000Z',
    updatedAt: '2024-01-15T10:00:00.000Z',
  },
]

// Demo credentials mapping (email → password) — only used in demo mode
export const DEMO_CREDENTIALS: Record<string, string> = {
  'admin@skulhub.ac.ke': 'admin123',
  'principal@skulhub.ac.ke': 'principal123',
  'bursar@skulhub.ac.ke': 'bursar123',
  'teacher@skulhub.ac.ke': 'teacher123',
  'librarian@skulhub.ac.ke': 'librarian123',
  'nurse@skulhub.ac.ke': 'nurse123',
  'admissions@skulhub.ac.ke': 'admissions123',
  'matron@skulhub.ac.ke': 'matron123',
  'secretary@skulhub.ac.ke': 'secretary123',
  'driver@skulhub.ac.ke': 'driver123',
  'gate@skulhub.ac.ke': 'gate123',
  'deputy@skulhub.ac.ke': 'deputy123',
  'cook@skulhub.ac.ke': 'cook123',
  'superadmin@skulhub.ac.ke': 'superadmin123',
}

export const DEMO_DASHBOARD = {
  stats: {
    totalStudents: 426,
    totalStaff: 31,
    totalClasses: 12,
    activeStreams: 16,
    totalBooks: 66,
    availableBooks: 66,
    activeLoans: 0,
  },
  finance: {
    totalBilled: 15000,
    totalCollected: 11500,
    totalOutstanding: 3500,
    collectionRate: 76.7,
    todayCollection: 0,
    totalExpenses: 0,
    feeStats: [{ status: 'Partially Paid', amount: 15000, balance: 3500, count: 1 }],
  },
  studentsByLevel: [
    { name: 'Form 1', count: 64 },
    { name: 'Form 2', count: 54 },
    { name: 'Form 3', count: 49 },
    { name: 'Form 4', count: 43 },
    { name: 'Grade 1', count: 28 },
    { name: 'Grade 2', count: 31 },
    { name: 'Grade 3', count: 25 },
    { name: 'Grade 4', count: 30 },
    { name: 'Grade 5', count: 27 },
    { name: 'Grade 6', count: 29 },
    { name: 'Grade 7', count: 24 },
    { name: 'Grade 8', count: 22 },
  ],
  studentsByGender: [
    { gender: 'Male', count: 218 },
    { gender: 'Female', count: 208 },
  ],
  attendanceTrend: [
    { date: '2026-08-04', rate: 94 },
    { date: '2026-08-05', rate: 96 },
    { date: '2026-08-06', rate: 92 },
    { date: '2026-08-07', rate: 95 },
    { date: '2026-08-08', rate: 97 },
    { date: '2026-08-11', rate: 93 },
    { date: '2026-08-12', rate: 95 },
    { date: '2026-08-13', rate: 94 },
    { date: '2026-08-14', rate: 96 },
  ],
  gradeDistribution: [
    { grade: 'A', count: 45 },
    { grade: 'A-', count: 62 },
    { grade: 'B+', count: 78 },
    { grade: 'B', count: 91 },
    { grade: 'B-', count: 85 },
    { grade: 'C+', count: 72 },
    { grade: 'C', count: 65 },
    { grade: 'C-', count: 48 },
    { grade: 'D+', count: 32 },
    { grade: 'D', count: 21 },
    { grade: 'D-', count: 14 },
    { grade: 'E', count: 8 },
  ],
  announcements: [
    {
      id: 'demo-ann-1',
      title: 'Welcome to Term 2',
      body: 'All students should report back by 8:00 AM on Monday. Fees must be cleared before the term begins.',
      audience: 'All',
      priority: 'High',
      authorId: null,
      authorName: 'Mary Wanjiru',
      pinned: true,
      publishedAt: '2026-08-10T08:00:00.000Z',
      createdAt: '2026-08-10T08:00:00.000Z',
    },
    {
      id: 'demo-ann-2',
      title: 'Parent-Teacher Conference',
      body: 'PTM scheduled for Saturday 9:00 AM - 1:00 PM. All parents are invited.',
      audience: 'Parents',
      priority: 'Medium',
      authorId: null,
      authorName: 'Mary Wanjiru',
      pinned: false,
      publishedAt: '2026-08-09T10:00:00.000Z',
      createdAt: '2026-08-09T10:00:00.000Z',
    },
  ],
  activities: [
    { id: 'demo-act-1', action: 'CREATE', entity: 'Student', entityId: null, user: 'Moses Kinyanjui', details: 'Admitted new student: ADM/5425', createdAt: '2026-08-14T14:30:00.000Z' },
    { id: 'demo-act-2', action: 'PAYMENT', entity: 'Invoice', entityId: null, user: 'Peter Kamau', details: 'Recorded payment of KES 5,000 for INV/10001', createdAt: '2026-08-14T11:15:00.000Z' },
    { id: 'demo-act-3', action: 'MARK', entity: 'Attendance', entityId: null, user: 'Grace Achieng', details: 'Marked attendance for Form 2A (45 students)', createdAt: '2026-08-14T08:30:00.000Z' },
  ],
}

export const DEMO_SUPERADMIN = {
  summary: {
    totalSchools: 1,
    activeSchools: 1,
    trialSchools: 0,
    suspendedSchools: 0,
    expiredSchools: 0,
    totalUsers: 5,
    totalStudents: 426,
    totalStaff: 32,
    totalInvoices: 1,
    totalPayments: 1,
    totalRevenue: 11500,
  },
  revenueByPlan: [
    { plan: 'Starter', amount: 0 },
    { plan: 'Standard', amount: 0 },
    { plan: 'Premium', amount: 11500 },
    { plan: 'Enterprise', amount: 0 },
  ],
  schoolsByPlan: [
    { plan: 'Starter', count: 0 },
    { plan: 'Standard', count: 0 },
    { plan: 'Premium', count: 1 },
    { plan: 'Enterprise', count: 0 },
  ],
  schoolsByStatus: [
    { name: 'Active', value: 1, color: '#059669' },
  ],
  monthlyGrowth: [
    { label: 'Mar', count: 0 },
    { label: 'Apr', count: 0 },
    { label: 'May', count: 0 },
    { label: 'Jun', count: 0 },
    { label: 'Jul', count: 0 },
    { label: 'Aug', count: 1 },
  ],
  recentRegistrations: [
    {
      id: 'demo-school-001',
      name: 'SkulHub Academy',
      slug: 'skulhub-academy',
      county: 'Nairobi',
      plan: 'Premium',
      studentCount: 426,
      createdAt: '2026-08-10T20:23:45.184Z',
    },
  ],
  schools: [
    {
      id: 'demo-school-001',
      name: 'SkulHub Academy',
      slug: 'skulhub-academy',
      email: 'info@skulhub.ac.ke',
      phone: '+254700123456',
      address: 'Karen, Nairobi',
      county: 'Nairobi',
      plan: 'Premium',
      status: 'Active',
      trialEndsAt: null,
      maxStudents: 1000,
      createdAt: '2026-08-10T20:23:45.184Z',
      userCount: 5,
      studentCount: 426,
      staffCount: 32,
      invoiceCount: 1,
      paymentCount: 1,
      revenue: 11500,
      lastLoginAt: '2026-08-17T13:11:31.715Z',
      users: [
        { id: 'demo-user-superadmin', name: 'Platform Super Admin', email: 'superadmin@skulhub.ac.ke', role: 'super_admin', status: 'Active', lastLoginAt: '2026-08-17T13:11:31.715Z' },
        { id: 'demo-user-admin', name: 'Moses Kinyanjui', email: 'admin@skulhub.ac.ke', role: 'admin', status: 'Active', lastLoginAt: null },
        { id: 'demo-user-principal', name: 'Mary Wanjiru', email: 'principal@skulhub.ac.ke', role: 'principal', status: 'Active', lastLoginAt: null },
        { id: 'demo-user-bursar', name: 'Peter Kamau', email: 'bursar@skulhub.ac.ke', role: 'bursar', status: 'Active', lastLoginAt: null },
        { id: 'demo-user-teacher', name: 'Grace Achieng', email: 'teacher@skulhub.ac.ke', role: 'teacher', status: 'Active', lastLoginAt: null },
      ],
    },
  ],
}

/**
 * Check if we're in demo mode — i.e., the database is unreachable.
 * This happens on Vercel when DATABASE_URL is not set to a Postgres connection string.
 * In demo mode, we return hardcoded demo data instead of querying the database.
 */
export function isDemoMode(): boolean {
  const dbUrl = process.env.DATABASE_URL || ''

  // If no DATABASE_URL at all → demo mode
  if (!dbUrl) return true

  // If it's a Postgres URL → NOT demo mode (real database)
  if (dbUrl.startsWith('postgresql://') || dbUrl.startsWith('postgres://')) return false

  // If it's a SQLite file: URL, check if the file exists locally
  if (dbUrl.startsWith('file:')) {
    try {
      const path = dbUrl.replace('file:', '')
      // If the file exists and is readable → NOT demo mode (real local DB)
      if (fs.existsSync(path)) return false
      // File doesn't exist → demo mode (DB hasn't been created yet)
      return true
    } catch {
      // Can't check filesystem (e.g., on Vercel serverless) → demo mode
      return true
    }
  }

  // Unknown URL format → demo mode
  return true
}

/**
 * Find a demo user by email. Returns null if not found.
 */
export function findDemoUserByEmail(email: string) {
  const normalized = email.toLowerCase().trim()
  return DEMO_USERS.find(u => u.email.toLowerCase() === normalized) || null
}

/**
 * Verify a demo password. In demo mode, we skip bcrypt and just compare against
 * the DEMO_CREDENTIALS map.
 */
export function verifyDemoPassword(email: string, password: string): boolean {
  const normalized = email.toLowerCase().trim()
  const expected = DEMO_CREDENTIALS[normalized]
  return expected === password
}
