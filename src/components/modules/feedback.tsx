'use client'
import { useState } from 'react'
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
import { cn, timeAgo, avatarColor, initials } from '@/lib/format'
import { toast } from 'sonner'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import {
  MessageSquare, Star, Plus, Search, CheckCircle2, Eye, Filter,
  ThumbsUp, MessageCircle, UtensilsCrossed, Bus, Building2, Sparkles, Loader2,
} from 'lucide-react'

const CATEGORIES = [
  { value: 'General', label: 'General', icon: MessageCircle, color: '#8b5cf6' },
  { value: 'Teaching', label: 'Teaching', icon: Sparkles, color: '#10b981' },
  { value: 'Facilities', label: 'Facilities', icon: Building2, color: '#06b6d4' },
  { value: 'Food', label: 'Food', icon: UtensilsCrossed, color: '#f59e0b' },
  { value: 'Transport', label: 'Transport', icon: Bus, color: '#ef4444' },
] as const

const ROLE_COLORS: Record<string, string> = {
  Parent: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Student: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  Staff: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
}

const STATUS_COLORS: Record<string, string> = {
  New: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Reviewed: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
  Addressed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
}

const RATING_COLORS = ['#ef4444', '#f97316', '#eab308', '#84cc16', '#10b981']

interface FeedbackItem {
  id: string
  category: string
  rating: number
  comment: string
  submittedBy: string | null
  role: string
  status: string
  createdAt: string
}

interface FeedbackData {
  stats: { total: number; avgRating: number; newCount: number; reviewedCount: number; addressedCount: number }
  byCategory: Array<{ name: string; count: number }>
  byRole: Array<{ name: string; count: number }>
  byStatus: Array<{ name: string; count: number }>
  ratingDistribution: Array<{ rating: number; count: number; label: string }>
  feedback: FeedbackItem[]
}

function Stars({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4'
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(sz, i < rating ? 'fill-amber-400 text-amber-400' : 'fill-muted text-muted-foreground/40')}
        />
      ))}
    </div>
  )
}

function categoryIcon(cat: string) {
  return CATEGORIES.find(c => c.value === cat)?.icon || MessageCircle
}

function categoryColor(cat: string) {
  return CATEGORIES.find(c => c.value === cat)?.color || '#8b5cf6'
}

export function FeedbackModule() {
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (categoryFilter !== 'all') params.set('category', categoryFilter)
  if (statusFilter !== 'all') params.set('status', statusFilter)
  const { data, loading } = useFetch<FeedbackData>(`/api/feedback?${params.toString()}`, [refreshKey, search, categoryFilter, statusFilter])

  const handleUpdateStatus = async (id: string, status: 'Reviewed' | 'Addressed') => {
    setUpdatingId(id)
    try {
      await apiPut('/api/feedback', { id, status })
      toast.success(`Marked as ${status}`)
      setRefreshKey(k => k + 1)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-72 w-full rounded-xl" />
          <Skeleton className="h-72 w-full rounded-xl lg:col-span-2" />
        </div>
      </div>
    )
  }

  const d = data!
  const hasFilters = search || categoryFilter !== 'all' || statusFilter !== 'all'

  return (
    <div className="space-y-6">
      {/* Violet gradient header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-700 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-fuchsia-400/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <MessageSquare className="h-3 w-3" /> {d.stats.newCount} new · {d.stats.total} total · {d.stats.avgRating}★ avg
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Feedback & Surveys</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Collect and act on feedback from parents, students, and staff across all school services.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            className="bg-white text-violet-700 hover:bg-white/90"
            onClick={() => setShowSubmitDialog(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" /> Submit Feedback
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Feedback</p>
              <p className="text-2xl font-bold">{d.stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Avg Rating</p>
              <p className="text-2xl font-bold">{d.stats.avgRating} <span className="text-sm text-muted-foreground">/ 5</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">New</p>
              <p className="text-2xl font-bold">{d.stats.newCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Addressed</p>
              <p className="text-2xl font-bold">{d.stats.addressedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts + breakdown */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Rating distribution donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Rating Distribution</CardTitle>
            <CardDescription className="text-xs">How people rate their experience</CardDescription>
          </CardHeader>
          <CardContent>
            {d.stats.total > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={d.ratingDistribution}
                      dataKey="count"
                      nameKey="label"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={78}
                      paddingAngle={3}
                    >
                      {d.ratingDistribution.map(r => (
                        <Cell key={r.rating} fill={RATING_COLORS[r.rating - 1]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }}
                      formatter={(v: any, n: any) => [`${v} response${Number(v) === 1 ? '' : 's'}`, n]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 grid grid-cols-5 gap-1 text-center text-xs">
                  {d.ratingDistribution.map(r => (
                    <div key={r.rating}>
                      <div className="mx-auto mb-1 h-2 w-full rounded-full" style={{ background: RATING_COLORS[r.rating - 1] }} />
                      <p className="font-semibold">{r.rating}★</p>
                      <p className="text-muted-foreground">{r.count}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex h-[200px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                <Star className="h-8 w-8" />
                <p>No ratings yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* By category */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">By Category</CardTitle>
            <CardDescription className="text-xs">Feedback topics breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5 pt-1">
            {CATEGORIES.map(cat => {
              const found = d.byCategory.find(c => c.name === cat.value)
              const count = found?.count || 0
              const pct = d.stats.total > 0 ? (count / d.stats.total) * 100 : 0
              const Icon = cat.icon
              return (
                <div key={cat.value} className="flex items-center gap-3">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${cat.color}1a`, color: cat.color }}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="font-medium">{cat.label}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cat.color }} />
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* By role */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">By Role</CardTitle>
            <CardDescription className="text-xs">Who is submitting feedback</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-1">
            {['Parent', 'Student', 'Staff'].map(role => {
              const found = d.byRole.find(r => r.name === role)
              const count = found?.count || 0
              const pct = d.stats.total > 0 ? (count / d.stats.total) * 100 : 0
              return (
                <div key={role}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className={cn('text-[10px]', ROLE_COLORS[role])}>{role}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">{count} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full', role === 'Parent' ? 'bg-emerald-500' : role === 'Student' ? 'bg-cyan-500' : 'bg-violet-500')}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
            <div className="mt-3 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5"><Eye className="h-3.5 w-3.5" /> Reviewed</span>
                <span className="font-semibold text-foreground">{d.stats.reviewedCount}</span>
              </div>
              <div className="mt-1.5 flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5" /> Addressed</span>
                <span className="font-semibold text-foreground">{d.stats.addressedCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search comments or names..."
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-44">
              <Filter className="mr-1.5 h-3.5 w-3.5" />
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Reviewed">Reviewed</SelectItem>
              <SelectItem value="Addressed">Addressed</SelectItem>
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setSearch(''); setCategoryFilter('all'); setStatusFilter('all') }}
              className="shrink-0"
            >
              Clear
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Feedback cards */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-muted-foreground">
            {d.feedback.length} response{d.feedback.length === 1 ? '' : 's'}
            {hasFilters && ' matching filters'}
          </h3>
        </div>
        {d.feedback.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/10 text-violet-600">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="font-medium">No feedback yet</p>
              <p className="text-sm text-muted-foreground">Be the first to share feedback.</p>
              <Button size="sm" className="mt-2 bg-violet-600 hover:bg-violet-700" onClick={() => setShowSubmitDialog(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Submit Feedback
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {d.feedback.map(f => {
              const Icon = categoryIcon(f.category)
              const color = categoryColor(f.category)
              const isUpdating = updatingId === f.id
              return (
                <Card key={f.id} className="overflow-hidden transition-all hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl"
                          style={{ background: `${color}1a`, color }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <Badge variant="outline" className="text-[10px] font-medium" style={{ borderColor: `${color}40`, color }}>
                            {f.category}
                          </Badge>
                          <div className="mt-1">
                            <Stars rating={f.rating} />
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className={cn('text-[10px] capitalize', STATUS_COLORS[f.status])}>
                        {f.status}
                      </Badge>
                    </div>

                    <p className="mt-3 text-sm leading-relaxed text-foreground/90 line-clamp-4">"{f.comment}"</p>

                    <div className="mt-4 flex items-center justify-between border-t pt-3">
                      <div className="flex items-center gap-2">
                        {f.submittedBy ? (
                          <>
                            <div className={cn('flex h-7 w-7 items-center justify-center rounded-full text-[10px] font-semibold text-white', avatarColor(f.submittedBy))}>
                              {initials(f.submittedBy.split(' ')[0], f.submittedBy.split(' ')[1])}
                            </div>
                            <div>
                              <p className="text-xs font-medium">{f.submittedBy}</p>
                              <p className="text-[10px] text-muted-foreground">{timeAgo(f.createdAt)}</p>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                              ?
                            </div>
                            <div>
                              <p className="text-xs font-medium">Anonymous</p>
                              <p className="text-[10px] text-muted-foreground">{timeAgo(f.createdAt)}</p>
                            </div>
                          </div>
                        )}
                        <Badge variant="secondary" className={cn('ml-1 text-[10px]', ROLE_COLORS[f.role])}>
                          {f.role}
                        </Badge>
                      </div>
                      <div className="flex gap-1.5">
                        {f.status === 'New' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(f.id, 'Reviewed')}
                          >
                            {isUpdating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <Eye className="mr-1 h-3 w-3" />}
                            Mark Reviewed
                          </Button>
                        )}
                        {f.status !== 'Addressed' && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950"
                            disabled={isUpdating}
                            onClick={() => handleUpdateStatus(f.id, 'Addressed')}
                          >
                            {isUpdating ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <ThumbsUp className="mr-1 h-3 w-3" />}
                            Mark Addressed
                          </Button>
                        )}
                        {f.status === 'Addressed' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Resolved
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {showSubmitDialog && (
        <SubmitFeedbackDialog
          onClose={() => setShowSubmitDialog(false)}
          onCreated={() => { setRefreshKey(k => k + 1); setShowSubmitDialog(false) }}
        />
      )}
    </div>
  )
}

function SubmitFeedbackDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [category, setCategory] = useState('General')
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [role, setRole] = useState('Parent')
  const [submittedBy, setSubmittedBy] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast.error('Please enter a comment')
      return
    }
    setSaving(true)
    try {
      await apiPost('/api/feedback', {
        category,
        rating,
        comment: comment.trim(),
        role,
        submittedBy: submittedBy.trim() || null,
      })
      toast.success('Feedback submitted. Thank you!')
      onCreated()
    } catch {
      toast.error('Failed to submit feedback')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
              <MessageSquare className="h-4 w-4" />
            </div>
            Submit Feedback
          </DialogTitle>
          <DialogDescription>Share your experience to help us improve our services.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Category */}
          <div>
            <Label className="text-xs font-medium">Category</Label>
            <div className="mt-1.5 grid grid-cols-5 gap-1.5">
              {CATEGORIES.map(c => {
                const Icon = c.icon
                const active = category === c.value
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 rounded-lg border p-2 text-[10px] font-medium transition-all',
                      active
                        ? 'border-transparent text-white shadow-sm'
                        : 'border-border bg-background text-muted-foreground hover:bg-muted'
                    )}
                    style={active ? { background: c.color } : undefined}
                  >
                    <Icon className="h-4 w-4" />
                    {c.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Rating slider */}
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Rating</Label>
              <div className="flex items-center gap-2">
                <Stars rating={rating} size="md" />
                <span className="text-sm font-bold text-violet-600">{rating}/5</span>
              </div>
            </div>
            <Slider
              value={[rating]}
              onValueChange={(v) => setRating(v[0])}
              min={1}
              max={5}
              step={1}
              className="mt-3 [&_[role=slider]]:bg-violet-600 [&_.bg-primary]:bg-violet-500"
            />
            <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
              <span>1 · Poor</span>
              <span>2</span>
              <span>3 · OK</span>
              <span>4</span>
              <span>5 · Excellent</span>
            </div>
          </div>

          {/* Comment */}
          <div>
            <Label className="text-xs font-medium">Comment *</Label>
            <Textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Tell us what you think..."
              className="mt-1.5 min-h-[100px] resize-none"
            />
          </div>

          {/* Role + Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs font-medium">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Parent">Parent</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Name (optional)</Label>
              <Input
                value={submittedBy}
                onChange={e => setSubmittedBy(e.target.value)}
                placeholder="Anonymous"
                className="mt-1.5"
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="bg-violet-600 hover:bg-violet-700" onClick={handleSubmit} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />}
            Submit Feedback
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
