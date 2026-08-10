'use client'
import { create } from 'zustand'

export type ModuleKey =
  | 'dashboard'
  | 'admissions'
  | 'students'
  | 'staff'
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
  | 'payroll'
  | 'appraisals'
  | 'feedback'
  | 'idcards'
  | 'dataimport'
  | 'invrequests'
  | 'reports'
  | 'settings'
  | 'superadmin'

interface AppState {
  activeModule: ModuleKey
  sidebarOpen: boolean
  commandPaletteOpen: boolean
  setActiveModule: (m: ModuleKey) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'dashboard',
  sidebarOpen: false,
  commandPaletteOpen: false,
  setActiveModule: (m) => set({ activeModule: m, sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),
}))
