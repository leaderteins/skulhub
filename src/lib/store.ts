'use client'
import { create } from 'zustand'

export type ModuleKey =
  | 'dashboard'
  | 'admissions'
  | 'students'
  | 'staff'
  | 'staffapprovals'
  | 'academics'
  | 'attendance'
  | 'finance'
  | 'communications'
  | 'library'
  | 'transport'
  | 'health'
  | 'alumni'
  | 'events'
  | 'discipline'
  | 'hostel'
  | 'inventory'
  | 'cafeteria'
  | 'procurement'
  | 'facilities'
  | 'exams'
  | 'reportcards'
  | 'lessonplans'
  | 'homework'
  | 'timetable'
  | 'payroll'
  | 'appraisals'
  | 'feedback'
  | 'idcards'
  | 'dataimport'
  | 'invrequests'
  | 'reports'
  | 'settings'
  | 'superadmin'

interface AcademicSettings {
  currentTerm: string
  academicYear: string
  termStart: string
  termEnd: string
}

interface AppState {
  activeModule: ModuleKey
  sidebarOpen: boolean
  commandPaletteOpen: boolean
  academic: AcademicSettings
  setActiveModule: (m: ModuleKey) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  setAcademic: (settings: Partial<AcademicSettings>) => void
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'dashboard',
  sidebarOpen: false,
  commandPaletteOpen: false,
  academic: {
    currentTerm: 'Term 1',
    academicYear: '2025',
    termStart: '2025-01-06',
    termEnd: '2025-04-04',
  },
  setActiveModule: (m) => set({ activeModule: m, sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
  setAcademic: (settings) => set((s) => ({ academic: { ...s.academic, ...settings } })),
}))
