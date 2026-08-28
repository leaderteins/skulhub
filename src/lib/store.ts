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
  | 'settings'
  | 'superadmin'

interface AcademicSettings {
  currentTerm: string
  academicYear: string
  termStart: string
  termEnd: string
  /** When true, the term/year is auto-derived from today's date on every load.
   *  Set to false once an admin manually overrides in Settings. */
  auto: boolean
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
  /** Recompute the academic term/year from today's date — called on app boot. */
  refreshAcademicFromToday: () => void
}

// ---------------------------------------------------------------------------
// Kenya school calendar derivation
// ---------------------------------------------------------------------------
// Official Kenyan school terms (moE calendar):
//   Term 1: early January → late April   (then 3-week April holiday)
//   Term 2: early May     → early August  (then 1-week August holiday)
//   Term 3: late August    → early November (then long Dec holiday)
// Approximate month breakpoints (good enough for badge display):
//   Jan–Apr  → Term 1
//   May–Aug (up to ~Aug 20) → Term 2
//   Aug 21–Nov → Term 3
//   Dec       → "Holiday" (end of academic year, prep for Term 1 next year)
// ---------------------------------------------------------------------------
const KENYA_TERM_RANGES: Array<{ term: string; fromMonth: number; fromDay: number; toMonth: number; toDay: number }> = [
  { term: 'Term 2', fromMonth: 4,  fromDay: 22, toMonth: 7,  toDay: 25 },  // Apr 22 – Aug 25
  { term: 'Term 3', fromMonth: 7,  fromDay: 26, toMonth: 10, toDay: 30 },  // Aug 26 – Nov 30
  { term: 'Term 1', fromMonth: 0,  fromDay: 1,  toMonth: 3,  toDay: 21 },  // Jan 1 – Apr 21
]

function deriveTermFromDate(d: Date): { term: string; year: string } {
  const month = d.getMonth() // 0-indexed
  const day = d.getDate()
  // December (month 11) → long holiday, prep for Term 1 of NEXT year
  if (month === 11) {
    return { term: 'Holiday', year: String(d.getFullYear() + 1) }
  }
  for (const r of KENYA_TERM_RANGES) {
    const afterFrom = month > r.fromMonth || (month === r.fromMonth && day >= r.fromDay)
    const beforeTo = month < r.toMonth || (month === r.toMonth && day <= r.toDay)
    if (afterFrom && beforeTo) {
      return { term: r.term, year: String(d.getFullYear()) }
    }
  }
  // Fallback — Jan-Apr window wasn't matched (shouldn't happen)
  return { term: 'Term 1', year: String(d.getFullYear()) }
}

function buildDefaultAcademic(): AcademicSettings {
  const now = new Date()
  const { term, year } = deriveTermFromDate(now)
  // Reasonable default term windows (current year)
  let termStart = `${year}-01-06`
  let termEnd = `${year}-04-04`
  if (term === 'Term 2') { termStart = `${year}-05-06`; termEnd = `${year}-08-08` }
  if (term === 'Term 3') { termStart = `${year}-08-26`; termEnd = `${year}-11-04` }
  if (term === 'Holiday') { termStart = `${year}-12-01`; termEnd = `${year}-12-31` }
  return { currentTerm: term, academicYear: year, termStart, termEnd, auto: true }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      activeModule: 'dashboard',
      sidebarOpen: false,
      commandPaletteOpen: false,
      academic: buildDefaultAcademic(),
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
      refreshAcademicFromToday: () => {
        const current = get().academic
        // Only auto-derive if the user hasn't manually overridden it
        if (current.auto) {
          const fresh = buildDefaultAcademic()
          // Only update if something actually changed (avoids needless re-renders)
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
      // Only persist the academic settings — not transient UI state like activeModule/sidebarOpen
      partialize: (state) => ({ academic: state.academic }),
    }
  )
)
