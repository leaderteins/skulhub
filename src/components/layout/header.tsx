'use client'
import { useAppStore } from '@/lib/store'
import { useAuthStore, ROLE_INFO } from '@/lib/auth-store'
import { Menu, Search, Bell, Moon, Sun, Calendar, ChevronDown, Command, Clock, LogOut, User as UserIcon, Settings as SettingsIcon, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { useRealtimeNotifications } from '@/hooks/use-realtime-notifications'

const TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'School-wide overview & key metrics' },
  admissions: { title: 'Admissions', subtitle: 'Manage applications & enrollment pipeline' },
  students: { title: 'Students', subtitle: 'Manage admissions, profiles & enrollment' },
  staff: { title: 'Staff & Teachers', subtitle: 'Teaching and non-teaching personnel' },
  staffapprovals: { title: 'Staff Approvals', subtitle: 'Review pending staff self-registration requests' },
  academics: { title: 'Academics', subtitle: 'Classes, subjects, exams & timetables' },
  attendance: { title: 'Attendance', subtitle: 'Daily attendance tracking & reports' },
  exams: { title: 'Examinations', subtitle: 'Question banks, CATs & grading rubrics' },
  reportcards: { title: 'Report Cards', subtitle: 'Generate & print student term reports' },
  health: { title: 'Health & Wellness', subtitle: 'Student medical records & clinic visits' },
  events: { title: 'Events & Activities', subtitle: 'Calendar, sports, cultural & trips' },
  discipline: { title: 'Discipline & Behavior', subtitle: 'Incidents, conduct & sanctions' },
  hostel: { title: 'Hostel & Boarding', subtitle: 'Dormitories, beds & inspections' },
  alumni: { title: 'Alumni Network', subtitle: 'Graduates, careers & donations' },
  finance: { title: 'Finance & Fees', subtitle: 'Invoices, payments & expenses' },
  communications: { title: 'Communications', subtitle: 'Announcements & notifications' },
  library: { title: 'Library', subtitle: 'Books, borrowing & returns' },
  transport: { title: 'Transport', subtitle: 'Routes, vehicles & drivers' },
  inventory: { title: 'Inventory & Assets', subtitle: 'Equipment, furniture & maintenance' },
  cafeteria: { title: 'Cafeteria & Meals', subtitle: 'Menu, meal plans & dining attendance' },
  procurement: { title: 'Procurement', subtitle: 'Suppliers, purchase orders & deliveries' },
  facilities: { title: 'Facility Booking', subtitle: 'Halls, labs, grounds & reservations' },
  dataimport: { title: 'Data Import & Migration', subtitle: 'Bulk import existing school data' },
  invrequests: { title: 'Inventory Requests', subtitle: 'Staff request items from the store' },
  reports: { title: 'Reports & Analytics', subtitle: 'Performance insights & exports' },
  biometric: { title: 'Biometric Attendance', subtitle: 'Fingerprint & RFID taps from gates and buses' },
  bustracking: { title: 'Live Bus Tracking', subtitle: 'Real-time student boarding & alighting' },
  notifications: { title: 'Notifications Center', subtitle: 'Live in-app notifications & activity feed' },
  examanalytics: { title: 'Exam Analytics', subtitle: 'KCSE performance insights & rankings' },
  aiassistant: { title: 'AI Assistant', subtitle: 'AI-powered tools for parents, teachers & admins' },
  superadmin: { title: 'Super Admin', subtitle: 'Platform-wide school management & analytics' },
  settings: { title: 'Settings', subtitle: 'System configuration' },
}

// ---------------------------------------------------------------------------
// Lightweight notification fetcher for the header dropdown
// ---------------------------------------------------------------------------
interface HeaderNotification {
  id: string
  type: string
  priority: string
  title: string
  message: string
  readAt: string | null
  createdAt: string
}

const TYPE_DOT: Record<string, string> = {
  fee: 'bg-emerald-500',
  attendance: 'bg-teal-500',
  exam: 'bg-cyan-500',
  discipline: 'bg-rose-500',
  system: 'bg-slate-500',
  message: 'bg-amber-500',
}

export function Header() {
  const { activeModule, toggleSidebar, setCommandPaletteOpen, academic, unreadNotifications, notificationPulse, clearNotificationPulse } = useAppStore()
  const { user, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [now, setNow] = useState(new Date())
  const [recent, setRecent] = useState<HeaderNotification[]>([])
  const [loadingRecent, setLoadingRecent] = useState(false)

  // Mount the realtime notifications hook — wires up socket.io, sonner toasts,
  // and the global unread counter. One mount per signed-in user.
  useRealtimeNotifications()

  // Live clock — updates every second
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Mount flag for theme
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // Global ⌘K / Ctrl+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [setCommandPaletteOpen])

  // Auto-clear the pulse flag after the bell animation has had a chance to
  // play (1.5s). The Header consumes the flag here so the bell can be
  // triggered again on the next notification.
  useEffect(() => {
    if (notificationPulse) {
      const id = setTimeout(() => clearNotificationPulse(), 1500)
      return () => clearTimeout(id)
    }
  }, [notificationPulse, clearNotificationPulse])

  // Refetch the header dropdown's recent notifications whenever the
  // 'notifications:refetch' custom event is dispatched (sent by the realtime
  // hook when a new notification arrives).
  const fetchRecent = async () => {
    setLoadingRecent(true)
    try {
      const res = await fetch('/api/notifications?limit=6')
      if (res.ok) {
        const data = await res.json()
        const list = (data?.notifications ?? []) as HeaderNotification[]
        setRecent(list.slice(0, 6))
        useAppStore.getState().setUnreadNotifications(data?.stats?.unread ?? 0)
      }
    } catch {
      // Silent — header dropdown is best-effort
    } finally {
      setLoadingRecent(false)
    }
  }
  useEffect(() => {
    if (!user) return
    fetchRecent()
    const handler = () => fetchRecent()
    window.addEventListener('notifications:refetch', handler)
    return () => window.removeEventListener('notifications:refetch', handler)
  }, [user?.id])

  const meta = TITLES[activeModule] || TITLES.dashboard
  const roleInfo = user ? ROLE_INFO[user.role] : null
  const timeStr = now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  const dateStr = now.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const unread = unreadNotifications || 0
  const hasUnread = unread > 0

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'school' }),
      })
      useAppStore.getState().clearUnreadNotifications()
      fetchRecent()
    } catch {}
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={toggleSidebar}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="truncate text-lg font-bold tracking-tight md:text-xl">{meta.title}</h1>
          <Badge variant="outline" className="hidden shrink-0 border-emerald-300 bg-emerald-50/50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400 sm:inline-flex">
            <Calendar className="mr-1 h-3 w-3" /> {academic.currentTerm}, {academic.academicYear}
          </Badge>
        </div>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">{meta.subtitle}</p>
      </div>

      {/* Search */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="relative hidden items-center gap-2 rounded-lg border border-input bg-muted/30 px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted md:flex md:w-56 lg:w-72"
        aria-label="Open search"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left">Search students, staff…</span>
        <kbd className="pointer-events-none hidden select-none items-center gap-0.5 rounded border bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground lg:inline-flex">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      {/* Live clock + date */}
      <div className="hidden items-center gap-2.5 rounded-lg border bg-gradient-to-r from-emerald-50/50 to-teal-50/50 px-3 py-1.5 dark:from-emerald-950/20 dark:to-teal-950/20 md:flex">
        <div className="flex items-center gap-1.5 border-r pr-2.5 text-emerald-600 dark:text-emerald-400">
          <Clock className="h-3.5 w-3.5" />
          <span className="font-mono text-sm font-semibold tabular-nums">{timeStr}</span>
        </div>
        <div className="hidden items-center gap-1.5 text-xs font-medium text-muted-foreground xl:flex">
          <Calendar className="h-3.5 w-3.5" />
          <span>{dateStr}</span>
        </div>
      </div>

      {/* Theme toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        aria-label="Toggle theme"
        className="relative"
      >
        {mounted && theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      {/* Notifications bell — live unread count + pulse */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            aria-label={`Notifications (${unread} unread)`}
          >
            <Bell className={cn('h-5 w-5 transition-transform', notificationPulse && 'scale-110 text-emerald-600 dark:text-emerald-400')} />
            {hasUnread && (
              <span className="absolute -right-0.5 -top-0.5 flex min-h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-background">
                {unread > 99 ? '99+' : unread}
                {notificationPulse && (
                  <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-rose-400 opacity-75" />
                )}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 p-0">
          <div className="flex items-center justify-between border-b px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold">Notifications</span>
              {hasUnread && (
                <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400">
                  {unread} new
                </Badge>
              )}
            </div>
            {hasUnread && (
              <button
                onClick={markAllRead}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 dark:text-emerald-400"
              >
                <Check className="h-3 w-3" /> Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loadingRecent && recent.length === 0 ? (
              <div className="space-y-2 p-2">
                {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
              </div>
            ) : recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-1 px-4 py-10 text-center">
                <Bell className="h-6 w-6 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">You're all caught up</p>
                <p className="text-xs text-muted-foreground/70">New notifications will appear here in real-time.</p>
              </div>
            ) : (
              recent.map((n) => (
                <DropdownMenuItem
                  key={n.id}
                  className="flex flex-col items-start gap-1 px-3 py-2.5 focus:bg-emerald-50/50 dark:focus:bg-emerald-950/20"
                >
                  <div className="flex w-full items-start gap-2">
                    <span className={cn('mt-1 h-2 w-2 shrink-0 rounded-full', TYPE_DOT[n.type] || 'bg-slate-400')} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{n.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground/70">
                        {new Date(n.createdAt).toLocaleString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true, day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))
            )}
          </div>
          <div className="border-t p-1.5">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                useAppStore.getState().setActiveModule('notifications')
              }}
              className="block rounded-md px-3 py-1.5 text-center text-xs font-semibold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
            >
              View all notifications →
            </a>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User — dynamic from auth store */}
      {user && roleInfo && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-muted">
              <Avatar className="h-8 w-8 border-2 border-emerald-500/20">
                <AvatarFallback className={cn('bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-semibold text-white')}>
                  {user.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="hidden text-left sm:block">
                <div className="text-xs font-semibold leading-tight">{user.name}</div>
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span>{roleInfo.icon}</span>
                  <span>{roleInfo.label}</span>
                </div>
              </div>
              <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold">{user.name}</span>
                <span className="text-xs font-normal text-muted-foreground">{user.email}</span>
                <Badge variant="outline" className={cn('mt-1 w-fit text-[10px]', roleInfo.bg, roleInfo.color)}>
                  {roleInfo.icon} {roleInfo.label}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem><UserIcon className="mr-2 h-4 w-4" /> My Profile</DropdownMenuItem>
            <DropdownMenuItem><SettingsIcon className="mr-2 h-4 w-4" /> Settings</DropdownMenuItem>
            <DropdownMenuItem>Help & Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={logout}>
              <LogOut className="mr-2 h-4 w-4" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </header>
  )
}
