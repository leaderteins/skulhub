'use client'
import { SuperAdminEnhanced } from './superadmin-enhanced'
import { SuperAdminExtras } from './superadmin-extras'
import { useState, useMemo } from 'react'
import { useFetch, apiPut, apiDelete } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Shield, Building2, CheckCircle2, Clock, Users, Wallet, TrendingUp,
  TrendingDown, MoreVertical, Trash2, ArrowUpCircle, PauseCircle, PlayCircle,
  Crown, Sparkles, Eye, Search, MapPin, Mail, Phone, CalendarDays,
  GraduationCap, UserCog, Banknote, FileText, AlertTriangle,
  Server, Activity, Rocket, ArrowRight, ChevronUp, ChevronDown, Layers,
} from 'lucide-react'
import { formatKES, formatNumber, formatCompact, formatDate, timeAgo, cn } from '@/lib/format'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Types — match the API response shape exactly (with safe optional handling)
// ---------------------------------------------------------------------------
interface SchoolListItem {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  address: string | null
  county: string | null
  plan: string
  status: string
  trialEndsAt: string | null
  maxStudents: number
  createdAt: string
  userCount: number
  studentCount: number
  staffCount: number
  invoiceCount: number
  paymentCount: number
  revenue: number
  lastLoginAt: string | null
  users: Array<{ id: string; name: string; email: string; role: string; status: string; lastLoginAt: string | null }>
}

interface DashboardData {
  summary: {
    totalSchools: number
    activeSchools: number
    trialSchools: number
    suspendedSchools: number
    expiredSchools: number
    totalUsers: number
    totalStudents: number
    totalStaff: number
    totalInvoices: number
    totalPayments: number
    totalRevenue: number
  }
  revenueByPlan: Array<{ plan: string; amount: number }>
  schoolsByPlan: Array<{ plan: string; count: number }>
  schoolsByStatus: Array<{ name: string; value: number; color: string }>
  monthlyGrowth: Array<{ label: string; count: number }>
  recentRegistrations: Array<{
    id: string; name: string; slug: string; plan: string; status: string
    county: string | null; createdAt: string; trialEndsAt: string | null
    userCount: number; studentCount: number
  }>
  schools: SchoolListItem[]
}

interface SchoolDetail {
  school: {
    id: string; name: string; slug: string; email: string | null; phone: string | null
    address: string | null; county: string | null; logo: string | null
    plan: string; status: string; trialEndsAt: string | null; maxStudents: number
    createdAt: string; updatedAt: string
  }
  users: Array<{
    id: string; name: string; email: string; role: string; status: string
    phone: string | null; lastLoginAt: string | null; createdAt: string
  }>
  stats: {
    userCount: number; studentCount: number; staffCount: number
    invoiceCount: number; paymentCount: number
    totalRevenue: number; totalBilled: number; totalCollected: number; totalOutstanding: number
  }
  studentsByStatus: Array<{ status: string; count: number }>
  staffByRole: Array<{ role: string; count: number }>
  revenueTrend: Array<{ label: string; amount: number }>
  recentPayments: Array<{
    id: string; amount: number; method: string; reference: string | null
    payerName: string | null; payerPhone: string | null; receivedBy: string | null; receivedAt: string
  }>
  recentInvoices: Array<{
    id: string; invoiceNo: string; amount: number; amountPaid: number
    balance: number; status: string; issueDate: string; dueDate: string
  }>
}

// ---------------------------------------------------------------------------
// Palette — sophisticated emerald/teal with neutrals
// ---------------------------------------------------------------------------
const PLAN_COLOR: Record<string, string> = {
  Starter: 'bg-slate-100 text-slate-700 dark:bg-slate-800/60 dark:text-slate-300 ring-slate-200 dark:ring-slate-700',
  Standard: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 ring-teal-200 dark:ring-teal-900',
  Premium: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-900',
  Enterprise: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 ring-amber-200 dark:ring-amber-900',
}

const PLAN_BAR_COLOR: Record<string, string> = {
  Starter: '#64748b', Standard: '#14b8a6', Premium: '#059669', Enterprise: '#f59e0b',
}

const PLAN_DOT_COLOR: Record<string, string> = {
  Starter: '#94a3b8', Standard: '#14b8a6', Premium: '#10b981', Enterprise: '#f59e0b',
}

const STATUS_COLOR: Record<string, string> = {
  Active: '#10b981', Trial: '#f59e0b', Suspended: '#f43f5e', Expired: '#64748b',
}

// ---------------------------------------------------------------------------
// Small visual helpers
// ---------------------------------------------------------------------------
function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  const styles: Record<string, string> = {
    active: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 ring-1 ring-inset ring-emerald-200 dark:ring-emerald-900',
    trial: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 ring-1 ring-inset ring-amber-200 dark:ring-amber-900',
    suspended: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 ring-1 ring-inset ring-rose-200 dark:ring-rose-900',
    expired: 'bg-slate-100 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300 ring-1 ring-inset ring-slate-200 dark:ring-slate-700',
  }
  const dotColor: Record<string, string> = {
    active: 'bg-emerald-500', trial: 'bg-amber-500', suspended: 'bg-rose-500', expired: 'bg-slate-400',
  }
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold', styles[s] || styles.expired)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', dotColor[s] || dotColor.expired)} />
      {status}
    </span>
  )
}

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold ring-1 ring-inset', PLAN_COLOR[plan] || PLAN_COLOR.Starter)}>
      {plan === 'Enterprise' && <Crown className="h-3 w-3" />}
      {plan === 'Premium' && <Sparkles className="h-3 w-3" />}
      {plan}
    </span>
  )
}

function SchoolInitials({ name, className }: { name: string; className?: string }) {
  const initials = name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  return (
    <Avatar className={cn('h-9 w-9 shrink-0', className)}>
      <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-bold text-white">
        {initials || '?'}
      </AvatarFallback>
    </Avatar>
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
      {Math.abs(delta).toFixed(1)}%
      {label && <span className="ml-1 font-normal opacity-70">{label}</span>}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Sparkline — tiny inline chart for stat cards
// ---------------------------------------------------------------------------
function Sparkline({ data, color }: { data: number[]; color: string }) {
  const chartData = data.map((v, i) => ({ i, v }))
  const id = useMemo(() => `spark-${color.replace('#', '')}-${Math.random().toString(36).slice(2, 8)}`, [color])
  if (!data.length) {
    return <div className="h-10 w-full" />
  }
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

// ---------------------------------------------------------------------------
// Derived metrics — computed client-side from the schools list
// (Honest proxies since the API only exposes monthlyGrowth & per-school revenue)
// ---------------------------------------------------------------------------
function buildMonthlyRevenue(schools: SchoolListItem[], months: Array<{ label: string; key: string }>) {
  const buckets: Record<string, number> = {}
  for (const m of months) buckets[m.key] = 0
  for (const s of schools) {
    const d = new Date(s.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (buckets[key] !== undefined) buckets[key] += s.revenue || 0
  }
  return months.map(m => ({ label: m.label, amount: buckets[m.key] || 0 }))
}

function buildMonthlyStudents(schools: SchoolListItem[], months: Array<{ label: string; key: string }>) {
  const buckets: Record<string, number> = {}
  for (const m of months) buckets[m.key] = 0
  for (const s of schools) {
    const d = new Date(s.createdAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (buckets[key] !== undefined) buckets[key] += s.studentCount || 0
  }
  return months.map(m => ({ label: m.label, count: buckets[m.key] || 0 }))
}

function buildMonthlyTrials(schools: SchoolListItem[], months: Array<{ label: string; key: string }>) {
  const buckets: Record<string, number> = {}
  for (const m of months) buckets[m.key] = 0
  for (const s of schools) {
    if (!s.trialEndsAt) continue
    const d = new Date(s.trialEndsAt)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (buckets[key] !== undefined) buckets[key] += 1
  }
  return months.map(m => ({ label: m.label, count: buckets[m.key] || 0 }))
}

function buildMonthKeys(monthlyGrowth: Array<{ label: string; count: number }>): Array<{ label: string; key: string }> {
  // Reconstruct month keys from current date backwards, matching API labels
  const now = new Date()
  const keys: Array<{ label: string; key: string }> = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const label = d.toLocaleDateString('en-KE', { month: 'short' })
    const key = `${d.getFullYear()}-${d.getMonth()}`
    keys.push({ label, key })
  }
  // If API gave us labels, use them (prefers server-derived labels)
  if (monthlyGrowth.length === keys.length) {
    return monthlyGrowth.map((m, i) => ({ label: m.label, key: keys[i].key }))
  }
  return keys
}

function pctDelta(series: number[]): number | null {
  if (series.length < 2) return null
  const last = series[series.length - 1]
  const prev = series[series.length - 2]
  if (prev === 0) return last > 0 ? 100 : 0
  return ((last - prev) / prev) * 100
}

// ---------------------------------------------------------------------------
// Main module
// ---------------------------------------------------------------------------
export function SuperAdminModule() {
  const { data, loading, refetch } = useFetch<DashboardData>('/api/superadmin')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [detailSchool, setDetailSchool] = useState<SchoolListItem | null>(null)
  const [deleteSchool, setDeleteSchool] = useState<SchoolListItem | null>(null)
  const [busy, setBusy] = useState(false)

  const updateSchool = async (id: string, body: Record<string, unknown>, msg: string) => {
    setBusy(true)
    try {
      await apiPut(`/api/superadmin/${id}`, body)
      toast.success(msg)
      refetch()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteSchool) return
    setBusy(true)
    try {
      await apiDelete(`/api/superadmin/${deleteSchool.id}`)
      toast.success(`${deleteSchool.name} deleted`)
      setDeleteSchool(null)
      refetch()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Delete failed')
    } finally {
      setBusy(false)
    }
  }

  // Loading state
  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 rounded-xl lg:col-span-2" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  // Safe defaults — API uses safe() wrappers so this should always be populated,
  // but defensive programming avoids any UI crash from partial data.
  const summary = data.summary ?? ({} as DashboardData['summary'])
  const revenueByPlan = data.revenueByPlan ?? []
  const schoolsByPlan = data.schoolsByPlan ?? []
  const schoolsByStatus = data.schoolsByStatus ?? []
  const monthlyGrowth = data.monthlyGrowth ?? []
  const recentRegistrations = data.recentRegistrations ?? []
  const schools = data.schools ?? []

  const monthKeys = buildMonthKeys(monthlyGrowth)
  const monthlyRevenue = buildMonthlyRevenue(schools, monthKeys)
  const monthlyStudents = buildMonthlyStudents(schools, monthKeys)
  const monthlyTrials = buildMonthlyTrials(schools, monthKeys)

  const schoolsSpark = monthlyGrowth.map(m => m.count)
  const revenueSpark = monthlyRevenue.map(m => m.amount)
  const studentsSpark = monthlyStudents.map(m => m.count)
  const trialsSpark = monthlyTrials.map(m => m.count)

  const schoolsDelta = pctDelta(schoolsSpark)
  const revenueDelta = pctDelta(revenueSpark)
  const studentsDelta = pctDelta(studentsSpark)
  const trialsDelta = pctDelta(trialsSpark)

  const filtered = schools.filter(s => {
    if (search) {
      const q = search.toLowerCase()
      if (!s.name.toLowerCase().includes(q)
        && !s.slug.toLowerCase().includes(q)
        && !(s.county || '').toLowerCase().includes(q)
        && !(s.email || '').toLowerCase().includes(q)) return false
    }
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (planFilter !== 'all' && s.plan !== planFilter) return false
    return true
  })

  const totalRevenue = summary.totalRevenue || 0
  const totalSchools = summary.totalSchools || 0
  const totalStudents = summary.totalStudents || 0
  const trialSchools = summary.trialSchools || 0

  return (
    <div className="space-y-6">
      {/* ============================================================ */}
      {/* EXECUTIVE HERO HEADER                                          */}
      {/* ============================================================ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 p-6 text-white shadow-xl ring-1 ring-white/5 md:p-8">
        {/* Decorative grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '22px 22px' }}
        />
        {/* Glow accents */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-teal-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-emerald-300 ring-1 ring-white/15 backdrop-blur">
              <Shield className="h-3.5 w-3.5" />
              Platform Owner Console
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">SkulHub Platform Administration</h1>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate-300">
              Manage every school on the platform — monitor health, revenue, growth, and take action on subscriptions across the entire tenant fleet.
            </p>
          </div>

          {/* Quick KPI strip inside the hero */}
          <div className="flex flex-wrap gap-3">
            <HeroKpi
              icon={<Wallet className="h-3.5 w-3.5" />}
              label="MRR (All Schools)"
              value={formatKES(totalRevenue)}
              accent="emerald"
            />
            <HeroKpi
              icon={<Activity className="h-3.5 w-3.5" />}
              label="Active Schools"
              value={`${summary.activeSchools ?? 0} / ${totalSchools}`}
              accent="teal"
            />
            <HeroKpi
              icon={<Clock className="h-3.5 w-3.5" />}
              label="On Trial"
              value={`${trialSchools}`}
              accent="amber"
            />
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 4 STAT CARDS WITH SPARKLINES                                  */}
      {/* ============================================================ */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Schools"
          value={formatNumber(totalSchools)}
          icon={Building2}
          accent="emerald"
          sub={`${summary.activeSchools ?? 0} active · ${summary.suspendedSchools ?? 0} suspended`}
          spark={schoolsSpark}
          sparkColor="#10b981"
          delta={schoolsDelta}
        />
        <StatCard
          label="Total Revenue"
          value={formatKES(totalRevenue)}
          icon={Wallet}
          accent="teal"
          sub={`${formatNumber(summary.totalPayments ?? 0)} payments · all schools`}
          spark={revenueSpark}
          sparkColor="#14b8a6"
          delta={revenueDelta}
        />
        <StatCard
          label="Total Students"
          value={formatNumber(totalStudents)}
          icon={GraduationCap}
          accent="emerald"
          sub={`${formatNumber(summary.totalStaff ?? 0)} staff · ${formatNumber(summary.totalUsers ?? 0)} users`}
          spark={studentsSpark}
          sparkColor="#059669"
          delta={studentsDelta}
        />
        <StatCard
          label="Active Trials"
          value={formatNumber(trialSchools)}
          icon={Clock}
          accent="amber"
          sub={`${summary.expiredSchools ?? 0} expired · ${summary.suspendedSchools ?? 0} suspended`}
          spark={trialsSpark}
          sparkColor="#f59e0b"
          delta={trialsDelta}
        />
      </div>

      {/* ============================================================ */}
      {/* ROW A: REVENUE TREND AREA + SCHOOLS BY PLAN DONUT             */}
      {/* ============================================================ */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue trend — Area chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Wallet className="h-4 w-4" />
                  </span>
                  Revenue Trend
                </CardTitle>
                <CardDescription className="mt-1">
                  Cumulative revenue collected per month (last 6 months)
                </CardDescription>
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Total</div>
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{formatKES(totalRevenue)}</div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              {monthlyRevenue.length === 0 || monthlyRevenue.every(m => m.amount === 0) ? (
                <EmptyChartState message="No revenue recorded yet" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyRevenue} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                    <YAxis
                      tickFormatter={(v) => formatCompact(v as number)}
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      width={50}
                      tickLine={false}
                      axisLine={false}
                    />
                    <RTooltip
                      formatter={(v: number) => [formatKES(v), 'Revenue']}
                      contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fill="url(#revGrad)"
                      dot={{ r: 4, fill: '#059669', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Schools by Plan — Donut */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400">
                <Layers className="h-4 w-4" />
              </span>
              Schools by Plan
            </CardTitle>
            <CardDescription>Distribution across subscription tiers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              {schoolsByPlan.length === 0 || schoolsByPlan.every(p => (p.count || 0) === 0) ? (
                <EmptyChartState message="No schools yet" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={schoolsByPlan.map(p => ({ ...p, name: p.plan }))}
                      dataKey="count"
                      nameKey="plan"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={3}
                    >
                      {schoolsByPlan.map((entry) => (
                        <Cell key={entry.plan} fill={PLAN_DOT_COLOR[entry.plan] || '#94a3b8'} stroke="hsl(var(--background))" strokeWidth={2} />
                      ))}
                    </Pie>
                    <RTooltip
                      formatter={(v: number, n: string) => [`${v} school${v === 1 ? '' : 's'}`, n]}
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
            {/* Plan breakdown mini-table */}
            <div className="mt-3 space-y-1.5">
              {schoolsByPlan.map(p => {
                const total = schoolsByPlan.reduce((sum, x) => sum + (x.count || 0), 0) || 1
                const pct = ((p.count || 0) / total) * 100
                return (
                  <div key={p.plan} className="flex items-center gap-2 text-xs">
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: PLAN_DOT_COLOR[p.plan] || '#94a3b8' }} />
                    <span className="text-muted-foreground">{p.plan}</span>
                    <div className="ml-auto flex items-center gap-2">
                      <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: PLAN_DOT_COLOR[p.plan] || '#94a3b8' }} />
                      </div>
                      <span className="w-6 text-right font-semibold tabular-nums">{p.count}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* ROW B: MONTHLY GROWTH AREA + SCHOOLS BY STATUS BAR           */}
      {/* ============================================================ */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Monthly growth — Area chart */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-4 w-4" />
                  </span>
                  Monthly Growth
                </CardTitle>
                <CardDescription className="mt-1">New schools registered per month (last 6 months)</CardDescription>
              </div>
              <div className="hidden text-right sm:block">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Last month</div>
                <div className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                  {monthlyGrowth.length > 0 ? `+${monthlyGrowth[monthlyGrowth.length - 1].count}` : '+0'}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              {monthlyGrowth.length === 0 ? (
                <EmptyChartState message="No growth data yet" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyGrowth} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={28} tickLine={false} axisLine={false} />
                    <RTooltip
                      formatter={(v: number) => [`${v} new school${v === 1 ? '' : 's'}`, 'Registered']}
                      contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      stroke="#14b8a6"
                      strokeWidth={2.5}
                      fill="url(#growthGrad)"
                      dot={{ r: 4, fill: '#14b8a6', stroke: 'hsl(var(--background))', strokeWidth: 2 }}
                      activeDot={{ r: 6 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Schools by status — Bar chart */}
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Activity className="h-4 w-4" />
              </span>
              By Status
            </CardTitle>
            <CardDescription>Across {totalSchools} schools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              {schoolsByStatus.length === 0 || schoolsByStatus.every(s => (s.value || 0) === 0) ? (
                <EmptyChartState message="No schools yet" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={schoolsByStatus} margin={{ top: 10, right: 6, left: -16, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={36} tickLine={false} axisLine={false} />
                    <RTooltip
                      formatter={(v: number, n: string) => [`${v} school${v === 1 ? '' : 's'}`, n]}
                      cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                      contentStyle={{ borderRadius: 12, border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))' }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={56}>
                      {schoolsByStatus.map((entry) => (
                        <Cell key={entry.name} fill={entry.color || STATUS_COLOR[entry.name] || '#94a3b8'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ============================================================ */}
      {/* RECENT REGISTRATIONS — TABLE                                  */}
      {/* ============================================================ */}
      <Card className="shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Rocket className="h-4 w-4" />
                </span>
                Recent Registrations
              </CardTitle>
              <CardDescription className="mt-1">Latest schools to join the platform</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="hidden sm:inline-flex" onClick={() => {
              const scrollEl = document.getElementById('schools-table')
              scrollEl?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }}>
              View all <ArrowRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">School</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">County</TableHead>
                  <TableHead className="hidden md:table-cell">Students</TableHead>
                  <TableHead className="pr-6 text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentRegistrations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No registrations yet.
                    </TableCell>
                  </TableRow>
                )}
                {recentRegistrations.map(r => (
                  <TableRow
                    key={r.id}
                    onClick={() => setDetailSchool(schools.find(s => s.id === r.id) || null)}
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                  >
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <SchoolInitials name={r.name} />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{r.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{r.slug}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><PlanBadge plan={r.plan} /></TableCell>
                    <TableCell><StatusBadge status={r.status} /></TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {r.county || '—'}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell tabular-nums">{r.studentCount}</TableCell>
                    <TableCell className="pr-6 text-right">
                      <span className="text-xs text-muted-foreground">{timeAgo(r.createdAt)}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ============================================================ */}
      {/* SCHOOLS TABLE — searchable, filterable                         */}
      {/* ============================================================ */}
      <Card id="schools-table" className="shadow-sm scroll-mt-4">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <Building2 className="h-4 w-4" />
                </span>
                All Schools
                <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
              </CardTitle>
              <CardDescription className="mt-1">
                Manage subscriptions, status & access for every school on the platform
              </CardDescription>
            </div>
          </div>

          {/* Filter bar */}
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, county, or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Trial">Trial</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
              <Select value={planFilter} onValueChange={setPlanFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Plans" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Plans</SelectItem>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
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
                  <TableHead className="pl-6">School</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Students</TableHead>
                  <TableHead className="text-right">Users</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                  <TableHead className="pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                      No schools match your filters.
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(s => (
                  <TableRow
                    key={s.id}
                    onClick={() => setDetailSchool(s)}
                    className="group cursor-pointer transition-colors hover:bg-muted/40"
                  >
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <SchoolInitials name={s.name} />
                        <div className="min-w-0">
                          <p className="truncate font-medium group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{s.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {s.county || 'No county'} · {timeAgo(s.createdAt)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><PlanBadge plan={s.plan} /></TableCell>
                    <TableCell><StatusBadge status={s.status} /></TableCell>
                    <TableCell className="text-right tabular-nums">{s.studentCount}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.userCount}</TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {formatKES(s.revenue)}
                    </TableCell>
                    <TableCell className="hidden text-xs text-muted-foreground lg:table-cell">
                      {s.lastLoginAt ? timeAgo(s.lastLoginAt) : 'never'}
                    </TableCell>
                    <TableCell className="pr-6 text-right" onClick={e => e.stopPropagation()}>
                      <SchoolActions
                        school={s}
                        busy={busy}
                        onView={() => setDetailSchool(s)}
                        onActivate={() => updateSchool(s.id, { status: 'Active' }, `${s.name} activated`)}
                        onSuspend={() => updateSchool(s.id, { status: 'Suspended' }, `${s.name} suspended`)}
                        onUpgrade={(plan) => updateSchool(s.id, { plan }, `${s.name} upgraded to ${plan}`)}
                        onDelete={() => setDeleteSchool(s)}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y md:hidden">
            {filtered.length === 0 && (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">No schools match your filters.</p>
            )}
            {filtered.map(s => (
              <div key={s.id} className="p-4">
                <div className="flex items-start gap-3">
                  <SchoolInitials name={s.name} className="h-10 w-10" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.county || 'No county'} · {timeAgo(s.createdAt)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <PlanBadge plan={s.plan} />
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-muted-foreground">Students</div>
                        <div className="font-semibold tabular-nums">{s.studentCount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Users</div>
                        <div className="font-semibold tabular-nums">{s.userCount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Revenue</div>
                        <div className="font-semibold text-emerald-700 dark:text-emerald-400">{formatKES(s.revenue)}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex justify-end">
                  <SchoolActions
                    school={s}
                    busy={busy}
                    onView={() => setDetailSchool(s)}
                    onActivate={() => updateSchool(s.id, { status: 'Active' }, `${s.name} activated`)}
                    onSuspend={() => updateSchool(s.id, { status: 'Suspended' }, `${s.name} suspended`)}
                    onUpgrade={(plan) => updateSchool(s.id, { plan }, `${s.name} upgraded to ${plan}`)}
                    onDelete={() => setDeleteSchool(s)}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* DETAIL DIALOG */}
      <SchoolDetailDialog
        school={detailSchool}
        onOpenChange={(o) => !o && setDetailSchool(null)}
        onMutated={refetch}
      />

      {/* DELETE CONFIRM */}
      <AlertDialog open={!!deleteSchool} onOpenChange={(o) => !o && setDeleteSchool(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-rose-600" />
              Delete {deleteSchool?.name}?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the school and all its user accounts, invoices, and payments.
              Students and staff records will be detached (schoolId cleared) but kept in the database for audit.
              <span className="mt-2 block font-medium text-rose-700 dark:text-rose-400">This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              disabled={busy}
              onClick={(e) => { e.preventDefault(); handleDelete() }}
            >
              {busy ? 'Deleting…' : <><Trash2 className="mr-1.5 h-4 w-4" /> Delete School</>}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Platform Insights — trials, analytics, activity feed */}
      <div className="mt-8 border-t pt-6">
        <SuperAdminEnhanced />
        <div className="mt-8">
          <SuperAdminExtras />
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Hero KPI — small badge inside the header
// ---------------------------------------------------------------------------
function HeroKpi({ icon, label, value, accent }: {
  icon: React.ReactNode
  label: string
  value: string
  accent: 'emerald' | 'teal' | 'amber'
}) {
  const a: Record<string, string> = {
    emerald: 'text-emerald-300',
    teal: 'text-teal-300',
    amber: 'text-amber-300',
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

// ---------------------------------------------------------------------------
// Stat card — with sparkline + delta
// ---------------------------------------------------------------------------
function StatCard({ label, value, icon: Icon, accent, sub, spark, sparkColor, delta }: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  accent: 'emerald' | 'teal' | 'amber'
  sub?: string
  spark: number[]
  sparkColor: string
  delta?: number | null
}) {
  const a: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
    teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 ring-teal-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
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

// ---------------------------------------------------------------------------
// Empty chart state — for graceful null/empty data handling
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// School row actions (view + activate/suspend/upgrade/delete dropdown)
// ---------------------------------------------------------------------------
function SchoolActions({ school, busy, onView, onActivate, onSuspend, onUpgrade, onDelete }: {
  school: SchoolListItem
  busy: boolean
  onView: () => void
  onActivate: () => void
  onSuspend: () => void
  onUpgrade: (plan: string) => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <TooltipProvider delayDuration={300}>
        {school.status !== 'Active' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10" disabled={busy} onClick={onActivate} aria-label="Activate">
                <PlayCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Activate</TooltipContent>
          </Tooltip>
        )}
        {school.status !== 'Suspended' && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8 text-amber-600 hover:bg-amber-500/10" disabled={busy} onClick={onSuspend} aria-label="Suspend">
                <PauseCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Suspend</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600 hover:bg-emerald-500/10" disabled={busy} onClick={() => onUpgrade(school.plan === 'Starter' ? 'Standard' : school.plan === 'Standard' ? 'Premium' : 'Enterprise')} aria-label="Upgrade plan">
              <ArrowUpCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Upgrade Plan</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="More actions">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={onView}><Eye className="mr-2 h-4 w-4" /> View Details</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs">Set Status</DropdownMenuLabel>
          <DropdownMenuItem onClick={onActivate} disabled={school.status === 'Active'}><PlayCircle className="mr-2 h-4 w-4 text-emerald-600" /> Activate</DropdownMenuItem>
          <DropdownMenuItem onClick={onSuspend} disabled={school.status === 'Suspended'}><PauseCircle className="mr-2 h-4 w-4 text-amber-600" /> Suspend</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel className="text-xs">Upgrade to Plan</DropdownMenuLabel>
          {['Starter', 'Standard', 'Premium', 'Enterprise'].filter(p => p !== school.plan).map(p => (
            <DropdownMenuItem key={p} onClick={() => onUpgrade(p)}>
              {p === 'Enterprise' ? <Crown className="mr-2 h-4 w-4 text-amber-600" /> : p === 'Premium' ? <Sparkles className="mr-2 h-4 w-4 text-emerald-600" /> : <ArrowUpCircle className="mr-2 h-4 w-4" />}
              {p}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem className="text-rose-600 focus:text-rose-600" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" /> Delete School
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

// ---------------------------------------------------------------------------
// School Detail Dialog
// ---------------------------------------------------------------------------
function SchoolDetailDialog({ school, onOpenChange, onMutated }: {
  school: SchoolListItem | null
  onOpenChange: (o: boolean) => void
  onMutated: () => void
}) {
  const { data, loading } = useFetch<SchoolDetail>(school ? `/api/superadmin/${school.id}` : null, [school?.id])
  const [busy, setBusy] = useState(false)

  const update = async (body: Record<string, unknown>, msg: string) => {
    if (!school) return
    setBusy(true)
    try {
      await apiPut(`/api/superadmin/${school.id}`, body)
      toast.success(msg)
      onMutated()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={!!school} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[95vh] max-w-4xl overflow-y-auto p-0">
        {loading || !data || !school ? (
          <div className="space-y-4 p-6">
            <Skeleton className="h-28 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-emerald-950 via-teal-950 to-slate-950 p-6 text-white">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-teal-500/20 blur-3xl" />
              <div className="relative z-10 flex items-start gap-4">
                <Avatar className="h-14 w-14 ring-2 ring-white/20">
                  <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white">
                    {data.school.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-xl font-bold text-white">{data.school.name}</DialogTitle>
                  <DialogDescription className="mt-0.5 text-sm text-slate-300">
                    {data.school.slug} · {data.school.county || 'No county'}
                  </DialogDescription>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <PlanBadge plan={data.school.plan} />
                    <StatusBadge status={data.school.status} />
                    {data.school.trialEndsAt && (
                      <span className="rounded-md bg-white/10 px-2 py-0.5 text-xs text-amber-200 ring-1 ring-white/10">
                        Trial ends {formatDate(data.school.trialEndsAt)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="relative z-10 mt-4 flex flex-wrap gap-2">
                {data.school.status !== 'Active' && (
                  <Button size="sm" disabled={busy} onClick={() => update({ status: 'Active' }, 'School activated')}
                    className="bg-emerald-600 hover:bg-emerald-700">
                    <PlayCircle className="mr-1.5 h-3.5 w-3.5" /> Activate
                  </Button>
                )}
                {data.school.status !== 'Suspended' && (
                  <Button size="sm" variant="secondary" disabled={busy} onClick={() => update({ status: 'Suspended' }, 'School suspended')}>
                    <PauseCircle className="mr-1.5 h-3.5 w-3.5" /> Suspend
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="outline" disabled={busy}>
                      <ArrowUpCircle className="mr-1.5 h-3.5 w-3.5" /> Upgrade Plan
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {['Starter', 'Standard', 'Premium', 'Enterprise'].filter(p => p !== data.school.plan).map(p => (
                      <DropdownMenuItem key={p} onClick={() => update({ plan: p }, `Plan changed to ${p}`)}>
                        {p === 'Enterprise' ? <Crown className="mr-2 h-4 w-4 text-amber-600" /> : p === 'Premium' ? <Sparkles className="mr-2 h-4 w-4 text-emerald-600" /> : <ArrowUpCircle className="mr-2 h-4 w-4" />}
                        {p}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Dialog body */}
            <div className="space-y-4 p-6">
              {/* Quick stats */}
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                <MiniStat label="Users" value={data.stats.userCount} icon={Users} accent="emerald" />
                <MiniStat label="Students" value={data.stats.studentCount} icon={GraduationCap} accent="teal" />
                <MiniStat label="Staff" value={data.stats.staffCount} icon={UserCog} accent="amber" />
                <MiniStat label="Invoices" value={data.stats.invoiceCount} icon={FileText} accent="violet" />
                <MiniStat label="Payments" value={data.stats.paymentCount} icon={Banknote} accent="emerald" />
                <MiniStat label="Billed" value={formatKES(data.stats.totalBilled)} icon={Wallet} accent="teal" />
                <MiniStat label="Collected" value={formatKES(data.stats.totalCollected)} icon={CheckCircle2} accent="emerald" />
                <MiniStat label="Outstanding" value={formatKES(data.stats.totalOutstanding)} icon={AlertTriangle} accent="rose" />
              </div>

              {/* Two columns */}
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Contact + meta */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">School Information</CardTitle></CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <InfoRow icon={Mail} label="Email" value={data.school.email || '—'} />
                    <InfoRow icon={Phone} label="Phone" value={data.school.phone || '—'} />
                    <InfoRow icon={MapPin} label="Address" value={data.school.address || '—'} />
                    <InfoRow icon={MapPin} label="County" value={data.school.county || '—'} />
                    <InfoRow icon={CalendarDays} label="Joined" value={`${formatDate(data.school.createdAt)} (${timeAgo(data.school.createdAt)})`} />
                    <InfoRow icon={Building2} label="Max Students" value={String(data.school.maxStudents)} />
                  </CardContent>
                </Card>

                {/* Revenue trend */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Revenue Trend (6 months)</CardTitle>
                    <CardDescription>Total: {formatKES(data.stats.totalRevenue)}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-40">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.revenueTrend} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="detailRevGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#059669" stopOpacity={1} />
                              <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.7} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                          <YAxis tickFormatter={(v) => formatCompact(v as number)} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={50} tickLine={false} axisLine={false} />
                          <RTooltip
                            formatter={(v: number) => [formatKES(v), 'Revenue']}
                            contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))' }}
                            cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                          />
                          <Bar dataKey="amount" fill="url(#detailRevGrad)" radius={[6, 6, 0, 0]} maxBarSize={36} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Recent payments */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Payments</CardTitle></CardHeader>
                  <CardContent>
                    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                      {data.recentPayments.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No payments yet.</p>}
                      {data.recentPayments.map(p => (
                        <div key={p.id} className="flex items-center gap-3 rounded-lg border p-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                            <Banknote className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{p.payerName || p.reference || p.method}</p>
                            <p className="truncate text-xs text-muted-foreground">{p.method} · {timeAgo(p.receivedAt)}</p>
                          </div>
                          <div className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{formatKES(p.amount)}</div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Users list */}
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm">User Accounts ({data.users.length})</CardTitle></CardHeader>
                  <CardContent>
                    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                      {data.users.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">No user accounts.</p>}
                      {data.users.map(u => (
                        <div key={u.id} className="flex items-center gap-3 rounded-lg border p-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] font-semibold text-white">
                              {u.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{u.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                          </div>
                          <div className="flex flex-col items-end gap-0.5">
                            <Badge variant="outline" className="text-[10px]">{u.role}</Badge>
                            <span className="text-[10px] text-muted-foreground">{u.lastLoginAt ? timeAgo(u.lastLoginAt) : 'never'}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Close</Button>
                </DialogClose>
              </DialogFooter>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Small detail-dialog helpers
// ---------------------------------------------------------------------------
function MiniStat({ label, value, icon: Icon, accent }: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  accent: 'emerald' | 'teal' | 'amber' | 'violet' | 'rose'
}) {
  const a: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    violet: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  }
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="truncate text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', a[accent])}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <p className="mt-1 truncate text-lg font-bold tabular-nums">{value}</p>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 truncate font-medium">{value}</span>
    </div>
  )
}
