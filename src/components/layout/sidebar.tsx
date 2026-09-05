'use client'
import { useAppStore, type ModuleKey } from '@/lib/store'
import { useAuthStore, ROLE_INFO } from '@/lib/auth-store'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, CalendarCheck,
  Wallet, Megaphone, Library, Bus, BarChart3, Settings, X,
  School, ChevronRight, FileText, HeartPulse, UsersRound, ClipboardList, CalendarDays, Scale, Home, Package, UtensilsCrossed, ClipboardCheck,
  ShoppingCart, Building2, Banknote, Award,
  NotebookPen, PencilRuler,
  MessageSquare, IdCard,
  LogOut, Upload, PackagePlus,
  Shield, UserCheck, CalendarClock,
  Fingerprint, Navigation,
  Sparkles, CreditCard, Bell, TrendingUp,
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
  { key: 'staffapprovals', label: 'Staff Approvals', icon: UserCheck, group: 'People' },
  { key: 'alumni', label: 'Alumni Network', icon: UsersRound, group: 'People' },
  { key: 'academics', label: 'Academics', icon: BookOpen, group: 'Academic' },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck, group: 'Academic' },
  { key: 'biometric', label: 'Biometric', icon: Fingerprint, group: 'Academic' },
  { key: 'exams', label: 'Examinations', icon: ClipboardCheck, group: 'Academic' },
  { key: 'examanalytics', label: 'Exam Analytics', icon: BarChart3, group: 'Academic' },
  { key: 'reportcards', label: 'Report Cards', icon: FileText, group: 'Academic' },
  { key: 'lessonplans', label: 'Lesson Plans', icon: NotebookPen, group: 'Academic' },
  { key: 'homework', label: 'Homework & Assignments', icon: PencilRuler, group: 'Academic' },
  { key: 'timetable', label: 'Timetable', icon: CalendarClock, group: 'Academic' },
  { key: 'health', label: 'Health & Wellness', icon: HeartPulse, group: 'Academic' },
  { key: 'events', label: 'Events & Activities', icon: CalendarDays, group: 'Academic' },
  { key: 'discipline', label: 'Discipline', icon: Scale, group: 'Academic' },
  { key: 'hostel', label: 'Hostel & Boarding', icon: Home, group: 'Academic' },
  { key: 'finance', label: 'Finance & Fees', icon: Wallet, group: 'Administration' },
  { key: 'payroll', label: 'Payroll', icon: Banknote, group: 'Administration' },
  { key: 'appraisals', label: 'Staff Appraisals', icon: Award, group: 'Administration' },
  { key: 'communications', label: 'Communications', icon: Megaphone, group: 'Administration' },
  { key: 'library', label: 'Library', icon: Library, group: 'Administration' },
  { key: 'transport', label: 'Transport', icon: Bus, group: 'Administration' },
  { key: 'bustracking', label: 'Bus Tracking', icon: Navigation, group: 'Administration' },
  { key: 'notifications', label: 'Notifications', icon: MessageSquare, group: 'Administration' },
  { key: 'inventory', label: 'Inventory & Assets', icon: Package, group: 'Administration' },
  { key: 'cafeteria', label: 'Cafeteria & Meals', icon: UtensilsCrossed, group: 'Administration' },
  { key: 'procurement', label: 'Procurement', icon: ShoppingCart, group: 'Administration' },
  { key: 'facilities', label: 'Facility Booking', icon: Building2, group: 'Administration' },
  { key: 'feedback', label: 'Feedback & Surveys', icon: MessageSquare, group: 'Insights' },
  { key: 'aiassistant', label: 'AI Assistant', icon: Sparkles, group: 'Insights' },
  { key: 'idcards', label: 'ID Cards', icon: IdCard, group: 'Insights' },
  { key: 'dataimport', label: 'Data Import', icon: Upload, group: 'Insights' },
  { key: 'invrequests', label: 'Inventory Requests', icon: PackagePlus, group: 'Administration' },
  { key: 'reports', label: 'Reports', icon: BarChart3, group: 'Insights' },
  { key: 'feereminders', label: 'Fee Reminders', icon: Bell, group: 'Administration' },
  { key: 'documents', label: 'Documents', icon: FileText, group: 'Insights' },
  { key: 'analytics', label: 'Analytics', icon: TrendingUp, group: 'Insights' },
  // Super Admin module is intentionally NOT in the sidebar nav — it's only
  // accessible to the platform owner via the hidden Ctrl+Shift+A shortcut on
  // the login screen, and auto-loads when they log in.
  { key: 'subscriptions', label: 'Subscriptions', icon: CreditCard, group: 'Insights' },
  { key: 'settings', label: 'Settings', icon: Settings, group: 'Insights' },
]

export function Sidebar() {
  const { activeModule, setActiveModule, sidebarOpen, setSidebarOpen, academic } = useAppStore()
  const { user, hasAccess, logout } = useAuthStore()

  // Filter nav items by user role
  const visibleNav = user ? NAV.filter(n => hasAccess(n.key)) : NAV

  const groups = Array.from(new Set(visibleNav.map(n => n.group)))

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
            <div className="truncate text-base font-bold tracking-tight text-white">SkulHub</div>
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
                {visibleNav.filter(n => n.group === group).map((item) => {
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

        {/* Footer card — current user + logout */}
        <div className="border-t border-sidebar-border p-3">
          <div className="rounded-xl bg-sidebar-accent/60 p-3.5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                <GraduationCap className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-xs font-semibold text-white">{academic.currentTerm}, {academic.academicYear}</div>
                <div className="truncate text-[10px] text-sidebar-foreground/50">In Session · 252 learners</div>
              </div>
            </div>
          </div>
          {user && (
            <button
              onClick={() => { logout(); setSidebarOpen(false) }}
              className="mt-2 flex w-full items-center gap-2.5 rounded-xl border border-sidebar-border bg-sidebar-accent/30 p-2.5 text-left transition-colors hover:bg-sidebar-accent/60"
            >
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-semibold text-white')}>
                {user.avatar}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-white">{user.name}</p>
                <p className="truncate text-[10px] text-sidebar-foreground/60">{ROLE_INFO[user.role]?.label}</p>
              </div>
              <LogOut className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/60" />
            </button>
          )}
        </div>
      </aside>
    </>
  )
}
