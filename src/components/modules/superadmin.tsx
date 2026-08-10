'use client'
import { useState } from 'react'
import { useFetch, apiPut, apiDelete } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
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
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip as RTooltip, ResponsiveContainer, Legend, LineChart, Line,
} from 'recharts'
import {
  Shield, Building2, CheckCircle2, Clock, Users, Wallet, TrendingUp,
  MoreVertical, Trash2, ArrowUpCircle, PauseCircle, PlayCircle,
  Crown, Sparkles, Eye, Search, MapPin, Mail, Phone, CalendarDays,
  GraduationCap, UserCog, Banknote, FileText, AlertTriangle, ChevronRight,
  Server, Activity, Rocket,
} from 'lucide-react'
import { formatKES, formatNumber, formatDate, timeAgo, cn } from '@/lib/format'
import { toast } from 'sonner'

// ---------------------------------------------------------------------------
// Types
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
// Helpers
// ---------------------------------------------------------------------------
const PLAN_COLOR: Record<string, string> = {
  Starter: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Standard: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300',
  Premium: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
  Enterprise: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
}

const PLAN_BAR_COLOR: Record<string, string> = {
  Starter: '#64748b', Standard: '#14b8a6', Premium: '#059669', Enterprise: '#f59e0b',
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase()
  const styles: Record<string, string> = {
    active: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300',
    trial: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
    suspended: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
    expired: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  }
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold', styles[s] || styles.expired)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', s === 'active' ? 'bg-emerald-500' : s === 'trial' ? 'bg-amber-500' : s === 'suspended' ? 'bg-rose-500' : 'bg-slate-400')} />
      {status}
    </span>
  )
}

function PlanBadge({ plan }: { plan: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold', PLAN_COLOR[plan] || PLAN_COLOR.Starter)}>
      {plan === 'Enterprise' && <Crown className="h-3 w-3" />}
      {plan === 'Premium' && <Sparkles className="h-3 w-3" />}
      {plan}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Main module
// ---------------------------------------------------------------------------
export function SuperAdminModule() {
  const { data, loading, refetch } = useFetch<DashboardData>('/api/superadmin')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [planFilter, setPlanFilter] = useState<string>('')
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

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 rounded-xl lg:col-span-2" />
          <Skeleton className="h-72 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  const { summary, revenueByPlan, schoolsByStatus, monthlyGrowth, recentRegistrations, schools } = data

  const filtered = schools.filter(s => {
    if (search) {
      const q = search.toLowerCase()
      if (!s.name.toLowerCase().includes(q) && !s.slug.toLowerCase().includes(q) && !s.county?.toLowerCase().includes(q) && !s.email?.toLowerCase().includes(q)) return false
    }
    if (statusFilter && s.status !== statusFilter) return false
    if (planFilter && s.plan !== planFilter) return false
    return true
  })

  return (
    <div className="space-y-6">
      {/* DARK PREMIUM HEADER */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950 p-6 text-white shadow-xl md:p-8">
        {/* Decorative grid */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '24px 24px' }} />
        {/* Glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />

        <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300 ring-1 ring-white/10 backdrop-blur">
              <Shield className="h-3.5 w-3.5" />
              Platform Owner
            </div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Platform Administration</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-300">
              Manage every school on EduManage Pro — monitor health, revenue, growth, and take action on subscriptions.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 backdrop-blur">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                <Server className="h-3 w-3" /> Total Revenue
              </div>
              <div className="mt-1 text-xl font-bold text-white">{formatKES(summary.totalRevenue)}</div>
            </div>
            <div className="rounded-xl bg-white/5 px-4 py-3 ring-1 ring-white/10 backdrop-blur">
              <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-300">
                <Activity className="h-3 w-3" /> Active Schools
              </div>
              <div className="mt-1 text-xl font-bold text-white">{summary.activeSchools}<span className="ml-1 text-sm text-slate-400">/ {summary.totalSchools}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* 5 STAT CARDS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="Total Schools" value={formatNumber(summary.totalSchools)} icon={Building2} accent="emerald" sub={`${summary.activeSchools} active`} />
        <StatTile label="Active" value={formatNumber(summary.activeSchools)} icon={CheckCircle2} accent="emerald" sub={`${summary.suspendedSchools} suspended`} />
        <StatTile label="On Trial" value={formatNumber(summary.trialSchools)} icon={Clock} accent="amber" sub={`${summary.expiredSchools} expired`} />
        <StatTile label="Total Students" value={formatNumber(summary.totalStudents)} icon={Users} accent="teal" sub={`${formatNumber(summary.totalStaff)} staff`} />
        <StatTile label="Total Revenue" value={formatKES(summary.totalRevenue)} icon={Wallet} accent="emerald" sub={`${formatNumber(summary.totalPayments)} payments`} />
      </div>

      {/* CHARTS ROW */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Revenue by Plan — Bar */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="h-4 w-4 text-emerald-600" /> Revenue by Plan
            </CardTitle>
            <CardDescription>Cumulative payment revenue collected per subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByPlan} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="plan" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tickFormatter={(v) => formatKES(v as number).replace('KES ', '')} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={60} />
                  <RTooltip
                    formatter={(v: number) => [formatKES(v), 'Revenue']}
                    contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))', color: 'hsl(var(--popover-foreground))' }}
                  />
                  <Bar dataKey="amount" radius={[8, 8, 0, 0]} maxBarSize={80}>
                    {revenueByPlan.map((entry) => (
                      <Cell key={entry.plan} fill={PLAN_BAR_COLOR[entry.plan] || '#64748b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Schools by Status — Donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-teal-600" /> Schools by Status
            </CardTitle>
            <CardDescription>Distribution across {summary.totalSchools} schools</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={schoolsByStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                    {schoolsByStatus.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} stroke="hsl(var(--background))" strokeWidth={2} />
                    ))}
                  </Pie>
                  <RTooltip
                    formatter={(v: number, n: string) => [`${v} school${v === 1 ? '' : 's'}`, n]}
                    contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {schoolsByStatus.map(s => (
                <div key={s.name} className="flex items-center gap-1.5 text-xs">
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="ml-auto font-semibold">{s.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MONTHLY GROWTH + RECENT REGISTRATIONS */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4 text-emerald-600" /> Monthly Growth
            </CardTitle>
            <CardDescription>New schools registered per month (last 6 months)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={28} />
                  <RTooltip
                    formatter={(v: number) => [`${v} new school${v === 1 ? '' : 's'}`, 'Registered']}
                    contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--popover))' }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#059669" strokeWidth={3} dot={{ r: 5, fill: '#059669' }} activeDot={{ r: 7 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Registrations */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Rocket className="h-4 w-4 text-amber-600" /> Recent Registrations
            </CardTitle>
            <CardDescription>Latest schools to join the platform</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
              {recentRegistrations.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No registrations yet.</p>
              )}
              {recentRegistrations.map(r => (
                <button
                  key={r.id}
                  onClick={() => setDetailSchool(schools.find(s => s.id === r.id) || null)}
                  className="flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-colors hover:bg-muted/50"
                >
                  <Avatar className="h-9 w-9 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-semibold text-white">
                      {r.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.county || '—'} · {timeAgo(r.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <PlanBadge plan={r.plan} />
                    <span className="text-[10px] text-muted-foreground">{r.studentCount} students</span>
                  </div>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SCHOOLS TABLE */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4 text-emerald-600" /> All Schools
                <Badge variant="secondary" className="ml-1">{filtered.length}</Badge>
              </CardTitle>
              <CardDescription>Manage subscriptions, status & access for every school</CardDescription>
            </div>
          </div>
          {/* Filter bar */}
          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
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
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Trial">Trial</option>
                <option value="Suspended">Suspended</option>
                <option value="Expired">Expired</option>
              </select>
              <select
                value={planFilter}
                onChange={e => setPlanFilter(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="">All Plans</option>
                <option value="Starter">Starter</option>
                <option value="Standard">Standard</option>
                <option value="Premium">Premium</option>
                <option value="Enterprise">Enterprise</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Desktop table */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead className="border-y bg-muted/30 text-xs uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">School</th>
                  <th className="px-4 py-3 text-left font-semibold">Plan</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Trial Ends</th>
                  <th className="px-4 py-3 text-right font-semibold">Users</th>
                  <th className="px-4 py-3 text-right font-semibold">Students</th>
                  <th className="px-4 py-3 text-right font-semibold">Revenue</th>
                  <th className="px-4 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-12 text-center text-muted-foreground">
                      No schools match your filters.
                    </td>
                  </tr>
                )}
                {filtered.map(s => (
                  <tr key={s.id} className="group transition-colors hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <button onClick={() => setDetailSchool(s)} className="flex items-center gap-3 text-left">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-semibold text-white">
                            {s.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate font-medium group-hover:text-emerald-700 dark:group-hover:text-emerald-400">{s.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {s.county || 'No county'} · {timeAgo(s.createdAt)}
                          </p>
                        </div>
                      </button>
                    </td>
                    <td className="px-4 py-3"><PlanBadge plan={s.plan} /></td>
                    <td className="px-4 py-3"><StatusBadge status={s.status} /></td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {s.trialEndsAt ? formatDate(s.trialEndsAt) : <span className="text-muted-foreground/50">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.userCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{s.studentCount}</td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-emerald-700 dark:text-emerald-400">{formatKES(s.revenue)}</td>
                    <td className="px-4 py-3 text-right">
                      <SchoolActions
                        school={s}
                        busy={busy}
                        onView={() => setDetailSchool(s)}
                        onActivate={() => updateSchool(s.id, { status: 'Active' }, `${s.name} activated`)}
                        onSuspend={() => updateSchool(s.id, { status: 'Suspended' }, `${s.name} suspended`)}
                        onUpgrade={(plan) => updateSchool(s.id, { plan }, `${s.name} upgraded to ${plan}`)}
                        onDelete={() => setDeleteSchool(s)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="divide-y md:hidden">
            {filtered.length === 0 && (
              <p className="px-4 py-12 text-center text-sm text-muted-foreground">No schools match your filters.</p>
            )}
            {filtered.map(s => (
              <div key={s.id} className="p-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-semibold text-white">
                      {s.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{s.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{s.county || 'No county'} · {timeAgo(s.createdAt)}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <PlanBadge plan={s.plan} />
                      <StatusBadge status={s.status} />
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                      <div><div className="text-muted-foreground">Users</div><div className="font-semibold">{s.userCount}</div></div>
                      <div><div className="text-muted-foreground">Students</div><div className="font-semibold">{s.studentCount}</div></div>
                      <div><div className="text-muted-foreground">Revenue</div><div className="font-semibold text-emerald-700 dark:text-emerald-400">{formatKES(s.revenue)}</div></div>
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
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stat tile
// ---------------------------------------------------------------------------
function StatTile({ label, value, icon: Icon, accent, sub }: {
  label: string
  value: string
  icon: React.ComponentType<{ className?: string }>
  accent: 'emerald' | 'teal' | 'amber'
  sub?: string
}) {
  const a: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-emerald-500/20',
    teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400 ring-teal-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 ring-amber-500/20',
  }
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1 truncate text-xl font-bold tracking-tight md:text-2xl">{value}</p>
            {sub && <p className="mt-0.5 truncate text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1', a[accent])}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
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
            <Button size="icon" variant="ghost" className="h-8 w-8 text-violet-600 hover:bg-violet-500/10" disabled={busy} onClick={() => onUpgrade(school.plan === 'Starter' ? 'Standard' : school.plan === 'Standard' ? 'Premium' : 'Enterprise')} aria-label="Upgrade plan">
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
      <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
        {loading || !data || !school ? (
          <div className="space-y-4 py-8">
            <Skeleton className="h-28 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="relative -mx-6 -mt-6 overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950 p-6 text-white">
              <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
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
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                        <YAxis tickFormatter={(v) => formatKES(v as number).replace('KES ', '')} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" width={50} />
                        <RTooltip formatter={(v: number) => [formatKES(v), 'Revenue']} contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
                        <Bar dataKey="amount" fill="#059669" radius={[6, 6, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* Recent payments */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm">Recent Payments</CardTitle></CardHeader>
                <CardContent>
                  <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
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
                  <div className="max-h-56 space-y-2 overflow-y-auto pr-1">
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
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

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
