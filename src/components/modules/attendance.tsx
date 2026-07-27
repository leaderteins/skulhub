'use client'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useFetch, apiPost } from '@/lib/api'
import { cn, fullName, initials, avatarColor, formatNumber } from '@/lib/format'
import { StatCard, SectionHeader, EmptyState } from '@/components/shared'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  CalendarCheck, CheckCircle2, XCircle, Clock, TrendingUp, Save,
  CheckCheck, Users, AlertCircle, Activity, ChevronRight, Stethoscope,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type AttendanceStatus = 'Present' | 'Late' | 'Absent' | 'Excused' | 'Sick'

interface StreamInfo {
  id: string
  name: string
  capacity: number
  classLevelName: string
  classLevelStage: string
  classTeacher: string | null
  enrolledCount: number
}

interface AttendanceRecord {
  id: string | null
  studentId: string
  admissionNo: string
  firstName: string
  lastName: string
  gender: string
  photoUrl: string | null
  status: AttendanceStatus | ''
  remarks: string
  checkInTime: string | null
  marked: boolean
}

interface AttendanceResponse {
  date: string
  streamId: string | null
  personType: string
  streams: StreamInfo[]
  records: AttendanceRecord[]
  summary: {
    total: number
    marked: number
    present: number
    absent: number
    late: number
    excused: number
    sick: number
    rate: number
  }
}

interface StatsDay {
  date: string
  present: number
  absent: number
  late: number
  excused: number
  sick: number
  total: number
  rate: number
}
interface StatsResponse {
  from: string
  to: string
  days: StatsDay[]
  overall: { present: number; absent: number; late: number; excused: number; sick: number; total: number; rate: number }
  today: { present: number; absent: number; late: number; excused: number; sick: number; total: number; rate: number; date: string }
  todayByStream: {
    streamId: string
    streamName: string
    classLevelName: string
    enrolled: number
    present: number
    absent: number
    late: number
    excused: number
    sick: number
    unmarked: number
    marked: number
    rate: number
  }[]
}

// ---------------------------------------------------------------------------
// Status configuration
// ---------------------------------------------------------------------------
const STATUSES: AttendanceStatus[] = ['Present', 'Late', 'Absent', 'Excused', 'Sick']

const STATUS_CONFIG: Record<AttendanceStatus, {
  label: string
  short: string
  // Active (selected) button styles
  active: string
  // Idle button styles
  idle: string
  dot: string
  text: string
  hex: string
  icon: typeof CheckCircle2
}> = {
  Present: {
    label: 'Present',
    short: 'P',
    active: 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/30',
    idle: 'text-emerald-700 border-emerald-200 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-900 dark:hover:bg-emerald-950',
    dot: 'bg-emerald-500',
    text: 'text-emerald-600 dark:text-emerald-400',
    hex: '#10b981',
    icon: CheckCircle2,
  },
  Late: {
    label: 'Late',
    short: 'L',
    active: 'bg-amber-500 text-white border-amber-500 shadow-sm shadow-amber-500/30',
    idle: 'text-amber-700 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-900 dark:hover:bg-amber-950',
    dot: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400',
    hex: '#f59e0b',
    icon: Clock,
  },
  Absent: {
    label: 'Absent',
    short: 'A',
    active: 'bg-rose-500 text-white border-rose-500 shadow-sm shadow-rose-500/30',
    idle: 'text-rose-700 border-rose-200 hover:bg-rose-50 dark:text-rose-400 dark:border-rose-900 dark:hover:bg-rose-950',
    dot: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400',
    hex: '#f43f5e',
    icon: XCircle,
  },
  Excused: {
    label: 'Excused',
    short: 'E',
    active: 'bg-violet-500 text-white border-violet-500 shadow-sm shadow-violet-500/30',
    idle: 'text-violet-700 border-violet-200 hover:bg-violet-50 dark:text-violet-400 dark:border-violet-900 dark:hover:bg-violet-950',
    dot: 'bg-violet-500',
    text: 'text-violet-600 dark:text-violet-400',
    hex: '#8b5cf6',
    icon: AlertCircle,
  },
  Sick: {
    label: 'Sick',
    short: 'S',
    active: 'bg-cyan-500 text-white border-cyan-500 shadow-sm shadow-cyan-500/30',
    idle: 'text-cyan-700 border-cyan-200 hover:bg-cyan-50 dark:text-cyan-400 dark:border-cyan-900 dark:hover:bg-cyan-950',
    dot: 'bg-cyan-500',
    text: 'text-cyan-600 dark:text-cyan-400',
    hex: '#06b6d4',
    icon: Stethoscope,
  },
}

function todayStr(): string {
  // Local date in YYYY-MM-DD
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`)
  return d.toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ---------------------------------------------------------------------------
// Main module
// ---------------------------------------------------------------------------
export function AttendanceModule() {
  const today = useMemo(() => todayStr(), [])
  const [date, setDate] = useState<string>(today)
  const [streamId, setStreamId] = useState<string>('')
  const [draft, setDraft] = useState<Record<string, AttendanceStatus>>({})
  const [remarksDraft, setRemarksDraft] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [streamPicked, setStreamPicked] = useState(false)

  // Fetch attendance roster for selected date/stream
  const rosterUrl = streamId
    ? `/api/attendance?date=${encodeURIComponent(date)}&streamId=${encodeURIComponent(streamId)}&personType=Student`
    : `/api/attendance?date=${encodeURIComponent(date)}`
  const { data, loading, refetch } = useFetch<AttendanceResponse>(rosterUrl)

  // Fetch stats (always — last 30 days)
  const { data: stats, loading: statsLoading } = useFetch<StatsResponse>('/api/attendance/stats')

  // When records load (or change because date/stream changed), seed the local draft
  useEffect(() => {
    if (!data?.records) return
    const d: Record<string, AttendanceStatus> = {}
    const r: Record<string, string> = {}
    data.records.forEach(rec => {
      if (rec.status) d[rec.studentId] = rec.status as AttendanceStatus
      if (rec.remarks) r[rec.studentId] = rec.remarks
    })
    setDraft(d)
    setRemarksDraft(r)
  }, [data?.records])

  // Auto-pick the first stream once streams are loaded
  useEffect(() => {
    if (!streamPicked && data?.streams?.length && !streamId) {
      setStreamId(data.streams[0].id)
      setStreamPicked(true)
    }
  }, [data?.streams, streamId, streamPicked])

  const records = data?.records || []
  const streams = data?.streams || []
  const summary = data?.summary

  // Local summary (reflects unsaved draft)
  const liveSummary = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = {
      Present: 0, Late: 0, Absent: 0, Excused: 0, Sick: 0,
    }
    records.forEach(rec => {
      const s = draft[rec.studentId] || (rec.status as AttendanceStatus) || ''
      if (s) counts[s]++
    })
    const marked = Object.values(counts).reduce((a, b) => a + b, 0)
    const total = records.length
    const rate = total > 0 ? Math.round(((counts.Present + counts.Late) / total) * 100) : 0
    return { ...counts, marked, total, rate }
  }, [records, draft])

  function setStatus(studentId: string, status: AttendanceStatus) {
    setDraft(prev => ({ ...prev, [studentId]: status }))
  }

  function markAllPresent() {
    const next: Record<string, AttendanceStatus> = {}
    records.forEach(rec => {
      next[rec.studentId] = 'Present'
    })
    setDraft(prev => ({ ...prev, ...next }))
    toast.success(`Marked ${records.length} students as Present`, {
      description: 'Click Save Attendance to persist the changes.',
    })
  }

  function clearAll() {
    setDraft({})
    setRemarksDraft({})
    toast.info('Draft cleared')
  }

  async function saveAttendance() {
    if (!streamId) {
      toast.error('Please select a stream first')
      return
    }
    const payload = records
      .map(rec => {
        const status = draft[rec.studentId] || (rec.status as AttendanceStatus)
        if (!status) return null
        return {
          studentId: rec.studentId,
          status,
          remarks: remarksDraft[rec.studentId] || rec.remarks || undefined,
        }
      })
      .filter(Boolean) as { studentId: string; status: string; remarks?: string }[]

    if (payload.length === 0) {
      toast.error('No attendance to save. Mark at least one student.')
      return
    }

    setSaving(true)
    try {
      const res = await apiPost<{ saved: number }>('/api/attendance', {
        date,
        streamId,
        records: payload,
      })
      toast.success(`Attendance saved`, {
        description: `${res.saved} record(s) updated for ${formatDateLabel(date)}.`,
      })
      refetch()
    } catch (e: any) {
      toast.error('Failed to save attendance', { description: e?.message })
    } finally {
      setSaving(false)
    }
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------
  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-xl" />
      </div>
    )
  }

  const todayStats = stats?.today
  const todayRate = todayStats?.rate ?? 0

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 right-24 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <CalendarCheck className="h-3 w-3" />
              Term 1, 2025 · Daily Attendance Register
            </div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Attendance Management</h2>
            <p className="mt-1 text-sm text-white/80">
              Mark daily attendance, track trends, and monitor student presence across all streams.
            </p>
          </div>
          <div className="flex flex-col items-start gap-1 rounded-xl bg-white/10 px-4 py-3 backdrop-blur md:items-end">
            <span className="text-xs text-white/70">Today's Attendance Rate</span>
            <span className="text-3xl font-bold">{todayRate}%</span>
            <span className="text-xs text-white/70">
              {todayStats ? `${formatNumber(todayStats.present + todayStats.late)} of ${formatNumber(todayStats.total)} present` : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's Attendance Rate"
          value={statsLoading ? '—' : `${todayRate}%`}
          icon={TrendingUp}
          accent="emerald"
          loading={statsLoading}
          footer={<span className="text-muted-foreground">last 30 days</span>}
        />
        <StatCard
          label="Present Today"
          value={todayStats?.present ?? 0}
          icon={CheckCircle2}
          accent="teal"
          loading={statsLoading}
          trendLabel={`of ${todayStats?.total ?? 0} marked`}
        />
        <StatCard
          label="Absent Today"
          value={todayStats?.absent ?? 0}
          icon={XCircle}
          accent="rose"
          loading={statsLoading}
          trendLabel={`${todayStats?.total ? Math.round((todayStats.absent / todayStats.total) * 100) : 0}% of marked`}
        />
        <StatCard
          label="Late Today"
          value={todayStats?.late ?? 0}
          icon={Clock}
          accent="amber"
          loading={statsLoading}
          trendLabel={`${todayStats?.total ? Math.round((todayStats.late / todayStats.total) * 100) : 0}% of marked`}
        />
      </div>

      {/* Mark attendance card */}
      <Card className="overflow-hidden">
        <CardHeader className="gap-4 border-b bg-muted/30">
          <SectionHeader
            title="Mark Attendance"
            description="Select a stream and date, then set each student's status."
            icon={CalendarCheck}
            action={
              <div className="flex flex-wrap items-end gap-2">
                <div className="flex flex-col gap-1">
                  <Label htmlFor="att-date" className="text-xs text-muted-foreground">Date</Label>
                  <Input
                    id="att-date"
                    type="date"
                    value={date}
                    max={today}
                    onChange={e => setDate(e.target.value)}
                    className="w-[160px]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <Label className="text-xs text-muted-foreground">Stream</Label>
                  <Select value={streamId} onValueChange={v => setStreamId(v)}>
                    <SelectTrigger className="w-[220px]">
                      <SelectValue placeholder="Select stream" />
                    </SelectTrigger>
                    <SelectContent>
                      {streams.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          <span className="flex items-center gap-2">
                            <span className="font-medium">{s.name}</span>
                            <span className="text-xs text-muted-foreground">· {s.classLevelName}</span>
                            <Badge variant="secondary" className="ml-1 text-[10px]">{s.enrolledCount}</Badge>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            }
          />

          {/* Inline summary + actions */}
          {streamId && records.length > 0 && (
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-wrap items-center gap-2">
                {STATUSES.map(s => {
                  const cfg = STATUS_CONFIG[s]
                  const count = (liveSummary as any)[s] as number
                  return (
                    <div
                      key={s}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                        'border-border bg-background',
                      )}
                    >
                      <span className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                      <span>{s}</span>
                      <span className="font-semibold tabular-nums">{count}</span>
                    </div>
                  )
                })}
                <div className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  <TrendingUp className="h-3 w-3" />
                  Rate: <span className="font-semibold tabular-nums">{liveSummary.rate}%</span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={clearAll} disabled={saving}>
                  Clear Draft
                </Button>
                <Button variant="outline" size="sm" onClick={markAllPresent} disabled={saving}>
                  <CheckCheck className="mr-1.5 h-4 w-4" /> Mark All Present
                </Button>
                <Button
                  size="sm"
                  onClick={saveAttendance}
                  disabled={saving || liveSummary.marked === 0}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {saving ? (
                    <>
                      <span className="mr-1.5 h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="mr-1.5 h-4 w-4" /> Save Attendance
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {!streamId ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="Select a stream to mark attendance"
                description="Choose a stream from the dropdown above to load the student roster."
              />
            </div>
          ) : loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : records.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="No students enrolled"
                description="There are no active students enrolled in this stream for Term 1, 2025."
              />
            </div>
          ) : (
            <div className="max-h-[34rem] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
                  <TableRow>
                    <TableHead className="w-[44%] pl-4">Student</TableHead>
                    <TableHead className="hidden sm:table-cell">Adm. No</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="hidden text-center md:table-cell">Marked</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {records.map(rec => {
                    const currentStatus = draft[rec.studentId] || (rec.status as AttendanceStatus) || ''
                    return (
                      <TableRow key={rec.studentId} className={cn('group', currentStatus && 'bg-muted/20')}>
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className={cn('text-xs font-semibold text-white', avatarColor(rec.studentId))}>
                                {initials(rec.firstName, rec.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-medium">{fullName(rec)}</p>
                                {rec.marked && (
                                  <Badge variant="secondary" className="h-4 px-1 text-[9px] uppercase tracking-wide">
                                    Saved
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground sm:hidden">{rec.admissionNo} · {rec.gender}</p>
                              <p className="hidden text-xs text-muted-foreground sm:block">{rec.gender}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="font-mono text-xs text-muted-foreground">{rec.admissionNo}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap justify-center gap-1">
                            {STATUSES.map(s => {
                              const cfg = STATUS_CONFIG[s]
                              const selected = currentStatus === s
                              return (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setStatus(rec.studentId, s)}
                                  aria-pressed={selected}
                                  title={s}
                                  className={cn(
                                    'inline-flex h-8 min-w-9 items-center justify-center rounded-md border px-2 text-xs font-semibold transition-all',
                                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1',
                                    selected ? cfg.active : cn('bg-background', cfg.idle),
                                  )}
                                >
                                  <span className="sm:hidden">{cfg.short}</span>
                                  <span className="hidden sm:inline">{s}</span>
                                </button>
                              )
                            })}
                          </div>
                        </TableCell>
                        <TableCell className="hidden text-center md:table-cell">
                          {currentStatus ? (
                            <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium', STATUS_CONFIG[currentStatus].idle, 'border-current/20')}>
                              <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_CONFIG[currentStatus].dot)} />
                              {currentStatus}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Trends: area chart + stacked bar */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Attendance Rate Trend</CardTitle>
                <CardDescription className="text-xs">Daily attendance rate over last 30 days</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading || !stats ? (
              <Skeleton className="h-[260px] w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={stats.days} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attRateGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    stroke="oklch(0.5 0.02 160)"
                    tickFormatter={(d) => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                    minTickGap={24}
                  />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" unit="%" />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }}
                    formatter={(v: number) => [`${v}%`, 'Attendance Rate']}
                    labelFormatter={(d) => new Date(d).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#attRateGrad)"
                    dot={{ r: 2.5, fill: '#10b981' }}
                    activeDot={{ r: 5 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Daily Status Breakdown</CardTitle>
                <CardDescription className="text-xs">Present, Late, Absent, Excused & Sick per day</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {statsLoading || !stats ? (
              <Skeleton className="h-[260px] w-full rounded-lg" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats.days} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    stroke="oklch(0.5 0.02 160)"
                    tickFormatter={(d) => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                    minTickGap={24}
                  />
                  <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }}
                    cursor={{ fill: 'oklch(0.96 0.01 150)' }}
                    labelFormatter={(d) => new Date(d).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
                  <Bar dataKey="present" name="Present" stackId="s" fill="#10b981" maxBarSize={28} />
                  <Bar dataKey="late" name="Late" stackId="s" fill="#f59e0b" maxBarSize={28} />
                  <Bar dataKey="absent" name="Absent" stackId="s" fill="#f43f5e" maxBarSize={28} />
                  <Bar dataKey="excused" name="Excused" stackId="s" fill="#8b5cf6" maxBarSize={28} />
                  <Bar dataKey="sick" name="Sick" stackId="s" fill="#06b6d4" radius={[3, 3, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Today's attendance by stream */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader
            title="Today's Attendance by Stream"
            description="Per-stream summary of attendance marked today."
            icon={Users}
          />
        </CardHeader>
        <CardContent className="p-0">
          {statsLoading || !stats ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : stats.todayByStream.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={CalendarCheck}
                title="No streams found"
                description="Streams will appear here once students are enrolled."
              />
            </div>
          ) : (
            <div className="max-h-96 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-card shadow-sm">
                  <TableRow>
                    <TableHead className="pl-4">Stream</TableHead>
                    <TableHead className="text-center">Enrolled</TableHead>
                    <TableHead className="text-center">Present</TableHead>
                    <TableHead className="text-center">Absent</TableHead>
                    <TableHead className="text-center">Late</TableHead>
                    <TableHead className="text-right pr-4">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.todayByStream.map(s => {
                    const rate = s.rate
                    const rateColor = rate >= 90
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : rate >= 75
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    return (
                      <TableRow key={s.streamId} className="group">
                        <TableCell className="pl-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                              {s.streamName.replace(/[^A-Za-z]/g, '').slice(0, 2).toUpperCase() || 'ST'}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{s.streamName}</p>
                              <p className="text-xs text-muted-foreground">{s.classLevelName}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="text-sm tabular-nums">{s.enrolled}</span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-sm tabular-nums">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            {s.present}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-sm tabular-nums">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                            {s.absent}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className="inline-flex items-center gap-1 text-sm tabular-nums">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            {s.late}
                          </span>
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="hidden h-1.5 w-20 overflow-hidden rounded-full bg-muted sm:block">
                              <div
                                className={cn(
                                  'h-full rounded-full',
                                  rate >= 90 ? 'bg-emerald-500' : rate >= 75 ? 'bg-amber-500' : 'bg-rose-500',
                                )}
                                style={{ width: `${Math.min(rate, 100)}%` }}
                              />
                            </div>
                            <span className={cn('text-sm font-semibold tabular-nums', rateColor)}>
                              {rate}%
                            </span>
                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 30-day overall footer */}
      {stats && !statsLoading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Present (30d)</p>
                <p className="text-sm font-semibold">{formatNumber(stats.overall.present)} · {stats.overall.rate}%</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Absent (30d)</p>
                <p className="text-sm font-semibold">{formatNumber(stats.overall.absent)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Late (30d)</p>
                <p className="text-sm font-semibold">{formatNumber(stats.overall.late)}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Excused + Sick (30d)</p>
                <p className="text-sm font-semibold">{formatNumber(stats.overall.excused + stats.overall.sick)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
