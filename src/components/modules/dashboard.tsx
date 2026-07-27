'use client'
import { useFetch } from '@/lib/api'
import { StatCard, SectionHeader } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { formatKES, formatNumber, timeAgo, fullName, initials, avatarColor, statusColor, priorityColor } from '@/lib/format'
import { useAppStore } from '@/lib/store'
import {
  Users, GraduationCap, Wallet, CalendarCheck, BookOpen, TrendingDown,
  BookMarked, Megaphone, Activity, ArrowRight, Banknote, AlertCircle,
  CheckCircle2, Clock, Layers, CalendarDays, Trophy, FileText, Bus,
  Sparkles, ChevronRight,
} from 'lucide-react'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'

const GENDER_COLORS: Record<string, string> = { Male: '#0d9488', Female: '#d97706' }
const GRADE_COLORS = ['#059669', '#10b981', '#14b8a6', '#0d9488', '#0ea5e9', '#f59e0b', '#f97316', '#ef4444', '#dc2626', '#e11d48', '#be185d', '#9333ea']

interface DashboardData {
  stats: {
    totalStudents: number
    totalStaff: number
    totalClasses: number
    activeStreams: number
    totalBooks: number
    availableBooks: number
    activeLoans: number
  }
  finance: {
    totalBilled: number
    totalCollected: number
    totalOutstanding: number
    collectionRate: number
    todayCollection: number
    totalExpenses: number
    feeStats: { status: string; amount: number; balance: number; count: number }[]
  }
  studentsByLevel: { name: string; count: number }[]
  studentsByGender: { gender: string; count: number }[]
  attendanceTrend: { date: string; rate: number }[]
  gradeDistribution: { grade: string; count: number }[]
  announcements: any[]
  activities: any[]
}

const ACTION_ICON: Record<string, any> = {
  CREATE: CheckCircle2, UPDATE: Activity, PAYMENT: Banknote, MARK: CalendarCheck, GRADE: GraduationCap, ISSUE: BookMarked,
}

export function DashboardModule() {
  const { data, loading } = useFetch<DashboardData>('/api/dashboard')
  const { setActiveModule, setCommandPaletteOpen } = useAppStore()

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    )
  }

  const { stats, finance, studentsByLevel, studentsByGender, attendanceTrend, gradeDistribution, announcements, activities } = data

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 right-24 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="max-w-xl">
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-300" /> Term 1, 2025 · In Session
            </div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Karibu, James 👋</h2>
            <p className="mt-1 text-sm text-white/80">
              You have <span className="font-semibold text-white">{finance.feeStats.find(f => f.status === 'Unpaid')?.count || 0}</span> unpaid invoices and{' '}
              <span className="font-semibold text-white">{stats.activeLoans}</span> active library loans to track today.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="bg-white/15 text-white backdrop-blur hover:bg-white/25" onClick={() => setActiveModule('finance')}>
              <Wallet className="mr-1.5 h-4 w-4" /> View Fees
            </Button>
            <Button variant="secondary" size="sm" className="bg-white text-emerald-700 hover:bg-white/90" onClick={() => setActiveModule('students')}>
              <Users className="mr-1.5 h-4 w-4" /> Students
            </Button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Students" value={formatNumber(stats.totalStudents)} icon={Users} accent="emerald" trend={4.2} trendLabel="vs last term" />
        <StatCard label="Teaching & Support Staff" value={formatNumber(stats.totalStaff)} icon={GraduationCap} accent="teal" trend={1.8} trendLabel="this year" />
        <StatCard label="Fee Collection Rate" value={`${finance.collectionRate}%`} icon={Wallet} accent="amber" trend={finance.collectionRate >= 70 ? 3.1 : -2.4} trendLabel="of billed" />
        <StatCard label="Outstanding Fees" value={formatKES(finance.totalOutstanding)} icon={TrendingDown} accent="rose" trendLabel={`${finance.feeStats.find(f => f.status === 'Unpaid')?.count || 0} unpaid`} />
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Attendance trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base">Attendance Trend</CardTitle>
              <CardDescription className="text-xs">Daily attendance rate over last 14 days</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActiveModule('attendance')}>
              Details <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={attendanceTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })} stroke="oklch(0.5 0.02 160)" />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" unit="%" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} formatter={(v: number) => [`${v}%`, 'Attendance']} labelFormatter={(d) => new Date(d).toLocaleDateString('en-KE', { weekday: 'short', day: 'numeric', month: 'short' })} />
                <Area type="monotone" dataKey="rate" stroke="#10b981" strokeWidth={2.5} fill="url(#attGrad)" dot={{ r: 3, fill: '#10b981' }} activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gender distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Gender Distribution</CardTitle>
            <CardDescription className="text-xs">Active students</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={studentsByGender} dataKey="count" nameKey="gender" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {studentsByGender.map((e) => <Cell key={e.gender} fill={GENDER_COLORS[e.gender] || '#94a3b8'} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex justify-center gap-4 text-xs">
              {studentsByGender.map(g => (
                <div key={g.gender} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: GENDER_COLORS[g.gender] }} />
                  <span className="font-medium">{g.gender}</span>
                  <span className="text-muted-foreground">{g.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Second charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Students by class level */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Enrollment by Class Level</CardTitle>
            <CardDescription className="text-xs">Active students per form</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={studentsByLevel} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} cursor={{ fill: 'oklch(0.96 0.01 150)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={60}>
                  {studentsByLevel.map((_, i) => <Cell key={i} fill={['#10b981', '#14b8a6', '#0d9488', '#0ea5e9'][i % 4]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fee collection status */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Fee Collection Status</CardTitle>
            <CardDescription className="text-xs">Term 1, 2025</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {finance.feeStats.map(f => {
              const pct = finance.totalBilled > 0 ? Math.round((f.amount / finance.totalBilled) * 100) : 0
              return (
                <div key={f.status}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{f.status}</span>
                    <span className="text-muted-foreground">{f.count} · {formatKES(f.amount)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={`h-full rounded-full ${f.status === 'Paid' ? 'bg-emerald-500' : f.status === 'Partially Paid' ? 'bg-amber-500' : f.status === 'Unpaid' ? 'bg-rose-500' : 'bg-slate-400'}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            <div className="mt-3 rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/40">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-emerald-700 dark:text-emerald-400">Collected Today</span>
                <span className="font-bold text-emerald-700 dark:text-emerald-400">{formatKES(finance.todayCollection)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row: announcements + activity */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Announcements */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
                <Megaphone className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Recent Announcements</CardTitle>
                <CardDescription className="text-xs">Latest school communications</CardDescription>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setActiveModule('communications')}>
              View all <ArrowRight className="ml-1 h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {announcements.slice(0, 4).map(a => (
              <div key={a.id} className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50">
                <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${priorityColor(a.priority)}`} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{a.title}</p>
                    {a.pinned && <Badge variant="outline" className="shrink-0 text-[10px]">📌 Pinned</Badge>}
                  </div>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{a.body}</p>
                  <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Badge variant="secondary" className="text-[10px]">{a.audience}</Badge>
                    <span>·</span>
                    <span>{timeAgo(a.publishedAt)}</span>
                    <span>·</span>
                    <span>{a.authorName}</span>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <CardDescription className="text-xs">System audit log</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activities.slice(0, 7).map(a => {
                const Icon = ACTION_ICON[a.action] || Activity
                return (
                  <div key={a.id} className="flex items-start gap-2.5">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs">
                        <span className="font-semibold">{a.user}</span>{' '}
                        <span className="text-muted-foreground">{a.details}</span>
                      </p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo(a.createdAt)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming events + Quick actions */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Term calendar / upcoming events */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Term Calendar & Upcoming Events</CardTitle>
                <CardDescription className="text-xs">Term 1, 2025 — key dates & deadlines</CardDescription>
              </div>
            </div>
            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
              <Sparkles className="mr-1 h-3 w-3" /> In Session
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { date: 'Feb 15', day: 'Sat', title: 'Parent-Teacher Conference', time: '9:00 AM — 1:00 PM', icon: Users, color: 'emerald' },
              { date: 'Feb 24', day: 'Mon', title: 'Mid-Term Break Begins', time: 'All day · resumes Feb 28', icon: CalendarCheck, color: 'amber' },
              { date: 'Mar 01', day: 'Sat', title: 'Staff CBC Workshop', time: '8:00 AM — Teaching staff', icon: GraduationCap, color: 'teal' },
              { date: 'Mar 08', day: 'Sat', title: 'Kenya Science & Engineering Fair', time: 'Regional competitions', icon: Trophy, color: 'violet' },
              { date: 'Mar 14', day: 'Fri', title: 'Annual Sports Day', time: 'Inter-stream athletics', icon: Activity, color: 'cyan' },
              { date: 'Apr 07', day: 'Mon', title: 'End Term 1 Examinations', time: 'Begins — all forms', icon: FileText, color: 'rose' },
            ].map((e, i) => {
              const Icon = e.icon
              const colorMap: Record<string, string> = {
                emerald: 'bg-emerald-500/10 text-emerald-600 border-emerald-200/50',
                teal: 'bg-teal-500/10 text-teal-600 border-teal-200/50',
                amber: 'bg-amber-500/10 text-amber-600 border-amber-200/50',
                rose: 'bg-rose-500/10 text-rose-600 border-rose-200/50',
                violet: 'bg-violet-500/10 text-violet-600 border-violet-200/50',
                cyan: 'bg-cyan-500/10 text-cyan-600 border-cyan-200/50',
              }
              return (
                <div key={i} className="group flex items-center gap-3 rounded-lg border p-3 transition-all hover:border-emerald-200 hover:bg-muted/40">
                  <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg border bg-muted/40">
                    <span className="text-[9px] font-semibold uppercase text-muted-foreground">{e.day}</span>
                    <span className="text-sm font-bold leading-none">{e.date.split(' ')[1]}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{e.time}</p>
                  </div>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${colorMap[e.color]}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Quick actions */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Quick Actions</CardTitle>
                <CardDescription className="text-xs">Common tasks</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-2">
            {[
              { label: 'Admit Student', icon: Users, module: 'students' as const, accent: 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' },
              { label: 'Mark Attendance', icon: CalendarCheck, module: 'attendance' as const, accent: 'bg-teal-500/10 text-teal-600 hover:bg-teal-500/20' },
              { label: 'Record Payment', icon: Wallet, module: 'finance' as const, accent: 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' },
              { label: 'Generate Report', icon: FileText, module: 'reportcards' as const, accent: 'bg-rose-500/10 text-rose-600 hover:bg-rose-500/20' },
              { label: 'New Announcement', icon: Megaphone, module: 'communications' as const, accent: 'bg-violet-500/10 text-violet-600 hover:bg-violet-500/20' },
              { label: 'Issue Book', icon: BookOpen, module: 'library' as const, accent: 'bg-cyan-500/10 text-cyan-600 hover:bg-cyan-500/20' },
            ].map(a => {
              const Icon = a.icon
              return (
                <button
                  key={a.label}
                  onClick={() => setActiveModule(a.module)}
                  className={`flex flex-col items-start gap-2 rounded-xl border p-3 text-left transition-all ${a.accent}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium leading-tight">{a.label}</span>
                </button>
              )
            })}
            <button
              onClick={() => setCommandPaletteOpen(true)}
              className="col-span-2 flex items-center justify-between rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 p-3 text-left text-emerald-700 transition-all hover:bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="text-xs font-medium">Open Command Palette</span>
              </div>
              <kbd className="rounded border border-emerald-300 bg-background px-1.5 py-0.5 text-[10px] font-semibold dark:border-emerald-800">⌘K</kbd>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Quick stats footer */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Classes & Streams</p>
              <p className="text-sm font-semibold">{stats.totalClasses} classes · {stats.activeStreams} streams</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-600">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Library Books</p>
              <p className="text-sm font-semibold">{formatNumber(stats.totalBooks)} total · {stats.availableBooks} available</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600">
              <Banknote className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Expenses (Term)</p>
              <p className="text-sm font-semibold">{formatKES(finance.totalExpenses)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-500/10 text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Overdue Library Loans</p>
              <p className="text-sm font-semibold">{stats.activeLoans} active loans</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
