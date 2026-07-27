'use client'
import { create } from 'zustand'

export type ModuleKey =
  | 'dashboard'
  | 'students'
  | 'staff'
  | 'academics'
  | 'attendance'
  | 'finance'
  | 'communications'
  | 'library'
  | 'transport'
  | 'reports'
  | 'settings'

interface AppState {
  activeModule: ModuleKey
  sidebarOpen: boolean
  setActiveModule: (m: ModuleKey) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
}

export const useAppStore = create<AppState>((set) => ({
  activeModule: 'dashboard',
  sidebarOpen: false,
  setActiveModule: (m) => set({ activeModule: m, sidebarOpen: false }),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))
