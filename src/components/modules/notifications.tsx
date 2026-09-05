'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Bell, Inbox, AlertTriangle, CalendarClock, CheckCheck, Trash2,
  Search, Filter, MoreHorizontal, Check, Archive, Sparkles, Activity,
  Wallet, ClipboardList, FileEdit, ShieldAlert, Server, MessageCircle,
  ChevronUp, ChevronDown, Radio, Wifi, WifiOff, RefreshCw,
} from 'lucide-react'
import { timeAgo, cn } from '@/lib/format'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface AppNotificationDTO {
  id: string
  schoolId: string | null
  userId: string | null
  role: string | null
  type: string         // fee | attendance | exam | discipline | system | message
  priority: string     // low | normal | high | urgent
  title: string
  message: string
  metadata: Record<string, unknown> | null
  readAt: string | null
  archivedAt: string | null
  createdAt: string
}

interface NotificationsResponse {
  notifications: AppNotificationDTO[]
  stats: {
    total: number
    unread: number
    actionRequired: number
    today: number
    byType: Record<string, number>
  }
  byDay: Array<{ label: string; count: number }>
  viewer: { userId: string | null; role: string | null; schoolId: string | null }
}

// ---------------------------------------------------------------------------
// Palette — same emerald/teal/amber/rose/slate as SuperAdminModule
// ---------------------------------------------------------------------------
const TYPE_META: Record<string, {
  label: string
  icon: React.ComponentType<{ className?: string }>
  color: string       // hex (for recharts)
  chip: string        // tailwind classes
}> = {
  fee: { label: 'Fees', icon: Wallet, color: '#059669', chip: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20' },
  attendance: { label: 'Attendance', icon: ClipboardList, color: '#14b8a6', chip: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 ring-teal-500/20' },
  exam: { label: 'Exams', icon: FileEdit, color: '#06b6d4', chip: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 ring-cyan-500/20' },
  discipline: { label: 'Discipline', icon: ShieldAlert, color: '#f43f5e', chip: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-rose-500/20' },
  system: { label: 'System', icon: Server, color: '#64748b', chip: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 ring-slate-500/20' },
  message: { label: 'Messages', icon: MessageCircle, color: '#f59e0b', chip: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20' },
}

const PRIORITY_META: Record<string, { label: string; dot: string; chip: string }> = {
  low: { label: 'Low', dot: 'bg-slate-400', chip: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 ring-slate-200 dark:ring-slate-700' },
  normal: { label: 'Normal', dot: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-900' },
  high: { label: 'High', dot: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 ring-amber-200 dark:ring-amber-900' },
  urgent: { label: 'Urgent', dot: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 ring-rose-200 dark:ring-rose-900' },
}

// ---------------------------------------------------------------------------
// Small visual helpers (mirrors the SuperAdminModule aesthetic)
// ---------------------------------------------------------------------------
function Sparkline({ data, color }: { data: number[]; color: string }) {
  if (!data.length) return <div className="h-10 w-full" />
  const chartData = data.map((v, i) => ({ i, v }))
  const id = `notif-spark-${color.replace('#', '')}-${Math.random().toString(36).slice(2, 8)}`
  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            isAnimationActive={false}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function DeltaPill({ delta, label }: { delta: number | null; label?: string }) {
  if (delta === null || !isFinite(delta)) return null
  const up = delta >= 0
  return (
    <span className={cn(
      'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold',
      up ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400',
    )}>
      {up ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      {Math.abs(delta).toFixed(0)}
      {label && <span className="ml-1 font-normal opacity-70">{label}</span>}
    </span>
  )
}

function EmptyChartState({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center">
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
        <Activity className="h-5 w-5 text-muted-foreground" />
      </div>
      <p className="text-xs text-muted-foreground">{message}</p>
    </div>
  )
}

function HeroKpi({ icon, label, value, accent }: {
  icon: React.ReactNode
  label: string
  value: string
  accent: 'emerald' | 'teal' | 'amber' | 'rose'
}) {
  const a: Record<string, string> = {
    emerald: 'text-emerald-300',
    teal: 'text-teal-300',
    amber: 'text-amber-300',
    rose: 'text-rose-300',
  }
  return (
    <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 backdrop-blur">
      <div className={cn('flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider', a[accent])}>
        {icon}
        {label}
      </div>
      <div className="mt-1 text-xl font-bold text-white">{value}</div>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent, sub, spark, sparkColor, delta }: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  accent: 'emerald' | 'teal' | 'amber' | 'rose'
  sub?: string
  spark: number[]
  sparkColor: string
  delta?: number | null
}) {
  const a: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
    teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 ring-teal-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 ring-rose-500/20',
  }
  return (
    <Card className="overflow-hidden shadow-sm transition-shadow hover:shadow-md">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 truncate text-xl font-bold tracking-tight md:text-2xl">{value}</p>
            {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1', a[accent])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3 flex items-end justify-between gap-3">
          <div className="h-10 flex-1">
            <Sparkline data={spark} color={sparkColor} />
          </div>
          {delta !== null && delta !== undefined && <DeltaPill delta={delta} />}
        </div>
      </CardContent>
    </Card>
  )
}

function TypeBadge({ type }: { type: string }) {
  const m = TYPE_META[type] || TYPE_META.system
  const Icon = m.icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', m.chip)}>
      <Icon className="h-3 w-3" />
      {m.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const m = PRIORITY_META[priority] || PRIORITY_META.normal
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1 ring-inset', m.chip)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', m.dot)} />
      {m.label}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main module
// ---------------------------------------------------------------------------
export function NotificationsModule() {
  const { data, loading, refetch } = useFetch<NotificationsResponse>('/api/notifications?limit=200')

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [clearOpen, setClearOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [seeded, setSeeded] = useState(false)

  // Listen for the realtime 'notifications:refetch' custom event (dispatched
  // by the useRealtimeNotifications hook) and refetch when it fires.
  useEffect(() => {
    const handler = () => refetch()
    window.addEventListener('notifications:refetch', handler)
    return () => window.removeEventListener('notifications:refetch', handler)
  }, [refetch])

  // When the user is signed in, auto-seed demo data the first time so the
  // redesigned UI has something to show. We only do this if there's no data
  // AND we've never seeded before in this session.
  useEffect(() => {
    if (loading || seeded) return
    if (data && data.notifications.length === 0 && (data.stats?.total ?? 0) === 0) {
      setSeeded(true)
      ;(async () => {
        try {
          const res = await fetch('/api/notifications/seed', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          })
          if (res.ok) refetch()
        } catch {}
      })()
    }
  }, [data, loading, refetch, seeded])

  const markAllRead = useCallback(async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: 'school' }),
      })
      if (!res.ok) throw new Error('Failed to mark all read')
      toast.success('All notifications marked as read')
      refetch()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Operation failed')
    } finally {
      setBusy(false)
    }
  }, [refetch])

  const clearAll = useCallback(async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/notifications/seed', { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to clear notifications')
      toast.success('All notifications cleared')
      setClearOpen(false)
      refetch()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Operation failed')
    } finally {
      setBusy(false)
    }
  }, [refetch])

  const markOneRead = useCallback(async (n: AppNotificationDTO) => {
    try {
      await fetch(`/api/notifications/${n.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ read: true }),
      })
      refetch()
    } catch {
      toast.error('Could not mark as read')
    }
  }, [refetch])

  const archiveOne = useCallback(async (n: AppNotificationDTO) => {
    try {
      await fetch(`/api/notifications/${n.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ archived: true }),
      })
      toast.success(`Archived: ${n.title}`)
      refetch()
    } catch {
      toast.error('Could not archive')
    }
  }, [refetch])

  const deleteOne = useCallback(async (n: AppNotificationDTO) => {
    try {
      await fetch(`/api/notifications/${n.id}`, { method: 'DELETE' })
      toast.success(`Deleted: ${n.title}`)
      refetch()
    } catch {
      toast.error('Could not delete')
    }
  }, [refetch])

  const reseed = useCallback(async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/notifications/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ force: true }),
      })
      if (!res.ok) throw new Error('Failed to reseed')
      toast.success('Demo notifications regenerated')
      refetch()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Reseed failed')
    } finally {
      setBusy(false)
    }
  }, [refetch])

  // ---- Loading skeleton mirrors final layout ----
  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-xl lg:col-span-1" />
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  // ---- Safe defaults ----
  const notifications = data.notifications ?? []
  const stats = data.stats ?? { total: 0, unread: 0, actionRequired: 0, today: 0, byType: {} }
  const byDay = data.byDay ?? []
  const byType = stats.byType ?? {}
  const total = stats.total ?? 0
  const unread = stats.unread ?? 0
  const actionRequired = stats.actionRequired ?? 0
  const today = stats.today ?? 0

  // Derive sparkline data from byDay (last 7 days) and type distributions
  const dailySpark = byDay.map((d) => d.count || 0)
  const totalDelta = dailySpark.length >= 2 ? ((dailySpark[dailySpark.length - 1] - dailySpark[dailySpark.length - 2]) / Math.max(1, dailySpark[dailySpark.length - 2])) * 100 : null

  // Build donut data
  const donutData = Object.keys(TYPE_META).map((k) => ({
    type: k,
    label: TYPE_META[k].label,
    value: byType[k] || 0,
    color: TYPE_META[k].color,
  })).filter((d) => d.value > 0)

  // Filter the notifications for the table
  const filtered = notifications.filter((n) => {
    if (search) {
      const q = search.toLowerCase()
      if (!n.title.toLowerCase().includes(q) && !n.message.toLowerCase().includes(q)) return false
    }
    if (typeFilter !== 'all' && n.type !== typeFilter) return false
    if (priorityFilter !== 'all' && n.priority !== priorityFilter) return false
    if (statusFilter === 'unread' && (n.readAt || n.archivedAt)) return false
    if (statusFilter === 'read' && (!n.readAt || n.archivedAt)) return false
    if (statusFilter === 'archived' && !n.archivedAt) return false
    if (statusFilter === 'all' && n.archivedAt) return false // hide archived from default view
    return true
  })

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* EXECUTIVE HERO                                                 */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 p-6 text-white shadow-xl ring-1 ring-white/5 md:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300 ring-1 ring-white/15 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Notifications Center
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Real-Time Activity &amp; Alerts</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
              Live in-app notifications for fees, attendance, exams, discipline, and system events.
              Filter, archive, or act on any alert — new ones push here instantly.
            </p>
            {/* Live presence indicator */}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-emerald-400/30">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <Radio className="h-3.5 w-3.5" />
              Live — streaming via WebSocket
            </div>
          </div>

          {/* Hero KPIs */}
          <div className="flex flex-wrap gap-3">
            <HeroKpi icon={<Inbox className="h-3.5 w-3.5" />} label="Total" value={String(total)} accent="emerald" />
            <HeroKpi icon={<Bell className="h-3.5 w-3.5" />} label="Unread" value={String(unread)} accent="rose" />
            <HeroKpi icon={<AlertTriangle className="h-3.5 w-3.5" />} label="Action Req." value={String(actionRequired)} accent="amber" />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4 STAT CARDS WITH SPARKLINES                                  */}
      {/* ============================================================ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Notifications"
          value={total}
          icon={Inbox}
          accent="emerald"
          sub={`${donutData.length} types tracked`}
          spark={dailySpark.length ? dailySpark : [0, 0, 0, 0, 0, 0, 0]}
          sparkColor="#10b981"
          delta={totalDelta}
        />
        <StatCard
          label="Unread"
          value={unread}
          icon={Bell}
          accent="rose"
          sub={`${actionRequired} marked action-required`}
          spark={dailySpark.length ? dailySpark : [0, 0, 0, 0, 0, 0, 0]}
          sparkColor="#f43f5e"
          delta={null}
        />
        <StatCard
          label="Action Required"
          value={actionRequired}
          icon={AlertTriangle}
          accent="amber"
          sub="High / urgent priority"
          spark={dailySpark.length ? dailySpark : [0, 0, 0, 0, 0, 0, 0]}
          sparkColor="#f59e0b"
          delta={null}
        />
        <StatCard
          label="Today"
          value={today}
          icon={CalendarClock}
          accent="teal"
          sub={`Last 7 days: ${dailySpark.reduce((a, b) => a + b, 0)}`}
          spark={dailySpark.length ? dailySpark : [0, 0, 0, 0, 0, 0, 0]}
          sparkColor="#14b8a6"
          delta={null}
        />
      </div>

      {/* ============================================================ */}
      {/* ROW A: BY TYPE (DONUT) + BY DAY (BAR)                         */}
      {/* ============================================================ */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* By Type — Donut */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Filter className="h-4 w-4" />
              </span>
              By Type
            </CardTitle>
            <CardDescription>Distribution across the {donutData.length}-type taxonomy</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              {donutData.length === 0 ? (
                <EmptyChartState message="No notifications yet" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                    >
                      {donutData.map((entry) => (
                        <Cell key={entry.type} fill={entry.color} stroke="hsl(var(--background))" strokeWidth={2} />
                      ))}
                    </Pie>
                    <RTooltip
                      formatter={(v: number, n: string) => [`${v} notification${v === 1 ? '' : 's'}`, n]}
                      contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }}
                    />
                    <Legend
                      iconType="circle"
                      iconSize={8}
                      formatter={(value: string) => <span className="text-xs text-muted-foreground">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
            {/* Type breakdown mini-table */}
            <div className="mt-3 space-y-1.5">
              {Object.keys(TYPE_META).map((k) => {
                const meta = TYPE_META[k]
                const v = byType[k] || 0
                const totalSum = Object.values(byType).reduce((a, b) => a + (b || 0), 0) || 1
                const pct = (v / totalSum) * 100
                return (
                  <div key={k} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: meta.color }} />
                    <span className="text-muted-foreground">{meta.label}</span>
                    <div className="ml-auto flex items-center gap-2">
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta.color }} />
                      </div>
                      <span className="w-6 text-right font-semibold tabular-nums">{v}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* By Day — Bar */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <CalendarClock className="h-4 w-4" />
                  </span>
                  Notifications per day
                </CardTitle>
                <CardDescription className="mt-1">Activity volume over the last 7 days</CardDescription>
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Last 7d</div>
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {dailySpark.reduce((a, b) => a + b, 0)}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {byDay.length === 0 || byDay.every((d) => (d.count || 0) === 0) ? (
                <EmptyChartState message="No notifications in the last 7 days" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byDay} margin={{ top: 10, right: 12, left: -8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="notifBarGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#059669" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={28} tickLine={false} axisLine={false} />
                    <RTooltip
                      formatter={(v: number) => [`${v} notification${v === 1 ? '' : 's'}`, 'Volume']}
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                      contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                    />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={56} fill="url(#notifBarGrad)" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* NOTIFICATIONS TABLE — searchable, filterable                   */}
      {/* ============================================================ */}
      <Card id="notifications-table" className="shadow-sm scroll-mt-4">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Bell className="h-4 w-4" />
                </span>
                Activity Feed
                <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                Live in-app notifications for your school — new ones stream in real-time
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" onClick={markAllRead} disabled={busy || unread === 0}>
                <CheckCheck className="mr-1.5 h-4 w-4" />
                Mark all read
              </Button>
              <Button variant="outline" size="sm" onClick={reseed} disabled={busy}>
                <RefreshCw className="mr-1.5 h-4 w-4" />
                Reseed demo
              </Button>
              <Button variant="outline" size="sm" className="text-rose-600 hover:text-rose-700" onClick={() => setClearOpen(true)} disabled={busy || total === 0}>
                <Trash2 className="mr-1.5 h-4 w-4" />
                Clear all
              </Button>
            </div>
          </div>

          {/* Filter bar */}
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title or message…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {Object.keys(TYPE_META).map((k) => (
                    <SelectItem key={k} value={k}>{TYPE_META[k].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  {Object.keys(PRIORITY_META).map((k) => (
                    <SelectItem key={k} value={k}>{PRIORITY_META[k].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Active</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6 w-[36px]"></TableHead>
                  <TableHead>Notification</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead className="hidden lg:table-cell">Status</TableHead>
                  <TableHead className="hidden md:table-cell">Time</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-16 text-center">
                      <EmptyRowState onReseed={reseed} busy={busy} total={total} />
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((n) => {
                  const meta = TYPE_META[n.type] || TYPE_META.system
                  const Icon = meta.icon
                  return (
                    <TableRow
                      key={n.id}
                      className={cn(
                        'transition-colors hover:bg-muted/40',
                        !n.readAt && 'bg-emerald-50/30 dark:bg-emerald-950/10',
                      )}
                    >
                      <TableCell className="pl-6">
                        <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg ring-1', meta.chip)}>
                          <Icon className="h-4 w-4" />
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[240px]">
                        <div className="flex items-center gap-2">
                          {!n.readAt && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" />}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{n.title}</p>
                            <p className="line-clamp-1 text-xs text-muted-foreground">{n.message}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><TypeBadge type={n.type} /></TableCell>
                      <TableCell><PriorityBadge priority={n.priority} /></TableCell>
                      <TableCell className="hidden lg:table-cell">
                        {n.archivedAt ? (
                          <Badge variant="outline" className="text-[10px] text-slate-500">Archived</Badge>
                        ) : n.readAt ? (
                          <Badge variant="outline" className="text-[10px] text-emerald-600 dark:text-emerald-400">Read</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-rose-600 dark:text-rose-400">Unread</Badge>
                        )}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-xs text-muted-foreground tabular-nums">
                        {timeAgo(n.createdAt)}
                      </TableCell>
                      <TableCell className="pr-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {!n.readAt && (
                              <DropdownMenuItem onClick={() => markOneRead(n)}>
                                <Check className="mr-2 h-3.5 w-3.5" /> Mark as read
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => archiveOne(n)}>
                              <Archive className="mr-2 h-3.5 w-3.5" /> Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={() => deleteOne(n)}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="divide-y md:hidden">
            {filtered.length === 0 && (
              <div className="py-12">
                <EmptyRowState onReseed={reseed} busy={busy} total={total} />
              </div>
            )}
            {filtered.map((n) => {
              const meta = TYPE_META[n.type] || TYPE_META.system
              const Icon = meta.icon
              return (
                <div key={n.id} className={cn('p-4', !n.readAt && 'bg-emerald-50/30 dark:bg-emerald-950/10')}>
                  <div className="flex items-start gap-3">
                    <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ring-1', meta.chip)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{n.title}</p>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {!n.readAt && (
                              <DropdownMenuItem onClick={() => markOneRead(n)}>
                                <Check className="mr-2 h-3.5 w-3.5" /> Mark as read
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem onClick={() => archiveOne(n)}>
                              <Archive className="mr-2 h-3.5 w-3.5" /> Archive
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={() => deleteOne(n)}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <TypeBadge type={n.type} />
                        <PriorityBadge priority={n.priority} />
                        <span className="text-[10px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Clear all confirmation */}
      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear all notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes all {total} notification(s) for your school. This action cannot be undone.
              Consider archiving instead if you may need them later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={clearAll}
              disabled={busy}
              className="bg-rose-600 hover:bg-rose-700 focus:ring-rose-600"
            >
              {busy ? <RefreshCw className="mr-1.5 h-4 w-4 animate-spin" /> : <Trash2 className="mr-1.5 h-4 w-4" />}
              Clear all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Empty row state — used by both desktop table and mobile list
// ---------------------------------------------------------------------------
function EmptyRowState({ onReseed, busy, total }: {
  onReseed: () => void
  busy: boolean
  total: number
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
        <Bell className="h-6 w-6" />
      </div>
      <div>
        <p className="text-sm font-semibold">
          {total === 0 ? 'No notifications yet' : 'No matches with current filters'}
        </p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {total === 0
            ? 'Demo data will appear here automatically, or generate it manually to see the redesigned module in action.'
            : 'Try widening your search or filter selections.'}
        </p>
      </div>
      {total === 0 && (
        <Button size="sm" variant="outline" onClick={onReseed} disabled={busy}>
          <RefreshCw className={cn('mr-1.5 h-4 w-4', busy && 'animate-spin')} />
          Generate demo notifications
        </Button>
      )}
    </div>
  )
}
