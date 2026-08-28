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
import { timeAgo } from '@/lib/format'
import { toast } from 'sonner'
import {
  NotebookPen, Plus, BookOpen, CalendarFold as CalendarWeek, FileEdit, Send, CheckCircle2,
  Target, ListChecks, Wrench, ClipboardCheck, StickyNote, Search, X, User, Layers, Hash,
} from 'lucide-react'

interface SubjectRef { id: string; name: string; code: string; category?: string }
interface ClassLevelRef { id: string; name: string; stage: string }

interface LessonPlan {
  id: string
  subjectId: string | null
  classLevelId: string | null
  week: number
  term: string
  topic: string
  objectives: string | null
  activities: string | null
  resources: string | null
  assessment: string | null
  notes: string | null
  createdBy: string | null
  status: string
  createdAt: string
  updatedAt: string
  subjectName: string | null
  subjectCode: string | null
  classLevelName: string | null
  stage: string | null
}

interface LessonPlansData {
  stats: { total: number; published: number; drafts: number; completed: number; thisWeek: number; currentWeek: number }
  bySubject: Array<{ subjectId: string | null; name: string; count: number }>
  subjects: SubjectRef[]
  classLevels: ClassLevelRef[]
  lessonPlans: LessonPlan[]
}

const STATUS_META: Record<string, { label: string; cls: string; dot: string }> = {
  Draft:     { label: 'Draft',     cls: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',  dot: 'bg-amber-500' },
  Published: { label: 'Published', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', dot: 'bg-emerald-500' },
  Completed: { label: 'Completed', cls: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400', dot: 'bg-teal-500' },
}

const SUBJECT_ACCENTS = [
  'from-emerald-500 to-teal-600',
  'from-teal-500 to-cyan-600',
  'from-green-500 to-emerald-600',
  'from-cyan-500 to-teal-600',
  'from-emerald-600 to-green-700',
  'from-teal-600 to-emerald-700',
]

function subjectGradient(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return SUBJECT_ACCENTS[Math.abs(hash) % SUBJECT_ACCENTS.length]
}

export function LessonPlansModule() {
  const { data, loading, refetch } = useFetch<LessonPlansData>('/api/lessonplans')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [weekFilter, setWeekFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddDialog, setShowAddDialog] = useState(false)

  const subjects = data?.subjects || []
  const classLevels = data?.classLevels || []
  const stats = data?.stats
  const bySubject = data?.bySubject || []

  // Available weeks (from data, deduped + sorted)
  const weeks = useMemo(() => {
    if (!data?.lessonPlans) return []
    return Array.from(new Set(data.lessonPlans.map(p => p.week))).sort((a, b) => a - b)
  }, [data])

  const filtered = useMemo(() => {
    if (!data?.lessonPlans) return []
    return data.lessonPlans.filter(p => {
      if (subjectFilter !== 'all' && p.subjectId !== subjectFilter) return false
      if (classFilter !== 'all' && p.classLevelId !== classFilter) return false
      if (weekFilter !== 'all' && p.week !== Number(weekFilter)) return false
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        const haystack = `${p.topic} ${p.objectives || ''} ${p.activities || ''} ${p.notes || ''} ${p.subjectName || ''}`.toLowerCase()
        if (!haystack.includes(q)) return false
      }
      return true
    })
  }, [data, subjectFilter, classFilter, weekFilter, statusFilter, search])

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64 w-full rounded-xl" />)}
        </div>
      </div>
    )
  }

  const hasFilters = subjectFilter !== 'all' || classFilter !== 'all' || weekFilter !== 'all' || statusFilter !== 'all' || search.trim() !== ''
  const clearFilters = () => {
    setSubjectFilter('all'); setClassFilter('all'); setWeekFilter('all'); setStatusFilter('all'); setSearch('')
  }

  return (
    <div className="space-y-6">
      {/* Header banner — emerald gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 p-6 text-white shadow-xl">
        <div className="absolute -right-12 -top-12 h-56 w-56 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-16 -left-8 h-40 w-40 rounded-full bg-teal-300/15 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <CalendarWeek className="h-3 w-3" /> Week {stats.currentWeek} · Term 1, 2025 · {stats.total} lesson plans
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Lesson Plans & Schemes of Work</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Plan weekly lessons by subject & class. Track objectives, activities, resources, assessment & notes — aligned to the CBE curriculum.
            </p>
          </div>
          <Button variant="secondary" size="sm" className="bg-white text-emerald-700 hover:bg-white/90" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Lesson Plan
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <NotebookPen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Plans</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20">
              <Send className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Published</p>
              <p className="text-2xl font-bold">{stats.published}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <FileEdit className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Drafts</p>
              <p className="text-2xl font-bold">{stats.drafts}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 ring-1 ring-cyan-500/20">
              <CalendarWeek className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">This Week</p>
              <p className="text-2xl font-bold">{stats.thisWeek}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subject breakdown */}
      {bySubject.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Layers className="h-4 w-4 text-emerald-600" /> Plans by Subject
            </CardTitle>
            <CardDescription className="text-xs">Lesson plan distribution across subjects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {bySubject.sort((a, b) => b.count - a.count).map(s => {
                const pct = stats.total ? Math.round((s.count / stats.total) * 100) : 0
                return (
                  <div key={s.subjectId || 'unassigned'} className="flex items-center gap-2 rounded-full border bg-muted/40 py-1 pl-3 pr-2 text-xs">
                    <span className="font-medium">{s.name}</span>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 text-[10px]">{s.count}</Badge>
                    <span className="text-[10px] text-muted-foreground">{pct}%</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
            <div className="lg:col-span-1">
              <Label className="text-xs">Search</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Topic, keyword..." className="pl-8" />
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
              <Label className="text-xs">Week</Label>
              <Select value={weekFilter} onValueChange={setWeekFilter}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="All weeks" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All weeks</SelectItem>
                  {weeks.map(w => <SelectItem key={w} value={String(w)}>Week {w}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {data.lessonPlans.length} lesson plans
            </p>
            {hasFilters && (
              <Button size="sm" variant="ghost" onClick={clearFilters} className="h-7 text-xs">
                <X className="mr-1 h-3 w-3" /> Clear filters
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lesson plan cards */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
            <NotebookPen className="h-7 w-7" />
          </div>
          <div>
            <p className="font-semibold">No lesson plans found</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {hasFilters ? 'Try adjusting your filters.' : 'Create your first lesson plan to get started.'}
            </p>
          </div>
          {!hasFilters && (
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-1 h-4 w-4" /> New Lesson Plan
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map(p => (
            <LessonPlanCard
              key={p.id}
              plan={p}
              onStatusChange={async (status) => {
                try {
                  await apiPut('/api/lessonplans', { id: p.id, status, updatedBy: useAuthStore.getState().user?.name })
                  toast.success(`Lesson plan marked as ${status}`)
                  refetch()
                } catch (e: any) {
                  toast.error(e?.message || 'Failed to update status')
                }
              }}
            />
          ))}
        </div>
      )}

      {showAddDialog && (
        <AddLessonPlanDialog
          subjects={subjects}
          classLevels={classLevels}
          defaultWeek={stats.currentWeek}
          onClose={() => setShowAddDialog(false)}
          onCreated={() => { setShowAddDialog(false); refetch() }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Lesson Plan Card
// ---------------------------------------------------------------------------
function LessonPlanCard({ plan, onStatusChange }: {
  plan: LessonPlan
  onStatusChange: (status: string) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const meta = STATUS_META[plan.status] || STATUS_META.Draft
  const gradient = subjectGradient(plan.subjectId || plan.subjectName || plan.topic)

  return (
    <Card className="group relative flex flex-col overflow-hidden transition-all hover:shadow-md">
      {/* Top color strip */}
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
                {plan.subjectName || 'Unassigned'} {plan.subjectCode && <span className="text-[10px]">· {plan.subjectCode}</span>}
              </p>
              <p className="text-[10px] text-muted-foreground">{plan.classLevelName || 'All classes'} · {plan.term}</p>
            </div>
          </div>
          <Badge variant="secondary" className={cn('text-[10px] shrink-0', meta.cls)}>
            <span className={cn('mr-1 inline-block h-1.5 w-1.5 rounded-full', meta.dot)} />
            {meta.label}
          </Badge>
        </div>

        {/* Topic + week */}
        <div>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <Hash className="h-3 w-3" /> Week {plan.week}
          </div>
          <h3 className="mt-0.5 line-clamp-2 text-base font-semibold leading-tight">{plan.topic}</h3>
        </div>

        {/* Body sections (collapsed by default to keep cards compact) */}
        <div className={cn('space-y-2.5 text-xs', expanded ? '' : 'max-h-32 overflow-hidden')}>
          <PlanSection icon={Target} label="Objectives" text={plan.objectives} accent="text-emerald-600" />
          <PlanSection icon={ListChecks} label="Activities" text={plan.activities} accent="text-teal-600" />
          <PlanSection icon={Wrench} label="Resources" text={plan.resources} accent="text-cyan-600" />
          <PlanSection icon={ClipboardCheck} label="Assessment" text={plan.assessment} accent="text-amber-600" />
          {plan.notes && <PlanSection icon={StickyNote} label="Notes" text={plan.notes} accent="text-violet-600" />}
        </div>

        {(() => {
          const totalLen = (plan.objectives || '').length + (plan.activities || '').length
            + (plan.resources || '').length + (plan.assessment || '').length + (plan.notes || '').length
          return totalLen > 200 ? (
            <button
              onClick={() => setExpanded(e => !e)}
              className="self-start text-[11px] font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          ) : null
        })()}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3">
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <User className="h-2.5 w-2.5" />
            <span className="truncate max-w-[8rem]">{plan.createdBy || 'Unknown'}</span>
            <span>·</span>
            <span>{timeAgo(plan.updatedAt)}</span>
          </div>
          <div className="flex items-center gap-1">
            {plan.status === 'Draft' && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950"
                onClick={() => onStatusChange('Published')}>
                <Send className="mr-1 h-3 w-3" /> Publish
              </Button>
            )}
            {plan.status === 'Published' && (
              <Button size="sm" variant="ghost" className="h-7 px-2 text-[11px] text-teal-600 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-950"
                onClick={() => onStatusChange('Completed')}>
                <CheckCircle2 className="mr-1 h-3 w-3" /> Complete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PlanSection({ icon: Icon, label, text, accent }: {
  icon: any; label: string; text: string | null; accent: string
}) {
  if (!text) return null
  return (
    <div>
      <p className={cn('mb-0.5 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider', accent)}>
        <Icon className="h-2.5 w-2.5" /> {label}
      </p>
      <p className="whitespace-pre-wrap text-[11px] leading-relaxed text-foreground/80">{text}</p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add Lesson Plan Dialog
// ---------------------------------------------------------------------------
function AddLessonPlanDialog({ subjects, classLevels, defaultWeek, onClose, onCreated }: {
  subjects: SubjectRef[]
  classLevels: ClassLevelRef[]
  defaultWeek: number
  onClose: () => void
  onCreated: () => void
}) {
  const { user } = useAuthStore()
  const [form, setForm] = useState({
    subjectId: '',
    classLevelId: '',
    week: String(defaultWeek),
    term: 'Term 1',
    topic: '',
    objectives: '',
    activities: '',
    resources: '',
    assessment: '',
    notes: '',
    status: 'Draft',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.topic.trim()) { toast.error('Topic is required'); return }
    if (!form.week || Number(form.week) < 1) { toast.error('Week must be a positive number'); return }
    setSaving(true)
    try {
      await apiPost('/api/lessonplans', {
        ...form,
        week: Number(form.week),
        subjectId: form.subjectId || null,
        classLevelId: form.classLevelId || null,
        createdBy: user?.name || null,
      })
      toast.success('Lesson plan created successfully')
      onCreated()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to create lesson plan')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <NotebookPen className="h-5 w-5 text-emerald-600" /> New Lesson Plan
          </DialogTitle>
          <DialogDescription>Create a weekly lesson plan / scheme of work entry</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Author auto-fill */}
          <div className="flex items-center gap-2 rounded-lg border bg-emerald-50/50 px-3 py-2 text-xs dark:bg-emerald-950/20">
            <User className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-muted-foreground">Author:</span>
            <span className="font-medium text-emerald-700 dark:text-emerald-400">{user?.name || 'Current user'}</span>
            <span className="ml-auto text-[10px] text-muted-foreground">Auto-filled from your account</span>
          </div>

          <div>
            <Label className="text-xs">Topic *</Label>
            <Input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })}
              placeholder="e.g. Algebra: Linear Equations & Word Problems" className="mt-1" />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div>
              <Label className="text-xs">Subject</Label>
              <Select value={form.subjectId} onValueChange={v => setForm({ ...form, subjectId: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Class Level</Label>
              <Select value={form.classLevelId} onValueChange={v => setForm({ ...form, classLevelId: v })}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {classLevels.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Week No. *</Label>
              <Input type="number" min={1} max={14} value={form.week}
                onChange={e => setForm({ ...form, week: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Term</Label>
              <Select value={form.term} onValueChange={v => setForm({ ...form, term: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Term 1">Term 1</SelectItem>
                  <SelectItem value="Term 2">Term 2</SelectItem>
                  <SelectItem value="Term 3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Learning Objectives</Label>
            <Textarea value={form.objectives} onChange={e => setForm({ ...form, objectives: e.target.value })}
              placeholder="By the end of the lesson, the learner should be able to:&#10;1. ...&#10;2. ..." rows={3} className="mt-1" />
          </div>

          <div>
            <Label className="text-xs">Learning Activities</Label>
            <Textarea value={form.activities} onChange={e => setForm({ ...form, activities: e.target.value })}
              placeholder="• Recap previous lesson&#10;• Group discussion&#10;• Guided practice..." rows={3} className="mt-1" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Teaching Resources</Label>
              <Textarea value={form.resources} onChange={e => setForm({ ...form, resources: e.target.value })}
                placeholder="KICD textbook, charts, calculators..." rows={3} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Assessment</Label>
              <Textarea value={form.assessment} onChange={e => setForm({ ...form, assessment: e.target.value })}
                placeholder="Oral questions, exercise Q1-10, exit ticket..." rows={3} className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Notes / Reflections</Label>
            <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Notes on differentiation, remedial, learner needs..." rows={2} className="mt-1" />
          </div>

          <div>
            <Label className="text-xs">Status</Label>
            <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Draft">Draft — Save for later</SelectItem>
                <SelectItem value="Published">Published — Share with team</SelectItem>
                <SelectItem value="Completed">Completed — Lesson delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? 'Creating...' : 'Create Lesson Plan'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
