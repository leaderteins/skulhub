'use client'
import { useState, useMemo } from 'react'
import { useFetch, apiPost, apiPut } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Slider } from '@/components/ui/slider'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import {
  Award, Plus, ClipboardCheck, CheckCircle2, TrendingUp, Star,
  Target, Sparkles, AlertCircle, X, ChevronRight, User, Search,
} from 'lucide-react'
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from 'recharts'

interface AppraisalsData {
  stats: {
    total: number; completed: number; reviewed: number; drafts: number
    avgScore: number; topPerformers: number
  }
  appraisals: Array<{
    id: string; staffId: string; period: string; reviewDate: string
    punctuality: number; teamwork: number; studentResults: number
    professionalism: number; innovation: number; overallScore: number
    strengths: string | null; improvements: string | null; goals: string | null
    reviewerName: string | null; status: string; createdAt: string
    staffName: string; staffRole: string; staffDept: string
    staff: { employeeNo: string }
  }>
  byStatus: Array<{ name: string; count: number }>
  byPeriod: Array<{ name: string; count: number; avg: number }>
}

interface StaffListData {
  staff: Array<{
    id: string; employeeNo: string; firstName: string; lastName: string
    role: string; status: string; salary: number; employmentType: string
    department: { id: string; name: string } | null
  }>
  total: number
}

const STATUS_BADGE: Record<string, string> = {
  Draft: 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300',
  Completed: 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-300',
  Reviewed: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
}

const STATUS_DOT: Record<string, string> = {
  Draft: '#94a3b8', Completed: '#8b5cf6', Reviewed: '#10b981',
}

const CRITERIA = [
  { key: 'punctuality', label: 'Punctuality', color: '#8b5cf6' },
  { key: 'teamwork', label: 'Teamwork', color: '#a78bfa' },
  { key: 'studentResults', label: 'Student Results', color: '#7c3aed' },
  { key: 'professionalism', label: 'Professionalism', color: '#c4b5fd' },
  { key: 'innovation', label: 'Innovation', color: '#6d28d9' },
] as const

function scoreColor(score: number): string {
  if (score >= 9) return 'text-emerald-600'
  if (score >= 7) return 'text-teal-600'
  if (score >= 5) return 'text-amber-600'
  if (score >= 3) return 'text-orange-600'
  return 'text-rose-600'
}

function scoreBg(score: number): string {
  if (score >= 9) return 'from-emerald-500 to-teal-500'
  if (score >= 7) return 'from-teal-500 to-cyan-500'
  if (score >= 5) return 'from-amber-500 to-orange-500'
  if (score >= 3) return 'from-orange-500 to-rose-500'
  return 'from-rose-500 to-pink-500'
}

function scoreLabel(score: number): string {
  if (score >= 9) return 'Outstanding'
  if (score >= 7) return 'Exceeds Expectations'
  if (score >= 5) return 'Meets Expectations'
  if (score >= 3) return 'Needs Improvement'
  return 'Below Standard'
}

export function AppraisalsModule() {
  const { user } = useAuthStore()
  const { data, loading, refetch } = useFetch<AppraisalsData>('/api/appraisals')
  const { data: staffData } = useFetch<StaffListData>('/api/staff?status=Active')

  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showDialog, setShowDialog] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!data) return []
    return data.appraisals.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!a.staffName.toLowerCase().includes(q) &&
            !a.period.toLowerCase().includes(q) &&
            !a.reviewerName?.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [data, statusFilter, search])

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

  const d = data!
  const stats = d.stats

  const activeStaff = staffData?.staff || []

  const handleStatusUpdate = async (id: string, status: 'Completed' | 'Reviewed') => {
    setActionLoading(id)
    try {
      await apiPut(`/api/appraisals/${id}`, { status, updatedBy: user?.name })
      toast.success(`Marked as ${status}`, {
        description: status === 'Reviewed' ? 'Appraisal review finalized.' : 'Appraisal marked complete.',
      })
      refetch()
    } catch (e: any) {
      toast.error('Failed to update appraisal', { description: e.message })
    } finally {
      setActionLoading(null)
    }
  }

  const selected = selectedId ? d.appraisals.find(a => a.id === selectedId) : null

  return (
    <div className="space-y-6">
      {/* Header banner — violet gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-fuchsia-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Award className="h-3 w-3" /> {stats.total} appraisals · avg {stats.avgScore}/10 · {stats.topPerformers} top performers
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Staff Appraisals</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Evaluate teacher and staff performance across five criteria — track progress, identify top talent, and set development goals.
            </p>
          </div>
          <Button
            onClick={() => setShowDialog(true)}
            className="gap-2 bg-white text-violet-700 hover:bg-white/90"
          >
            <Plus className="h-4 w-4" /> New Appraisal
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">Total Appraisals</p>
              <p className="text-xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">Completed</p>
              <p className="text-xl font-bold">{stats.completed + stats.reviewed}</p>
              <p className="truncate text-[11px] text-muted-foreground">{stats.reviewed} reviewed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">Avg Score</p>
              <p className="text-xl font-bold">{stats.avgScore}<span className="text-sm text-muted-foreground">/10</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <Star className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">Top Performers</p>
              <p className="text-xl font-bold">{stats.topPerformers}</p>
              <p className="truncate text-[11px] text-muted-foreground">score ≥ 8.0</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">By Status</CardTitle>
            <CardDescription className="text-xs">Workflow distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={d.byStatus} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" width={80} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} cursor={{ fill: 'oklch(0.96 0.01 150)' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
                  {d.byStatus.map(s => <Cell key={s.name} fill={STATUS_DOT[s.name] || '#94a3b8'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Average Score by Period</CardTitle>
            <CardDescription className="text-xs">Performance trend across review periods</CardDescription>
          </CardHeader>
          <CardContent>
            {d.byPeriod.length === 0 ? (
              <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">No appraisal data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={d.byPeriod} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="oklch(0.5 0.02 160)" angle={-15} textAnchor="end" height={60} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }}
                    cursor={{ fill: 'oklch(0.96 0.01 150)' }}
                  />
                  <Bar dataKey="avg" name="Avg Score" radius={[6, 6, 0, 0]} maxBarSize={48}>
                    {d.byPeriod.map((p, i) => (
                      <Cell key={i} fill={p.avg >= 8 ? '#10b981' : p.avg >= 6 ? '#8b5cf6' : p.avg >= 4 ? '#f59e0b' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-base font-semibold">Appraisal Records</h3>
          <p className="text-xs text-muted-foreground">{filtered.length} of {d.appraisals.length} records</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search staff, period, reviewer…"
              className="h-9 w-full pl-8 sm:w-60"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-9 w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Reviewed">Reviewed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Appraisal cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10 text-violet-600">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="font-medium">No appraisals found</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {d.appraisals.length === 0 ? 'Create your first appraisal to get started.' : 'Try adjusting your filters.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(a => (
            <AppraisalCard
              key={a.id}
              appraisal={a}
              onOpen={() => setSelectedId(a.id)}
              onStatusUpdate={handleStatusUpdate}
              actionLoading={actionLoading}
            />
          ))}
        </div>
      )}

      {/* New Appraisal dialog */}
      <NewAppraisalDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        staff={activeStaff}
        userName={user?.name || ''}
        onCreated={() => {
          refetch()
          setShowDialog(false)
        }}
      />

      {/* Detail dialog */}
      <AppraisalDetailDialog
        appraisal={selected || null}
        onClose={() => setSelectedId(null)}
        onStatusUpdate={handleStatusUpdate}
        actionLoading={actionLoading}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Appraisal card
// ---------------------------------------------------------------------------
interface CardProps {
  appraisal: AppraisalsData['appraisals'][number]
  onOpen: () => void
  onStatusUpdate: (id: string, status: 'Completed' | 'Reviewed') => void
  actionLoading: string | null
}

function AppraisalCard({ appraisal: a, onOpen, onStatusUpdate, actionLoading }: CardProps) {
  const radarData = CRITERIA.map(c => ({
    criterion: c.label,
    score: (a as any)[c.key] as number,
  }))

  return (
    <Card className="group overflow-hidden transition-all hover:shadow-lg">
      {/* Top accent strip */}
      <div className={cn('h-1.5 bg-gradient-to-r', scoreBg(a.overallScore))} />
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-semibold leading-tight">{a.staffName}</p>
            <p className="truncate text-xs text-muted-foreground">{a.staffRole} · {a.staffDept}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{a.period}</p>
          </div>
          <Badge variant="outline" className={cn('gap-1 shrink-0', STATUS_BADGE[a.status])}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_DOT[a.status] }} />
            {a.status}
          </Badge>
        </div>

        {/* Score + radar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="flex flex-col items-center">
            <div className={cn('flex h-16 w-16 flex-col items-center justify-center rounded-2xl bg-gradient-to-br text-white', scoreBg(a.overallScore))}>
              <span className="text-2xl font-bold leading-none">{a.overallScore}</span>
              <span className="text-[10px] uppercase tracking-wide opacity-90">/ 10</span>
            </div>
            <span className={cn('mt-1 text-[10px] font-semibold', scoreColor(a.overallScore))}>{scoreLabel(a.overallScore)}</span>
          </div>
          <div className="h-24 flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                <PolarGrid stroke="oklch(0.88 0.02 280)" />
                <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 8, fill: 'oklch(0.5 0.02 280)' }} />
                <PolarRadiusAxis domain={[0, 10]} tick={false} axisLine={false} />
                <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.35} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Criteria mini-bars */}
        <div className="mt-3 grid grid-cols-5 gap-1.5">
          {CRITERIA.map(c => {
            const v = (a as any)[c.key] as number
            return (
              <div key={c.key} className="text-center" title={`${c.label}: ${v}/10`}>
                <div className="relative mx-auto h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${(v / 10) * 100}%`, background: c.color }}
                  />
                </div>
                <p className="mt-1 text-[9px] uppercase tracking-wide text-muted-foreground">{c.label.split(' ')[0]}</p>
                <p className="text-[10px] font-semibold">{v}</p>
              </div>
            )
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><User className="h-3 w-3" /> {a.reviewerName || '—'}</span>
          <span>{formatDate(a.reviewDate)}</span>
        </div>

        <div className="mt-3 flex items-center gap-1.5">
          <Button variant="outline" size="sm" className="h-8 flex-1 gap-1 text-xs" onClick={onOpen}>
            View Details <ChevronRight className="h-3.5 w-3.5" />
          </Button>
          {a.status === 'Draft' && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1 text-xs"
              disabled={actionLoading === a.id}
              onClick={() => onStatusUpdate(a.id, 'Completed')}
            >
              <CheckCircle2 className="h-3.5 w-3.5" /> Complete
            </Button>
          )}
          {a.status === 'Completed' && (
            <Button
              size="sm"
              className="h-8 gap-1 bg-violet-600 text-xs hover:bg-violet-700"
              disabled={actionLoading === a.id}
              onClick={() => onStatusUpdate(a.id, 'Reviewed')}
            >
              {actionLoading === a.id ? '…' : 'Review'} <Star className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// New Appraisal dialog
// ---------------------------------------------------------------------------
interface NewProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  staff: StaffListData['staff']
  userName: string
  onCreated: () => void
}

function NewAppraisalDialog({ open, onOpenChange, staff, userName, onCreated }: NewProps) {
  const [staffId, setStaffId] = useState('')
  const [period, setPeriod] = useState('Term 1 2025')
  const [reviewDate, setReviewDate] = useState(new Date().toISOString().slice(0, 10))
  const [scores, setScores] = useState<Record<string, number>>({
    punctuality: 7, teamwork: 7, studentResults: 7, professionalism: 7, innovation: 7,
  })
  const [strengths, setStrengths] = useState('')
  const [improvements, setImprovements] = useState('')
  const [goals, setGoals] = useState('')
  const [status, setStatus] = useState('Completed')
  const [saving, setSaving] = useState(false)

  const overall = Math.round(
    CRITERIA.reduce((sum, c) => sum + scores[c.key], 0) / CRITERIA.length,
  )

  const selectedStaff = staff.find(s => s.id === staffId)

  const reset = () => {
    setStaffId(''); setStrengths(''); setImprovements(''); setGoals('')
    setScores({ punctuality: 7, teamwork: 7, studentResults: 7, professionalism: 7, innovation: 7 })
    setStatus('Completed')
  }

  const handleSubmit = async () => {
    if (!staffId) { toast.error('Select a staff member'); return }
    if (!period.trim()) { toast.error('Period is required (e.g. Term 1 2025)'); return }
    if (!userName) { toast.error('Reviewer name is missing — please log in.'); return }
    setSaving(true)
    try {
      await apiPost('/api/appraisals', {
        staffId,
        period: period.trim(),
        reviewDate,
        punctuality: scores.punctuality,
        teamwork: scores.teamwork,
        studentResults: scores.studentResults,
        professionalism: scores.professionalism,
        innovation: scores.innovation,
        strengths: strengths.trim() || null,
        improvements: improvements.trim() || null,
        goals: goals.trim() || null,
        reviewerName: userName,
        status,
      })
      toast.success('Appraisal created', {
        description: `${selectedStaff?.firstName} ${selectedStaff?.lastName} — ${period} · ${overall}/10`,
      })
      reset()
      onCreated()
    } catch (e: any) {
      toast.error('Failed to create appraisal', { description: e.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-violet-600" /> New Staff Appraisal
          </DialogTitle>
          <DialogDescription>
            Score the staff member across five criteria (0–10). The overall score is the average.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Staff + period */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Staff Member <span className="text-rose-500">*</span></Label>
              <Select value={staffId} onValueChange={setStaffId}>
                <SelectTrigger><SelectValue placeholder="Select staff…" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {staff.length === 0 ? (
                    <SelectItem value="_none" disabled>No active staff found</SelectItem>
                  ) : staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} · {s.employeeNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Review Period <span className="text-rose-500">*</span></Label>
              <Input value={period} onChange={e => setPeriod(e.target.value)} placeholder="e.g. Term 1 2025" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label>Review Date</Label>
              <Input type="date" value={reviewDate} onChange={e => setReviewDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Reviewer Name</Label>
              <Input value={userName} readOnly className="bg-muted/50 text-muted-foreground" />
              <p className="text-[11px] text-muted-foreground">Auto-filled from your account</p>
            </div>
          </div>

          {/* Score sliders */}
          <div className="rounded-xl border border-violet-200/60 bg-violet-50/40 p-4 dark:border-violet-900/40 dark:bg-violet-950/20">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">Performance Criteria</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Overall</span>
                <span className={cn('flex h-9 w-12 items-center justify-center rounded-lg bg-gradient-to-br text-lg font-bold text-white', scoreBg(overall))}>
                  {overall}
                </span>
              </div>
            </div>
            <div className="space-y-3.5">
              {CRITERIA.map(c => (
                <div key={c.key}>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <Label className="text-xs font-medium">{c.label}</Label>
                    <span className={cn('text-sm font-bold', scoreColor(scores[c.key]))}>{scores[c.key]}<span className="text-xs text-muted-foreground">/10</span></span>
                  </div>
                  <Slider
                    value={[scores[c.key]]}
                    onValueChange={(v) => setScores(s => ({ ...s, [c.key]: v[0] }))}
                    min={0}
                    max={10}
                    step={1}
                    className="[&_[role=slider]]:bg-violet-600 [&_.bg-primary]:bg-violet-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Text areas */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1 text-xs"><Sparkles className="h-3 w-3 text-emerald-500" /> Strengths</Label>
              <Textarea
                value={strengths}
                onChange={e => setStrengths(e.target.value)}
                placeholder="What does this staff member excel at?"
                className="min-h-20 resize-none text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1 text-xs"><AlertCircle className="h-3 w-3 text-amber-500" /> Improvements</Label>
              <Textarea
                value={improvements}
                onChange={e => setImprovements(e.target.value)}
                placeholder="Areas that need growth…"
                className="min-h-20 resize-none text-sm"
              />
            </div>
            <div className="grid gap-1.5">
              <Label className="flex items-center gap-1 text-xs"><Target className="h-3 w-3 text-violet-500" /> Goals</Label>
              <Textarea
                value={goals}
                onChange={e => setGoals(e.target.value)}
                placeholder="Targets for next period…"
                className="min-h-20 resize-none text-sm"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Reviewed">Reviewed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-2 bg-violet-600 hover:bg-violet-700">
            {saving ? 'Saving…' : (<><Award className="h-4 w-4" /> Create Appraisal</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Appraisal detail dialog
// ---------------------------------------------------------------------------
interface DetailProps {
  appraisal: AppraisalsData['appraisals'][number] | null
  onClose: () => void
  onStatusUpdate: (id: string, status: 'Completed' | 'Reviewed') => void
  actionLoading: string | null
}

function AppraisalDetailDialog({ appraisal: a, onClose, onStatusUpdate, actionLoading }: DetailProps) {
  if (!a) return null
  const radarData = CRITERIA.map(c => ({ criterion: c.label, score: (a as any)[c.key] as number }))
  return (
    <Dialog open={!!a} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2"><Award className="h-5 w-5 text-violet-600" /> Appraisal Detail</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
          </DialogTitle>
          <DialogDescription>{a.period}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Staff header */}
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
            <div>
              <p className="font-medium">{a.staffName}</p>
              <p className="text-xs text-muted-foreground">{a.staffRole} · {a.staffDept} · {a.staff.employeeNo}</p>
            </div>
            <Badge variant="outline" className={cn('gap-1', STATUS_BADGE[a.status])}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_DOT[a.status] }} />
              {a.status}
            </Badge>
          </div>

          {/* Score + radar */}
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <div className={cn('flex h-20 w-20 flex-col items-center justify-center rounded-2xl bg-gradient-to-br text-white', scoreBg(a.overallScore))}>
                <span className="text-3xl font-bold leading-none">{a.overallScore}</span>
                <span className="text-[10px] uppercase tracking-wide opacity-90">/ 10</span>
              </div>
              <span className={cn('mt-1.5 text-[11px] font-semibold', scoreColor(a.overallScore))}>{scoreLabel(a.overallScore)}</span>
            </div>
            <div className="h-36 flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="oklch(0.88 0.02 280)" />
                  <PolarAngleAxis dataKey="criterion" tick={{ fontSize: 10, fill: 'oklch(0.5 0.02 280)' }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 9 }} />
                  <Radar dataKey="score" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Criteria list */}
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {CRITERIA.map(c => {
              const v = (a as any)[c.key] as number
              return (
                <div key={c.key} className="rounded-lg border bg-card p-2.5">
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{c.label}</span>
                    <span className={cn('font-bold', scoreColor(v))}>{v}<span className="text-xs text-muted-foreground">/10</span></span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${(v / 10) * 100}%`, background: c.color }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* Notes */}
          {(a.strengths || a.improvements || a.goals) && (
            <div className="space-y-2">
              {a.strengths && (
                <NoteBlock icon={Sparkles} label="Strengths" color="text-emerald-600 bg-emerald-500/10" text={a.strengths} />
              )}
              {a.improvements && (
                <NoteBlock icon={AlertCircle} label="Improvements" color="text-amber-600 bg-amber-500/10" text={a.improvements} />
              )}
              {a.goals && (
                <NoteBlock icon={Target} label="Goals" color="text-violet-600 bg-violet-500/10" text={a.goals} />
              )}
            </div>
          )}

          {/* Reviewer info */}
          <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><User className="h-3 w-3" /> Reviewed by {a.reviewerName || '—'}</span>
            <span>{formatDate(a.reviewDate)}</span>
          </div>

          {/* Actions */}
          {a.status !== 'Reviewed' && (
            <div className="flex gap-2">
              {a.status === 'Draft' && (
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5"
                  disabled={actionLoading === a.id}
                  onClick={() => onStatusUpdate(a.id, 'Completed')}
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark Completed
                </Button>
              )}
              <Button
                className="flex-1 gap-1.5 bg-violet-600 hover:bg-violet-700"
                disabled={actionLoading === a.id}
                onClick={() => onStatusUpdate(a.id, 'Reviewed')}
              >
                <Star className="h-4 w-4" /> Finalize Review
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function NoteBlock({ icon: Icon, label, color, text }: { icon: any; label: string; color: string; text: string }) {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className={cn('mb-1 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold', color)}>
        <Icon className="h-3 w-3" /> {label}
      </div>
      <p className="text-sm text-foreground">{text}</p>
    </div>
  )
}
