'use client'
import { useState } from 'react'
import { useFetch, apiPost, apiPut, apiDelete } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { formatDate, formatDateTime, timeAgo, statusColor } from '@/lib/format'
import { toast } from 'sonner'
import {
  CalendarDays, Plus, ChevronLeft, ChevronRight, MapPin, User, Users,
  Clock, Trophy, BookOpen, Music, Bus, PartyPopper, FileText, Bell,
  LayoutGrid, List, X, CheckCircle2, Calendar,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

interface EventsData {
  stats: { total: number; scheduled: number; ongoing: number; completed: number; cancelled: number; thisWeek: number }
  events: Array<{
    id: string; title: string; description: string | null; category: string
    startDate: string; endDate: string | null; allDay: boolean; location: string | null
    organizer: string | null; audience: string; status: string; priority: string; color: string
    participantCount: number; confirmedCount: number
    participants: Array<{ id: string; name: string; role: string; status: string }>
  }>
  byCategory: Array<{ name: string; count: number }>
  byStatus: Array<{ name: string; count: number }>
  upcoming: Array<{ id: string; title: string; startDate: string; endDate: string | null; category: string; location: string | null; color: string }>
}

const CATEGORY_META: Record<string, { color: string; bg: string; text: string; dot: string; icon: any }> = {
  Academic: { color: 'emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: '#10b981', icon: BookOpen },
  Sports: { color: 'amber', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: '#f59e0b', icon: Trophy },
  Cultural: { color: 'rose', bg: 'bg-rose-500/10', text: 'text-rose-600', dot: '#f43f5e', icon: Music },
  Meeting: { color: 'violet', bg: 'bg-violet-500/10', text: 'text-violet-600', dot: '#8b5cf6', icon: Users },
  Trip: { color: 'teal', bg: 'bg-teal-500/10', text: 'text-teal-600', dot: '#14b8a6', icon: Bus },
  Holiday: { color: 'cyan', bg: 'bg-cyan-500/10', text: 'text-cyan-600', dot: '#06b6d4', icon: PartyPopper },
  Exam: { color: 'red', bg: 'bg-rose-500/10', text: 'text-rose-600', dot: '#ef4444', icon: FileText },
  General: { color: 'slate', bg: 'bg-slate-500/10', text: 'text-slate-600', dot: '#64748b', icon: Bell },
}

const STATUS_COLORS: Record<string, string> = {
  Scheduled: '#10b981', Ongoing: '#f59e0b', Completed: '#64748b', Cancelled: '#ef4444', Postponed: '#8b5cf6',
}

export function EventsModule() {
  const { data, loading } = useFetch<EventsData>('/api/events')
  const [view, setView] = useState<'calendar' | 'list'>('calendar')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const params = new URLSearchParams()
  if (categoryFilter !== 'all') params.set('category', categoryFilter)
  if (statusFilter !== 'all') params.set('status', statusFilter)
  const { data: filtered } = useFetch<EventsData>(`/api/events?${params.toString()}`, [categoryFilter, statusFilter])

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  const display = filtered || data!
  const stats = display.stats

  // Calendar logic
  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startWeekday = firstDay.getDay() // 0 = Sunday
  const monthName = currentMonth.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })

  const eventsByDate: Record<string, typeof display.events> = {}
  display.events.forEach(e => {
    const dateKey = new Date(e.startDate).toISOString().slice(0, 10)
    if (!eventsByDate[dateKey]) eventsByDate[dateKey] = []
    eventsByDate[dateKey].push(e)
  })

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-600 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <CalendarDays className="h-3 w-3" /> {stats.total} events · {stats.thisWeek} this week
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Events & Activities</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              School calendar — academic, sports, cultural, trips, meetings & community events.
            </p>
          </div>
          <Button variant="secondary" size="sm" className="bg-white text-violet-600 hover:bg-white/90" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Event
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Events</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Scheduled</p>
              <p className="text-2xl font-bold">{stats.scheduled}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold">{stats.thisWeek}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Completed</p>
              <p className="text-2xl font-bold">{stats.completed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts + upcoming */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Category distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Events by Category</CardTitle>
            <CardDescription className="text-xs">Distribution across types</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={display.byCategory} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {display.byCategory.map(c => <Cell key={c.name} fill={CATEGORY_META[c.name]?.dot || '#94a3b8'} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-2 text-[10px]">
              {display.byCategory.map(c => {
                const Icon = CATEGORY_META[c.name]?.icon || Bell
                return (
                  <div key={c.name} className="flex items-center gap-1">
                    <Icon className="h-2.5 w-2.5" style={{ color: CATEGORY_META[c.name]?.dot }} />
                    <span className="font-medium">{c.name}</span><span className="text-muted-foreground">{c.count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming events list */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-violet-500" />
              <CardTitle className="text-base">Upcoming Events</CardTitle>
            </div>
            <CardDescription className="text-xs">Next scheduled activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {display.upcoming.length > 0 ? display.upcoming.map(e => {
              const meta = CATEGORY_META[e.category] || CATEGORY_META.General
              const Icon = meta.icon
              const evDate = new Date(e.startDate)
              return (
                <div key={e.id} className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/40 cursor-pointer" onClick={() => setSelectedEvent(e.id)}>
                  <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border" style={{ borderColor: meta.dot, backgroundColor: `${meta.dot}15` }}>
                    <span className="text-[9px] font-semibold uppercase" style={{ color: meta.dot }}>{evDate.toLocaleDateString('en-KE', { month: 'short' })}</span>
                    <span className="text-base font-bold leading-none" style={{ color: meta.dot }}>{evDate.getDate()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.title}</p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <Icon className="h-2.5 w-2.5" /><span>{e.category}</span>
                      {e.location && <><span>·</span><MapPin className="h-2.5 w-2.5" /><span className="truncate">{e.location}</span></>}
                    </div>
                  </div>
                  <span className="shrink-0 text-[10px] text-muted-foreground">
                    {e.allDay ? 'All day' : evDate.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )
            }) : <p className="py-4 text-center text-xs text-muted-foreground">No upcoming events.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Filters + view toggle */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.keys(CATEGORY_META).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Scheduled">Scheduled</SelectItem>
              <SelectItem value="Ongoing">Ongoing</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
              <SelectItem value="Postponed">Postponed</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <div className="flex rounded-lg border bg-muted/40 p-0.5">
            <Button variant={view === 'calendar' ? 'default' : 'ghost'} size="sm" className="h-8" onClick={() => setView('calendar')}>
              <Calendar className="h-4 w-4" />
            </Button>
            <Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" className="h-8" onClick={() => setView('list')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Calendar or List view */}
      {view === 'calendar' ? (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="text-lg">{monthName}</CardTitle>
              <CardDescription className="text-xs">{display.events.length} events this filter</CardDescription>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-8" onClick={() => setCurrentMonth(new Date())}>Today</Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Weekday headers */}
            <div className="grid grid-cols-7 gap-1 mb-1">
              {weekdays.map(d => (
                <div key={d} className="py-2 text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{d}</div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {/* Empty cells before first day */}
              {Array.from({ length: startWeekday }).map((_, i) => (
                <div key={`empty-${i}`} className="min-h-[88px] rounded-lg bg-muted/20" />
              ))}
              {/* Days */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateKey = new Date(year, month, day).toISOString().slice(0, 10)
                const dayEvents = eventsByDate[dateKey] || []
                const isToday = new Date().toDateString() === new Date(year, month, day).toDateString()
                return (
                  <div key={day} className={cn(
                    'min-h-[88px] rounded-lg border p-1 transition-colors hover:border-violet-300 dark:hover:border-violet-700',
                    isToday && 'border-violet-400 bg-violet-50/50 dark:bg-violet-950/20',
                    dayEvents.length === 0 && 'bg-muted/10'
                  )}>
                    <div className={cn('mb-1 text-xs font-semibold', isToday ? 'flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white' : 'text-muted-foreground')}>
                      {day}
                    </div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(e => {
                        const meta = CATEGORY_META[e.category] || CATEGORY_META.General
                        return (
                          <button
                            key={e.id}
                            onClick={() => setSelectedEvent(e.id)}
                            className={cn('block w-full truncate rounded px-1 py-0.5 text-left text-[9px] font-medium transition-all hover:scale-105', meta.bg, meta.text)}
                            title={e.title}
                          >
                            <span className="mr-0.5 inline-block h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
                            {e.allDay ? '' : new Date(e.startDate).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' }) + ' '}
                            {e.title}
                          </button>
                        )
                      })}
                      {dayEvents.length > 3 && (
                        <p className="px-1 text-[9px] text-muted-foreground">+{dayEvents.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {display.events.map(e => {
            const meta = CATEGORY_META[e.category] || CATEGORY_META.General
            const Icon = meta.icon
            return (
              <Card key={e.id} className="stat-card cursor-pointer transition-all hover:shadow-md" onClick={() => setSelectedEvent(e.id)}>
                <CardContent className="flex items-start gap-4 p-4">
                  <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl border" style={{ borderColor: meta.dot, backgroundColor: `${meta.dot}15` }}>
                    <Icon className="h-5 w-5" style={{ color: meta.dot }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{e.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{formatDateTime(e.startDate)} {e.endDate && !e.allDay ? `→ ${new Date(e.endDate).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}` : ''}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-1">
                        <Badge variant="outline" className={cn('text-[10px]', meta.text)}>{e.category}</Badge>
                        <Badge variant="secondary" className={cn('text-[10px]', statusColor(e.status))}>{e.status}</Badge>
                      </div>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
                      {e.location && <span className="flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />{e.location}</span>}
                      {e.organizer && <span className="flex items-center gap-1"><User className="h-2.5 w-2.5" />{e.organizer}</span>}
                      <span className="flex items-center gap-1"><Users className="h-2.5 w-2.5" />{e.confirmedCount}/{e.participantCount} confirmed</span>
                      <Badge variant="outline" className="text-[10px]">{e.audience}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
          {display.events.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                <CalendarDays className="h-8 w-8" />
                <p>No events match your filters.</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Detail dialog */}
      {selectedEvent && <EventDetailDialog eventId={selectedEvent} onClose={() => setSelectedEvent(null)} />}
      {/* Add dialog */}
      {showAddDialog && <AddEventDialog onClose={() => setShowAddDialog(false)} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Event Detail Dialog
// ---------------------------------------------------------------------------
function EventDetailDialog({ eventId, onClose }: { eventId: string; onClose: () => void }) {
  const { data: event, loading } = useFetch<any>(`/api/events/${eventId}`)

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto scrollbar-thin">
        {loading || !event ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-violet-500" /> Event Details
              </DialogTitle>
              <DialogDescription>{event.title}</DialogDescription>
            </DialogHeader>

            {/* Event header */}
            <div className="rounded-xl bg-gradient-to-r from-violet-50 to-purple-50 p-4 dark:from-violet-950/30 dark:to-purple-950/30">
              <div className="flex items-start gap-3">
                {(() => {
                  const meta = CATEGORY_META[event.category] || CATEGORY_META.General
                  const Icon = meta.icon
                  return (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border" style={{ borderColor: meta.dot, backgroundColor: `${meta.dot}15` }}>
                      <Icon className="h-6 w-6" style={{ color: meta.dot }} />
                    </div>
                  )
                })()}
                <div className="min-w-0 flex-1">
                  <p className="text-base font-bold">{event.title}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-[10px]">{event.category}</Badge>
                    <Badge variant="secondary" className={cn('text-[10px]', statusColor(event.status))}>{event.status}</Badge>
                    <Badge variant="outline" className="text-[10px]">{event.priority} Priority</Badge>
                    <Badge variant="outline" className="text-[10px]">{event.audience}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border p-3">
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><Calendar className="h-3 w-3" /> Date & Time</p>
                <p className="text-sm font-medium">{formatDate(event.startDate)}</p>
                {event.endDate && !event.allDay && <p className="text-xs text-muted-foreground">{new Date(event.startDate).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })} — {new Date(event.endDate).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</p>}
                {event.allDay && <p className="text-xs text-muted-foreground">All day event</p>}
              </div>
              <div className="rounded-xl border p-3">
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><MapPin className="h-3 w-3" /> Location</p>
                <p className="text-sm font-medium">{event.location || 'TBD'}</p>
              </div>
              {event.organizer && (
                <div className="rounded-xl border p-3">
                  <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><User className="h-3 w-3" /> Organizer</p>
                  <p className="text-sm font-medium">{event.organizer}</p>
                </div>
              )}
              <div className="rounded-xl border p-3">
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"><Users className="h-3 w-3" /> Participants</p>
                <p className="text-sm font-medium">{event.participants.filter((p: any) => p.status === 'Confirmed' || p.status === 'Attended').length} confirmed of {event.participants.length}</p>
              </div>
            </div>

            {/* Description */}
            {event.description && (
              <div className="rounded-xl border-l-4 border-violet-400 bg-violet-50/50 p-4 dark:bg-violet-950/20">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400">Description</p>
                <p className="text-sm">{event.description}</p>
              </div>
            )}

            {/* Participants */}
            {event.participants.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Participants ({event.participants.length})</p>
                <div className="max-h-40 space-y-1.5 overflow-y-auto scrollbar-thin pr-1">
                  {event.participants.map((p: any) => (
                    <div key={p.id} className="flex items-center justify-between rounded-lg border p-2 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.name}</span>
                        <Badge variant="outline" className="text-[10px]">{p.role}</Badge>
                      </div>
                      <Badge variant="secondary" className={cn('text-[10px]', statusColor(p.status))}>{p.status}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => { apiPut(`/api/events/${eventId}`, { status: 'Completed' }).then(() => { toast.success('Marked as completed'); onClose() }) }}>
                <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark Completed
              </Button>
              <Button size="sm" variant="outline" onClick={() => { apiPut(`/api/events/${eventId}`, { status: 'Cancelled' }).then(() => { toast.success('Event cancelled'); onClose() }) }}>
                Cancel Event
              </Button>
              <Button size="sm" variant="destructive" onClick={() => { apiDelete(`/api/events/${eventId}`).then(() => { toast.success('Event deleted'); onClose() }) }}>
                <X className="mr-1 h-3.5 w-3.5" /> Delete
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Add Event Dialog
// ---------------------------------------------------------------------------
function AddEventDialog({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    title: '', description: '', category: 'General', startDate: '', endDate: '',
    allDay: false, location: '', organizer: '', audience: 'All', priority: 'Normal', color: 'emerald',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.title || !form.startDate) { toast.error('Title and start date are required'); return }
    setSaving(true)
    try {
      await apiPost('/api/events', { ...form, status: 'Scheduled' })
      toast.success('Event created successfully')
      onClose()
    } catch (e: any) { toast.error(e?.message || 'Failed to create event') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-violet-500" /> New Event</DialogTitle>
          <DialogDescription>Schedule a new school event or activity</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Inter-House Athletics" className="mt-1" /></div>
          <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Category</Label><Select value={form.category} onValueChange={v => setForm({ ...form, category: v, color: CATEGORY_META[v]?.color || 'emerald' })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(CATEGORY_META).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Audience</Label><Select value={form.audience} onValueChange={v => setForm({ ...form, audience: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="All">All</SelectItem><SelectItem value="Students">Students</SelectItem><SelectItem value="Staff">Staff</SelectItem><SelectItem value="Parents">Parents</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Start Date & Time *</Label><Input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">End Date & Time</Label><Input type="datetime-local" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={form.allDay} onCheckedChange={v => setForm({ ...form, allDay: v })} id="allDay" />
            <Label htmlFor="allDay" className="text-xs cursor-pointer">All-day event</Label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="e.g. School Hall" className="mt-1" /></div>
            <div><Label className="text-xs">Organizer</Label><Input value={form.organizer} onChange={e => setForm({ ...form, organizer: e.target.value })} placeholder="e.g. Games Department" className="mt-1" /></div>
          </div>
          <div><Label className="text-xs">Priority</Label><Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Normal">Normal</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent></Select></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving} className="bg-violet-600 hover:bg-violet-700">{saving ? 'Creating...' : 'Create Event'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
