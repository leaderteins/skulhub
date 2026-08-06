'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ---------------------------------------------------------------------------
// Roles — full school structure (13 roles)
// ---------------------------------------------------------------------------
export type UserRole =
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
  schoolName?: string
}

// Role display info
export const ROLE_INFO: Record<UserRole, { label: string; color: string; bg: string; icon: string }> = {
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
  'dashboard', 'admissions', 'students', 'staff', 'alumni', 'academics',
  'attendance', 'exams', 'reportcards', 'health', 'events', 'discipline',
  'hostel', 'finance', 'communications', 'library', 'transport', 'inventory',
  'cafeteria', 'visitors', 'staffroom', 'reports', 'settings',
]

// Module VIEW access by role
export const MODULE_ACCESS: Record<UserRole, string[]> = {
  admin: ALL_MODULES,
  principal: ALL_MODULES,
  deputy_principal: ['dashboard', 'admissions', 'students', 'staff', 'academics', 'attendance', 'exams', 'reportcards', 'health', 'events', 'discipline', 'hostel', 'communications', 'library', 'transport', 'cafeteria', 'visitors', 'staffroom', 'reports'],
  bursar: ['dashboard', 'students', 'finance', 'reports', 'settings'],
  teacher: ['dashboard', 'students', 'academics', 'attendance', 'exams', 'reportcards', 'events', 'discipline', 'staffroom', 'settings'],
  librarian: ['dashboard', 'students', 'library', 'settings'],
  nurse: ['dashboard', 'students', 'health', 'settings'],
  matron: ['dashboard', 'students', 'hostel', 'health', 'discipline', 'settings'],
  secretary: ['dashboard', 'admissions', 'students', 'staff', 'communications', 'events', 'staffroom', 'settings'],
  admissions: ['dashboard', 'admissions', 'students', 'settings'],
  bus_driver: ['dashboard', 'students', 'transport', 'settings'],
  gate_man: ['dashboard', 'students', 'visitors', 'transport', 'settings'],
  cook: ['dashboard', 'students', 'cafeteria', 'settings'],
}

// Roles that can see financial/monetary data
export const FINANCE_ROLES: UserRole[] = ['admin', 'principal', 'bursar']

// Demo users — admin is Moses Kinyanjui
export const DEMO_USERS: Array<SystemUser & { password: string }> = [
  { id: 'u1', name: 'Moses Kinyanjui', email: 'admin@edumanage.ac.ke', role: 'admin', avatar: 'MK', password: 'admin123', schoolName: 'EduManage Academy' },
  { id: 'u2', name: 'Mary Wanjiru', email: 'principal@edumanage.ac.ke', role: 'principal', avatar: 'MW', password: 'principal123', schoolName: 'EduManage Academy' },
  { id: 'u3', name: 'Peter Kamau', email: 'bursar@edumanage.ac.ke', role: 'bursar', avatar: 'PK', password: 'bursar123', schoolName: 'EduManage Academy' },
  { id: 'u4', name: 'Grace Achieng', email: 'teacher@edumanage.ac.ke', role: 'teacher', avatar: 'GA', password: 'teacher123', schoolName: 'EduManage Academy' },
  { id: 'u5', name: 'Dennis Kiprop', email: 'librarian@edumanage.ac.ke', role: 'librarian', avatar: 'DK', password: 'librarian123', schoolName: 'EduManage Academy' },
  { id: 'u6', name: 'Faith Mutua', email: 'nurse@edumanage.ac.ke', role: 'nurse', avatar: 'FM', password: 'nurse123', schoolName: 'EduManage Academy' },
  { id: 'u7', name: 'John Mwangi', email: 'admissions@edumanage.ac.ke', role: 'admissions', avatar: 'JM', password: 'admissions123', schoolName: 'EduManage Academy' },
  { id: 'u8', name: 'Rose Chebet', email: 'matron@edumanage.ac.ke', role: 'matron', avatar: 'RC', password: 'matron123', schoolName: 'EduManage Academy' },
  { id: 'u9', name: 'Samuel Otieno', email: 'secretary@edumanage.ac.ke', role: 'secretary', avatar: 'SO', password: 'secretary123', schoolName: 'EduManage Academy' },
  { id: 'u10', name: 'David Kibet', email: 'driver@edumanage.ac.ke', role: 'bus_driver', avatar: 'DK', password: 'driver123', schoolName: 'EduManage Academy' },
  { id: 'u11', name: 'Paul Wafula', email: 'gate@edumanage.ac.ke', role: 'gate_man', avatar: 'PW', password: 'gate123', schoolName: 'EduManage Academy' },
  { id: 'u12', name: 'Esther Njeri', email: 'deputy@edumanage.ac.ke', role: 'deputy_principal', avatar: 'EN', password: 'deputy123', schoolName: 'EduManage Academy' },
  { id: 'u13', name: 'Joseph Muthomi', email: 'cook@edumanage.ac.ke', role: 'cook', avatar: 'JM', password: 'cook123', schoolName: 'EduManage Academy' },
]

interface AuthState {
  user: SystemUser | null
  _hasHydrated: boolean
  setHasHydrated: (state: boolean) => void
  login: (email: string, password: string) => boolean
  logout: () => void
  hasAccess: (module: string) => boolean
  canViewFinance: () => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
      login: (email: string, password: string) => {
        const found = DEMO_USERS.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password)
        if (found) {
          const { password: _, ...user } = found
          set({ user })
          return true
        }
        return false
      },
      logout: () => set({ user: null }),
      hasAccess: (module: string) => {
        const user = get().user
        if (!user) return false
        return MODULE_ACCESS[user.role].includes(module)
      },
      canViewFinance: () => {
        const user = get().user
        if (!user) return false
        return FINANCE_ROLES.includes(user.role)
      },
    }),
    {
      name: 'edumanage-auth',
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)
