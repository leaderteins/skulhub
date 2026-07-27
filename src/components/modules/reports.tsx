'use client'
import { useFetch } from '@/lib/api'
import {
  cn,
  formatKES,
  formatNumber,
  formatCompact,
  timeAgo,
} from '@/lib/format'
import { SectionHeader } from '@/components/shared'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { toast } from 'sonner'
import {
  BarChart3,
  FileText,
  Download,
  FileSpreadsheet,
  FileBarChart,
  Wallet,
  GraduationCap,
  CalendarCheck,
  BookMarked,
  Users,
  Activity,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  CircleDollarSign,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import type { LucideIcon } from 'lucide-react'

// ---------------------------------------------------------------------------
// Types — mirror of /api/reports response
// ---------------------------------------------------------------------------
interface ReportsData {
  generatedAt: string
  enrollment: {
    totalStudents: number
    gender: { gender: string; count: number }[]
    byClassLevel: { id: string; name: string; stage: string; capacity: number; enrolled: number }[]
    boarding: number
    dayScholars: number
  }
  attendance: {
    overallRate: number
    trend: { date: string; rate: number }[]
    byStream: {
      streamId: string
      streamName: string
      classLevelName: string
      enrolled: number
      present: number
      absent: number
      late: number
      rate: number
    }[]
    totalRecords: number
  }
  academics: {
    latestExam: { id: string; name: string; academicYear: string; term: string; examType: string } | null
    gradeDistribution: { grade: string; count: number }[]
    topSubjects: { subjectId: string; subjectName: string; subjectCode: string; avg: number; count: number }[]
    bottomSubjects: { subjectId: string; subjectName: string; subjectCode: string; avg: number; count: number }[]
    subjectPerformanceAll: { subjectId: string; subjectName: string; subjectCode: string; avg: number; count: number }[]
    totalGrades: number
  }
  finance: {
    totalBilled: number
    totalCollected: number
    totalOutstanding: number
    collectionRate: number
    monthly: { month: string; revenue: number; expense: number }[]
    outstandingByClassLevel: { level: string; amount: number }[]
    expenseBreakdown: { category: string; amount: number }[]
    totalExpenses6M: number
  }
  library: {
    booksByCategory: { category: string; total: number; available: number }[]
    loansThisMonth: number
    overdueCount: number
    loansTrend: { month: string; loans: number }[]
    totalCopies: number
    availableCopies: number
  }
  staff: {
    byRole: { role: string; count: number }[]
    byDepartment: { name: string; count: number }[]
    total: number
  }
  activities: {
    id: string
    action: string
    entity: string
    entityId: string | null
    user: string | null
    details: string | null
    createdAt: string
  }[]
}

// Color palette — emerald/teal/cyan/amber/orange/rose family
const PALETTE = ['#059669', '#0d9488', '#14b8a6', '#0ea5e9', '#f59e0b', '#f97316', '#ef4444', '#d97706', '#84cc16', '#06b6d4', '#10b981', '#22d3ee']
const GENDER_COLORS: Record<string, string> = { Male: '#0d9488', Female: '#d97706' }

function gradeColorHex(grade: string): string {
  if (grade.startsWith('A')) return '#059669'
  if (grade.startsWith('B')) return '#10b981'
  if (grade.startsWith('C')) return '#14b8a6'
  if (grade.startsWith('D')) return '#f59e0b'
  return '#ef4444'
}

function formatChartKES(v: number): string {
  if (Math.abs(v) >= 1_000_000) return `KES ${(v / 1_000_000).toFixed(1)}M`
  if (Math.abs(v) >= 1_000) return `KES ${(v / 1_000).toFixed(0)}K`
  return `KES ${v}`
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------
export function ReportsModule() {
  const { data, loading } = useFetch<ReportsData>('/api/reports')

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    )
  }

  return <ReportsContent data={data} />
}

function ReportsContent({ data }: { data: ReportsData }) {
  function exportReport(format: 'PDF' | 'Excel' | 'CSV') {
    toast.success(`Report exported as ${format}`, {
      description: `${data.enrollment.totalStudents} students · KES ${formatCompact(data.finance.totalCollected)} collected`,
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Reports & Analytics"
        description="Comprehensive school performance insights across academics, finance, attendance and more"
        icon={BarChart3}
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => exportReport('PDF')}>
              <FileText className="mr-1.5 h-4 w-4" /> PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportReport('Excel')}>
              <FileSpreadsheet className="mr-1.5 h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportReport('CSV')}>
              <FileBarChart className="mr-1.5 h-4 w-4" /> CSV
            </Button>
            <Button size="sm" onClick={() => exportReport('PDF')}>
              <Download className="mr-1.5 h-4 w-4" /> Export Report
            </Button>
          </div>
        }
      />

      {/* Quick stats strip */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <QuickStat
          icon={GraduationCap}
          label="Total Students"
          value={formatNumber(data.enrollment.totalStudents)}
          sub={`${data.enrollment.boarding} boarding`}
          accent="emerald"
        />
        <QuickStat
          icon={CircleDollarSign}
          label="Collection Rate"
          value={`${data.finance.collectionRate}%`}
          sub={formatKES(data.finance.totalCollected)}
          accent="teal"
          trend={data.finance.collectionRate >= 80 ? 1 : -1}
        />
        <QuickStat
          icon={CalendarCheck}
          label="Attendance Rate"
          value={`${data.attendance.overallRate}%`}
          sub={`${data.attendance.totalRecords} records (30d)`}
          accent="cyan"
          trend={data.attendance.overallRate >= 85 ? 1 : -1}
        />
        <QuickStat
          icon={BookMarked}
          label="Active Loans"
          value={formatNumber(data.library.loansThisMonth)}
          sub={`${data.library.overdueCount} overdue`}
          accent="amber"
          trend={data.library.overdueCount === 0 ? 1 : -1}
        />
      </div>

      {/* Report grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <AcademicPerformanceCard data={data} />
        <FinancialHealthCard data={data} />
        <AttendanceOverviewCard data={data} />
        <EnrollmentDemographicsCard data={data} />
        <LibraryUsageCard data={data} />
        <StaffCompositionCard data={data} />
      </div>

      {/* Recent activity table */}
      <RecentActivityCard activities={data.activities} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Quick stat tile
// ---------------------------------------------------------------------------
function QuickStat({
  icon: Icon, label, value, sub, accent, trend,
}: {
  icon: LucideIcon
  label: string
  value: string
  sub?: string
  accent: 'emerald' | 'teal' | 'amber' | 'cyan'
  trend?: 1 | -1
}) {
  const map = {
    emerald: 'bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400',
    teal: 'bg-teal-500/10 text-teal-600 ring-teal-500/20 dark:text-teal-400',
    amber: 'bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400',
    cyan: 'bg-cyan-500/10 text-cyan-600 ring-cyan-500/20 dark:text-cyan-400',
  }
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-center gap-3 p-4">
        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1', map[accent])}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="text-lg font-bold tracking-tight">{value}</p>
        </div>
        {trend !== undefined && (
          <span className={cn('inline-flex items-center gap-0.5 text-xs font-semibold', trend > 0 ? 'text-emerald-600' : 'text-rose-600')}>
            {trend > 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
          </span>
        )}
      </CardContent>
      {sub && (
        <div className="border-t bg-muted/30 px-4 py-1.5 text-[11px] text-muted-foreground">{sub}</div>
      )}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Card wrapper for report panels
// ---------------------------------------------------------------------------
function ReportCard({
  title, description, icon: Icon, action, children, footer,
}: {
  title: string
  description?: string
  icon: LucideIcon
  action?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
}) {
  return (
    <Card className="flex flex-col overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm">{title}</CardTitle>
              {description && <CardDescription className="text-xs">{description}</CardDescription>}
            </div>
          </div>
          {action}
        </div>
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
      {footer && <div className="border-t bg-muted/30 px-4 py-2 text-xs">{footer}</div>}
    </Card>
  )
}

// ---------------------------------------------------------------------------
// 1. Academic Performance
// ---------------------------------------------------------------------------
function AcademicPerformanceCard({ data }: { data: ReportsData }) {
  const { academics } = data
  const maxCount = Math.max(...academics.gradeDistribution.map((g) => g.count), 1)
  return (
    <ReportCard
      title="Academic Performance"
      description={
        academics.latestExam
          ? `${academics.latestExam.name} · ${academics.latestExam.term} ${academics.latestExam.academicYear}`
          : 'No exam data'
      }
      icon={GraduationCap}
      footer={
        <span className="text-muted-foreground">
          {academics.totalGrades} grades recorded in latest exam
        </span>
      }
    >
      <div className="space-y-3">
        <div className="text-xs font-medium text-muted-foreground">Grade Distribution</div>
        <div className="flex items-end gap-1 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={academics.gradeDistribution} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="grade" tick={{ fontSize: 10 }} interval={0} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <RTooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {academics.gradeDistribution.map((g, i) => (
                  <Cell key={i} fill={gradeColorHex(g.grade)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <div>
            <div className="mb-1 flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3 w-3" /> Top Subjects
            </div>
            <div className="space-y-1">
              {academics.topSubjects.length === 0 && <EmptyMini label="No data" />}
              {academics.topSubjects.slice(0, 4).map((s, i) => (
                <SubjectMiniRow key={s.subjectId} rank={i + 1} name={s.subjectName} avg={s.avg} positive />
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1 flex items-center gap-1 text-xs font-medium text-rose-600 dark:text-rose-400">
              <TrendingDown className="h-3 w-3" /> Needs Attention
            </div>
            <div className="space-y-1">
              {academics.bottomSubjects.length === 0 && <EmptyMini label="No data" />}
              {academics.bottomSubjects.slice(0, 4).map((s, i) => (
                <SubjectMiniRow key={s.subjectId} rank={i + 1} name={s.subjectName} avg={s.avg} />
              ))}
            </div>
          </div>
        </div>
        {/* Legend bar showing relative scale */}
        <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground">
          <span>0</span>
          <div className="relative h-1 flex-1 rounded-full bg-muted">
            <div className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" />
          </div>
          <span>{maxCount}</span>
        </div>
      </div>
    </ReportCard>
  )
}

function SubjectMiniRow({ rank, name, avg, positive }: { rank: number; name: string; avg: number; positive?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-md bg-muted/40 px-2 py-1">
      <span className={cn(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded text-[10px] font-bold text-white',
        positive ? 'bg-emerald-500' : 'bg-rose-500',
      )}>{rank}</span>
      <span className="min-w-0 flex-1 truncate text-xs font-medium">{name}</span>
      <span className={cn('text-xs font-bold', avg >= 50 ? 'text-emerald-600' : 'text-rose-600')}>{avg}%</span>
    </div>
  )
}

function EmptyMini({ label }: { label: string }) {
  return <div className="rounded-md bg-muted/30 px-2 py-1.5 text-[11px] text-muted-foreground">{label}</div>
}

// ---------------------------------------------------------------------------
// 2. Financial Health
// ---------------------------------------------------------------------------
function FinancialHealthCard({ data }: { data: ReportsData }) {
  const { finance } = data
  const rate = finance.collectionRate
  // gauge color
  const gaugeColor = rate >= 80 ? '#059669' : rate >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <ReportCard
      title="Financial Health"
      description="Revenue vs Expenses · Last 6 months"
      icon={Wallet}
      footer={
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="text-muted-foreground">Billed: <span className="font-semibold text-foreground">{formatKES(finance.totalBilled)}</span></span>
          <span className="text-muted-foreground">Collected: <span className="font-semibold text-emerald-600">{formatKES(finance.totalCollected)}</span></span>
          <span className="text-muted-foreground">Outstanding: <span className="font-semibold text-rose-600">{formatKES(finance.totalOutstanding)}</span></span>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <div className="text-xs font-medium text-muted-foreground">Collection Rate</div>
            <div className="mt-1 flex items-end gap-2">
              <span className="text-3xl font-bold tracking-tight" style={{ color: gaugeColor }}>{rate}%</span>
              <span className="mb-1 text-xs text-muted-foreground">of billed</span>
            </div>
            {/* Progress bar */}
            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${Math.min(rate, 100)}%`, backgroundColor: gaugeColor }}
              />
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="relative h-20 w-20">
              <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e2e8f0" strokeWidth="3.5" />
                <circle
                  cx="18" cy="18" r="15.5" fill="none" stroke={gaugeColor} strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeDasharray={`${(rate / 100) * 97.4} 97.4`}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold" style={{ color: gaugeColor }}>{rate}%</span>
              </div>
            </div>
            <span className="mt-1 text-[10px] text-muted-foreground">gauge</span>
          </div>
        </div>

        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={finance.monthly} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => formatCompact(v)} />
              <RTooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                formatter={(v: number) => formatKES(v)}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#059669" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="expense" name="Expense" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {finance.outstandingByClassLevel.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">Outstanding by Class Level</div>
            <div className="space-y-1">
              {finance.outstandingByClassLevel.slice(0, 4).map((o) => {
                const max = finance.outstandingByClassLevel[0]?.amount || 1
                return (
                  <div key={o.level} className="flex items-center gap-2">
                    <span className="w-20 truncate text-xs">{o.level}</span>
                    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-rose-500" style={{ width: `${(o.amount / max) * 100}%` }} />
                    </div>
                    <span className="w-20 text-right text-xs font-medium">{formatKES(o.amount)}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </ReportCard>
  )
}

// ---------------------------------------------------------------------------
// 3. Attendance Overview
// ---------------------------------------------------------------------------
function AttendanceOverviewCard({ data }: { data: ReportsData }) {
  const { attendance } = data
  const trend = attendance.trend
  const avgRate = trend.length > 0 ? trend.reduce((s, d) => s + d.rate, 0) / trend.length : 0

  return (
    <ReportCard
      title="Attendance Overview"
      description="Last 30 days · Overall rate & by stream"
      icon={CalendarCheck}
      footer={
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Average: <span className="font-semibold text-foreground">{avgRate.toFixed(1)}%</span></span>
          <span className="text-muted-foreground">{attendance.totalRecords} records</span>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="h-36">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="attGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => v.slice(5)} interval="preserveStartEnd" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <RTooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
                formatter={(v: number) => [`${v}%`, 'Rate']}
              />
              <Area type="monotone" dataKey="rate" stroke="#0d9488" strokeWidth={2} fill="url(#attGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">By Stream (today)</div>
          <div className="max-h-28 space-y-1 overflow-y-auto pr-1">
            {attendance.byStream.length === 0 && <EmptyMini label="No streams" />}
            {attendance.byStream.slice(0, 8).map((s) => (
              <div key={s.streamId} className="flex items-center gap-2">
                <span className="w-24 truncate text-xs font-medium">{s.streamName}</span>
                <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn('absolute inset-y-0 left-0 rounded-full',
                      s.rate >= 90 ? 'bg-emerald-500' : s.rate >= 75 ? 'bg-amber-500' : 'bg-rose-500')}
                    style={{ width: `${Math.max(s.rate, 2)}%` }}
                  />
                </div>
                <span className="w-10 text-right text-xs font-semibold">{s.rate}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ReportCard>
  )
}

// ---------------------------------------------------------------------------
// 4. Enrollment Demographics
// ---------------------------------------------------------------------------
function EnrollmentDemographicsCard({ data }: { data: ReportsData }) {
  const { enrollment } = data
  const genderData = enrollment.gender.map((g) => ({
    name: g.gender,
    value: g.count,
    color: GENDER_COLORS[g.gender] || '#94a3b8',
  }))
  const levelData = enrollment.byClassLevel.map((l) => ({ name: l.name, enrolled: l.enrolled, capacity: l.capacity }))

  return (
    <ReportCard
      title="Enrollment Demographics"
      description={`${formatNumber(enrollment.totalStudents)} students · ${enrollment.boarding} boarding / ${enrollment.dayScholars} day`}
      icon={Users}
      footer={
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">
            Gender: {enrollment.gender.map((g) => `${g.gender} ${g.count}`).join(' · ')}
          </span>
        </div>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Gender pie */}
        <div className="flex flex-col items-center justify-center sm:w-1/3">
          <div className="h-28 w-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={genderData} dataKey="value" nameKey="name" innerRadius={32} outerRadius={50} paddingAngle={2}>
                  {genderData.map((g, i) => <Cell key={i} fill={g.color} />)}
                </Pie>
                <RTooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-2 text-[11px]">
            {genderData.map((g) => (
              <span key={g.name} className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: g.color }} />
                {g.name} ({g.value})
              </span>
            ))}
          </div>
        </div>

        {/* Class level bar */}
        <div className="h-32 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={levelData} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={36} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <RTooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              <Bar dataKey="capacity" name="Capacity" fill="#cbd5e1" radius={[3, 3, 0, 0]} />
              <Bar dataKey="enrolled" name="Enrolled" fill="#059669" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ReportCard>
  )
}

// ---------------------------------------------------------------------------
// 5. Library Usage
// ---------------------------------------------------------------------------
function LibraryUsageCard({ data }: { data: ReportsData }) {
  const { library } = data
  return (
    <ReportCard
      title="Library Usage"
      description={`${formatNumber(library.totalCopies)} copies · ${formatNumber(library.availableCopies)} available`}
      icon={BookMarked}
      footer={
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">This month: <span className="font-semibold text-foreground">{library.loansThisMonth} loans</span></span>
          <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400">
            <AlertCircle className="h-3 w-3" /> {library.overdueCount} overdue
          </span>
        </div>
      }
    >
      <div className="space-y-3">
        <div className="h-28">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={library.booksByCategory} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="category" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <RTooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" />
              <Bar dataKey="total" name="Total" stackId="a" fill="#0d9488" radius={[0, 0, 0, 0]} />
              <Bar dataKey="available" name="Available" stackId="b" fill="#5eead4" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div>
          <div className="mb-1 text-xs font-medium text-muted-foreground">Loans Trend (6 months)</div>
          <div className="h-20">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={library.loansTrend} margin={{ top: 4, right: 8, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="loansGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                <RTooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
                <Area type="monotone" dataKey="loans" stroke="#f59e0b" strokeWidth={2} fill="url(#loansGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </ReportCard>
  )
}

// ---------------------------------------------------------------------------
// 6. Staff Composition
// ---------------------------------------------------------------------------
function StaffCompositionCard({ data }: { data: ReportsData }) {
  const { staff } = data
  const roleData = staff.byRole.map((r, i) => ({ name: r.role, value: r.count, color: PALETTE[i % PALETTE.length] }))
  const deptData = staff.byDepartment.slice(0, 8)

  return (
    <ReportCard
      title="Staff Composition"
      description={`${staff.total} staff across ${staff.byDepartment.length} departments`}
      icon={Users}
      footer={
        <div className="flex flex-wrap items-center gap-2">
          {staff.byRole.slice(0, 5).map((r) => (
            <Badge key={r.role} variant="outline" className="text-[10px]">
              {r.role} <span className="ml-1 font-semibold">{r.count}</span>
            </Badge>
          ))}
        </div>
      }
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        {/* Role donut */}
        <div className="flex flex-col items-center justify-center sm:w-1/2">
          <div className="relative h-28 w-28">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={roleData} dataKey="value" nameKey="name" innerRadius={38} outerRadius={52} paddingAngle={2}>
                  {roleData.map((r, i) => <Cell key={i} fill={r.color} />)}
                </Pie>
                <RTooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-bold">{staff.total}</span>
              <span className="text-[10px] text-muted-foreground">staff</span>
            </div>
          </div>
          <div className="mt-1 flex flex-wrap justify-center gap-1 text-[10px]">
            {roleData.slice(0, 4).map((r) => (
              <span key={r.name} className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: r.color }} />
                {r.name}
              </span>
            ))}
          </div>
        </div>

        {/* Department bar */}
        <div className="h-32 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptData} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} width={80} />
              <RTooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="count" name="Staff" radius={[0, 3, 3, 0]}>
                {deptData.map((_, i) => <Cell key={i} fill={PALETTE[i % PALETTE.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ReportCard>
  )
}

// ---------------------------------------------------------------------------
// Recent activity
// ---------------------------------------------------------------------------
const ACTION_STYLE: Record<string, { icon: LucideIcon; color: string }> = {
  CREATE: { icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950' },
  UPDATE: { icon: Activity, color: 'text-teal-600 bg-teal-100 dark:bg-teal-950' },
  DELETE: { icon: AlertCircle, color: 'text-rose-600 bg-rose-100 dark:bg-rose-950' },
  PAYMENT: { icon: CircleDollarSign, color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-950' },
  MARK: { icon: CalendarCheck, color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-950' },
  GRADE: { icon: GraduationCap, color: 'text-amber-600 bg-amber-100 dark:bg-amber-950' },
  ISSUE: { icon: BookMarked, color: 'text-violet-600 bg-violet-100 dark:bg-violet-950' },
}

function RecentActivityCard({ activities }: { activities: ReportsData['activities'] }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-sm">Recent System Activity</CardTitle>
              <CardDescription className="text-xs">Last 20 audit log entries across all modules</CardDescription>
            </div>
          </div>
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" /> {activities.length} entries
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-96 overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead className="w-10"></TableHead>
                <TableHead>Action</TableHead>
                <TableHead className="hidden md:table-cell">Entity</TableHead>
                <TableHead className="hidden lg:table-cell">Details</TableHead>
                <TableHead className="hidden sm:table-cell">User</TableHead>
                <TableHead className="text-right">When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activities.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    No recent activity recorded.
                  </TableCell>
                </TableRow>
              )}
              {activities.map((a) => {
                const style = ACTION_STYLE[a.action] || { icon: Activity, color: 'text-slate-600 bg-slate-100 dark:bg-slate-800' }
                const Icon = style.icon
                return (
                  <TableRow key={a.id} className="hover:bg-muted/40">
                    <TableCell>
                      <div className={cn('flex h-7 w-7 items-center justify-center rounded-full', style.color)}>
                        <Icon className="h-3.5 w-3.5" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{a.action}</div>
                      <div className="text-xs text-muted-foreground md:hidden">{a.entity}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-[10px]">{a.entity}</Badge>
                    </TableCell>
                    <TableCell className="hidden max-w-xs truncate lg:table-cell text-sm text-muted-foreground">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="truncate">{a.details || '—'}</span>
                          </TooltipTrigger>
                          {a.details && (
                            <TooltipContent className="max-w-sm">
                              <p className="text-xs">{a.details}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell text-sm">{a.user || 'system'}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                      {timeAgo(a.createdAt)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
