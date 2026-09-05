'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Roles — full school structure (13 roles + super_admin for platform owner)
// ---------------------------------------------------------------------------
export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'principal'
  | 'deputy_principal'
  | 'bursar'
  | 'teacher'
  | 'librarian'
  | 'nurse'
  | 'matron'
  | 'secretary'
  | 'admissions'
  | 'bus_driver'
  | 'gate_man'
  | 'cook'

export type Permission = 'view' | 'edit' | 'none'

export interface SystemUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatar: string
  department?: string
  schoolId?: string
  schoolName?: string
  schoolSlug?: string
  isSuperAdmin?: boolean
  allowedModules?: string[] | null
}

// Role display info
export const ROLE_INFO: Record<UserRole, { label: string; color: string; bg: string; icon: string }> = {
  super_admin: { label: 'Platform Super Admin', color: 'text-emerald-700', bg: 'bg-emerald-500/15', icon: '🛡️' },
  admin: { label: 'System Administrator', color: 'text-rose-600', bg: 'bg-rose-500/10', icon: '👑' },
  principal: { label: 'Principal', color: 'text-violet-600', bg: 'bg-violet-500/10', icon: '🎓' },
  deputy_principal: { label: 'Deputy Principal', color: 'text-indigo-600', bg: 'bg-indigo-500/10', icon: '🧑‍💼' },
  bursar: { label: 'Bursar / Finance Officer', color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: '💰' },
  teacher: { label: 'Teacher', color: 'text-teal-600', bg: 'bg-teal-500/10', icon: '📚' },
  librarian: { label: 'Librarian', color: 'text-cyan-600', bg: 'bg-cyan-500/10', icon: '📖' },
  nurse: { label: 'School Nurse', color: 'text-pink-600', bg: 'bg-pink-500/10', icon: '⚕️' },
  matron: { label: 'Matron / Boarding Supervisor', color: 'text-orange-600', bg: 'bg-orange-500/10', icon: '🛏️' },
  secretary: { label: 'Secretary', color: 'text-blue-600', bg: 'bg-blue-500/10', icon: '📝' },
  admissions: { label: 'Admissions Clerk', color: 'text-amber-600', bg: 'bg-amber-500/10', icon: '📋' },
  bus_driver: { label: 'Bus Driver', color: 'text-lime-600', bg: 'bg-lime-500/10', icon: '🚌' },
  gate_man: { label: 'Security / Gate Officer', color: 'text-slate-600', bg: 'bg-slate-500/10', icon: '🚪' },
  cook: { label: 'Cook / Kitchen Staff', color: 'text-red-600', bg: 'bg-red-500/10', icon: '👨‍🍳' },
}

const ALL_MODULES = [
  'dashboard', 'admissions', 'students', 'staff', 'staffapprovals', 'alumni', 'academics',
  'attendance', 'exams', 'reportcards', 'lessonplans', 'homework', 'timetable',
  'health', 'events', 'discipline',
  'hostel', 'finance', 'communications', 'library', 'transport', 'inventory',
  'cafeteria', 'procurement', 'facilities', 'visitors', 'staffroom',
  'payroll', 'appraisals', 'feedback', 'idcards', 'dataimport', 'invrequests', 'reports',
  'biometric', 'bustracking', 'notifications', 'examanalytics', 'aiassistant', 'documents', 'analytics', 'feereminders', 'settings',
]

// Module VIEW access by role. super_admin sees everything (platform owner).
export const MODULE_ACCESS: Record<UserRole, string[]> = {
  super_admin: ['superadmin', 'settings', 'subscriptions'],
  admin: ALL_MODULES,
  principal: ALL_MODULES,
  deputy_principal: ['dashboard', 'admissions', 'students', 'staff', 'staffapprovals', 'academics', 'attendance', 'exams', 'reportcards', 'lessonplans', 'homework', 'timetable', 'health', 'events', 'discipline', 'hostel', 'communications', 'library', 'transport', 'cafeteria', 'procurement', 'facilities', 'visitors', 'staffroom', 'payroll', 'appraisals', 'feedback', 'idcards', 'reports', 'biometric', 'bustracking'],
  bursar: ['dashboard', 'students', 'finance', 'procurement', 'facilities', 'payroll', 'idcards', 'reports', 'settings'],
  teacher: ['dashboard', 'students', 'academics', 'attendance', 'exams', 'reportcards', 'lessonplans', 'homework', 'timetable', 'events', 'discipline', 'staffroom', 'appraisals', 'feedback', 'idcards', 'invrequests', 'settings'],
  librarian: ['dashboard', 'students', 'library', 'invrequests', 'feedback', 'settings'],
  nurse: ['dashboard', 'students', 'health', 'invrequests', 'feedback', 'settings'],
  matron: ['dashboard', 'students', 'hostel', 'health', 'discipline', 'feedback', 'settings'],
  secretary: ['dashboard', 'admissions', 'students', 'staff', 'academics', 'lessonplans', 'homework', 'timetable', 'communications', 'events', 'staffroom', 'appraisals', 'feedback', 'idcards', 'dataimport', 'settings'],
  admissions: ['dashboard', 'admissions', 'students', 'idcards', 'dataimport', 'settings'],
  bus_driver: ['dashboard', 'students', 'transport', 'bustracking', 'feedback', 'settings'],
  gate_man: ['dashboard', 'students', 'visitors', 'transport', 'biometric', 'bustracking', 'feedback', 'settings'],
  cook: ['dashboard', 'students', 'cafeteria', 'invrequests', 'feedback', 'settings'],
}

// Roles that can see financial/monetary data
export const FINANCE_ROLES: UserRole[] = ['super_admin', 'admin', 'principal', 'bursar']

// Demo users — admin is Moses Kinyanjui (used as dev fallback when DB auth fails)
export const DEMO_USERS: Array<SystemUser & { password: string }> = [
  { id: 'u1', name: 'Moses Kinyanjui', email: 'admin@skulhub.ac.ke', role: 'admin', avatar: 'MK', password: 'admin123', schoolName: 'SkulHub Academy' },
  { id: 'u2', name: 'Mary Wanjiru', email: 'principal@skulhub.ac.ke', role: 'principal', avatar: 'MW', password: 'principal123', schoolName: 'SkulHub Academy' },
  { id: 'u3', name: 'Peter Kamau', email: 'bursar@skulhub.ac.ke', role: 'bursar', avatar: 'PK', password: 'bursar123', schoolName: 'SkulHub Academy' },
  { id: 'u4', name: 'Grace Achieng', email: 'teacher@skulhub.ac.ke', role: 'teacher', avatar: 'GA', password: 'teacher123', schoolName: 'SkulHub Academy' },
  { id: 'u5', name: 'Dennis Kiprop', email: 'librarian@skulhub.ac.ke', role: 'librarian', avatar: 'DK', password: 'librarian123', schoolName: 'SkulHub Academy' },
  { id: 'u6', name: 'Faith Mutua', email: 'nurse@skulhub.ac.ke', role: 'nurse', avatar: 'FM', password: 'nurse123', schoolName: 'SkulHub Academy' },
  { id: 'u7', name: 'John Mwangi', email: 'admissions@skulhub.ac.ke', role: 'admissions', avatar: 'JM', password: 'admissions123', schoolName: 'SkulHub Academy' },
  { id: 'u8', name: 'Rose Chebet', email: 'matron@skulhub.ac.ke', role: 'matron', avatar: 'RC', password: 'matron123', schoolName: 'SkulHub Academy' },
  { id: 'u9', name: 'Samuel Otieno', email: 'secretary@skulhub.ac.ke', role: 'secretary', avatar: 'SO', password: 'secretary123', schoolName: 'SkulHub Academy' },
  { id: 'u10', name: 'David Kibet', email: 'driver@skulhub.ac.ke', role: 'bus_driver', avatar: 'DK', password: 'driver123', schoolName: 'SkulHub Academy' },
  { id: 'u11', name: 'Paul Wafula', email: 'gate@skulhub.ac.ke', role: 'gate_man', avatar: 'PW', password: 'gate123', schoolName: 'SkulHub Academy' },
  { id: 'u12', name: 'Esther Njeri', email: 'deputy@skulhub.ac.ke', role: 'deputy_principal', avatar: 'EN', password: 'deputy123', schoolName: 'SkulHub Academy' },
  { id: 'u13', name: 'Joseph Muthomi', email: 'cook@skulhub.ac.ke', role: 'cook', avatar: 'JM', password: 'cook123', schoolName: 'SkulHub Academy' },
  { id: 'u14', name: 'Platform Super Admin', email: 'superadmin@skulhub.ac.ke', role: 'super_admin', avatar: 'SA', password: 'superadmin123', schoolName: 'SkulHub Platform', isSuperAdmin: true },
]

// --- Server-side auth types ------------------------------------------------

export interface ServerLoginResponse {
  user: {
    id: string
    name: string
    email: string
    role: UserRole
    schoolId: string
    schoolName: string | null
    schoolSlug: string | null
    avatar: string
    isSuperAdmin: boolean
    allowedModules: string[] | null
  }
  token: string
}

export interface ServerRegisterPayload {
  schoolName: string
  schoolEmail?: string
  schoolPhone?: string
  county?: string
  adminName: string
  adminEmail: string
  adminPassword: string
  // Extended wizard fields
  level?: string
  knecCode?: string
  yearEstablished?: string | number
  category?: string
  gender?: string
  motto?: string
  primaryColor?: string
  address?: string
  adminPhone?: string
}

export interface ServerRegisterResponse {
  school: {
    id: string
    name: string
    slug: string
    schoolCode: string
    plan: string
    status: string
    trialEndsAt: string | Date | null
  }
  user: { id: string; name: string; email: string; role: UserRole; schoolId: string; avatar: string }
  token: string
}

type AuthView = 'landing' | 'login' | 'register' | 'staff-signup' | 'parent' | 'superadmin'

interface AuthState {
  user: SystemUser | null
  serverToken: string | null
  isSuperAdmin: boolean
  authView: AuthView
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  setAuthView: (view: AuthView) => void
  // Demo login (dev fallback) — returns true on success
  login: (email: string, password: string) => boolean
  // Server-side auth (real DB-backed)
  serverLogin: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  serverRegister: (data: ServerRegisterPayload) => Promise<{ success: boolean; error?: string; school?: { id: string; name: string; slug: string; schoolCode: string } }>
  // Staff self-signup (pending approval) — does NOT log in
  staffSignup: (data: StaffSignupPayload) => Promise<{ success: boolean; error?: string; message?: string; schoolName?: string }>
  logout: () => void
  hasAccess: (module: string) => boolean
  canEdit: (module: string) => boolean
  canDelete: (module: string) => boolean
  canViewFinance: () => boolean
}

export interface StaffSignupPayload {
  schoolCode: string
  name: string
  email: string
  password: string
  phone?: string
  role: string
  gender?: string
  qualification?: string
  specialization?: string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      serverToken: null,
      isSuperAdmin: false,
      authView: 'landing',
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
      setAuthView: (view: AuthView) => set({ authView: view }),

      // --- Demo login (Zustand-only, for dev convenience) -------------------
      login: (email: string, password: string) => {
        const found = DEMO_USERS.find(
          u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        )
        if (found) {
          const { password: _, ...user } = found
          set({ user, serverToken: null, isSuperAdmin: false })
          return true
        }
        return false
      },

      // --- Server login (real DB via /api/auth/login) -----------------------
      serverLogin: async (email: string, password: string) => {
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
          })
          const data = await res.json().catch(() => ({}))
          if (!res.ok) {
            return { success: false, error: data?.error || 'Login failed' }
          }
          const payload = data as ServerLoginResponse
          const u = payload.user
          set({
            user: {
              id: u.id,
              name: u.name,
              email: u.email,
              role: u.role,
              avatar: u.avatar || u.name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase(),
              schoolId: u.schoolId,
              schoolName: u.schoolName ?? undefined,
              schoolSlug: u.schoolSlug ?? undefined,
              isSuperAdmin: !!u.isSuperAdmin,
              allowedModules: u.allowedModules ?? null,
            },
            serverToken: payload.token,
            isSuperAdmin: !!u.isSuperAdmin,
          })
          return { success: true }
        } catch (e: any) {
          return { success: false, error: e?.message || 'Network error' }
        }
      },

      // --- Server register (creates school + admin via /api/auth/register) --
      serverRegister: async (data: ServerRegisterPayload) => {
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
          const json = await res.json().catch(() => ({}))
          if (!res.ok) {
            return { success: false, error: json?.error || 'Registration failed' }
          }
          const payload = json as ServerRegisterResponse
          // Auto-login the newly registered admin
          set({
            user: {
              id: payload.user.id,
              name: payload.user.name,
              email: payload.user.email,
              role: payload.user.role,
              avatar: payload.user.avatar || payload.user.name.split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase(),
              schoolId: payload.user.schoolId,
              schoolName: payload.school.name,
              schoolSlug: payload.school.slug,
              isSuperAdmin: false,
            },
            serverToken: payload.token,
            isSuperAdmin: false,
          })
          return {
            success: true,
            school: { id: payload.school.id, name: payload.school.name, slug: payload.school.slug, schoolCode: payload.school.schoolCode },
          }
        } catch (e: any) {
          return { success: false, error: e?.message || 'Network error' }
        }
      },

      // --- Staff self-signup (pending principal approval) ------------------
      staffSignup: async (data: StaffSignupPayload) => {
        try {
          const res = await fetch('/api/auth/staff-signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          })
          const json = await res.json().catch(() => ({}))
          if (!res.ok) {
            return { success: false, error: json?.error || 'Sign up failed' }
          }
          return {
            success: true,
            message: json?.message,
            schoolName: json?.schoolName,
          }
        } catch (e: any) {
          return { success: false, error: e?.message || 'Network error' }
        }
      },

      logout: () =>
        set({
          user: null,
          serverToken: null,
          isSuperAdmin: false,
          authView: 'landing',
        }),

      hasAccess: (module: string) => {
        const user = get().user
        if (!user) return false
        // Super admin: platform modules + subscriptions billing
        if (user.isSuperAdmin) {
          return ['dashboard', 'superadmin', 'settings', 'subscriptions'].includes(module)
        }
        // If the admin has set per-user module overrides, use ONLY those.
        // An empty array means "only dashboard". null/undefined means "use role defaults".
        if (user.allowedModules) {
          if (user.allowedModules.length === 0) return module === 'dashboard'
          return user.allowedModules.includes(module)
        }
        // Fallback to role-based defaults
        return MODULE_ACCESS[user.role].includes(module)
      },
      canEdit: (module: string) => {
        const user = get().user
        if (!user) return false
        if (user.role === 'admin' || user.role === 'principal' || user.role === 'super_admin') return true
        const editMap: Record<string, UserRole[]> = {
          inventory: ['admin', 'principal', 'deputy_principal'],
          cafeteria: ['admin', 'principal', 'cook'],
          finance: ['admin', 'principal', 'bursar'],
          invrequests: ['admin', 'principal', 'deputy_principal', 'cook', 'teacher', 'librarian', 'nurse', 'matron', 'secretary'],
        }
        return (editMap[module] || ['admin', 'principal']).includes(user.role)
      },
      // Only admin and principal can DELETE anything — protects sensitive data
      // from being removed by teachers, bursars, librarians, etc.
      canDelete: (module: string) => {
        const user = get().user
        if (!user) return false
        // Only admin, principal, and super_admin can delete
        if (user.role === 'admin' || user.role === 'principal' || user.role === 'super_admin') return true
        // Deputy principal can delete in limited modules
        if (user.role === 'deputy_principal') {
          return ['attendance', 'discipline', 'events', 'homework', 'lessonplans'].includes(module)
        }
        // All other roles: NO delete permissions
        return false
      },
      canViewFinance: () => {
        const user = get().user
        if (!user) return false
        return FINANCE_ROLES.includes(user.role)
      },
    }),
    {
      name: 'skulhub-auth',
      // Don't persist authView — visitors should always see the landing page
      // first, not whatever auth screen they were on when they last closed the tab.
      // Exception: if they were logged in, we want to keep them logged in.
      partialize: (state) => ({
        user: state.user,
        serverToken: state.serverToken,
        isSuperAdmin: state.isSuperAdmin,
        // authView is intentionally excluded — reset to 'landing' on reload
        // unless the user is logged in (in which case authView doesn't matter)
        _hasHydrated: state._hasHydrated,
      }),
      onRehydrateStorage: () => (state) => {
        // After rehydration, force authView back to 'landing' (or 'superadmin'
        // if a flag was set by the Ctrl+Shift+A flow during this session).
        if (state) {
          state.authView = 'landing'
          state.setHasHydrated(true)
        }
      },
    }
  )
)
