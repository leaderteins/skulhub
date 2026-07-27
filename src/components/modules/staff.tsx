'use client'
import { useEffect, useMemo, useState } from 'react'
import { useFetch, apiPost, apiPut, apiDelete } from '@/lib/api'
import { StatCard, SectionHeader, EmptyState } from '@/components/shared'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
  DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { toast } from 'sonner'
import { cn, formatKES, formatDate, initials, fullName, avatarColor, statusColor } from '@/lib/format'
import {
  Users, GraduationCap, UserCog, CalendarOff, UserPlus, Search, Filter,
  Mail, Phone, MapPin, Briefcase, Award, BookOpen, CalendarClock, IdCard,
  Building2, Layers, Clock, CheckCircle2, XCircle, Trash2, Pencil, X,
} from 'lucide-react'

// ---- Types -----------------------------------------------------------------
interface DepartmentRef { id: string; name: string }
interface TaughtSubject {
  id: string
  weeklyPeriods: number
  subject: { id: string; name: string; code: string }
  classLevel: { id: string; name: string }
}
interface StaffListItem {
  id: string
  employeeNo: string
  firstName: string
  lastName: string
  email: string | null
  phone: string | null
  gender: string
  role: string
  departmentId: string | null
  department: DepartmentRef | null
  qualification: string | null
  specialization: string | null
  employmentType: string
  salary: number
  status: string
  hireDate: string
  address: string | null
  taughtSubjects: TaughtSubject[]
}
interface StaffListResponse {
  staff: StaffListItem[]
  total: number
  byDepartment: { name: string; count: number }[]
  departments: DepartmentRef[]
}
interface StaffDetail extends StaffListItem {
  createdAt: string
  updatedAt: string
  timetableByDay: { day: string; lessons: any[] }[]
  loadSummary: {
    totalLessons: number
    totalPeriods: number
    uniqueSubjects: number
    uniqueClasses: number
  }
  attendanceSummary: {
    recent: any[]
    rate: number
    totalRecords: number
  }
}

// ---- Constants -------------------------------------------------------------
const ROLES = [
  'Principal', 'Deputy Principal', 'HOD', 'Teacher', 'Bursar', 'Librarian',
  'Clerk', 'Driver', 'Security', 'Cleaner',
] as const
const EMPLOYMENT_TYPES = ['Permanent', 'Contract', 'Part-time'] as const
const STATUSES = ['Active', 'On Leave', 'Suspended', 'Inactive'] as const
const GENDERS = ['Male', 'Female'] as const

const TEACHING_ROLES = new Set(['Principal', 'Deputy Principal', 'HOD', 'Teacher'])
const SUPPORT_ROLES = new Set(['Bursar', 'Librarian', 'Clerk', 'Driver', 'Security', 'Cleaner'])

const DEPT_CHART_COLORS = [
  '#10b981', '#14b8a6', '#0d9488', '#06b6d4', '#22c55e',
  '#84cc16', '#0ea5e9', '#f59e0b', '#f97316', '#ec4899',
]

const ROLE_BADGE: Record<string, string> = {
  Principal: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 ring-1 ring-emerald-500/30',
  'Deputy Principal': 'bg-teal-500/15 text-teal-700 dark:text-teal-400 ring-1 ring-teal-500/30',
  HOD: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400 ring-1 ring-cyan-500/30',
  Teacher: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 ring-1 ring-emerald-500/20',
  Bursar: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 ring-1 ring-amber-500/30',
  Librarian: 'bg-violet-500/15 text-violet-700 dark:text-violet-400 ring-1 ring-violet-500/30',
  Clerk: 'bg-slate-500/15 text-slate-700 dark:text-slate-300 ring-1 ring-slate-500/30',
  Driver: 'bg-orange-500/15 text-orange-700 dark:text-orange-400 ring-1 ring-orange-500/30',
  Security: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 ring-1 ring-rose-500/30',
  Cleaner: 'bg-lime-500/15 text-lime-700 dark:text-lime-400 ring-1 ring-lime-500/30',
}

function roleBadgeClass(role: string) {
  return ROLE_BADGE[role] || 'bg-slate-500/15 text-slate-700 dark:text-slate-300 ring-1 ring-slate-500/30'
}

// ---- Empty form state ------------------------------------------------------
const EMPTY_FORM = {
  employeeNo: '',
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  gender: 'Male',
  role: 'Teacher',
  departmentId: '__none__',
  qualification: '',
  specialization: '',
  employmentType: 'Permanent',
  salary: '',
  hireDate: new Date().toISOString().slice(0, 10),
  address: '',
  status: 'Active',
}

// ============================================================================
// Main module
// ============================================================================
export function StaffModule() {
  const [search, setSearch] = useState('')
  const [role, setRole] = useState<string>('__all__')
  const [departmentId, setDepartmentId] = useState<string>('__all__')
  const [status, setStatus] = useState<string>('__all__')
  const [employmentType, setEmploymentType] = useState<string>('__all__')

  const [showFilters, setShowFilters] = useState(false)
  const [addOpen, setAddOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)

  // Build query string — only include non-default filters so the URL stays clean
  const qs = useMemo(() => {
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (role && role !== '__all__') p.set('role', role)
    if (departmentId && departmentId !== '__all__') p.set('departmentId', departmentId)
    if (status && status !== '__all__') p.set('status', status)
    if (employmentType && employmentType !== '__all__') p.set('employmentType', employmentType)
    return p.toString()
  }, [search, role, departmentId, status, employmentType])

  const url = `/api/staff${qs ? `?${qs}` : ''}`
  const { data, loading, error, refetch } = useFetch<StaffListResponse>(url)

  const staffList = data?.staff ?? []
  const departments = data?.departments ?? []
  const byDepartment = data?.byDepartment ?? []

  // Stat strip (computed from filtered list — gives accurate counts for what's on screen)
  const stats = useMemo(() => {
    const all = staffList
    const teachers = all.filter((s) => TEACHING_ROLES.has(s.role)).length
    const support = all.filter((s) => SUPPORT_ROLES.has(s.role)).length
    const onLeave = all.filter((s) => s.status === 'On Leave').length
    return { total: all.length, teachers, support, onLeave }
  }, [staffList])

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Staff & Teachers"
        description="Manage teaching and non-teaching staff, departments and assignments."
        icon={UserCog}
        action={
          <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 text-white hover:bg-emerald-700">
            <UserPlus className="h-4 w-4" /> Add Staff
          </Button>
        }
      />

      {/* Stat strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Staff" value={stats.total} icon={Users} accent="emerald" loading={loading} />
        <StatCard label="Teaching Staff" value={stats.teachers} icon={GraduationCap} accent="teal" loading={loading} />
        <StatCard label="Support Staff" value={stats.support} icon={UserCog} accent="cyan" loading={loading} />
        <StatCard label="On Leave" value={stats.onLeave} icon={CalendarOff} accent="amber" loading={loading} />
      </div>

      {/* Filter bar + department donut */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <CardTitle className="text-base">Staff Directory</CardTitle>
                <CardDescription className="text-xs">
                  {data ? `${data.total} staff member${data.total === 1 ? '' : 's'}` : 'Loading…'}
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters((s) => !s)}
                className="text-xs"
              >
                <Filter className="h-3.5 w-3.5" /> Filters
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Search row always visible */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, employee no, email, phone…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Collapsible filters */}
            {showFilters && (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <FilterSelect
                  label="Role"
                  value={role}
                  onChange={setRole}
                  options={ROLES.map((r) => ({ value: r, label: r }))}
                />
                <FilterSelect
                  label="Department"
                  value={departmentId}
                  onChange={setDepartmentId}
                  options={departments.map((d) => ({ value: d.id, label: d.name }))}
                />
                <FilterSelect
                  label="Status"
                  value={status}
                  onChange={setStatus}
                  options={STATUSES.map((s) => ({ value: s, label: s }))}
                />
                <FilterSelect
                  label="Employment"
                  value={employmentType}
                  onChange={setEmploymentType}
                  options={EMPLOYMENT_TYPES.map((e) => ({ value: e, label: e }))}
                />
              </div>
            )}

            {(role !== '__all__' || departmentId !== '__all__' || status !== '__all__' || employmentType !== '__all__') && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                <span className="text-muted-foreground">Active filters:</span>
                {role !== '__all__' && <FilterChip label={`Role: ${role}`} onClear={() => setRole('__all__')} />}
                {departmentId !== '__all__' && (
                  <FilterChip
                    label={`Dept: ${departments.find((d) => d.id === departmentId)?.name || '—'}`}
                    onClear={() => setDepartmentId('__all__')}
                  />
                )}
                {status !== '__all__' && <FilterChip label={`Status: ${status}`} onClear={() => setStatus('__all__')} />}
                {employmentType !== '__all__' && (
                  <FilterChip label={`Type: ${employmentType}`} onClear={() => setEmploymentType('__all__')} />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs text-muted-foreground"
                  onClick={() => {
                    setRole('__all__'); setDepartmentId('__all__'); setStatus('__all__'); setEmploymentType('__all__')
                  }}
                >
                  Clear all
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department distribution donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Staff by Department</CardTitle>
            <CardDescription className="text-xs">Distribution overview</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[200px] w-full rounded-xl" />
            ) : byDepartment.length === 0 ? (
              <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                No data
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie
                      data={byDepartment}
                      dataKey="count"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {byDepartment.map((_, i) => (
                        <Cell key={i} fill={DEPT_CHART_COLORS[i % DEPT_CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid oklch(0.91 0.01 150)',
                        fontSize: 12,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <ScrollArea className="max-h-28 pr-2">
                  <div className="space-y-1.5">
                    {byDepartment.map((d, i) => (
                      <div key={d.name} className="flex items-center justify-between text-xs">
                        <div className="flex min-w-0 items-center gap-2">
                          <span
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ background: DEPT_CHART_COLORS[i % DEPT_CHART_COLORS.length] }}
                          />
                          <span className="truncate">{d.name}</span>
                        </div>
                        <span className="font-medium">{d.count}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Staff grid */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-xl" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          icon={XCircle}
          title="Could not load staff"
          description={error}
          action={<Button onClick={refetch}>Retry</Button>}
        />
      ) : staffList.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No staff found"
          description="Try adjusting your filters or add a new staff member."
          action={
            <Button onClick={() => setAddOpen(true)} className="bg-emerald-600 text-white hover:bg-emerald-700">
              <UserPlus className="h-4 w-4" /> Add Staff
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {staffList.map((s) => (
            <StaffCard key={s.id} staff={s} onOpen={() => setDetailId(s.id)} />
          ))}
        </div>
      )}

      {/* Add staff dialog */}
      <AddStaffDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        departments={departments}
        onCreated={() => {
          setAddOpen(false)
          toast.success('Staff member added successfully')
          refetch()
        }}
      />

      {/* Detail dialog — closing it can hand off to the edit dialog */}
      <StaffDetailDialog
        staffId={detailId}
        onOpenChange={(open) => { if (!open) setDetailId(null) }}
        onEdit={(id) => { setDetailId(null); setEditId(id) }}
        onChanged={refetch}
      />

      {/* Edit dialog (separate from detail to avoid focus-trap conflicts) */}
      <EditStaffDialog
        staffId={editId}
        departments={departments}
        onOpenChange={(open) => { if (!open) setEditId(null) }}
        onSaved={() => {
          setEditId(null)
          refetch()
        }}
      />
    </div>
  )
}

// ============================================================================
// Filter helpers
// ============================================================================
function FilterSelect({
  label, value, onChange, options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`All ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all__">All</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-400">
      {label}
      <button onClick={onClear} className="rounded-full hover:bg-emerald-500/20" aria-label={`Clear ${label}`}>
        <X className="h-3 w-3" />
      </button>
    </span>
  )
}

// ============================================================================
// Staff card
// ============================================================================
function StaffCard({ staff, onOpen }: { staff: StaffListItem; onOpen: () => void }) {
  const subjectCount = staff.taughtSubjects.length
  const weeklyPeriods = staff.taughtSubjects.reduce((s, a) => s + (a.weeklyPeriods || 0), 0)
  return (
    <Card
      onClick={onOpen}
      className="group cursor-pointer overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg hover:ring-1 hover:ring-emerald-500/20"
    >
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12 ring-2 ring-background">
            <AvatarFallback className={cn('text-sm font-semibold text-white', avatarColor(staff.id))}>
              {initials(staff.firstName, staff.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate font-semibold leading-tight">{fullName(staff)}</p>
              <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', statusColor(staff.status))}>
                {staff.status}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-xs text-muted-foreground">{staff.employeeNo}</p>
            <span className={cn('mt-1.5 inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium', roleBadgeClass(staff.role))}>
              {staff.role}
            </span>
          </div>
        </div>

        <Separator className="my-3" />

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate text-muted-foreground">
              {staff.department?.name || 'Unassigned'}
            </span>
          </div>
          {staff.specialization && (
            <div className="flex items-center gap-2">
              <Award className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-muted-foreground">{staff.specialization}</span>
            </div>
          )}
          {staff.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-muted-foreground">{staff.email}</span>
            </div>
          )}
          {staff.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate text-muted-foreground">{staff.phone}</span>
            </div>
          )}
        </div>

        {(subjectCount > 0 || weeklyPeriods > 0) && (
          <div className="mt-3 flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2 text-[11px]">
            <div className="flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
              <span className="font-medium">{subjectCount}</span>
              <span className="text-muted-foreground">subject{subjectCount === 1 ? '' : 's'}</span>
            </div>
            <Separator orientation="vertical" className="h-3" />
            <div className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-teal-600" />
              <span className="font-medium">{weeklyPeriods}</span>
              <span className="text-muted-foreground">periods/wk</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================================================
// Add staff dialog
// ============================================================================
function AddStaffDialog({
  open, onOpenChange, departments, onCreated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  departments: DepartmentRef[]
  onCreated: () => void
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof EMPTY_FORM, v: string) => setForm((f) => ({ ...f, [k]: v }))

  const reset = () => setForm({ ...EMPTY_FORM })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim() || !form.employeeNo.trim()) {
      toast.error('First name, last name and employee number are required')
      return
    }
    setSaving(true)
    try {
      const payload: any = {
        ...form,
        departmentId: form.departmentId === '__none__' ? null : form.departmentId,
        salary: form.salary === '' ? 0 : Number(form.salary),
      }
      await apiPost('/api/staff', payload)
      reset()
      onCreated()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add staff')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset() }}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Staff Member</DialogTitle>
          <DialogDescription>
            Enter the staff member's details below. Fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <StaffFormFields form={form} set={set} departments={departments} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={saving} className="bg-emerald-600 text-white hover:bg-emerald-700">
              {saving ? 'Saving…' : 'Add Staff'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---- Shared form fields (used by Add and Edit) ----
type FormState = typeof EMPTY_FORM

function StaffFormFields({
  form, set, departments,
}: {
  form: FormState
  set: (k: keyof FormState, v: string) => void
  departments: DepartmentRef[]
}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Employee No. *">
          <Input
            value={form.employeeNo}
            onChange={(e) => set('employeeNo', e.target.value)}
            placeholder="e.g. EMP/1042"
          />
        </Field>
        <Field label="Hire Date">
          <Input
            type="date"
            value={form.hireDate}
            onChange={(e) => set('hireDate', e.target.value)}
          />
        </Field>
        <Field label="First Name *">
          <Input value={form.firstName} onChange={(e) => set('firstName', e.target.value)} placeholder="Jane" />
        </Field>
        <Field label="Last Name *">
          <Input value={form.lastName} onChange={(e) => set('lastName', e.target.value)} placeholder="Wanjiru" />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="jane@school.ac.ke"
          />
        </Field>
        <Field label="Phone">
          <Input value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="+2547…" />
        </Field>
        <Field label="Gender">
          <Select value={form.gender} onValueChange={(v) => set('gender', v)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Role">
          <Select value={form.role} onValueChange={(v) => set('role', v)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Department">
          <Select value={form.departmentId} onValueChange={(v) => set('departmentId', v)}>
            <SelectTrigger className="w-full"><SelectValue placeholder="Select department" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="__none__">— None —</SelectItem>
              {departments.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Employment Type">
          <Select value={form.employmentType} onValueChange={(v) => set('employmentType', v)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Qualification">
          <Input value={form.qualification} onChange={(e) => set('qualification', e.target.value)} placeholder="BEd, MSc…" />
        </Field>
        <Field label="Specialization">
          <Input value={form.specialization} onChange={(e) => set('specialization', e.target.value)} placeholder="Mathematics" />
        </Field>
        <Field label="Salary (KES)">
          <Input
            type="number"
            value={form.salary}
            onChange={(e) => set('salary', e.target.value)}
            placeholder="0"
          />
        </Field>
        <Field label="Status">
          <Select value={form.status} onValueChange={(v) => set('status', v)}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>
      <Field label="Address">
        <Input value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Nairobi, Kenya" />
      </Field>
    </>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

// ============================================================================
// Staff detail dialog
// ============================================================================
function StaffDetailDialog({
  staffId, onOpenChange, onEdit, onChanged,
}: {
  staffId: string | null
  onOpenChange: (o: boolean) => void
  onEdit: (id: string) => void
  onChanged: () => void
}) {
  const { data, loading, refetch } = useFetch<StaffDetail>(staffId ? `/api/staff/${staffId}` : null)
  const [deleting, setDeleting] = useState(false)

  const handleClose = (open: boolean) => {
    onOpenChange(open)
    if (!open) setDeleting(false)
  }

  const handleDelete = async () => {
    if (!data) return
    setDeleting(true)
    try {
      await apiDelete(`/api/staff/${data.id}`)
      toast.success('Staff member deleted')
      handleClose(false)
      onChanged()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to delete staff')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={!!staffId} onOpenChange={handleClose}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        {loading || !data ? (
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-32 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16 ring-2 ring-background">
                    <AvatarFallback className={cn('text-lg font-bold text-white', avatarColor(data.id))}>
                      {initials(data.firstName, data.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <DialogTitle className="text-xl">{fullName(data)}</DialogTitle>
                    <DialogDescription className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="font-mono">{data.employeeNo}</span>
                      <span>·</span>
                      <span className={cn('inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-medium', roleBadgeClass(data.role))}>
                        {data.role}
                      </span>
                      <span>·</span>
                      <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', statusColor(data.status))}>
                        {data.status}
                      </span>
                    </DialogDescription>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="max-h-[60vh] pr-3">
              <div className="space-y-5">
                {/* Quick stats */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <MiniStat icon={BookOpen} label="Subjects" value={data.loadSummary.uniqueSubjects} accent="emerald" />
                  <MiniStat icon={Layers} label="Classes" value={data.loadSummary.uniqueClasses} accent="teal" />
                  <MiniStat icon={Clock} label="Periods/wk" value={data.loadSummary.totalPeriods} accent="cyan" />
                  <MiniStat icon={CalendarClock} label="Lessons/wk" value={data.loadSummary.totalLessons} accent="amber" />
                </div>

                {/* Profile info */}
                <Section icon={IdCard} title="Profile Information">
                  <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
                    <InfoRow icon={Building2} label="Department" value={data.department?.name || 'Unassigned'} />
                    <InfoRow icon={Briefcase} label="Employment" value={data.employmentType} />
                    <InfoRow icon={Award} label="Qualification" value={data.qualification || '—'} />
                    <InfoRow icon={BookOpen} label="Specialization" value={data.specialization || '—'} />
                    <InfoRow icon={CalendarClock} label="Hire Date" value={formatDate(data.hireDate)} />
                    <InfoRow icon={GraduationCap} label="Gender" value={data.gender} />
                    <InfoRow icon={Mail} label="Email" value={data.email || '—'} />
                    <InfoRow icon={Phone} label="Phone" value={data.phone || '—'} />
                    <InfoRow icon={MapPin} label="Address" value={data.address || '—'} />
                    <InfoRow icon={IdCard} label="Salary" value={formatKES(data.salary)} />
                  </div>
                </Section>

                {/* Subjects taught */}
                <Section icon={BookOpen} title="Subjects Taught">
                  {data.taughtSubjects.length === 0 ? (
                    <p className="py-3 text-sm text-muted-foreground">No subject assignments yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {data.taughtSubjects.map((a) => (
                        <div
                          key={a.id}
                          className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-xs"
                        >
                          <span className="font-medium text-emerald-700 dark:text-emerald-400">{a.subject.name}</span>
                          <span className="text-muted-foreground">·</span>
                          <span>{a.classLevel.name}</span>
                          <Badge variant="outline" className="ml-1 text-[10px]">{a.weeklyPeriods}/wk</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                {/* Weekly timetable */}
                <Section icon={CalendarClock} title="Weekly Timetable">
                  {data.timetableByDay.length === 0 ? (
                    <p className="py-3 text-sm text-muted-foreground">No timetable slots assigned.</p>
                  ) : (
                    <div className="space-y-2">
                      {data.timetableByDay.map((d) => (
                        <div key={d.day} className="rounded-lg border p-2.5">
                          <p className="mb-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">{d.day}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {d.lessons.map((l: any) => (
                              <span
                                key={l.id}
                                className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-[11px]"
                              >
                                <span className="font-mono">{l.startTime}–{l.endTime}</span>
                                <span className="text-muted-foreground">·</span>
                                <span>{l.subject.name}</span>
                                <span className="text-muted-foreground">·</span>
                                <span>{l.stream.name}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>

                {/* Recent attendance */}
                <Section icon={CheckCircle2} title="Recent Attendance">
                  {data.attendanceSummary.recent.length === 0 ? (
                    <p className="py-3 text-sm text-muted-foreground">No attendance records yet.</p>
                  ) : (
                    <>
                      <div className="mb-3 flex items-center justify-between rounded-lg bg-emerald-500/5 px-3 py-2">
                        <span className="text-xs text-muted-foreground">Attendance rate (last {data.attendanceSummary.totalRecords})</span>
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{data.attendanceSummary.rate}%</span>
                      </div>
                      <div className="space-y-1.5">
                        {data.attendanceSummary.recent.map((a: any) => (
                          <div key={a.id} className="flex items-center justify-between rounded-md border px-3 py-1.5 text-xs">
                            <div className="flex items-center gap-2">
                              <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium', statusColor(a.status))}>
                                {a.status}
                              </span>
                              <span className="text-muted-foreground">{formatDate(a.date)}</span>
                              {a.checkInTime && (
                                <span className="font-mono text-muted-foreground">{a.checkInTime}</span>
                              )}
                            </div>
                            <span className="text-muted-foreground">
                              {a.marker ? `Marked by ${a.marker.firstName} ${a.marker.lastName}` : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </Section>
              </div>
            </ScrollArea>

            <DialogFooter className="gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleting}
                className="mr-auto"
              >
                <Trash2 className="h-4 w-4" /> {deleting ? 'Deleting…' : 'Delete'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => onEdit(data.id)}>
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              <DialogClose asChild>
                <Button size="sm">Close</Button>
              </DialogClose>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ============================================================================
// Edit staff dialog (separate from detail)
// ============================================================================
function EditStaffDialog({
  staffId, departments, onOpenChange, onSaved,
}: {
  staffId: string | null
  departments: DepartmentRef[]
  onOpenChange: (o: boolean) => void
  onSaved: () => void
}) {
  const { data, loading } = useFetch<StaffDetail>(staffId ? `/api/staff/${staffId}` : null)
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)

  // Sync form from server data once it arrives
  useEffect(() => {
    if (data) {
      setForm({
        employeeNo: data.employeeNo,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || '',
        phone: data.phone || '',
        gender: data.gender || 'Male',
        role: data.role || 'Teacher',
        departmentId: data.departmentId || '__none__',
        qualification: data.qualification || '',
        specialization: data.specialization || '',
        employmentType: data.employmentType || 'Permanent',
        salary: String(data.salary || 0),
        hireDate: data.hireDate ? new Date(data.hireDate).toISOString().slice(0, 10) : '',
        address: data.address || '',
        status: data.status || 'Active',
      })
    } else {
      setForm(null)
    }
  }, [data])

  const set = (k: keyof FormState, v: string) => setForm((f) => (f ? { ...f, [k]: v } : f))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!staffId || !form) return
    setSaving(true)
    try {
      const payload: any = {
        ...form,
        departmentId: form.departmentId === '__none__' ? null : form.departmentId,
        salary: form.salary === '' ? 0 : Number(form.salary),
      }
      await apiPut(`/api/staff/${staffId}`, payload)
      toast.success('Staff updated successfully')
      onSaved()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update staff')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={!!staffId} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
          <DialogDescription>
            {data ? `Update details for ${fullName(data)}.` : 'Loading…'}
          </DialogDescription>
        </DialogHeader>
        {loading || !form ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <StaffFormFields form={form} set={set} departments={departments} />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-emerald-600 text-white hover:bg-emerald-700">
                {saving ? 'Saving…' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---- Small building blocks -------------------------------------------------
function MiniStat({
  icon: Icon, label, value, accent,
}: {
  icon: any; label: string; value: number; accent: 'emerald' | 'teal' | 'cyan' | 'amber'
}) {
  const map: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    cyan: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
  }
  return (
    <div className="rounded-xl border p-3">
      <div className={cn('mb-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md', map[accent])}>
        <Icon className="h-3.5 w-3.5" />
      </div>
      <p className="text-lg font-bold leading-tight">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function InfoRow({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium">{value}</p>
      </div>
    </div>
  )
}
