'use client'
import { useAppStore } from '@/lib/store'
import { Menu, Search, Bell, Moon, Sun, Calendar, ChevronDown, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

const TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard', subtitle: 'School-wide overview & key metrics' },
  admissions: { title: 'Admissions', subtitle: 'Manage applications & enrollment pipeline' },
  students: { title: 'Students', subtitle: 'Manage admissions, profiles & enrollment' },
  staff: { title: 'Staff & Teachers', subtitle: 'Teaching and non-teaching personnel' },
  academics: { title: 'Academics', subtitle: 'Classes, subjects, exams & timetables' },
  attendance: { title: 'Attendance', subtitle: 'Daily attendance tracking & reports' },
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
  reports: { title: 'Reports & Analytics', subtitle: 'Performance insights & exports' },
  settings: { title: 'Settings', subtitle: 'System configuration' },
}

export function Header() {
  const { activeModule, toggleSidebar, setCommandPaletteOpen } = useAppStore()
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [today, setToday] = useState('')

  useEffect(() => {
    // use rAF to defer state updates out of the synchronous effect body
    const id = requestAnimationFrame(() => {
      setMounted(true)
      setToday(new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }))
    })
    return () => cancelAnimationFrame(id)
  }, [])

  // Global ⌘K / Ctrl+K shortcut to open command palette
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

  const meta = TITLES[activeModule] || TITLES.dashboard

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
        <h1 className="truncate text-lg font-bold tracking-tight md:text-xl">{meta.title}</h1>
        <p className="hidden truncate text-xs text-muted-foreground sm:block">{meta.subtitle}</p>
      </div>

      {/* Search — opens command palette */}
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

      {/* Date */}
      <div className="hidden items-center gap-2 rounded-lg border bg-muted/40 px-3 py-1.5 text-xs font-medium text-muted-foreground xl:flex">
        <Calendar className="h-3.5 w-3.5" />
        <span>{today}</span>
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

      {/* Notifications */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
            </span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel className="flex items-center justify-between">
            <span>Notifications</span>
            <Badge variant="secondary" className="text-[10px]">3 new</Badge>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex flex-col items-start gap-1 py-2">
            <span className="text-sm font-medium">Fee payment received</span>
            <span className="text-xs text-muted-foreground">M-Pesa payment of KES 45,000 from a parent</span>
            <span className="text-[10px] text-muted-foreground/70">2 minutes ago</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-col items-start gap-1 py-2">
            <span className="text-sm font-medium">New admission application</span>
            <span className="text-xs text-muted-foreground">Form 1 transfer request received</span>
            <span className="text-[10px] text-muted-foreground/70">15 minutes ago</span>
          </DropdownMenuItem>
          <DropdownMenuItem className="flex flex-col items-start gap-1 py-2">
            <span className="text-sm font-medium">Library book overdue</span>
            <span className="text-xs text-muted-foreground">5 books past due date</span>
            <span className="text-[10px] text-muted-foreground/70">1 hour ago</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* User */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 rounded-lg p-1 pr-2 transition-colors hover:bg-muted">
            <Avatar className="h-8 w-8 border-2 border-emerald-500/20">
              <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-semibold text-white">
                JA
              </AvatarFallback>
            </Avatar>
            <div className="hidden text-left sm:block">
              <div className="text-xs font-semibold leading-tight">James Atito</div>
              <div className="text-[10px] text-muted-foreground">Principal</div>
            </div>
            <ChevronDown className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Profile</DropdownMenuItem>
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Help & Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-rose-600 focus:text-rose-600">Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
