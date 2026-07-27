'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type UserRole = 'admin' | 'principal' | 'bursar' | 'teacher' | 'librarian' | 'nurse' | 'admissions'

export interface SystemUser {
  id: string
  name: string
  email: string
  role: UserRole
  avatar: string
  department?: string
}

// Role display info
export const ROLE_INFO: Record<UserRole, { label: string; color: string; bg: string; icon: string }> = {
  admin: { label: 'Administrator', color: 'text-rose-600', bg: 'bg-rose-500/10', icon: '👑' },
  principal: { label: 'Principal', color: 'text-violet-600', bg: 'bg-violet-500/10', icon: '🎓' },
  bursar: { label: 'Bursar', color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: '💰' },
  teacher: { label: 'Teacher', color: 'text-teal-600', bg: 'bg-teal-500/10', icon: '📚' },
  librarian: { label: 'Librarian', color: 'text-cyan-600', bg: 'bg-cyan-500/10', icon: '📖' },
  nurse: { label: 'School Nurse', color: 'text-pink-600', bg: 'bg-pink-500/10', icon: '⚕️' },
  admissions: { label: 'Admissions Clerk', color: 'text-amber-600', bg: 'bg-amber-500/10', icon: '📋' },
}

// Demo users for different roles
export const DEMO_USERS: Array<SystemUser & { password: string }> = [
  { id: 'u1', name: 'James Atito', email: 'admin@edumanage.ac.ke', role: 'admin', avatar: 'JA', password: 'admin123', department: 'Administration' },
  { id: 'u2', name: 'Mary Wanjiru', email: 'principal@edumanage.ac.ke', role: 'principal', avatar: 'MW', password: 'principal123', department: 'Administration' },
  { id: 'u3', name: 'Peter Kamau', email: 'bursar@edumanage.ac.ke', role: 'bursar', avatar: 'PK', password: 'bursar123', department: 'Finance' },
  { id: 'u4', name: 'Grace Achieng', email: 'teacher@edumanage.ac.ke', role: 'teacher', avatar: 'GA', password: 'teacher123', department: 'Sciences' },
  { id: 'u5', name: 'Dennis Kiprop', email: 'librarian@edumanage.ac.ke', role: 'librarian', avatar: 'DK', password: 'librarian123', department: 'Library' },
  { id: 'u6', name: 'Faith Mutua', email: 'nurse@edumanage.ac.ke', role: 'nurse', avatar: 'FM', password: 'nurse123', department: 'Health' },
  { id: 'u7', name: 'John Mwangi', email: 'admissions@edumanage.ac.ke', role: 'admissions', avatar: 'JM', password: 'admissions123', department: 'Admissions' },
]

// Module access by role
export const MODULE_ACCESS: Record<UserRole, string[]> = {
  admin: ['dashboard', 'admissions', 'students', 'staff', 'alumni', 'academics', 'attendance', 'exams', 'reportcards', 'health', 'events', 'discipline', 'hostel', 'finance', 'communications', 'library', 'transport', 'inventory', 'cafeteria', 'reports', 'settings'],
  principal: ['dashboard', 'admissions', 'students', 'staff', 'alumni', 'academics', 'attendance', 'exams', 'reportcards', 'health', 'events', 'discipline', 'hostel', 'finance', 'communications', 'library', 'transport', 'inventory', 'cafeteria', 'reports', 'settings'],
  bursar: ['dashboard', 'students', 'finance', 'reports', 'settings'],
  teacher: ['dashboard', 'students', 'academics', 'attendance', 'exams', 'reportcards', 'events', 'discipline', 'settings'],
  librarian: ['dashboard', 'students', 'library', 'settings'],
  nurse: ['dashboard', 'students', 'health', 'settings'],
  admissions: ['dashboard', 'admissions', 'students', 'settings'],
}

interface AuthState {
  user: SystemUser | null
  login: (email: string, password: string) => boolean
  logout: () => void
  hasAccess: (module: string) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
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
    }),
    { name: 'edumanage-auth' }
  )
)
