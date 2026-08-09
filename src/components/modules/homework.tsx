'use client'
import { useState, useMemo } from 'react'
import { useFetch, apiPost, apiPut } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatDate } from '@/lib/format'
import { toast } from 'sonner'
import {
  PencilRuler, Plus, BookOpen, AlertTriangle, CalendarClock, CheckCircle2,
  Clock, Award, Search, X, User, ListChecks, Layers,
} from 'lucide-react'

interface SubjectRef { id: string; name: string; code: string; category?: string }
interface ClassLevelRef { id: string; name: string; stage: string }

interface Homework {
  id: string
  title: string
  subjectId: string | null
  classLevelId: string | null
  description: string
  dueDate: string
  maxMarks: number
  status: string
  createdBy: string | null
  createdAt: string
  subjectName: string | null
  subjectCode: string | null
  classLevelName: string | null
  stage: string | null
}

interface HomeworkData {
  stats: { total: number; active: number; closed: number; graded: number; overdue: number; dueThisWeek: number }
  subjects: SubjectRef[]
  classLevels: ClassLevelRef[]
  homework: Homework[]
}

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  Active:  { label: 'Active',  cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', dot: 'bg-emerald-500' },
  Closed:  { label: 'Closed',  cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',  dot: 'bg-amber-500' },
  Graded:  { label: 'Graded',  cls: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',  dot: 'bg-teal-500' },
}

const SUBJECT_ACCENTS = [
  'from-teal-500 to-cyan-600',
  'from-cyan-500 to-teal-600',
  'from-emerald-500 to-teal-600',
  'from-teal-600 to-emerald-700',
  'from-green-500 to-teal-600',
  'from-cyan-600 to-emerald-700',
]

function subjectGradient(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return SUBJECT_ACCENTS[Math.abs(hash) % SUBJECT_ACCENTS.length]
}

function dueDateStatus(due: string, status: string): { label: string; tone: 'danger' | 'warn' | 'ok' | 'muted' } {
  if (status !== 'Active') return { label: `Due ${formatDate(due)}`, tone: 'muted' }
  const now = new Date()
  const dueDate = new Date(due)
  const diffMs = dueDate.getTime() - now.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffMs < 0) return { label: 'Overdue', tone: 'danger' }
  if (diffHours <= 24) return { label: 'Due in < 24h', tone: 'warn' }
  if (diffHours <= 72) return { label: `Due in ${Math.ceil(diffHours / 24)}d`, tone: 'warn' }
  return { label: `Due ${formatDate(due)}`, tone: 'ok' }
}

const TONE_CLS: Record<string, string> = {
  danger: 'text-rose-600 dark:text-rose-400',
  warn: 'text-amber-600 dark:text-amber-400',
  ok: 'text-emerald-600 dark:text-emerald-400',
  muted: 'text-muted-foreground',
}

export function HomeworkModule() {
  const { data, loading, refetch } = useFetch<HomeworkData>('/api/homework')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showAddDialog, setShowAddDialog] = useState(false)

  const subjects = data?.subjects || []
  const classLevels = data?.classLevels || []
  const stats = data?.stats

  const filtered = useMemo(() => {
    if (!data?.homework) return []
    return data.homework.filter(h => {
      if (subjectFilter !== 'all' && h.subjectId !== subjectFilter) return false
      if (classFilter !== 'all' && h.classLevelId !== classFilter) return false
      if (statusFilter !== 'all' && h.status !== statusFilter) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const haystack = `${h.title} ${h.description} ${h.subjectName || ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [data, subjectFilter, classFilter, statusFilter, search])

  // Group by status for sections
  const grouped = useMemo(() => {
    const overdue: Homework[] = []
    const dueSoon: Homework[] = []
    const later: Homework[] = []
    const closedGraded: Homework[] = []
    filtered.forEach(h => {
      if (h.status === 'Closed' || h.status === 'Graded') {
        closedGraded.push(h)
      } else {
        const tone = dueDateStatus(h.dueDate, h.status).tone
        if (tone === 'danger') overdue.push(h)
        else if (tone === 'warn') dueSoon.push(h)
        else later.push(h)
      }
    })
    return { overdue, dueSoon, later, closedGraded }
  }, [filtered])

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  const hasFilters = subjectFilter !== 'all' || classFilter !== 'all' || statusFilter !== 'all' || search.trim() !== ''
  const clearFilters = () => {
    setSubjectFilter('all'); setClassFilter('all'); setStatusFilter('all'); setSearch('')
  }

  return (
    <div className="space-y-6">
      {/* Header banner — teal gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-700 p-6 text-white shadow-xl">
        <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-cyan-300/15 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <PencilRuler className="h-3 w-3" /> {stats.total} assignments · {stats.active} active · {stats.overdue} overdue
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Homework & Assignments</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Assign, track and grade homework by subject and class. Stay on top of due dates, marks and submission status.
            </p>
          </div>
          <Button variant="secondary" size="sm" className="bg-white text-teal-700 hover:bg-white/90" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Homework
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20">
              <PencilRuler className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
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
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Active</p>
              <p className="text-2xl font-bold">{stats.active}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Overdue</p>
              <p className="text-2xl font-bold">{stats.overdue}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 ring-1 ring-cyan-500/20">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Due This Week</p>
              <p className="text-2xl font-bold">{stats.dueThisWeek}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status breakdown */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Layers className="h-4 w-4 text-teal-600" /> Status Breakdown
          </CardTitle>
          <CardDescription className="text-xs">Distribution of homework by status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 rounded-full border bg-muted/40 py-1 pl-3 pr-2 text-xs">
              <span className="font-medium">Active</span>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[10px]">{stats.active}</Badge>
            </div>
            <div className="flex items-center gap-2 rounded-full border bg-muted/40 py-1 pl-3 pr-2 text-xs">
              <span className="font-medium">Closed</span>
              <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 text-[10px]">{stats.closed}</Badge>
            </div>
            <div className="flex items-center gap-2 rounded-full border bg-muted/40 py-1 pl-3 pr-2 text-xs">
              <span className="font-medium">Graded</span>
              <Badge variant="secondary" className="bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400 text-[10px]">{stats.graded}</Badge>
            </div>
            <div className="flex items-center gap-2 rounded-full border bg-rose-50 dark:bg-rose-950/30 py-1 pl-3 pr-2 text-xs">
              <span className="font-medium text-rose-700 dark:text-rose-400">Overdue</span>
              <Badge variant="secondary" className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 text-[10px]">{stats.overdue}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-2">
              <Label className="text-xs">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Title, keyword..." className="pl-8" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Subject</Label>
              <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="All subjects" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Class Level</Label>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="All classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {classLevels.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Closed">Closed</SelectItem>
                  <SelectItem value="Graded">Graded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {data.homework.length} homework assignments
            </p>
            {hasFilters && (
              <Button size="sm" variant="ghost" onClick={clearFilters} className="h-7 text-xs">
                <X className="mr-1 h-3 w-3" /> Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Homework sections */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-500/10 text-teal-600">
            <PencilRuler className="h-7 w-7" />
          </div>
          <div>
            <p className="font-semibold">No homework found</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {hasFilters ? 'Try adjusting your filters.' : 'Create your first homework assignment to get started.'}
            </p>
          </div>
          {!hasFilters && (
            <Button size="sm" className="bg-teal-600 hover:bg-teal-700" onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-1 h-4 w-4" /> New Homework
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.overdue.length > 0 && (
            <HomeworkSection title="Overdue" subtitle="Past due date — close or grade" icon={AlertTriangle} accent="text-rose-600" items={grouped.overdue} onAction={async (h, status) => {
              try {
                await apiPut('/api/homework', { id: h.id, status, updatedBy: useAuthStore.getState().user?.name })
                toast.success(`Homework marked as ${status}`)
                refetch()
              } catch (e: any) { toast.error(e?.message || 'Failed to update status') }
            }} />
          )}
          {grouped.dueSoon.length > 0 && (
            <HomeworkSection title="Due Soon" subtitle="Within the next 72 hours" icon={Clock} accent="text-amber-600" items={grouped.dueSoon} onAction={async (h, status) => {
              try {
                await apiPut('/api/homework', { id: h.id, status, updatedBy: useAuthStore.getState().user?.name })
                toast.success(`Homework marked as ${status}`)
                refetch()
              } catch (e: any) { toast.error(e?.message || 'Failed to update status') }
            }} />
          )}
          {grouped.later.length > 0 && (
            <HomeworkSection title="Upcoming" subtitle="Due later this week or beyond" icon={CalendarClock} accent="text-emerald-600" items={grouped.later} onAction={async (h, status) => {
              try {
                await apiPut('/api/homework', { id: h.id, status, updatedBy: useAuthStore.getState().user?.name })
                toast.success(`Homework marked as ${status}`)
                refetch()
              } catch (e: any) { toast.error(e?.message || 'Failed to update status') }
            }} />
          )}
          {grouped.closedGraded.length > 0 && (
            <HomeworkSection title="Closed & Graded" subtitle="Past assignments awaiting grading or already graded" icon={CheckCircle2} accent="text-teal-600" items={grouped.closedGraded} onAction={async (h, status) => {
              try {
                await apiPut('/api/homework', { id: h.id, status, updatedBy: useAuthStore.getState().user?.name })
                toast.success(`Homework marked as ${status}`)
                refetch()
              } catch (e: any) { toast.error(e?.message || 'Failed to update status') }
            }} />
          )}
        </div>
      )}

      {showAddDialog && (
        <AddHomeworkDialog
          subjects={subjects}
          classLevels={classLevels}
          onClose={() => setShowAddDialog(false)}
          onCreated={() => { setShowAddDialog(false); refetch() }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Homework Section (grouped)
// ---------------------------------------------------------------------------
function HomeworkSection({ title, subtitle, icon: Icon, accent, items, onAction }: {
  title: string
  subtitle: string
  icon: any
  accent: string
  items: Homework[]
  onAction: (h: Homework, status: string) => void
}) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Icon className={cn('h-4 w-4', accent)} />
        <h3 className="text-sm font-semibold">{title}</h3>
        <Badge variant="outline" className="text-[10px]">{items.length}</Badge>
        <span className="text-xs text-muted-foreground">· {subtitle}</span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map(h => <HomeworkCard key={h.id} homework={h} onAction={onAction} />)}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Homework Card
// ---------------------------------------------------------------------------
function HomeworkCard({ homework, onAction }: {
  homework: Homework
  onAction: (h: Homework, status: string) => void
}) {
  const meta = STATUS_META[homework.status] || STATUS_META.Active
  const gradient = subjectGradient(homework.subjectId || homework.subjectName || homework.title)
  const due = dueDateStatus(homework.dueDate, homework.status)

  return (
    <Card className="group relative flex flex-col overflow-hidden transition-all hover:shadow-md">
      <div className={cn('h-1.5 w-full bg-gradient-to-r', gradient)} />
      <CardContent className="flex flex-1 flex-col gap-3 p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white', gradient)}>
              <BookOpen className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-muted-foreground">
                {homework.subjectName || 'Unassigned'} {homework.subjectCode && <span className="text-[10px]">· {homework.subjectCode}</span>}
              </p>
              <p className="text-[10px] text-muted-foreground">{homework.classLevelName || 'All classes'}</p>
            </div>
          </div>
          <Badge variant="secondary" className={cn('text-[10px] shrink-0', meta.cls)}>
            <span className={cn('mr-1 inline-block h-1.5 w-1.5 rounded-full', meta.dot)} />
            {meta.label}
          </Badge>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 text-base font-semibold leading-tight">{homework.title}</h3>

        {/* Description */}
        {homework.description && (
          <p className="line-clamp-3 text-xs leading-relaxed text-foreground/80">{homework.description}</p>
        )}

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-2 border-t pt-3 text-xs">
          <div className="flex items-center gap-1.5">
            <CalendarClock className={cn('h-3.5 w-3.5', TONE_CLS[due.tone])} />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Due</p>
              <p className={cn('font-medium', TONE_CLS[due.tone])}>{due.label}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-amber-600" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Max Marks</p>
              <p className="font-medium text-amber-700 dark:text-amber-400">{homework.maxMarks}</p>
            </div>
          </div>
        </div>

        {/* Footer / actions */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <User className="h-2.5 w-2.5" />
            <span className="truncate max-w-[8rem]">{homework.createdBy || 'Unknown'}</span>
          </div>
          <div className="flex items-center gap-1">
            {homework.status === 'Active' && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950"
                onClick={() => onAction(homework, 'Closed')}>
                <X className="mr-1 h-3 w-3" /> Close
              </Button>
            )}
            {(homework.status === 'Active' || homework.status === 'Closed') && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-teal-600 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950"
                onClick={() => onAction(homework, 'Graded')}>
                <CheckCircle2 className="mr-1 h-3 w-3" /> Mark Graded
              </Button>
            )}
            {homework.status === 'Closed' && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950"
                onClick={() => onAction(homework, 'Active')}>
                <Clock className="mr-1 h-3 w-3" /> Reopen
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Add Homework Dialog
// ---------------------------------------------------------------------------
function AddHomeworkDialog({ subjects, classLevels, onClose, onCreated }: {
  subjects: SubjectRef[]
  classLevels: ClassLevelRef[]
  onClose: () => void
  onCreated: () => void
}) {
  const { user } = useAuthStore()
  // Default due date = 3 days from now at 11:59 PM
  const defaultDue = (() => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    d.setHours(23, 59, 0, 0)
    return d.toISOString().slice(0, 16)
  })()
  const [form, setForm] = useState({
    title: '',
    subjectId: '',
    classLevelId: '',
    description: '',
    dueDate: defaultDue,
    maxMarks: '50',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error('Title is required'); return }
    if (!form.dueDate) { toast.error('Due date is required'); return }
    setSaving(true)
    try {
      await apiPost('/api/homework', {
        title: form.title,
        subjectId: form.subjectId || null,
        classLevelId: form.classLevelId || null,
        description: form.description || '',
        dueDate: new Date(form.dueDate).toISOString(),
        maxMarks: Number(form.maxMarks) || 100,
        status: 'Active',
        createdBy: user?.name || null,
      })
      toast.success('Homework created successfully')
      onCreated()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create homework')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PencilRuler className="h-5 w-5 text-teal-600" /> New Homework / Assignment
          </DialogTitle>
          <DialogDescription>Create a new homework assignment for a class</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Author auto-fill */}
          <div className="flex items-center gap-2 rounded-lg border bg-teal-50/50 px-3 py-2 text-xs dark:bg-teal-950/20">
            <User className="h-3.5 w-3.5 text-teal-600" />
            <span className="text-muted-foreground">Assigned by:</span>
            <span className="font-medium text-teal-700 dark:text-teal-400">{user?.name || 'Current user'}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">Auto-filled from your account</span>
          </div>

          <div>
            <Label className="text-xs">Title *</Label>
            <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Exercise 5.2 — Linear Equations" className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Subject</Label>
              <Select value={form.subjectId} onValueChange={v => setForm({ ...form, subjectId: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Class Level</Label>
              <Select value={form.classLevelId} onValueChange={v => setForm({ ...form, classLevelId: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classLevels.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Description / Instructions</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="Complete Exercise 5.2 Q1-15. Show all working clearly. Submit before 8:00 AM." rows={3} className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Due Date *</Label>
              <Input type="datetime-local" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Max Marks</Label>
              <Input type="number" min={1} max={100} value={form.maxMarks}
                onChange={e => setForm({ ...form, maxMarks: e.target.value })} className="mt-1" />
            </div>
          </div>

          {/* Helper hint */}
          <div className="flex items-start gap-2 rounded-lg border border-dashed bg-muted/40 p-3 text-[11px] text-muted-foreground">
            <ListChecks className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-600" />
            <span>Homework starts as <span className="font-medium text-emerald-600">Active</span>. Mark as <span className="font-medium text-amber-600">Closed</span> after the due date, then <span className="font-medium text-teal-600">Graded</span> once marks are recorded.</span>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving}
              className="bg-teal-600 hover:bg-teal-700">
              {saving ? 'Creating...' : 'Create Homework'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
