'use client'
import { useState } from 'react'
import { useFetch, apiPut } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { avatarColor, initials, formatDate, timeAgo, statusColor } from '@/lib/format'
import { toast } from 'sonner'
import {
  ClipboardList, UserCheck, Clock, CheckCircle2, XCircle, Plus, Search,
  ChevronRight, Phone, Mail, School as SchoolIcon, Calendar, MapPin,
  Users, LayoutGrid, List, X, CalendarClock, UserPlus,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

interface AdmissionsData {
  stats: {
    total: number; pending: number; reviewing: number; interviewScheduled: number
    accepted: number; rejected: number; waitlisted: number; enrolled: number; recentThisWeek: number
  }
  applications: Array<{
    id: string; applicationNo: string; applicantName: string; email: string | null; phone: string
    gender: string; dateOfBirth: string | null; previousSchool: string | null
    appliedClassName: string | null; appliedYear: string; appliedTerm: string; boarding: boolean
    guardianName: string; guardianPhone: string; guardianEmail: string | null
    guardianOccupation: string | null; county: string | null
    source: string; status: string; priority: string
    interviewDate: string | null; interviewNotes: string | null
    decisionDate: string | null; decisionBy: string | null; rejectionReason: string | null
    notes: string | null; submittedAt: string
  }>
  byStatus: Array<{ name: string; count: number }>
  bySource: Array<{ name: string; count: number }>
  byPriority: Array<{ name: string; count: number }>
  upcomingInterviews: Array<{ id: string; applicationNo: string; applicantName: string; interviewDate: string; appliedClassName: string | null; guardianPhone: string }>
  classLevels: Array<{ id: string; name: string }>
}

const STATUS_META: Record<string, { color: string; dot: string; icon: any }> = {
  Pending: { color: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400', dot: '#f59e0b', icon: Clock },
  Reviewing: { color: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400', dot: '#06b6d4', icon: UserCheck },
  'Interview Scheduled': { color: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400', dot: '#8b5cf6', icon: CalendarClock },
  Accepted: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400', dot: '#10b981', icon: CheckCircle2 },
  Rejected: { color: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400', dot: '#ef4444', icon: XCircle },
  Waitlisted: { color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400', dot: '#64748b', icon: Clock },
  Enrolled: { color: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400', dot: '#14b8a6', icon: UserPlus },
}

const SOURCE_COLORS: Record<string, string> = { 'Walk-in': '#10b981', Online: '#06b6d4', Referral: '#8b5cf6', Transfer: '#f59e0b' }

export function AdmissionsModule() {
  const { data, loading } = useFetch<AdmissionsData>('/api/admissions')
  const [view, setView] = useState<'kanban' | 'list'>('kanban')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sourceFilter, setSourceFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [selectedApp, setSelectedApp] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter !== 'all') params.set('status', statusFilter)
  if (sourceFilter !== 'all') params.set('source', sourceFilter)
  if (priorityFilter !== 'all') params.set('priority', priorityFilter)
  const { data: filtered } = useFetch<AdmissionsData>(`/api/admissions?${params.toString()}`, [search, statusFilter, sourceFilter, priorityFilter])

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

  const display = filtered || data!
  const stats = display.stats
  const kanbanColumns = ['Pending', 'Reviewing', 'Interview Scheduled', 'Accepted', 'Waitlisted', 'Rejected']

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-600 via-teal-600 to-emerald-600 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <ClipboardList className="h-3 w-3" /> {stats.total} applications · {stats.recentThisWeek} new this week
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Admissions & Applications</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Manage the prospective student pipeline from application to enrollment.
            </p>
          </div>
          <Button variant="secondary" size="sm" className="bg-white text-teal-600 hover:bg-white/90" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Application
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 ring-1 ring-cyan-500/20">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Applications</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold">{stats.pending + stats.reviewing}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20">
              <CalendarClock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Interviews Scheduled</p>
              <p className="text-2xl font-bold">{stats.interviewScheduled}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Accepted / Enrolled</p>
              <p className="text-2xl font-bold">{stats.accepted + stats.enrolled}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts + upcoming interviews */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Status distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Application Pipeline</CardTitle>
            <CardDescription className="text-xs">Status breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={display.byStatus} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {display.byStatus.map(s => <Cell key={s.name} fill={STATUS_META[s.name]?.dot || '#94a3b8'} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-2 text-[10px]">
              {display.byStatus.map(s => (
                <div key={s.name} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: STATUS_META[s.name]?.dot || '#94a3b8' }} />
                  <span className="font-medium">{s.name}</span><span className="text-muted-foreground">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Source distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Applications by Source</CardTitle>
            <CardDescription className="text-xs">Where applicants come from</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={display.bySource} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="oklch(0.5 0.02 160)" />
                <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} cursor={{ fill: 'oklch(0.96 0.01 150)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {display.bySource.map(s => <Cell key={s.name} fill={SOURCE_COLORS[s.name] || '#94a3b8'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Upcoming interviews */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-violet-500" />
              <CardTitle className="text-base">Upcoming Interviews</CardTitle>
            </div>
            <CardDescription className="text-xs">Next scheduled assessments</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {display.upcomingInterviews.length > 0 ? display.upcomingInterviews.map(iv => (
              <div key={iv.id} className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/40">
                <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg bg-violet-500/10 text-violet-600">
                  <span className="text-[9px] font-semibold uppercase">{new Date(iv.interviewDate).toLocaleDateString('en-KE', { month: 'short' })}</span>
                  <span className="text-sm font-bold leading-none">{new Date(iv.interviewDate).getDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{iv.applicantName}</p>
                  <p className="truncate text-xs text-muted-foreground">{iv.applicationNo} · {iv.appliedClassName || '—'}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{new Date(iv.interviewDate).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })} · {iv.guardianPhone}</p>
                </div>
              </div>
            )) : <p className="py-4 text-center text-xs text-muted-foreground">No upcoming interviews.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Filters + view toggle */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search applicant, application no, guardian, school..." className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.keys(STATUS_META).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Source" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="Walk-in">Walk-in</SelectItem>
              <SelectItem value="Online">Online</SelectItem>
              <SelectItem value="Referral">Referral</SelectItem>
              <SelectItem value="Transfer">Transfer</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full md:w-32"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priority</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex rounded-lg border bg-muted/40 p-0.5">
            <Button variant={view === 'kanban' ? 'default' : 'ghost'} size="sm" className="h-8" onClick={() => setView('kanban')}>
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button variant={view === 'list' ? 'default' : 'ghost'} size="sm" className="h-8" onClick={() => setView('list')}>
              <List className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Kanban or List view */}
      {view === 'kanban' ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {kanbanColumns.map(col => {
            const colApps = display.applications.filter(a => a.status === col)
            const meta = STATUS_META[col]
            const Icon = meta.icon
            return (
              <div key={col} className="space-y-2">
                <div className="sticky top-16 z-10 flex items-center justify-between rounded-lg border bg-card/95 p-2 backdrop-blur">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full" style={{ background: meta.dot }} />
                    <span className="text-xs font-semibold">{col}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">{colApps.length}</Badge>
                </div>
                <div className="space-y-2">
                  {colApps.map(a => (
                    <Card key={a.id} className="stat-card cursor-pointer transition-all hover:shadow-md" onClick={() => setSelectedApp(a.id)}>
                      <CardContent className="p-3">
                        <div className="flex items-start gap-2">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className={cn('text-[10px] font-semibold text-white', avatarColor(a.applicantName))}>
                              {a.applicantName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold">{a.applicantName}</p>
                            <p className="truncate text-[10px] text-muted-foreground">{a.applicationNo}</p>
                          </div>
                          {a.priority === 'High' && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" title="High priority" />}
                        </div>
                        <div className="mt-2 space-y-1 text-[10px] text-muted-foreground">
                          <p className="flex items-center gap-1"><SchoolIcon className="h-2.5 w-2.5" />{a.previousSchool || '—'}</p>
                          <p className="flex items-center gap-1"><Users className="h-2.5 w-2.5" />{a.appliedClassName || '—'} · {a.boarding ? 'Boarding' : 'Day'}</p>
                          <p className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{timeAgo(a.submittedAt)}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {colApps.length === 0 && <p className="py-4 text-center text-[10px] text-muted-foreground">Empty</p>}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">All Applications</CardTitle>
            <CardDescription className="text-xs">{display.applications.length} records</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">Applicant</TableHead>
                    <TableHead className="text-xs">Applied Class</TableHead>
                    <TableHead className="text-xs">Guardian</TableHead>
                    <TableHead className="text-xs">Source</TableHead>
                    <TableHead className="text-center text-xs">Priority</TableHead>
                    <TableHead className="text-center text-xs">Status</TableHead>
                    <TableHead className="text-xs">Submitted</TableHead>
                    <TableHead className="text-right text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {display.applications.map(a => (
                    <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedApp(a.id)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className={cn('text-[10px] font-semibold text-white', avatarColor(a.applicantName))}>
                              {a.applicantName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{a.applicantName}</p>
                            <p className="text-xs text-muted-foreground">{a.applicationNo}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{a.appliedClassName || '—'} {a.boarding && <Badge variant="outline" className="ml-1 text-[10px]">Boarding</Badge>}</TableCell>
                      <TableCell>
                        <p className="text-xs font-medium">{a.guardianName}</p>
                        <p className="text-[10px] text-muted-foreground">{a.guardianPhone}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{a.source}</Badge></TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn('text-[10px]', a.priority === 'High' ? 'border-rose-300 text-rose-700' : a.priority === 'Low' ? 'border-slate-300 text-slate-500' : '')}>{a.priority}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={cn('text-[10px]', STATUS_META[a.status]?.color)}>{a.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{timeAgo(a.submittedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedApp(a.id) }}>
                          View <ChevronRight className="ml-0.5 h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detail dialog */}
      {selectedApp && <ApplicationDetailDialog applicationId={selectedApp} onClose={() => setSelectedApp(null)} />}
      {/* Add dialog */}
      {showAddDialog && <AddApplicationDialog onClose={() => setShowAddDialog(false)} classLevels={display.classLevels} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Application Detail Dialog
// ---------------------------------------------------------------------------
function ApplicationDetailDialog({ applicationId, onClose }: { applicationId: string; onClose: () => void }) {
  const { data: app, loading } = useFetch<any>(`/api/admissions/${applicationId}`)
  const [newStatus, setNewStatus] = useState('')
  const [interviewDate, setInterviewDate] = useState('')
  const [interviewNotes, setInterviewNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [saving, setSaving] = useState(false)

  const handleUpdate = async (updates: any) => {
    setSaving(true)
    try {
      await apiPut(`/api/admissions/${applicationId}`, updates)
      toast.success('Application updated')
      onClose()
    } catch (e: any) { toast.error(e?.message || 'Failed to update') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto scrollbar-thin">
        {loading || !app ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-cyan-500" /> Application Details
              </DialogTitle>
              <DialogDescription>{app.applicationNo} · Submitted {formatDate(app.submittedAt)}</DialogDescription>
            </DialogHeader>

            {/* Applicant header */}
            <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-cyan-50 to-teal-50 p-4 dark:from-cyan-950/30 dark:to-teal-950/30">
              <Avatar className="h-14 w-14 border-2 border-cyan-300 dark:border-cyan-800">
                <AvatarFallback className={cn('text-sm font-semibold text-white', avatarColor(app.applicantName))}>
                  {app.applicantName.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold">{app.applicantName}</p>
                <p className="text-xs text-muted-foreground">{app.applicationNo} · {app.gender} · {app.county || '—'}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge variant="secondary" className={cn('text-[10px]', STATUS_META[app.status]?.color)}>{app.status}</Badge>
                  <Badge variant="outline" className="text-[10px]">{app.source}</Badge>
                  <Badge variant="outline" className="text-[10px]">{app.priority} Priority</Badge>
                  {app.boarding && <Badge variant="outline" className="text-[10px]">Boarding</Badge>}
                </div>
              </div>
            </div>

            {/* Applicant + Guardian info */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="border-cyan-200/50 bg-cyan-50/30 dark:bg-cyan-950/10">
                <CardContent className="p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">Applicant</p>
                  <div className="space-y-1.5 text-sm">
                    {app.dateOfBirth && <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /><span>DOB: {formatDate(app.dateOfBirth)}</span></div>}
                    {app.previousSchool && <div className="flex items-center gap-2"><SchoolIcon className="h-3.5 w-3.5 text-muted-foreground" /><span>{app.previousSchool}</span></div>}
                    <div className="flex items-center gap-2"><SchoolIcon className="h-3.5 w-3.5 text-muted-foreground" /><span>Applied: {app.appliedClassLevel?.name || '—'} ({app.appliedYear} {app.appliedTerm})</span></div>
                    {app.county && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /><span>{app.county}</span></div>}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Guardian</p>
                  <div className="space-y-1.5 text-sm">
                    <p className="font-medium">{app.guardianName}</p>
                    {app.guardianOccupation && <p className="text-xs text-muted-foreground">{app.guardianOccupation}</p>}
                    <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span>{app.guardianPhone}</span></div>
                    {app.guardianEmail && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span className="truncate text-xs">{app.guardianEmail}</span></div>}
                    {app.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span className="truncate text-xs">{app.email}</span></div>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Interview info */}
            {app.interviewDate && (
              <div className="rounded-xl border-l-4 border-violet-400 bg-violet-50/50 p-4 dark:bg-violet-950/20">
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400">Interview Scheduled</p>
                <p className="text-sm font-medium">{new Date(app.interviewDate).toLocaleString('en-KE', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
                {app.interviewNotes && <p className="mt-1 text-xs text-muted-foreground">{app.interviewNotes}</p>}
              </div>
            )}

            {/* Decision info */}
            {app.decisionDate && (
              <div className={cn('rounded-xl border-l-4 p-4', app.status === 'Rejected' ? 'border-rose-400 bg-rose-50/50 dark:bg-rose-950/20' : 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20')}>
                <p className={cn('mb-1 text-[10px] font-semibold uppercase tracking-wider', app.status === 'Rejected' ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400')}>Decision: {app.status}</p>
                <p className="text-xs text-muted-foreground">Decided on {formatDate(app.decisionDate)} by {app.decisionBy || 'Administration'}</p>
                {app.rejectionReason && <p className="mt-1 text-sm font-medium text-rose-700 dark:text-rose-400">Reason: {app.rejectionReason}</p>}
              </div>
            )}

            {app.notes && (
              <div className="rounded-lg bg-muted/40 p-3 text-xs">
                <span className="font-semibold">Notes: </span>{app.notes}
              </div>
            )}

            {/* Actions */}
            {!app.decisionDate && (
              <div className="space-y-3 rounded-xl border-2 border-dashed border-cyan-200 p-4 dark:border-cyan-900">
                <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">Review Actions</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs">Update Status</Label>
                    <Select value={newStatus} onValueChange={setNewStatus}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder={app.status} /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(STATUS_META).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs">Schedule Interview (date & time)</Label>
                    <Input type="datetime-local" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs">Interview Notes</Label>
                  <Textarea value={interviewNotes} onChange={e => setInterviewNotes(e.target.value)} placeholder="Assessment details..." className="mt-1" rows={2} />
                </div>
                {(newStatus === 'Rejected') && (
                  <div>
                    <Label className="text-xs">Rejection Reason</Label>
                    <Textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Reason for rejection..." className="mt-1" rows={2} />
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleUpdate({ status: 'Reviewing' })} disabled={saving}>Mark Reviewing</Button>
                  {interviewDate && <Button size="sm" variant="outline" onClick={() => handleUpdate({ status: 'Interview Scheduled', interviewDate, interviewNotes })} disabled={saving}>Schedule Interview</Button>}
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => handleUpdate({ status: 'Accepted' })} disabled={saving}>Accept</Button>
                  <Button size="sm" variant="outline" onClick={() => handleUpdate({ status: 'Waitlisted' })} disabled={saving}>Waitlist</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleUpdate({ status: 'Rejected', rejectionReason })} disabled={saving}>Reject</Button>
                </div>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Add Application Dialog
// ---------------------------------------------------------------------------
function AddApplicationDialog({ onClose, classLevels }: { onClose: () => void; classLevels: Array<{ id: string; name: string }> }) {
  const [form, setForm] = useState({
    applicantName: '', email: '', phone: '', gender: 'Male', dateOfBirth: '',
    previousSchool: '', appliedClassLevelId: '', boarding: false,
    guardianName: '', guardianPhone: '', guardianEmail: '', guardianOccupation: '', county: '',
    source: 'Walk-in', priority: 'Normal', notes: '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.applicantName || !form.guardianName || !form.phone) { toast.error('Applicant name, guardian name and phone are required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/admissions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('Failed to create application')
      toast.success('Application submitted successfully')
      onClose()
    } catch (e: any) { toast.error(e?.message || 'Failed to submit') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-cyan-500" /> New Application</DialogTitle>
          <DialogDescription>Register a prospective student application</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg bg-cyan-50 p-2.5 text-[10px] text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400">
            Application number will be auto-generated (e.g. APP/7049)
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label className="text-xs">Applicant Name *</Label><Input value={form.applicantName} onChange={e => setForm({ ...form, applicantName: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Phone *</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Gender</Label><Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Date of Birth</Label><Input type="date" value={form.dateOfBirth} onChange={e => setForm({ ...form, dateOfBirth: e.target.value })} className="mt-1" /></div>
            <div className="sm:col-span-2"><Label className="text-xs">Previous School</Label><Input value={form.previousSchool} onChange={e => setForm({ ...form, previousSchool: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Applied Class</Label><Select value={form.appliedClassLevelId} onValueChange={v => setForm({ ...form, appliedClassLevelId: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger><SelectContent>{classLevels.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Boarding</Label><Select value={form.boarding ? 'yes' : 'no'} onValueChange={v => setForm({ ...form, boarding: v === 'yes' })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="no">Day Scholar</SelectItem><SelectItem value="yes">Boarding</SelectItem></SelectContent></Select></div>
          </div>
          <div className="border-t pt-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Guardian Details</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><Label className="text-xs">Guardian Name *</Label><Input value={form.guardianName} onChange={e => setForm({ ...form, guardianName: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Guardian Phone</Label><Input value={form.guardianPhone} onChange={e => setForm({ ...form, guardianPhone: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Guardian Email</Label><Input type="email" value={form.guardianEmail} onChange={e => setForm({ ...form, guardianEmail: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">Occupation</Label><Input value={form.guardianOccupation} onChange={e => setForm({ ...form, guardianOccupation: e.target.value })} className="mt-1" /></div>
              <div><Label className="text-xs">County</Label><Input value={form.county} onChange={e => setForm({ ...form, county: e.target.value })} className="mt-1" /></div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Source</Label><Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Walk-in">Walk-in</SelectItem><SelectItem value="Online">Online</SelectItem><SelectItem value="Referral">Referral</SelectItem><SelectItem value="Transfer">Transfer</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Priority</Label><Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Normal">Normal</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Low">Low</SelectItem></SelectContent></Select></div>
          </div>
          <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1" rows={2} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving} className="bg-cyan-600 hover:bg-cyan-700">{saving ? 'Submitting...' : 'Submit Application'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
