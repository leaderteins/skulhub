'use client'
import { useState } from 'react'
import { useFetch, apiPut } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
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
import { avatarColor, initials, fullName, formatDate, formatDateTime, timeAgo, statusColor } from '@/lib/format'
import { toast } from 'sonner'
import {
  Scale, AlertTriangle, AlertOctagon, ShieldAlert, Plus, Search, ChevronRight,
  MapPin, User, Eye, Gavel, CheckCircle2, Phone, Clock, FileWarning, Repeat, X,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

interface DisciplineData {
  stats: {
    total: number; open: number; investigating: number; resolved: number; closed: number
    critical: number; recentThisWeek: number; criticalOpen: number
  }
  incidents: Array<{
    id: string; incidentNo: string; date: string; location: string | null
    category: string; severity: string; description: string; reportedBy: string | null
    witnesses: string | null; status: string; sanction: string | null; sanctionDetails: string | null
    sanctionStartDate: string | null; sanctionEndDate: string | null; resolvedDate: string | null
    resolvedBy: string | null; resolutionNotes: string | null; parentNotified: boolean
    parentNotificationDate: string | null
    student: { id: string; admissionNo: string; firstName: string; lastName: string; gender: string; stream: string | null; classLevel: string | null }
  }>
  bySeverity: Array<{ name: string; count: number }>
  byCategory: Array<{ name: string; count: number }>
  byStatus: Array<{ name: string; count: number }>
  repeatOffenders: Array<{ id: string; admissionNo: string; firstName: string; lastName: string; incidentCount: number; stream: string | null; classLevel: string | null }>
}

const SEVERITY_META: Record<string, { color: string; dot: string; bg: string; text: string; icon: any }> = {
  Minor: { color: 'emerald', dot: '#10b981', bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-700 dark:text-emerald-400', icon: CheckCircle2 },
  Moderate: { color: 'amber', dot: '#f59e0b', bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-400', icon: AlertTriangle },
  Major: { color: 'orange', dot: '#f97316', bg: 'bg-orange-100 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-400', icon: AlertOctagon },
  Critical: { color: 'rose', dot: '#ef4444', bg: 'bg-rose-100 dark:bg-rose-950', text: 'text-rose-700 dark:text-rose-400', icon: ShieldAlert },
}

const CATEGORY_ICONS: Record<string, any> = {
  Bullying: AlertOctagon, Fighting: ShieldAlert, Theft: FileWarning, Vandalism: FileWarning,
  Truancy: Clock, Misconduct: AlertTriangle, Insubordination: AlertTriangle,
  'Dress Code': AlertTriangle, 'Substance Abuse': ShieldAlert, Other: AlertTriangle,
}

const SANCTION_COLORS: Record<string, string> = {
  'Verbal Warning': 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  'Written Warning': 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  Detention: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  'Community Service': 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-400',
  Counselling: 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-400',
  'Parent Meeting': 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-400',
  Suspension: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
  Expulsion: 'border-rose-500 bg-rose-100 text-rose-800 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-400',
}

export function DisciplineModule() {
  const { data, loading } = useFetch<DisciplineData>('/api/discipline')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedIncident, setSelectedIncident] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (categoryFilter !== 'all') params.set('category', categoryFilter)
  if (severityFilter !== 'all') params.set('severity', severityFilter)
  if (statusFilter !== 'all') params.set('status', statusFilter)
  const { data: filtered } = useFetch<DisciplineData>(`/api/discipline?${params.toString()}`, [search, categoryFilter, severityFilter, statusFilter])

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

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-700 via-slate-800 to-gray-900 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-rose-500/20 blur-2xl" />
        <div className="absolute -bottom-12 right-24 h-40 w-40 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Scale className="h-3 w-3" /> {stats.total} incidents · {stats.criticalOpen} critical open · {stats.recentThisWeek} this week
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Discipline & Behavior</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Track student conduct, manage incidents, and administer sanctions with full audit trails.
            </p>
          </div>
          <Button variant="secondary" size="sm" className="bg-white text-slate-800 hover:bg-white/90" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Log Incident
          </Button>
        </div>
      </div>

      {/* Alert banner for critical open incidents */}
      {stats.criticalOpen > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-600">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">{stats.criticalOpen} Critical Incident{stats.criticalOpen > 1 ? 's' : ''} Require Attention</p>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80">Immediate action required — review and resolve critical cases pending investigation.</p>
          </div>
          <Button size="sm" variant="outline" className="border-rose-300 text-rose-700 hover:bg-rose-100 dark:border-rose-800 dark:text-rose-400" onClick={() => setStatusFilter('Open')}>
            Review Now
          </Button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/20">
              <Scale className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Incidents</p>
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
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Open / Investigating</p>
              <p className="text-2xl font-bold">{stats.open + stats.investigating}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Critical Cases</p>
              <p className="text-2xl font-bold">{stats.critical}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Resolved / Closed</p>
              <p className="text-2xl font-bold">{stats.resolved + stats.closed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts + repeat offenders */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Severity distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Incidents by Severity</CardTitle>
            <CardDescription className="text-xs">Case severity breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={display.bySeverity} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {display.bySeverity.map(s => <Cell key={s.name} fill={SEVERITY_META[s.name]?.dot || '#94a3b8'} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-2 text-[10px]">
              {display.bySeverity.map(s => (
                <div key={s.name} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: SEVERITY_META[s.name]?.dot }} />
                  <span className="font-medium">{s.name}</span><span className="text-muted-foreground">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Incidents by Category</CardTitle>
            <CardDescription className="text-xs">Types of misconduct</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={display.byCategory} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="oklch(0.5 0.02 160)" width={90} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} cursor={{ fill: 'oklch(0.96 0.01 150)' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={22} fill="#64748b" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Repeat offenders */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Repeat className="h-4 w-4 text-rose-500" />
              <CardTitle className="text-base">Repeat Offenders</CardTitle>
            </div>
            <CardDescription className="text-xs">Students with 3+ incidents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {display.repeatOffenders.length > 0 ? display.repeatOffenders.slice(0, 6).map(s => (
              <div key={s.id} className="flex items-center gap-2.5 rounded-lg border p-2 transition-colors hover:bg-muted/40">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={cn('text-[10px] font-semibold text-white', avatarColor(fullName(s)))}>
                    {initials(s.firstName, s.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium">{fullName(s)}</p>
                  <p className="truncate text-[10px] text-muted-foreground">{s.admissionNo} · {s.classLevel} {s.stream}</p>
                </div>
                <Badge variant="outline" className={cn('shrink-0 text-[10px] font-bold', s.incidentCount >= 5 ? 'border-rose-300 text-rose-700' : 'border-amber-300 text-amber-700')}>
                  {s.incidentCount}x
                </Badge>
              </div>
            )) : <p className="py-4 text-center text-xs text-muted-foreground">No repeat offenders.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search incident no, student, description, reporter..." className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.keys(CATEGORY_ICONS).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={severityFilter} onValueChange={setSeverityFilter}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severity</SelectItem>
              {Object.keys(SEVERITY_META).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Open">Open</SelectItem>
              <SelectItem value="Investigating">Investigating</SelectItem>
              <SelectItem value="Resolved">Resolved</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Incidents table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Incident Register</CardTitle>
          <CardDescription className="text-xs">{display.incidents.length} records · latest first</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">Incident</TableHead>
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-center text-xs">Severity</TableHead>
                  <TableHead className="text-xs">Sanction</TableHead>
                  <TableHead className="text-center text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-right text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {display.incidents.map(i => {
                  const sev = SEVERITY_META[i.severity] || SEVERITY_META.Minor
                  const CatIcon = CATEGORY_ICONS[i.category] || AlertTriangle
                  return (
                    <TableRow key={i.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedIncident(i.id)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', sev.bg, sev.text)}>
                            <CatIcon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold">{i.incidentNo}</p>
                            <p className="max-w-[200px] truncate text-[10px] text-muted-foreground">{i.description}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="h-7 w-7">
                            <AvatarFallback className={cn('text-[9px] font-semibold text-white', avatarColor(fullName(i.student)))}>
                              {initials(i.student.firstName, i.student.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-medium">{fullName(i.student)}</p>
                            <p className="text-[10px] text-muted-foreground">{i.student.admissionNo} · {i.student.classLevel}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{i.category}</Badge></TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn('text-[10px] font-semibold', sev.bg, sev.text)}>{i.severity}</Badge>
                      </TableCell>
                      <TableCell>
                        {i.sanction ? <Badge variant="outline" className={cn('text-[10px]', SANCTION_COLORS[i.sanction] || '')}>{i.sanction}</Badge> : <span className="text-[10px] text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className={cn('text-[10px]', statusColor(i.status))}>{i.status}</Badge>
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">{timeAgo(i.date)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedIncident(i.id) }}>
                          View <ChevronRight className="ml-0.5 h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          {display.incidents.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <Scale className="h-8 w-8" />
              <p>No incidents match your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      {selectedIncident && <IncidentDetailDialog incidentId={selectedIncident} onClose={() => setSelectedIncident(null)} />}
      {/* Add dialog */}
      {showAddDialog && <AddIncidentDialog onClose={() => setShowAddDialog(false)} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Incident Detail Dialog
// ---------------------------------------------------------------------------
function IncidentDetailDialog({ incidentId, onClose }: { incidentId: string; onClose: () => void }) {
  const { data: inc, loading } = useFetch<any>(`/api/discipline/${incidentId}`)
  const [resolveNotes, setResolveNotes] = useState('')
  const [sanction, setSanction] = useState('')
  const [saving, setSaving] = useState(false)

  const handleResolve = async () => {
    setSaving(true)
    try {
      await apiPut(`/api/discipline/${incidentId}`, {
        status: 'Resolved',
        sanction: sanction || undefined,
        resolutionNotes: resolveNotes || 'Matter resolved. Sanction administered.',
        resolvedBy: 'Administration',
      })
      toast.success('Incident resolved')
      onClose()
    } catch (e: any) { toast.error(e?.message || 'Failed to resolve') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto scrollbar-thin">
        {loading || !inc ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-slate-600" /> Incident Report
              </DialogTitle>
              <DialogDescription>{inc.incidentNo} · {formatDateTime(inc.date)}</DialogDescription>
            </DialogHeader>

            {/* Incident header */}
            {(() => {
              const sev = SEVERITY_META[inc.severity] || SEVERITY_META.Minor
              const CatIcon = CATEGORY_ICONS[inc.category] || AlertTriangle
              return (
                <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-slate-50 to-gray-50 p-4 dark:from-slate-900/30 dark:to-gray-900/30">
                  <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', sev.bg, sev.text)}>
                    <CatIcon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold">{inc.category}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant="outline" className={cn('text-[10px] font-semibold', sev.bg, sev.text)}>{inc.severity}</Badge>
                      <Badge variant="secondary" className={cn('text-[10px]', statusColor(inc.status))}>{inc.status}</Badge>
                      {inc.parentNotified && <Badge variant="outline" className="text-[10px] border-cyan-300 text-cyan-700">Parent Notified</Badge>}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Student + incident info */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="border-slate-200/50 bg-slate-50/30 dark:bg-slate-900/10">
                <CardContent className="p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">Student</p>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={cn('text-xs font-semibold text-white', avatarColor(fullName(inc.student)))}>
                        {initials(inc.student.firstName, inc.student.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">{fullName(inc.student)}</p>
                      <p className="text-xs text-muted-foreground">{inc.student.admissionNo} · {inc.student.enrollments[0]?.stream?.classLevel?.name} {inc.student.enrollments[0]?.stream?.name}</p>
                    </div>
                  </div>
                  {inc.student.guardian && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> {inc.student.guardian.firstName} {inc.student.guardian.lastName} · {inc.student.guardian.phone}
                    </div>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Incident Details</p>
                  <div className="space-y-1.5 text-sm">
                    {inc.location && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /><span>{inc.location}</span></div>}
                    {inc.reportedBy && <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" /><span>Reported by {inc.reportedBy}</span></div>}
                    {inc.witnesses && <div className="flex items-center gap-2"><Eye className="h-3.5 w-3.5 text-muted-foreground" /><span className="text-xs">Witnesses: {inc.witnesses}</span></div>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Description */}
            <div className="rounded-xl border-l-4 border-slate-400 bg-slate-50/50 p-4 dark:bg-slate-900/20">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">Incident Description</p>
              <p className="text-sm">{inc.description}</p>
            </div>

            {/* Sanction info */}
            {inc.sanction && (
              <div className="rounded-xl border-l-4 border-amber-400 bg-amber-50/50 p-4 dark:bg-amber-950/20">
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                  <Gavel className="h-3 w-3" /> Sanction Applied: {inc.sanction}
                </p>
                {inc.sanctionDetails && <p className="text-sm">{inc.sanctionDetails}</p>}
                {inc.sanctionStartDate && inc.sanctionEndDate && (
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(inc.sanctionStartDate)} — {formatDate(inc.sanctionEndDate)}</p>
                )}
              </div>
            )}

            {/* Resolution info */}
            {inc.resolvedDate && (
              <div className="rounded-xl border-l-4 border-emerald-400 bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
                <p className="mb-1 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" /> Resolved on {formatDate(inc.resolvedDate)} by {inc.resolvedBy || 'Administration'}
                </p>
                {inc.resolutionNotes && <p className="text-sm">{inc.resolutionNotes}</p>}
              </div>
            )}

            {/* Other incidents */}
            {inc.otherIncidents && inc.otherIncidents.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <Repeat className="h-3.5 w-3.5 text-rose-500" /> Student's Other Incidents ({inc.otherIncidents.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {inc.otherIncidents.map((o: any) => (
                    <Badge key={o.id} variant="outline" className={cn('text-[10px]', SEVERITY_META[o.severity]?.bg, SEVERITY_META[o.severity]?.text)}>
                      {o.incidentNo} · {o.category} · {formatDate(o.date)}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Resolve actions */}
            {!inc.resolvedDate && (
              <div className="space-y-3 rounded-xl border-2 border-dashed border-slate-200 p-4 dark:border-slate-700">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-400">Resolve Incident</p>
                <div>
                  <Label className="text-xs">Apply Sanction</Label>
                  <Select value={sanction} onValueChange={setSanction}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select sanction (optional)" /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(SANCTION_COLORS).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Resolution Notes</Label>
                  <Textarea value={resolveNotes} onChange={e => setResolveNotes(e.target.value)} placeholder="Describe the resolution and any actions taken..." className="mt-1" rows={2} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => apiPut(`/api/discipline/${incidentId}`, { status: 'Investigating' }).then(() => { toast.success('Marked as investigating'); onClose() })}>Mark Investigating</Button>
                  <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={handleResolve} disabled={saving}>
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> {saving ? 'Resolving...' : 'Resolve Incident'}
                  </Button>
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
// Add Incident Dialog
// ---------------------------------------------------------------------------
function AddIncidentDialog({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore()
  const [studentSearch, setStudentSearch] = useState('')
  const [studentId, setStudentId] = useState('')
  const [form, setForm] = useState({
    category: 'Misconduct', severity: 'Minor', location: 'Classroom', description: '',
    reportedBy: user?.name || '', witnesses: '', date: '',
  })
  const [saving, setSaving] = useState(false)

  const { data: searchResults } = useFetch<any>(studentSearch.length >= 2 ? `/api/search?q=${encodeURIComponent(studentSearch)}` : null)

  const handleSubmit = async () => {
    if (!studentId) { toast.error('Please select a student'); return }
    if (!form.description) { toast.error('Description is required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/discipline', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, studentId }),
      })
      if (!res.ok) throw new Error('Failed to log incident')
      toast.success('Incident logged successfully')
      onClose()
    } catch (e: any) { toast.error(e?.message || 'Failed to log incident') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-slate-600" /> Log Discipline Incident</DialogTitle>
          <DialogDescription>Record a student conduct incident</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Student *</Label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={studentSearch} onChange={e => { setStudentSearch(e.target.value); setStudentId('') }} placeholder="Search student..." className="pl-9" />
            </div>
            {studentId && (
              <div className="mt-2 flex items-center gap-2 rounded-md bg-emerald-50 p-2 text-xs dark:bg-emerald-950/30">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-medium text-emerald-700 dark:text-emerald-400">Student selected</span>
                <button onClick={() => { setStudentId(''); setStudentSearch('') }} className="ml-auto"><X className="h-3 w-3" /></button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Category *</Label><Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(CATEGORY_ICONS).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Severity</Label><Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(SEVERITY_META).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Location</Label><Select value={form.location} onValueChange={v => setForm({ ...form, location: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Classroom">Classroom</SelectItem><SelectItem value="Playground">Playground</SelectItem><SelectItem value="Dormitory">Dormitory</SelectItem><SelectItem value="Hall">Hall</SelectItem><SelectItem value="Gate">Gate</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Date & Time</Label><Input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label className="text-xs">Description *</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describe the incident in detail..." className="mt-1" rows={3} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Reported By</Label><Input value={form.reportedBy} onChange={e => setForm({ ...form, reportedBy: e.target.value })} placeholder="Staff name" className="mt-1" /></div>
            <div><Label className="text-xs">Witnesses</Label><Input value={form.witnesses} onChange={e => setForm({ ...form, witnesses: e.target.value })} placeholder="Comma-separated names" className="mt-1" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving} className="bg-slate-700 hover:bg-slate-800">{saving ? 'Logging...' : 'Log Incident'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
