'use client'
import { useEffect, useState, useCallback } from 'react'
import { useAppStore, type ModuleKey } from '@/lib/store'
import {
  CommandDialog, CommandEmpty, CommandGroup, CommandInput,
  CommandItem, CommandList, CommandSeparator, CommandShortcut,
} from '@/components/ui/command'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, CalendarCheck,
  Wallet, Megaphone, Library, Bus, FileText, BarChart3, Settings,
  Search, User, BookMarked, Megaphone as MegaphoneIcon, CornerDownLeft, HeartPulse, UsersRound, ClipboardList, CalendarDays, Scale,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { avatarColor, initials } from '@/lib/format'

interface SearchResult {
  students: Array<{ id: string; admissionNo: string; firstName: string; lastName: string; gender: string; stream?: string; classLevel?: string }>
  staff: Array<{ id: string; employeeNo: string; firstName: string; lastName: string; role: string; department?: string }>
  books: Array<{ id: string; title: string; author: string; category: string; available: number }>
  announcements: Array<{ id: string; title: string; body: string; audience: string; priority: string }>
}

const NAV_ITEMS: Array<{ key: ModuleKey; label: string; icon: any; group: string; shortcut?: string }> = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, group: 'Navigation', shortcut: 'G D' },
  { key: 'admissions', label: 'Admissions', icon: ClipboardList, group: 'Navigation', shortcut: 'G Q' },
  { key: 'students', label: 'Students', icon: Users, group: 'Navigation', shortcut: 'G S' },
  { key: 'staff', label: 'Staff & Teachers', icon: GraduationCap, group: 'Navigation', shortcut: 'G T' },
  { key: 'alumni', label: 'Alumni Network', icon: UsersRound, group: 'Navigation', shortcut: 'G U' },
  { key: 'academics', label: 'Academics', icon: BookOpen, group: 'Navigation', shortcut: 'G A' },
  { key: 'attendance', label: 'Attendance', icon: CalendarCheck, group: 'Navigation', shortcut: 'G V' },
  { key: 'reportcards', label: 'Report Cards', icon: FileText, group: 'Navigation', shortcut: 'G R' },
  { key: 'health', label: 'Health & Wellness', icon: HeartPulse, group: 'Navigation', shortcut: 'G H' },
  { key: 'events', label: 'Events & Activities', icon: CalendarDays, group: 'Navigation', shortcut: 'G E' },
  { key: 'discipline', label: 'Discipline & Behavior', icon: Scale, group: 'Navigation', shortcut: 'G X' },
  { key: 'finance', label: 'Finance & Fees', icon: Wallet, group: 'Navigation', shortcut: 'G F' },
  { key: 'communications', label: 'Communications', icon: Megaphone, group: 'Navigation', shortcut: 'G C' },
  { key: 'library', label: 'Library', icon: Library, group: 'Navigation', shortcut: 'G L' },
  { key: 'transport', label: 'Transport', icon: Bus, group: 'Navigation', shortcut: 'G B' },
  { key: 'reports', label: 'Reports & Analytics', icon: BarChart3, group: 'Navigation', shortcut: 'G P' },
  { key: 'settings', label: 'Settings', icon: Settings, group: 'Navigation', shortcut: 'G ,' },
]

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen, setActiveModule } = useAppStore()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult | null>(null)
  const [searching, setSearching] = useState(false)

  const runSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults(null); return }
    setSearching(true)
    try {
      const r = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`)
      if (r.ok) setResults(await r.json())
    } catch { /* ignore */ }
    setSearching(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => runSearch(query), 250)
    return () => clearTimeout(t)
  }, [query, runSearch])

  // Keyboard nav shortcuts G+letter
  useEffect(() => {
    let buffer = ''
    let timer: ReturnType<typeof setTimeout> | null = null
    const handler = (e: KeyboardEvent) => {
      if (commandPaletteOpen) return
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
      if (e.key === 'g') {
        buffer = 'g'
        if (timer) clearTimeout(timer)
        timer = setTimeout(() => { buffer = '' }, 800)
        return
      }
      if (buffer === 'g') {
        const map: Record<string, ModuleKey> = {
          d: 'dashboard', s: 'students', t: 'staff', a: 'academics',
          v: 'attendance', r: 'reportcards', f: 'finance', c: 'communications',
          l: 'library', b: 'transport', p: 'reports', ',': 'settings',
        }
        const mod = map[e.key.toLowerCase()]
        if (mod) { e.preventDefault(); setActiveModule(mod) }
        buffer = ''
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [commandPaletteOpen, setActiveModule])

  const goTo = (mod: ModuleKey) => {
    setActiveModule(mod)
    setCommandPaletteOpen(false)
    setQuery('')
  }

  const hasResults = results && (results.students.length || results.staff.length || results.books.length || results.announcements.length)

  return (
    <CommandDialog open={commandPaletteOpen} onOpenChange={setCommandPaletteOpen}>
      <CommandInput placeholder="Search students, staff, books, or jump to a module…" value={query} onValueChange={setQuery} />
      <CommandList className="max-h-[70vh]">
        <CommandEmpty>
          {searching ? 'Searching…' : query.length > 0 && query.length < 2 ? 'Keep typing…' : 'No results found.'}
        </CommandEmpty>

        {/* Navigation */}
        <CommandGroup heading="Navigation" className="[&_[cmdk-group-heading]]:text-emerald-700 dark:[&_[cmdk-group-heading]]:text-emerald-400">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            return (
              <CommandItem key={item.key} value={`${item.label} nav ${item.group}`} onSelect={() => goTo(item.key)} className="gap-2.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="flex-1">{item.label}</span>
                {item.shortcut && <CommandShortcut>{item.shortcut}</CommandShortcut>}
              </CommandItem>
            )
          })}
        </CommandGroup>

        {/* Search results */}
        {query.trim().length >= 2 && (
          <>
            {results?.students && results.students.length > 0 && (
              <CommandGroup heading={`Students (${results.students.length})`} className="[&_[cmdk-group-heading]]:text-teal-700 dark:[&_[cmdk-group-heading]]:text-teal-400">
                {results.students.map(s => (
                  <CommandItem key={s.id} value={`student ${s.firstName} ${s.lastName} ${s.admissionNo}`} onSelect={() => goTo('students')} className="gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className={cn('text-[9px] font-semibold text-white', avatarColor(`${s.firstName} ${s.lastName}`))}>
                        {initials(s.firstName, s.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.firstName} {s.lastName}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.admissionNo} · {s.classLevel} {s.stream}</p>
                    </div>
                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results?.staff && results.staff.length > 0 && (
              <CommandGroup heading={`Staff (${results.staff.length})`} className="[&_[cmdk-group-heading]]:text-cyan-700 dark:[&_[cmdk-group-heading]]:text-cyan-400">
                {results.staff.map(s => (
                  <CommandItem key={s.id} value={`staff ${s.firstName} ${s.lastName} ${s.employeeNo} ${s.role}`} onSelect={() => goTo('staff')} className="gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className={cn('text-[9px] font-semibold text-white', avatarColor(`${s.firstName} ${s.lastName}`))}>
                        {initials(s.firstName, s.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.firstName} {s.lastName}</p>
                      <p className="truncate text-xs text-muted-foreground">{s.employeeNo} · {s.role}{s.department ? ` · ${s.department}` : ''}</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results?.books && results.books.length > 0 && (
              <CommandGroup heading={`Library Books (${results.books.length})`} className="[&_[cmdk-group-heading]]:text-amber-700 dark:[&_[cmdk-group-heading]]:text-amber-400">
                {results.books.map(b => (
                  <CommandItem key={b.id} value={`book ${b.title} ${b.author} ${b.isbn}`} onSelect={() => goTo('library')} className="gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/10 text-amber-600">
                      <BookMarked className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{b.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{b.author} · {b.category} · {b.available} available</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {results?.announcements && results.announcements.length > 0 && (
              <CommandGroup heading={`Announcements (${results.announcements.length})`} className="[&_[cmdk-group-heading]]:text-violet-700 dark:[&_[cmdk-group-heading]]:text-violet-400">
                {results.announcements.map(a => (
                  <CommandItem key={a.id} value={`announcement ${a.title} ${a.body}`} onSelect={() => goTo('communications')} className="gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-500/10 text-violet-600">
                      <MegaphoneIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      <p className="truncate text-xs text-muted-foreground">{a.audience} · {a.body.slice(0, 60)}…</p>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {!hasResults && !searching && query.trim().length >= 2 && (
              <CommandEmpty>No matches for "{query}".</CommandEmpty>
            )}
          </>
        )}

        <CommandSeparator />
        <CommandGroup heading="Tips">
          <div className="px-3 py-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5"><CornerDownLeft className="h-3 w-3" /> Press <kbd className="rounded border bg-muted px-1">Enter</kbd> to select</div>
            <div className="mt-1 flex items-center gap-1.5"><Search className="h-3 w-3" /> Type <kbd className="rounded border bg-muted px-1">G</kbd> then a letter to jump to modules</div>
          </div>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
