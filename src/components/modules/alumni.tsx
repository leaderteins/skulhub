'use client'
import { useState } from 'react'
import { useFetch, apiPost } from '@/lib/api'
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
import { avatarColor, initials, fullName, formatKES, formatNumber, formatDate, timeAgo, statusColor } from '@/lib/format'
import { toast } from 'sonner'
import {
  UsersRound, Award, HeartHandshake, TrendingUp, Plus, Search, ChevronRight,
  Briefcase, MapPin, Mail, Phone, Linkedin, GraduationCap, Calendar, X,
  Trophy, Building2, Globe,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, LineChart, Line, Area, AreaChart,
} from 'recharts'

interface AlumniData {
  stats: { total: number; totalDonations: number; avgDonation: number }
  alumni: Array<{
    id: string; firstName: string; lastName: string; email: string | null; phone: string | null
    gender: string; admissionNo: string | null; graduationYear: number; classLevel: string | null
    career: string | null; employer: string | null; industry: string | null; location: string | null
    linkedin: string | null; achievement: string | null; status: string
    totalDonated: number; donationCount: number; lastDonation: string | null
  }>
  byYear: Array<{ year: number; count: number }>
  byIndustry: Array<{ name: string; count: number }>
  byStatus: Array<{ name: string; count: number }>
  donationsByPurpose: Array<{ name: string; amount: number; count: number }>
  recentDonations: Array<{
    id: string; amount: number; method: string; purpose: string; date: string
    alumnus: { firstName: string; lastName: string; graduationYear: number; career: string | null }
  }>
  topDonors: Array<{ id: string; name: string; graduationYear: number; career: string | null; total: number }>
  graduationYears: number[]
}

const INDUSTRY_COLORS = ['#10b981', '#14b8a6', '#0d9488', '#f59e0b', '#f97316', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#6366f1']
const PURPOSE_COLORS: Record<string, string> = { General: '#10b981', Scholarship: '#14b8a6', Infrastructure: '#0d9488', Sports: '#f59e0b', Library: '#8b5cf6' }

export function AlumniModule() {
  const { data, loading } = useFetch<AlumniData>('/api/alumni')
  const [search, setSearch] = useState('')
  const [gradYear, setGradYear] = useState('all')
  const [industry, setIndustry] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDonateDialog, setShowDonateDialog] = useState(false)
  const [selectedAlumnus, setSelectedAlumnus] = useState<string | null>(null)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (gradYear !== 'all') params.set('graduationYear', gradYear)
  if (industry !== 'all') params.set('industry', industry)
  if (statusFilter !== 'all') params.set('status', statusFilter)
  const { data: filtered } = useFetch<AlumniData>(`/api/alumni?${params.toString()}`, [search, gradYear, industry, statusFilter])

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 right-24 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <GraduationCap className="h-3 w-3" /> {stats.total} alumni across {display.byYear.length} graduating classes
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Alumni Network</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Connecting graduates, tracking careers, and building a culture of giving back to the school community.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="bg-white/15 text-white backdrop-blur hover:bg-white/25" onClick={() => setShowDonateDialog(true)}>
              <HeartHandshake className="mr-1.5 h-4 w-4" /> Record Donation
            </Button>
            <Button variant="secondary" size="sm" className="bg-white text-violet-600 hover:bg-white/90" onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Alumnus
            </Button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20">
              <UsersRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Alumni</p>
              <p className="text-2xl font-bold">{formatNumber(stats.total)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <HeartHandshake className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Donations</p>
              <p className="text-2xl font-bold">{formatKES(stats.totalDonations)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Avg Contribution</p>
              <p className="text-2xl font-bold">{formatKES(stats.avgDonation)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Top Donor</p>
              <p className="truncate text-sm font-bold">{display.topDonors[0]?.name || '—'}</p>
              <p className="text-xs text-muted-foreground">{display.topDonors[0] ? formatKES(display.topDonors[0].total) : ''}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Alumni by graduation year */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alumni by Graduation Year</CardTitle>
            <CardDescription className="text-xs">Distribution across graduating classes</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={display.byYear} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} cursor={{ fill: 'oklch(0.96 0.01 150)' }} />
                <Bar dataKey="count" radius={[8, 8, 0, 0]} maxBarSize={50}>
                  {display.byYear.map((_, i) => <Cell key={i} fill={['#8b5cf6', '#a78bfa', '#7c3aed', '#9333ea', '#6d28d9', '#c084fc'][i % 6]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Donations by purpose */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Donations by Purpose</CardTitle>
            <CardDescription className="text-xs">Where alumni give</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={display.donationsByPurpose} dataKey="amount" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {display.donationsByPurpose.map((d) => <Cell key={d.name} fill={PURPOSE_COLORS[d.name] || '#94a3b8'} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} formatter={(v: number) => formatKES(v)} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-2 text-[10px]">
              {display.donationsByPurpose.map(d => (
                <div key={d.name} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: PURPOSE_COLORS[d.name] || '#94a3b8' }} />
                  <span className="font-medium">{d.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top donors + Industries */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top donors */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              <CardTitle className="text-base">Top Donors</CardTitle>
            </div>
            <CardDescription className="text-xs">Most generous alumni contributors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {display.topDonors.slice(0, 6).map((d, i) => (
              <div key={d.id} className="flex items-center gap-3 rounded-lg border p-2.5 transition-colors hover:bg-muted/40">
                <span className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold',
                  i === 0 ? 'bg-amber-100 text-amber-700' : i === 1 ? 'bg-slate-100 text-slate-700' : i === 2 ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground')}>
                  {i + 1}
                </span>
                <Avatar className="h-8 w-8">
                  <AvatarFallback className={cn('text-[10px] font-semibold text-white', avatarColor(d.name))}>
                    {d.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.name}</p>
                  <p className="truncate text-xs text-muted-foreground">Class of {d.graduationYear} · {d.career || '—'}</p>
                </div>
                <span className="shrink-0 text-sm font-bold text-emerald-600">{formatKES(d.total)}</span>
              </div>
            ))}
            {display.topDonors.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No donations recorded yet.</p>}
          </CardContent>
        </Card>

        {/* Industry distribution */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-violet-500" />
              <CardTitle className="text-base">Alumni by Industry</CardTitle>
            </div>
            <CardDescription className="text-xs">Career sectors represented</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={display.byIndustry} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="oklch(0.5 0.02 160)" width={90} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} cursor={{ fill: 'oklch(0.96 0.01 150)' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={24}>
                  {display.byIndustry.map((_, i) => <Cell key={i} fill={INDUSTRY_COLORS[i % INDUSTRY_COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, admission no, career, employer..." className="pl-9" />
          </div>
          <Select value={gradYear} onValueChange={setGradYear}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Grad Year" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Years</SelectItem>
              {display.graduationYears.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Industry" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Industries</SelectItem>
              {display.byIndustry.map(i => <SelectItem key={i.name} value={i.name}>{i.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Lost Contact">Lost Contact</SelectItem>
              <SelectItem value="Deceased">Deceased</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Alumni grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {display.alumni.slice(0, 24).map(a => (
          <Card key={a.id} className="stat-card cursor-pointer transition-all hover:shadow-lg" onClick={() => setSelectedAlumnus(a.id)}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12 border-2 border-violet-200 dark:border-violet-900">
                  <AvatarFallback className={cn('text-xs font-semibold text-white', avatarColor(fullName(a)))}>
                    {initials(a.firstName, a.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{fullName(a)}</p>
                  <p className="truncate text-xs text-muted-foreground">Class of {a.graduationYear} · {a.admissionNo || '—'}</p>
                </div>
                <Badge variant="secondary" className={cn('shrink-0 text-[10px]', statusColor(a.status))}>{a.status}</Badge>
              </div>
              <div className="mt-3 space-y-1.5 text-xs">
                {a.career && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Briefcase className="h-3 w-3 shrink-0" /><span className="truncate">{a.career}</span>
                  </div>
                )}
                {a.employer && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Building2 className="h-3 w-3 shrink-0" /><span className="truncate">{a.employer}</span>
                  </div>
                )}
                {a.location && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" /><span className="truncate">{a.location}</span>
                  </div>
                )}
              </div>
              {a.totalDonated > 0 && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-50 px-2.5 py-1.5 dark:bg-emerald-950/30">
                  <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                    <HeartHandshake className="h-3 w-3" /> Donated
                  </span>
                  <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">{formatKES(a.totalDonated)}</span>
                </div>
              )}
              {a.achievement && (
                <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1.5 dark:bg-amber-950/30">
                  <Award className="mt-0.5 h-3 w-3 shrink-0 text-amber-600" />
                  <span className="text-[10px] text-amber-700 dark:text-amber-400">{a.achievement}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
      {display.alumni.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <UsersRound className="h-8 w-8" />
            <p>No alumni match your filters.</p>
          </CardContent>
        </Card>
      )}

      {/* Recent donations table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Donations</CardTitle>
          <CardDescription className="text-xs">Latest contributions from alumni</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">Alumnus</TableHead>
                  <TableHead className="text-xs">Class</TableHead>
                  <TableHead className="text-xs">Purpose</TableHead>
                  <TableHead className="text-xs">Method</TableHead>
                  <TableHead className="text-right text-xs">Amount</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {display.recentDonations.map(d => (
                  <TableRow key={d.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className={cn('text-[9px] font-semibold text-white', avatarColor(`${d.alumnus.firstName} ${d.alumnus.lastName}`))}>
                            {initials(d.alumnus.firstName, d.alumnus.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium">{d.alumnus.firstName} {d.alumnus.lastName}</p>
                          <p className="text-xs text-muted-foreground">{d.alumnus.career || '—'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{d.alumnus.graduationYear}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{d.purpose}</Badge></TableCell>
                    <TableCell className="text-xs">{d.method}</TableCell>
                    <TableCell className="text-right text-sm font-bold text-emerald-600">{formatKES(d.amount)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(d.date)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Detail dialog */}
      {selectedAlumnus && <AlumnusDetailDialog alumnusId={selectedAlumnus} onClose={() => setSelectedAlumnus(null)} />}
      {/* Add dialog */}
      {showAddDialog && <AddAlumnusDialog onClose={() => setShowAddDialog(false)} />}
      {/* Donate dialog */}
      {showDonateDialog && <DonateDialog onClose={() => setShowDonateDialog(false)} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Alumnus Detail Dialog
// ---------------------------------------------------------------------------
function AlumnusDetailDialog({ alumnusId, onClose }: { alumnusId: string; onClose: () => void }) {
  const { data, loading } = useFetch<any>(`/api/alumni/${alumnusId}`)

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto scrollbar-thin">
        {loading || !data ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UsersRound className="h-5 w-5 text-violet-500" /> Alumnus Profile
              </DialogTitle>
              <DialogDescription>Graduate details & contribution history</DialogDescription>
            </DialogHeader>

            {/* Profile header */}
            <div className="flex items-center gap-4 rounded-xl bg-gradient-to-r from-violet-50 to-fuchsia-50 p-4 dark:from-violet-950/30 dark:to-fuchsia-950/30">
              <Avatar className="h-16 w-16 border-2 border-violet-300 dark:border-violet-800">
                <AvatarFallback className={cn('text-lg font-semibold text-white', avatarColor(fullName(data)))}>
                  {initials(data.firstName, data.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold">{fullName(data)}</p>
                <p className="text-xs text-muted-foreground">Class of {data.graduationYear} · {data.admissionNo || '—'} · {data.classLevel}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge variant="secondary" className={cn('text-[10px]', statusColor(data.status))}>{data.status}</Badge>
                  {data.industry && <Badge variant="outline" className="text-[10px]">{data.industry}</Badge>}
                  {data.gender && <Badge variant="outline" className="text-[10px]">{data.gender}</Badge>}
                </div>
              </div>
            </div>

            {/* Career & contact */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="border-violet-200/50 bg-violet-50/30 dark:bg-violet-950/10">
                <CardContent className="p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-violet-700 dark:text-violet-400">Career</p>
                  <div className="space-y-1.5 text-sm">
                    {data.career && <div className="flex items-center gap-2"><Briefcase className="h-3.5 w-3.5 text-muted-foreground" /><span>{data.career}</span></div>}
                    {data.employer && <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /><span>{data.employer}</span></div>}
                    {data.industry && <div className="flex items-center gap-2"><Globe className="h-3.5 w-3.5 text-muted-foreground" /><span>{data.industry}</span></div>}
                    {data.location && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /><span>{data.location}</span></div>}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Contact</p>
                  <div className="space-y-1.5 text-sm">
                    {data.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span className="truncate">{data.email}</span></div>}
                    {data.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span>{data.phone}</span></div>}
                    {data.linkedin && <div className="flex items-center gap-2"><Linkedin className="h-3.5 w-3.5 text-muted-foreground" /><span className="truncate text-xs">{data.linkedin}</span></div>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Achievement */}
            {data.achievement && (
              <div className="flex items-start gap-2 rounded-xl border-l-4 border-amber-400 bg-amber-50/50 p-4 dark:bg-amber-950/20">
                <Award className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Notable Achievement</p>
                  <p className="text-sm">{data.achievement}</p>
                </div>
              </div>
            )}

            {/* Donation summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border bg-muted/30 p-3 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">Total Donated</p>
                <p className="text-lg font-bold text-emerald-600">{formatKES(data.totalDonated)}</p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">Donations</p>
                <p className="text-lg font-bold">{data.donationCount}</p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">Last Gift</p>
                <p className="text-sm font-bold">{data.lastDonation ? formatDate(data.lastDonation) : '—'}</p>
              </div>
            </div>

            {/* Donation history */}
            {data.donations.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Donation History</p>
                <div className="max-h-48 space-y-2 overflow-y-auto scrollbar-thin pr-1">
                  {data.donations.map((d: any) => (
                    <div key={d.id} className="flex items-center justify-between rounded-lg border p-2.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{d.purpose}</Badge>
                          <span className="text-xs text-muted-foreground">{d.method}</span>
                        </div>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">{formatDate(d.date)} · {d.reference || '—'}</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">{formatKES(d.amount)}</span>
                    </div>
                  ))}
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
// Add Alumnus Dialog
// ---------------------------------------------------------------------------
function AddAlumnusDialog({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', gender: 'Male',
    admissionNo: '', graduationYear: String(new Date().getFullYear() - 1), classLevel: 'Form 4',
    career: '', employer: '', industry: '', location: '', linkedin: '', achievement: '', status: 'Active',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName) { toast.error('First and last name are required'); return }
    setSaving(true)
    try {
      await apiPost('/api/alumni', form)
      toast.success('Alumnus registered successfully')
      onClose()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to register alumnus')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-violet-500" /> Register Alumnus</DialogTitle>
          <DialogDescription>Add a graduate to the alumni network</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label className="text-xs">First Name *</Label><Input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Last Name *</Label><Input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Gender</Label><Select value={form.gender} onValueChange={v => setForm({ ...form, gender: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem></SelectContent></Select></div>
          <div><Label className="text-xs">Admission No</Label><Input value={form.admissionNo} onChange={e => setForm({ ...form, admissionNo: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Graduation Year *</Label><Input type="number" value={form.graduationYear} onChange={e => setForm({ ...form, graduationYear: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Class Level</Label><Input value={form.classLevel} onChange={e => setForm({ ...form, classLevel: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Career</Label><Input value={form.career} onChange={e => setForm({ ...form, career: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Employer</Label><Input value={form.employer} onChange={e => setForm({ ...form, employer: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Industry</Label><Input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Location</Label><Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1" /></div>
          <div className="sm:col-span-2"><Label className="text-xs">LinkedIn</Label><Input value={form.linkedin} onChange={e => setForm({ ...form, linkedin: e.target.value })} className="mt-1" /></div>
          <div className="sm:col-span-2"><Label className="text-xs">Notable Achievement</Label><Textarea value={form.achievement} onChange={e => setForm({ ...form, achievement: e.target.value })} className="mt-1" rows={2} /></div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving} className="bg-violet-600 hover:bg-violet-700">{saving ? 'Saving...' : 'Register'}</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Donate Dialog
// ---------------------------------------------------------------------------
function DonateDialog({ onClose }: { onClose: () => void }) {
  const [alumnusSearch, setAlumnusSearch] = useState('')
  const [alumnusId, setAlumnusId] = useState('')
  const [form, setForm] = useState({ amount: '', method: 'M-Pesa', reference: '', purpose: 'General', date: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const { data: searchResults } = useFetch<any>(alumnusSearch.length >= 2 ? `/api/search?q=${encodeURIComponent(alumnusSearch)}` : null)

  const handleSubmit = async () => {
    if (!alumnusId) { toast.error('Please select an alumnus'); return }
    if (!form.amount) { toast.error('Amount is required'); return }
    setSaving(true)
    try {
      await apiPost('/api/alumni/donations', { ...form, alumnusId })
      toast.success('Donation recorded successfully')
      onClose()
    } catch (e: any) { toast.error(e?.message || 'Failed to record donation') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><HeartHandshake className="h-5 w-5 text-emerald-500" /> Record Donation</DialogTitle>
          <DialogDescription>Log a contribution from an alumnus</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Alumnus *</Label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={alumnusSearch} onChange={e => { setAlumnusSearch(e.target.value); setAlumnusId('') }} placeholder="Search alumni by name..." className="pl-9" />
            </div>
            {alumnusId && (
              <div className="mt-2 flex items-center gap-2 rounded-md bg-emerald-50 p-2 text-xs dark:bg-emerald-950/30">
                <HeartHandshake className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-medium text-emerald-700 dark:text-emerald-400">Alumnus selected</span>
                <button onClick={() => { setAlumnusId(''); setAlumnusSearch('') }} className="ml-auto"><X className="h-3 w-3" /></button>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Amount (KES) *</Label><Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Method</Label><Select value={form.method} onValueChange={v => setForm({ ...form, method: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="M-Pesa">M-Pesa</SelectItem><SelectItem value="Bank Transfer">Bank Transfer</SelectItem><SelectItem value="Cash">Cash</SelectItem><SelectItem value="Cheque">Cheque</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Purpose</Label><Select value={form.purpose} onValueChange={v => setForm({ ...form, purpose: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="General">General</SelectItem><SelectItem value="Scholarship">Scholarship</SelectItem><SelectItem value="Infrastructure">Infrastructure</SelectItem><SelectItem value="Sports">Sports</SelectItem><SelectItem value="Library">Library</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Date</Label><Input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label className="text-xs">Reference (M-Pesa code, cheque no.)</Label><Input value={form.reference} onChange={e => setForm({ ...form, reference: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1" rows={2} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? 'Saving...' : 'Record Donation'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
