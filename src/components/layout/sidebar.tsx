'use client'
import { useAppStore, type ModuleKey } from '@/lib/store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, CalendarCheck,
  Wallet, Megaphone, Library, Bus, BarChart3, Settings, X,
  School, ChevronRight, FileText, HeartPulse, UsersRound, ClipboardList, CalendarDays,
} from 'lucide-react'

interface NavItem {
  key: ModuleKey
  label: string
  icon: React.ComponentType<{ className?: string }>
  group: string
}

const NAV: NavItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Overview' },
  { key: 'admissions', label: 'Admissions', icon: ClipboardList, group: 'People' },
  { key: 'students', label: 'Students', icon: Users, group: 'People' },
  { key: 'staff', label: 'Staff & Teachers', icon: GraduationCap, group: 'People' },
  { key: 'alumni', label: 'Alumni Network', icon: UsersRound, group: 'People' },
  { key: 'academics', label: 'Academics', icon: BookOpen, group: 'Academic' },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck, group: 'Academic' },
  { key: 'reportcards', label: 'Report Cards', icon: FileText, group: 'Academic' },
  { key: 'health', label: 'Health & Wellness', icon: HeartPulse, group: 'Academic' },
  { key: 'events', label: 'Events & Activities', icon: CalendarDays, group: 'Academic' },
  { key: 'finance', label: 'Finance & Fees', icon: Wallet, group: 'Administration' },
  { key: 'communications', label: 'Communications', icon: Megaphone, group: 'Administration' },
  { key: 'library', label: 'Library', icon: Library, group: 'Administration' },
  { key: 'transport', label: 'Transport', icon: Bus, group: 'Administration' },
  { key: 'reports', label: 'Reports', icon: BarChart3, group: 'Insights' },
  { key: 'settings', label: 'Settings', icon: Settings, group: 'Insights' },
]

export function Sidebar() {
  const { activeModule, setActiveModule, sidebarOpen, setSidebarOpen } = useAppStore()

  const groups = Array.from(new Set(NAV.map(n => n.group)))

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-300 lg:translate-x-0 lg:static lg:z-auto',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand */}
        <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
            <School className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-base font-bold tracking-tight text-white">EduManage Pro</div>
            <div className="truncate text-[11px] text-sidebar-foreground/60">School Management System</div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-sidebar-foreground/70 hover:bg-sidebar-accent lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-5 overflow-y-auto scrollbar-thin px-3 py-4">
          {groups.map((group) => (
            <div key={group}>
              <div className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/40">
                {group}
              </div>
              <div className="space-y-0.5">
                {NAV.filter(n => n.group === group).map((item) => {
                  const Icon = item.icon
                  const active = activeModule === item.key
                  return (
                    <button
                      key={item.key}
                      onClick={() => setActiveModule(item.key)}
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                        active
                          ? 'sidebar-link-active'
                          : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-white'
                      )}
                    >
                      <Icon className={cn('h-[18px] w-[18px] shrink-0 transition-transform', active ? '' : 'group-hover:scale-110')} />
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      {active && <ChevronRight className="h-4 w-4 opacity-70" />}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer card */}
        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-xl bg-sidebar-accent/60 p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-white">Term 1, 2025</div>
                <div className="truncate text-[10px] text-sidebar-foreground/50">In Session · 252 learners</div>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
