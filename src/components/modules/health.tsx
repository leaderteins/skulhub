'use client'
import { useState } from 'react'
import { useFetch, apiPost } from '@/lib/api'
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
import { avatarColor, initials, fullName, formatDate, statusColor } from '@/lib/format'
import { toast } from 'sonner'
import {
  HeartPulse, Activity, Stethoscope, AlertTriangle, Ambulance, Thermometer,
  Plus, Search, ChevronRight, User, Phone, Droplet, Ruler, Weight, Shield,
  Pill, Clock, X,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie,
} from 'recharts'

interface HealthData {
  stats: { totalRecords: number; totalVisits: number; severeVisits: number; referredVisits: number; recentVisits: number }
  visits: Array<{
    id: string; visitDate: string; complaint: string; diagnosis: string | null; treatment: string | null;
    prescription: string | null; temperature: number | null; bloodPressure: string | null;
    severity: string; attendedBy: string | null; referredTo: string | null; status: string; followUpDate: string | null;
    student: { id: string; admissionNo: string; firstName: string; lastName: string; gender: string; stream: string | null; classLevel: string | null }
  }>
  bySeverity: Array<{ name: string; count: number }>
  byStatus: Array<{ name: string; count: number }>
  topComplaints: Array<{ name: string; count: number }>
}

const SEVERITY_COLORS: Record<string, string> = { Mild: '#10b981', Moderate: '#f59e0b', Severe: '#ef4444' }
const STATUS_PIE_COLORS = ['#10b981', '#f59e0b', '#0d9488', '#ef4444']

export function HealthModule() {
  const [search, setSearch] = useState('')
  const [severity, setSeverity] = useState('all')
  const [status, setStatus] = useState('all')
  const [showVisitDialog, setShowVisitDialog] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)

  // Single fetch with dynamic filters
  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (severity !== 'all') params.set('severity', severity)
  if (status !== 'all') params.set('status', status)
  const { data, loading } = useFetch<HealthData>(`/api/health?${params.toString()}`)

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

  const display = data!
  const stats = display.stats

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-pink-600 to-red-600 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 right-24 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <HeartPulse className="h-3 w-3" /> School Clinic · {stats.recentVisits} visits this week
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Health & Wellness Center</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Student medical records, clinic visits, and wellness monitoring for a safe learning environment.
            </p>
          </div>
          <Button variant="secondary" size="sm" className="bg-white text-rose-600 hover:bg-white/90" onClick={() => setShowVisitDialog(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Log Clinic Visit
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Medical Records</p>
              <p className="text-2xl font-bold">{stats.totalRecords}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Visits</p>
              <p className="text-2xl font-bold">{stats.totalVisits}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Severe Cases</p>
              <p className="text-2xl font-bold">{stats.severeVisits}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <Ambulance className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Referred to Hospital</p>
              <p className="text-2xl font-bold">{stats.referredVisits}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Severity distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Visits by Severity</CardTitle>
            <CardDescription className="text-xs">Case severity breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={display.bySeverity} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {display.bySeverity.map((s) => <Cell key={s.name} fill={SEVERITY_COLORS[s.name] || '#94a3b8'} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex justify-center gap-3 text-xs">
              {display.bySeverity.map(s => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: SEVERITY_COLORS[s.name] }} />
                  <span className="font-medium">{s.name}</span><span className="text-muted-foreground">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Top complaints */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Health Complaints</CardTitle>
            <CardDescription className="text-xs">Most common reasons for clinic visits</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={display.topComplaints} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} stroke="oklch(0.5 0.02 160)" width={140} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} cursor={{ fill: 'oklch(0.96 0.01 150)' }} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={28} fill="#f43f5e" />
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
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search student, complaint, diagnosis..."
              className="pl-9"
            />
          </div>
          <Select value={severity} onValueChange={setSeverity}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Severity" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="Mild">Mild</SelectItem>
              <SelectItem value="Moderate">Moderate</SelectItem>
              <SelectItem value="Severe">Severe</SelectItem>
            </SelectContent>
          </Select>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Treated">Treated</SelectItem>
              <SelectItem value="Referred">Referred</SelectItem>
              <SelectItem value="Follow-up">Follow-up</SelectItem>
              <SelectItem value="Admitted">Admitted</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Recent visits table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Recent Clinic Visits</CardTitle>
          <CardDescription className="text-xs">{display.visits.length} records · latest first</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">Complaint</TableHead>
                  <TableHead className="text-xs">Diagnosis</TableHead>
                  <TableHead className="text-center text-xs">Severity</TableHead>
                  <TableHead className="text-xs">Attended By</TableHead>
                  <TableHead className="text-center text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-right text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {display.visits.map(v => (
                  <TableRow key={v.id} className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setSelectedStudent(v.student.id)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={cn('text-[10px] font-semibold text-white', avatarColor(fullName(v.student)))}>
                            {initials(v.student.firstName, v.student.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{fullName(v.student)}</p>
                          <p className="truncate text-xs text-muted-foreground">{v.student.admissionNo} · {v.student.classLevel}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-medium">{v.complaint}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{v.diagnosis || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn('text-[10px] font-semibold',
                        v.severity === 'Severe' ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400'
                        : v.severity === 'Moderate' ? 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400'
                        : 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                      )}>{v.severity}</Badge>
                    </TableCell>
                    <TableCell className="text-xs">{v.attendedBy || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className={cn('text-[10px]', statusColor(v.status))}>{v.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{formatDate(v.visitDate)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedStudent(v.student.id) }}>
                        Profile <ChevronRight className="ml-0.5 h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {display.visits.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <Stethoscope className="h-8 w-8" />
              <p>No clinic visits match your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Student medical profile dialog */}
      {selectedStudent && (
        <StudentMedicalDialog studentId={selectedStudent} onClose={() => setSelectedStudent(null)} />
      )}

      {/* Log visit dialog */}
      {showVisitDialog && (
        <LogVisitDialog onClose={() => setShowVisitDialog(false)} />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Student Medical Profile Dialog
// ---------------------------------------------------------------------------
function StudentMedicalDialog({ studentId, onClose }: { studentId: string; onClose: () => void }) {
  const { data, loading } = useFetch<any>(`/api/health/${studentId}`)

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
                <HeartPulse className="h-5 w-5 text-rose-500" />
                Medical Profile
              </DialogTitle>
              <DialogDescription>Patient health records & visit history</DialogDescription>
            </DialogHeader>

            {/* Student header */}
            <div className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-rose-50 to-pink-50 p-4 dark:from-rose-950/30 dark:to-pink-950/30">
              <Avatar className="h-14 w-14 border-2 border-rose-200 dark:border-rose-900">
                <AvatarFallback className={cn('text-sm font-semibold text-white', avatarColor(fullName(data.student)))}>
                  {initials(data.student.firstName, data.student.lastName)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-base font-semibold">{fullName(data.student)}</p>
                <p className="text-xs text-muted-foreground">{data.student.admissionNo} · {data.student.enrollments[0]?.stream?.classLevel?.name} {data.student.enrollments[0]?.stream?.name}</p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  <Badge variant="outline" className="text-[10px]"><Droplet className="mr-1 h-2.5 w-2.5" />{data.medicalRecord?.bloodGroup || data.student.bloodGroup || 'N/A'}</Badge>
                  <Badge variant="outline" className="text-[10px]">{data.student.gender}</Badge>
                  {data.medicalRecord?.conditions && <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-700">{data.medicalRecord.conditions}</Badge>}
                </div>
              </div>
            </div>

            {/* Vitals grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border p-3 text-center">
                <Ruler className="mx-auto h-4 w-4 text-muted-foreground" />
                <p className="mt-1 text-[10px] uppercase text-muted-foreground">Height</p>
                <p className="text-sm font-bold">{data.medicalRecord?.heightCm ? `${data.medicalRecord.heightCm} cm` : '-'}</p>
              </div>
              <div className="rounded-xl border p-3 text-center">
                <Weight className="mx-auto h-4 w-4 text-muted-foreground" />
                <p className="mt-1 text-[10px] uppercase text-muted-foreground">Weight</p>
                <p className="text-sm font-bold">{data.medicalRecord?.weightKg ? `${data.medicalRecord.weightKg} kg` : '-'}</p>
              </div>
              <div className="rounded-xl border p-3 text-center">
                <Pill className="mx-auto h-4 w-4 text-muted-foreground" />
                <p className="mt-1 text-[10px] uppercase text-muted-foreground">Allergies</p>
                <p className="text-xs font-bold truncate">{data.medicalRecord?.allergies || 'None'}</p>
              </div>
              <div className="rounded-xl border p-3 text-center">
                <Shield className="mx-auto h-4 w-4 text-muted-foreground" />
                <p className="mt-1 text-[10px] uppercase text-muted-foreground">Immunization</p>
                <p className="text-xs font-bold">{data.medicalRecord?.immunization || 'N/A'}</p>
              </div>
            </div>

            {/* Emergency contact & notes */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="border-rose-200/50 bg-rose-50/30 dark:bg-rose-950/10">
                <CardContent className="p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">Emergency Contact</p>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" /><span>{data.medicalRecord?.emergencyContact || data.student.guardian ? `${data.student.guardian?.firstName} ${data.student.guardian?.lastName}` : 'N/A'}</span></div>
                    <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span>{data.medicalRecord?.emergencyPhone || data.student.guardian?.phone || 'N/A'}</span></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Medical Notes</p>
                  <p className="text-sm text-muted-foreground">{data.medicalRecord?.notes || 'No special notes recorded.'}</p>
                  {data.medicalRecord?.medications && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                      <Pill className="h-3 w-3 text-amber-600" />
                      <span className="font-medium">Current medication:</span>
                      <span>{data.medicalRecord.medications}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Visit history */}
            <div>
              <p className="mb-2 text-sm font-semibold">Visit History ({data.visits.length})</p>
              <div className="max-h-60 space-y-2 overflow-y-auto scrollbar-thin pr-1">
                {data.visits.map((v: any) => (
                  <div key={v.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{v.complaint}</p>
                          <Badge variant="outline" className={cn('text-[10px]', v.severity === 'Severe' ? 'border-rose-300 text-rose-700' : v.severity === 'Moderate' ? 'border-amber-300 text-amber-700' : 'border-emerald-300 text-emerald-700')}>{v.severity}</Badge>
                        </div>
                        {v.diagnosis && <p className="text-xs text-muted-foreground">Dx: {v.diagnosis}</p>}
                        {v.treatment && <p className="text-xs text-muted-foreground">Tx: {v.treatment}</p>}
                        <div className="mt-1 flex items-center gap-3 text-[10px] text-muted-foreground">
                          <span>{formatDate(v.visitDate)}</span>
                          {v.attendedBy && <span>· {v.attendedBy}</span>}
                          {v.temperature && <span>· {v.temperature.toFixed(1)}°C</span>}
                          {v.bloodPressure && <span>· BP {v.bloodPressure}</span>}
                        </div>
                      </div>
                      <Badge variant="secondary" className={cn('text-[10px] shrink-0', statusColor(v.status))}>{v.status}</Badge>
                    </div>
                    {v.followUpDate && (
                      <div className="mt-2 flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-[10px] text-amber-700 dark:bg-amber-950/30 dark:text-amber-400">
                        <Clock className="h-3 w-3" /> Follow-up scheduled: {formatDate(v.followUpDate)}
                      </div>
                    )}
                  </div>
                ))}
                {data.visits.length === 0 && <p className="py-4 text-center text-xs text-muted-foreground">No clinic visits recorded.</p>}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Log Visit Dialog
// ---------------------------------------------------------------------------
function LogVisitDialog({ onClose }: { onClose: () => void }) {
  const { user } = useAuthStore()
  const [studentSearch, setStudentSearch] = useState('')
  const [studentId, setStudentId] = useState('')
  const [form, setForm] = useState({
    complaint: '', diagnosis: '', treatment: '', prescription: '',
    temperature: '', bloodPressure: '', severity: 'Mild', attendedBy: user?.name || 'School Nurse',
    referredTo: '', status: 'Treated', followUpDate: '',
  })
  const [saving, setSaving] = useState(false)

  // Search students
  const { data: searchResults } = useFetch<any>(
    studentSearch.length >= 2 ? `/api/search?q=${encodeURIComponent(studentSearch)}` : null
  )

  const handleSubmit = async () => {
    if (!studentId) { toast.error('Please select a student'); return }
    if (!form.complaint) { toast.error('Complaint is required'); return }
    setSaving(true)
    try {
      await apiPost('/api/health', { ...form, studentId })
      toast.success('Clinic visit logged successfully')
      onClose()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to log visit')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Stethoscope className="h-5 w-5 text-rose-500" /> Log Clinic Visit
          </DialogTitle>
          <DialogDescription>Record a new student clinic visit</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Student search */}
          <div>
            <Label className="text-xs">Student *</Label>
            <div className="relative mt-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={studentSearch}
                onChange={e => { setStudentSearch(e.target.value); setStudentId('') }}
                placeholder="Search student by name or admission no..."
                className="pl-9"
              />
            </div>
            {searchResults?.students && searchResults.students.length > 0 && !studentId && (
              <div className="mt-2 max-h-40 space-y-1 overflow-y-auto scrollbar-thin rounded-lg border p-1">
                {searchResults.students.map(s => (
                  <button
                    key={s.id}
                    onClick={() => { setStudentId(s.id); setStudentSearch(`${s.firstName} ${s.lastName} (${s.admissionNo})`) }}
                    className="flex w-full items-center gap-2 rounded-md p-2 text-left text-xs hover:bg-muted"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className={cn('text-[9px] font-semibold text-white', avatarColor(`${s.firstName} ${s.lastName}`))}>
                        {initials(s.firstName, s.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{s.firstName} {s.lastName}</span>
                    <span className="text-muted-foreground">{s.admissionNo}</span>
                    <span className="text-muted-foreground">{s.classLevel}</span>
                  </button>
                ))}
              </div>
            )}
            {studentId && (
              <div className="mt-2 flex items-center gap-2 rounded-md bg-emerald-50 p-2 text-xs dark:bg-emerald-950/30">
                <Shield className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-medium text-emerald-700 dark:text-emerald-400">Student selected</span>
                <button onClick={() => { setStudentId(''); setStudentSearch('') }} className="ml-auto text-muted-foreground hover:text-foreground">
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          <div>
            <Label className="text-xs">Presenting Complaint *</Label>
            <Input value={form.complaint} onChange={e => setForm({ ...form, complaint: e.target.value })} placeholder="e.g. Headache and fever" className="mt-1" />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Diagnosis</Label>
              <Input value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} placeholder="e.g. Malaria" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Severity</Label>
              <Select value={form.severity} onValueChange={v => setForm({ ...form, severity: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mild">Mild</SelectItem>
                  <SelectItem value="Moderate">Moderate</SelectItem>
                  <SelectItem value="Severe">Severe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Treatment</Label>
            <Textarea value={form.treatment} onChange={e => setForm({ ...form, treatment: e.target.value })} placeholder="Treatment given..." className="mt-1" rows={2} />
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label className="text-xs flex items-center gap-1"><Thermometer className="h-3 w-3" /> Temp (°C)</Label>
              <Input type="number" step="0.1" value={form.temperature} onChange={e => setForm({ ...form, temperature: e.target.value })} placeholder="36.5" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Blood Pressure</Label>
              <Input value={form.bloodPressure} onChange={e => setForm({ ...form, bloodPressure: e.target.value })} placeholder="120/80" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Treated">Treated</SelectItem>
                  <SelectItem value="Referred">Referred</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                  <SelectItem value="Admitted">Admitted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label className="text-xs">Attended By</Label>
              <Input value={form.attendedBy} onChange={e => setForm({ ...form, attendedBy: e.target.value })} placeholder="Nurse name" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Referred To (if any)</Label>
              <Input value={form.referredTo} onChange={e => setForm({ ...form, referredTo: e.target.value })} placeholder="Hospital name" className="mt-1" />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving} className="bg-rose-600 hover:bg-rose-700">
              {saving ? 'Saving...' : 'Log Visit'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
