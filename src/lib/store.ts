'use client'
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

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
  | 'biometric'
  | 'bustracking'
  | 'notifications'
  | 'examanalytics'
  | 'aiassistant'
  | 'feereminders'
  | 'subscriptions'
  | 'documents'
  | 'analytics'
  | 'settings'
  | 'superadmin'

interface AcademicSettings {
  currentTerm: string
  academicYear: string
  termStart: string
  termEnd: string
  /** When true, the term/year is auto-derived (from server) on every load.
   *  Set to false once an admin manually overrides in Settings. */
  auto: boolean
}

interface AppState {
  activeModule: ModuleKey
  sidebarOpen: boolean
  commandPaletteOpen: boolean
  academic: AcademicSettings
  /** True while the initial server fetch is in-flight */
  academicLoading: boolean
  setActiveModule: (m: ModuleKey) => void
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  setAcademic: (settings: Partial<AcademicSettings>) => void
  /** Fetch the authoritative academic calendar from the server (server clock).
   *  Called on app boot — uses the server's date, not the client's clock. */
  fetchAcademicFromServer: () => Promise<void>
  /** Recompute the academic term/year from the CLIENT's date — used as a
   *  fallback if the server endpoint is unreachable. */
  refreshAcademicFromToday: () => void
}

// ---------------------------------------------------------------------------
// Kenya school calendar derivation (client-side fallback)
// ---------------------------------------------------------------------------
const KENYA_TERM_RANGES: Array<{ term: string; fromMonth: number; fromDay: number; toMonth: number; toDay: number }> = [
  { term: 'Term 2', fromMonth: 3, fromDay: 22, toMonth: 7, toDay: 25 },  // Apr 22 – Aug 25
  { term: 'Term 3', fromMonth: 7, fromDay: 26, toMonth: 10, toDay: 30 },  // Aug 26 – Nov 30
  { term: 'Term 1', fromMonth: 0, fromDay: 1, toMonth: 3, toDay: 21 },   // Jan 1 – Apr 21
]

function deriveTermFromDate(d: Date): { term: string; year: string; termStart: string; termEnd: string } {
  const month = d.getMonth() // 0-indexed
  const day = d.getDate()
  const year = d.getFullYear()

  // December → long holiday, prep for Term 1 of NEXT year
  if (month === 11) {
    return {
      term: 'Holiday',
      year: String(year + 1),
      termStart: `${year}-12-01`,
      termEnd: `${year}-12-31`,
    }
  }
  for (const r of KENYA_TERM_RANGES) {
    const afterFrom = month > r.fromMonth || (month === r.fromMonth && day >= r.fromDay)
    const beforeTo = month < r.toMonth || (month === r.toMonth && day <= r.toDay)
    if (afterFrom && beforeTo) {
      return {
        term: r.term,
        year: String(year),
        termStart: `${year}-${String(r.fromMonth + 1).padStart(2, '0')}-${String(r.fromDay).padStart(2, '0')}`,
        termEnd: `${year}-${String(r.toMonth + 1).padStart(2, '0')}-${String(r.toDay).padStart(2, '0')}`,
      }
    }
  }
  // Fallback — Jan–Apr window wasn't matched (shouldn't happen)
  return {
    term: 'Term 1',
    year: String(year),
    termStart: `${year}-01-01`,
    termEnd: `${year}-04-21`,
  }
}

function buildDefaultAcademic(): AcademicSettings {
  const derived = deriveTermFromDate(new Date())
  return {
    currentTerm: derived.term,
    academicYear: derived.year,
    termStart: derived.termStart,
    termEnd: derived.termEnd,
    auto: true,
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeModule: 'dashboard',
      sidebarOpen: false,
      commandPaletteOpen: false,
      academic: buildDefaultAcademic(),
      academicLoading: false,

      setActiveModule: (m) => set({ activeModule: m, sidebarOpen: false }),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
      toggleCommandPalette: () => set((s) => ({ commandPaletteOpen: !s.commandPaletteOpen })),

      setAcademic: (settings) =>
        set((s) => ({
          academic: {
            ...s.academic,
            ...settings,
            // Any manual override disables auto-derivation (until reset)
            auto: settings.auto ?? false,
          },
        })),

      // --- Fetch authoritative calendar from the server (uses server clock) ---
      fetchAcademicFromServer: async () => {
        // If the user has manually overridden the calendar, don't clobber it.
        if (!get().academic.auto) return

        set({ academicLoading: true })
        try {
          const res = await fetch('/api/academic-calendar', {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' },
          })
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          const data = await res.json()
          set({
            academic: {
              currentTerm: data.currentTerm,
              academicYear: data.academicYear,
              termStart: data.termStart,
              termEnd: data.termEnd,
              auto: true,
            },
            academicLoading: false,
          })
        } catch {
          // Network/API failure — fall back to client-side derivation
          set({ academic: buildDefaultAcademic(), academicLoading: false })
        }
      },

      // --- Client-side fallback (used if server is unreachable) ---
      refreshAcademicFromToday: () => {
        const current = get().academic
        if (current.auto) {
          const fresh = buildDefaultAcademic()
          if (
            fresh.currentTerm !== current.currentTerm ||
            fresh.academicYear !== current.academicYear
          ) {
            set({ academic: fresh })
          }
        }
      },
    }),
    {
      name: 'skulhub-app-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist the academic settings — not transient UI state
      partialize: (state) => ({ academic: state.academic }),
    }
  )
)
