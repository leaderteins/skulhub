'use client'
import { useEffect, useMemo, useState } from 'react'
import { useFetch, apiPost, apiDelete } from '@/lib/api'
import { StatCard, EmptyState } from '@/components/shared'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import {
  Users,
  UserPlus,
  Search,
  BedDouble,
  Sun,
  Eye,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  Droplet,
  ShieldCheck,
  BookOpen,
  ClipboardCheck,
  Wallet,
  Filter,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  formatKES,
  formatDate,
  fullName,
  initials,
  avatarColor,
  statusColor,
  gradeColor,
} from '@/lib/format'

// ----- Types -----------------------------------------------------------------

interface Guardian {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string | null
  relation: string
  occupation?: string | null
  address?: string | null
}

interface ClassLevel {
  id: string
  name: string
  stage?: string
}

interface Stream {
  id: string
  name: string
  classLevel?: ClassLevel
}

interface Enrollment {
  id: string
  studentId: string
  streamId: string
  classLevelId?: string | null
  academicYear: string
  term: string
  status: string
  enrolledAt: string
  stream?: Stream & { classLevel?: ClassLevel }
  classLevel?: ClassLevel | null
}

interface StudentRow {
  id: string
  admissionNo: string
  firstName: string
  lastName: string
  email?: string | null
  phone?: string | null
  gender: string
  dateOfBirth?: string | null
  bloodGroup?: string | null
  nationality?: string
  county?: string | null
  photoUrl?: string | null
  status: string
  boarding: boolean
  admissionDate: string
  guardian?: Guardian | null
  currentEnrollment?: Enrollment | null
}

interface Invoice {
  id: string
  invoiceNo: string
  amount: number
  amountPaid: number
  balance: number
  status: string
  dueDate: string
  issueDate: string
  _count?: { payments: number }
}

interface Grade {
  id: string
  marks: number
  grade: string
  points: number
  remarks?: string | null
  subject?: { id: string; name: string; code: string }
  exam?: { id: string; name: string; term: string; academicYear: string }
  createdAt: string
}

interface AttendanceRow {
  id: string
  date: string
  status: string
  checkInTime?: string | null
  remarks?: string | null
}

interface StudentDetail extends StudentRow {
  enrollments: Enrollment[]
  attendance: AttendanceRow[]
  grades: Grade[]
  invoices: Invoice[]
  currentEnrollment?: Enrollment | null
  feeSummary: {
    totalBilled: number
    totalPaid: number
    balance: number
    invoiceCount: number
    paymentsCount: number
  }
  attendanceStats: { present: number; absent: number; late: number; total: number }
}

interface ListResponse {
  students: StudentRow[]
  total: number
  page: number
  pageSize: number
  stats: { total: number; boarding: number; dayScholars: number; newThisTerm: number }
  classLevels: ClassLevel[]
}

// ----- Constants -------------------------------------------------------------

const KENYAN_COUNTIES = [
  'Nairobi', 'Mombasa', 'Kwale', 'Kilifi', 'Tana River', 'Lamu', 'Taita-Taveta',
  'Garissa', 'Wajir', 'Mandera', 'Marsabit', 'Isiolo', 'Meru', 'Tharaka-Nithi',
  'Embu', 'Kitui', 'Machakos', 'Makueni', 'Nyandarua', 'Nyeri', 'Kirinyaga',
  "Murang'a", 'Kiambu', 'Turkana', 'West Pokot', 'Samburu', 'Trans Nzoia',
  'Uasin Gishu', 'Elgeyo-Marakwet', 'Nandi', 'Baringo', 'Laikipia', 'Nakuru',
  'Narok', 'Kajiado', 'Kericho', 'Bomet', 'Kakamega', 'Vihiga', 'Bungoma',
  'Busia', 'Siaya', 'Kisumu', 'Homa Bay', 'Migori', 'Kisii', 'Nyamira',
]

const GENDERS = ['Male', 'Female']
const STATUSES = ['Active', 'Graduated', 'Transferred', 'Suspended', 'Dropped']
const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const GUARDIAN_RELATIONS = ['Parent', 'Guardian', 'Sponsor', 'Grandparent', 'Sibling', 'Other']

const ATTENDANCE_VARIANT: Record<string, string> = {
  Present: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Absent: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
  Late: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Excused: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  Sick: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
}

// ----- Helpers ---------------------------------------------------------------

function suggestAdmissionNo(): string {
  const year = new Date().getFullYear()
  const rand = Math.floor(1000 + Math.random() * 9000)
  return `ADM-${year}-${rand}`
}

// ----- Main Module -----------------------------------------------------------

export function StudentsModule() {
  // Filters
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [classLevel, setClassLevel] = useState('all')
  const [gender, setGender] = useState('all')
  const [status, setStatus] = useState('all')
  const [boarding, setBoarding] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 10

  // Dialogs
  const [admitOpen, setAdmitOpen] = useState(false)
  const [detailId, setDetailId] = useState<string | null>(null)

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [searchInput])

  // Build fetch URL
  const qs = useMemo(() => {
    const p = new URLSearchParams()
    p.set('page', String(page))
    p.set('pageSize', String(pageSize))
    if (search) p.set('search', search)
    if (classLevel !== 'all') p.set('classLevel', classLevel)
    if (gender !== 'all') p.set('gender', gender)
    if (status !== 'all') p.set('status', status)
    if (boarding !== 'all') p.set('boarding', boarding)
    return p.toString()
  }, [page, pageSize, search, classLevel, gender, status, boarding])

  const { data, loading, error, refetch } = useFetch<ListResponse>(`/api/students?${qs}`)

  const resetFilters = () => {
    setSearchInput('')
    setClassLevel('all')
    setGender('all')
    setStatus('all')
    setBoarding('all')
    setPage(1)
  }

  const hasFilters =
    !!search || classLevel !== 'all' || gender !== 'all' || status !== 'all' || boarding !== 'all'

  const students = data?.students || []
  const total = data?.total || 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const stats = data?.stats
  const classLevels = data?.classLevels || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <GraduationCap className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Students</h2>
            <p className="text-sm text-muted-foreground">
              Manage admissions, profiles, enrollment and guardians
            </p>
          </div>
        </div>
        <Button onClick={() => setAdmitOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <UserPlus className="mr-2 h-4 w-4" /> Admit Student
        </Button>
      </div>

      {/* Stat strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Students"
          value={stats?.total ?? 0}
          icon={Users}
          accent="emerald"
          loading={loading && !stats}
        />
        <StatCard
          label="Boarding"
          value={stats?.boarding ?? 0}
          icon={BedDouble}
          accent="teal"
          loading={loading && !stats}
        />
        <StatCard
          label="Day Scholars"
          value={stats?.dayScholars ?? 0}
          icon={Sun}
          accent="amber"
          loading={loading && !stats}
        />
        <StatCard
          label="New This Term"
          value={stats?.newThisTerm ?? 0}
          icon={UserPlus}
          accent="violet"
          loading={loading && !stats}
        />
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by admission no, name, phone or email…"
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:flex">
              <Select value={classLevel} onValueChange={(v) => { setClassLevel(v); setPage(1) }}>
                <SelectTrigger className="w-full lg:w-[150px]">
                  <SelectValue placeholder="Class Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classLevels.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={gender} onValueChange={(v) => { setGender(v); setPage(1) }}>
                <SelectTrigger className="w-full lg:w-[120px]">
                  <SelectValue placeholder="Gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Genders</SelectItem>
                  {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
                <SelectTrigger className="w-full lg:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={boarding} onValueChange={(v) => { setBoarding(v); setPage(1) }}>
                <SelectTrigger className="w-full lg:w-[130px]">
                  <SelectValue placeholder="Boarding" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Boarding & Day</SelectItem>
                  <SelectItem value="true">Boarding Only</SelectItem>
                  <SelectItem value="false">Day Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="shrink-0">
                <X className="mr-1 h-4 w-4" /> Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-base">
            Students List
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              {total} {total === 1 ? 'record' : 'records'}
            </span>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="text-xs">
            <Filter className="mr-1 h-3.5 w-3.5" /> Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6">
              <EmptyState
                icon={X}
                title="Failed to load students"
                description={error}
                action={
                  <Button size="sm" onClick={() => refetch()}>Retry</Button>
                }
              />
            </div>
          ) : loading ? (
            <StudentTableSkeleton />
          ) : students.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title={hasFilters ? 'No students match your filters' : 'No students admitted yet'}
                description={
                  hasFilters
                    ? 'Try adjusting your search criteria or clearing filters.'
                    : 'Click "Admit Student" to register your first student.'
                }
                action={
                  hasFilters ? (
                    <Button size="sm" variant="outline" onClick={resetFilters}>Clear filters</Button>
                  ) : (
                    <Button size="sm" onClick={() => setAdmitOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
                      <UserPlus className="mr-1.5 h-4 w-4" /> Admit Student
                    </Button>
                  )
                }
              />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="pl-4">Student</TableHead>
                      <TableHead>Class / Stream</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Guardian Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right pr-4">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((s) => {
                      const name = fullName(s)
                      const cls = s.currentEnrollment?.stream?.classLevel?.name ||
                        s.currentEnrollment?.classLevel?.name || null
                      const stream = s.currentEnrollment?.stream?.name
                      return (
                        <TableRow
                          key={s.id}
                          onClick={() => setDetailId(s.id)}
                          className="cursor-pointer"
                        >
                          <TableCell className="pl-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className={cn('text-white text-xs font-semibold', avatarColor(name))}>
                                  {initials(s.firstName, s.lastName)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <div className="truncate font-medium">{name}</div>
                                <div className="text-xs text-muted-foreground">{s.admissionNo}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {cls ? (
                              <div className="flex flex-col">
                                <span className="text-sm font-medium">{cls}</span>
                                {stream && <span className="text-xs text-muted-foreground">{stream}</span>}
                              </div>
                            ) : (
                              <Badge variant="outline" className="text-muted-foreground">Unassigned</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm">{s.gender}</span>
                          </TableCell>
                          <TableCell>
                            {s.guardian?.phone ? (
                              <span className="font-mono text-xs">{s.guardian.phone}</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className={cn('border-transparent', statusColor(s.status))}>
                              {s.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {s.boarding ? (
                              <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400">
                                <BedDouble className="mr-1 h-3 w-3" /> Boarding
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-400">
                                <Sun className="mr-1 h-3 w-3" /> Day
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right pr-4">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDetailId(s.id)
                              }}
                            >
                              <Eye className="mr-1 h-3.5 w-3.5" /> View
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <div className="flex flex-col items-center justify-between gap-3 border-t p-4 sm:flex-row">
                <p className="text-xs text-muted-foreground">
                  Showing <span className="font-medium text-foreground">{(page - 1) * pageSize + 1}</span>
                  {' '}-{' '}
                  <span className="font-medium text-foreground">{Math.min(page * pageSize, total)}</span>
                  {' '}of{' '}
                  <span className="font-medium text-foreground">{total}</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="h-4 w-4" /> Prev
                  </Button>
                  <span className="text-xs font-medium text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Next <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Admit Dialog */}
      <AdmitDialog
        open={admitOpen}
        onOpenChange={setAdmitOpen}
        classLevels={classLevels}
        onCreated={() => {
          refetch()
          setAdmitOpen(false)
        }}
      />

      {/* Detail Dialog */}
      <StudentDetailDialog
        studentId={detailId}
        onOpenChange={(open) => { if (!open) setDetailId(null) }}
        onChanged={() => refetch()}
      />
    </div>
  )
}

// ----- Table Skeleton --------------------------------------------------------

function StudentTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/40">
            <TableHead className="pl-4">Student</TableHead>
            <TableHead>Class / Stream</TableHead>
            <TableHead>Gender</TableHead>
            <TableHead>Guardian Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right pr-4">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 6 }).map((_, i) => (
            <TableRow key={i}>
              <TableCell className="pl-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              </TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-4 w-14" /></TableCell>
              <TableCell><Skeleton className="h-4 w-24" /></TableCell>
              <TableCell><Skeleton className="h-5 w-16 rounded-md" /></TableCell>
              <TableCell><Skeleton className="h-5 w-20 rounded-md" /></TableCell>
              <TableCell className="text-right pr-4"><Skeleton className="ml-auto h-7 w-16" /></TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

// ----- Admit Dialog ----------------------------------------------------------

interface AdmitForm {
  admissionNo: string
  firstName: string
  lastName: string
  gender: string
  dateOfBirth: string
  phone: string
  email: string
  county: string
  boarding: boolean
  bloodGroup: string
  status: string
  guardianFirstName: string
  guardianLastName: string
  guardianPhone: string
  guardianEmail: string
  guardianRelation: string
  guardianOccupation: string
}

function AdmitDialog({
  open,
  onOpenChange,
  classLevels,
  onCreated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  classLevels: ClassLevel[]
  onCreated: () => void
}) {
  const [form, setForm] = useState<AdmitForm>({
    admissionNo: '',
    firstName: '',
    lastName: '',
    gender: 'Male',
    dateOfBirth: '',
    phone: '',
    email: '',
    county: '',
    boarding: false,
    bloodGroup: '',
    status: 'Active',
    guardianFirstName: '',
    guardianLastName: '',
    guardianPhone: '',
    guardianEmail: '',
    guardianRelation: 'Parent',
    guardianOccupation: '',
  })
  const [saving, setSaving] = useState(false)

  // Auto-suggest admission number when opened
  useEffect(() => {
    if (open && !form.admissionNo) {
      setForm((f) => ({ ...f, admissionNo: suggestAdmissionNo() }))
    }
  }, [open])

  const update = <K extends keyof AdmitForm>(k: K, v: AdmitForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.firstName.trim() || !form.lastName.trim() || !form.admissionNo.trim()) {
      toast.error('First name, last name and admission number are required')
      return
    }
    setSaving(true)
    try {
      const payload: any = {
        admissionNo: form.admissionNo.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        gender: form.gender,
        dateOfBirth: form.dateOfBirth || null,
        phone: form.phone || null,
        email: form.email || null,
        county: form.county || null,
        boarding: form.boarding,
        bloodGroup: form.bloodGroup || null,
        status: form.status,
      }
      if (form.guardianFirstName && form.guardianPhone) {
        payload.guardian = {
          firstName: form.guardianFirstName.trim(),
          lastName: form.guardianLastName.trim(),
          phone: form.guardianPhone.trim(),
          email: form.guardianEmail || null,
          relation: form.guardianRelation,
          occupation: form.guardianOccupation || null,
        }
      }
      await apiPost('/api/students', payload)
      toast.success(`${form.firstName} ${form.lastName} admitted successfully`)
      // reset form
      setForm({
        admissionNo: '',
        firstName: '',
        lastName: '',
        gender: 'Male',
        dateOfBirth: '',
        phone: '',
        email: '',
        county: '',
        boarding: false,
        bloodGroup: '',
        status: 'Active',
        guardianFirstName: '',
        guardianLastName: '',
        guardianPhone: '',
        guardianEmail: '',
        guardianRelation: 'Parent',
        guardianOccupation: '',
      })
      onCreated()
    } catch (err: any) {
      try {
        const r = await err?.response?.json?.()
        toast.error(r?.error || 'Failed to admit student')
      } catch {
        toast.error('Failed to admit student')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-600" /> Admit New Student
          </DialogTitle>
          <DialogDescription>
            Register a new student. Guardian details are optional but recommended.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Student section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <GraduationCap className="h-4 w-4 text-emerald-600" /> Student Information
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Admission No." required>
                <Input
                  value={form.admissionNo}
                  onChange={(e) => update('admissionNo', e.target.value)}
                  placeholder="ADM-2025-0001"
                  className="font-mono"
                />
              </Field>
              <Field label="Status">
                <Select value={form.status} onValueChange={(v) => update('status', v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="First Name" required>
                <Input value={form.firstName} onChange={(e) => update('firstName', e.target.value)} placeholder="John" />
              </Field>
              <Field label="Last Name" required>
                <Input value={form.lastName} onChange={(e) => update('lastName', e.target.value)} placeholder="Mwangi" />
              </Field>
              <Field label="Gender">
                <Select value={form.gender} onValueChange={(v) => update('gender', v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Date of Birth">
                <Input type="date" value={form.dateOfBirth} onChange={(e) => update('dateOfBirth', e.target.value)} />
              </Field>
              <Field label="Phone">
                <Input value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="0712 345 678" />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="student@example.com" />
              </Field>
              <Field label="County">
                <Select value={form.county || 'none'} onValueChange={(v) => update('county', v === 'none' ? '' : v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Select county" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Not specified —</SelectItem>
                    {KENYAN_COUNTIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Blood Group">
                <Select value={form.bloodGroup || 'none'} onValueChange={(v) => update('bloodGroup', v === 'none' ? '' : v)}>
                  <SelectTrigger className="w-full"><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Not specified —</SelectItem>
                    {BLOOD_GROUPS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/30">
              <div>
                <p className="text-sm font-medium">Boarding Student</p>
                <p className="text-xs text-muted-foreground">Toggle on if the student will reside at school</p>
              </div>
              <Switch checked={form.boarding} onCheckedChange={(v) => update('boarding', v)} />
            </div>
          </div>

          <Separator />

          {/* Guardian section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-teal-600" /> Guardian / Parent (Optional)
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="First Name">
                <Input value={form.guardianFirstName} onChange={(e) => update('guardianFirstName', e.target.value)} placeholder="Mary" />
              </Field>
              <Field label="Last Name">
                <Input value={form.guardianLastName} onChange={(e) => update('guardianLastName', e.target.value)} placeholder="Wanjiru" />
              </Field>
              <Field label="Phone">
                <Input value={form.guardianPhone} onChange={(e) => update('guardianPhone', e.target.value)} placeholder="0722 000 111" />
              </Field>
              <Field label="Email">
                <Input type="email" value={form.guardianEmail} onChange={(e) => update('guardianEmail', e.target.value)} placeholder="parent@example.com" />
              </Field>
              <Field label="Relation">
                <Select value={form.guardianRelation} onValueChange={(v) => update('guardianRelation', v)}>
                  <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GUARDIAN_RELATIONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Occupation">
                <Input value={form.guardianOccupation} onChange={(e) => update('guardianOccupation', e.target.value)} placeholder="Teacher" />
              </Field>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              {saving ? 'Admitting…' : 'Admit Student'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">
        {label} {required && <span className="text-rose-500">*</span>}
      </Label>
      {children}
    </div>
  )
}

// ----- Detail Dialog ---------------------------------------------------------

function StudentDetailDialog({
  studentId,
  onOpenChange,
  onChanged,
}: {
  studentId: string | null
  onOpenChange: (o: boolean) => void
  onChanged: () => void
}) {
  const { data, loading, refetch } = useFetch<StudentDetail>(
    studentId ? `/api/students/${studentId}` : null
  )
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!data) return
    if (!confirm(`Delete ${data.firstName} ${data.lastName}? This action cannot be undone.`)) return
    setDeleting(true)
    try {
      await apiDelete(`/api/students/${data.id}`)
      toast.success('Student deleted')
      onOpenChange(false)
      onChanged()
    } catch {
      toast.error('Failed to delete student')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Dialog open={!!studentId} onOpenChange={(o) => { onOpenChange(o); if (o) setTimeout(refetch, 0) }}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-hidden p-0">
        {loading || !data ? (
          <div className="p-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 w-full rounded-lg" />)}
            </div>
            <Skeleton className="mt-4 h-40 w-full rounded-lg" />
          </div>
        ) : (
          <StudentDetailBody data={data} onDelete={handleDelete} deleting={deleting} />
        )}
      </DialogContent>
    </Dialog>
  )
}

function StudentDetailBody({
  data,
  onDelete,
  deleting,
}: {
  data: StudentDetail
  onDelete: () => void
  deleting: boolean
}) {
  const name = fullName(data)
  const cls = data.currentEnrollment?.stream?.classLevel?.name ||
    data.currentEnrollment?.classLevel?.name
  const stream = data.currentEnrollment?.stream?.name
  const attRate = data.attendanceStats.total > 0
    ? Math.round((data.attendanceStats.present / data.attendanceStats.total) * 100)
    : null

  return (
    <>
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white">
        <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start gap-4">
          <Avatar className="h-16 w-16 ring-2 ring-white/40">
            <AvatarFallback className={cn('text-lg font-bold text-white', avatarColor(name))}>
              {initials(data.firstName, data.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold">{name}</h2>
              <Badge variant="secondary" className="border-transparent bg-white/20 text-white">
                {data.admissionNo}
              </Badge>
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-white/85">
              {cls && <span className="inline-flex items-center gap-1"><GraduationCap className="h-3.5 w-3.5" /> {cls}{stream ? ` · ${stream}` : ''}</span>}
              <span className="inline-flex items-center gap-1">{data.gender}</span>
              {data.boarding ? (
                <span className="inline-flex items-center gap-1"><BedDouble className="h-3.5 w-3.5" /> Boarding</span>
              ) : (
                <span className="inline-flex items-center gap-1"><Sun className="h-3.5 w-3.5" /> Day Scholar</span>
              )}
              <span className="inline-flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" /> Admitted {formatDate(data.admissionDate)}</span>
            </div>
          </div>
          <Badge variant="secondary" className="border-transparent bg-white/20 text-white">
            {data.status}
          </Badge>
        </div>
      </div>

      <ScrollArea className="max-h-[55vh]">
        <div className="space-y-5 p-6">
          {/* Stat tiles */}
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat
              icon={Wallet}
              label="Fees Billed"
              value={formatKES(data.feeSummary.totalBilled)}
              accent="emerald"
            />
            <MiniStat
              icon={Wallet}
              label="Fees Paid"
              value={formatKES(data.feeSummary.totalPaid)}
              accent="teal"
            />
            <MiniStat
              icon={Wallet}
              label="Balance"
              value={formatKES(data.feeSummary.balance)}
              accent={data.feeSummary.balance > 0 ? 'rose' : 'emerald'}
            />
          </div>

          {/* Personal & Guardian */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-emerald-600" /> Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <InfoRow icon={CalendarDays} label="Date of Birth" value={data.dateOfBirth ? formatDate(data.dateOfBirth) : '—'} />
                <InfoRow icon={Droplet} label="Blood Group" value={data.bloodGroup || '—'} />
                <InfoRow icon={MapPin} label="Nationality" value={data.nationality || '—'} />
                <InfoRow icon={MapPin} label="County" value={data.county || '—'} />
                <InfoRow icon={Phone} label="Phone" value={data.phone || '—'} />
                <InfoRow icon={Mail} label="Email" value={data.email || '—'} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ShieldCheck className="h-4 w-4 text-teal-600" /> Guardian
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {data.guardian ? (
                  <>
                    <InfoRow
                      icon={Users}
                      label="Name"
                      value={`${data.guardian.firstName} ${data.guardian.lastName}`}
                    />
                    <InfoRow icon={ShieldCheck} label="Relation" value={data.guardian.relation} />
                    <InfoRow icon={Phone} label="Phone" value={data.guardian.phone} />
                    <InfoRow icon={Mail} label="Email" value={data.guardian.email || '—'} />
                    <InfoRow icon={BookOpen} label="Occupation" value={data.guardian.occupation || '—'} />
                    {data.guardian.address && (
                      <InfoRow icon={MapPin} label="Address" value={data.guardian.address} />
                    )}
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No guardian assigned.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enrollment */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <GraduationCap className="h-4 w-4 text-emerald-600" /> Enrollment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {data.enrollments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No enrollment records.</p>
              ) : (
                <div className="space-y-2">
                  {data.enrollments.slice(0, 4).map((e) => (
                    <div
                      key={e.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                          <BookOpen className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {e.stream?.classLevel?.name || e.classLevel?.name || 'Unassigned'}
                            {e.stream?.name ? ` · ${e.stream.name}` : ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {e.academicYear} · {e.term}
                          </p>
                        </div>
                      </div>
                      <Badge variant="secondary" className={cn('border-transparent', statusColor(e.status))}>
                        {e.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent attendance + grades */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <ClipboardCheck className="h-4 w-4 text-emerald-600" /> Recent Attendance
                  </CardTitle>
                  {attRate !== null && (
                    <Badge variant="outline" className={cn(
                      'border-transparent',
                      attRate >= 90
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                        : attRate >= 75
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                    )}>
                      {attRate}% present
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="max-h-56 overflow-y-auto">
                {data.attendance.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No attendance records.</p>
                ) : (
                  <div className="space-y-1.5">
                    {data.attendance.map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{formatDate(a.date)}</span>
                        <Badge variant="secondary" className={cn('border-transparent text-[10px]', ATTENDANCE_VARIANT[a.status] || statusColor(a.status))}>
                          {a.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-teal-600" /> Recent Grades
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-56 overflow-y-auto">
                {data.grades.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No grades recorded yet.</p>
                ) : (
                  <div className="space-y-1.5">
                    {data.grades.map((g) => (
                      <div key={g.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-xs">
                        <div className="min-w-0">
                          <p className="truncate font-medium">{g.subject?.name || '—'}</p>
                          <p className="text-muted-foreground">
                            {g.exam?.name || '—'} · {g.marks}/100
                          </p>
                        </div>
                        <Badge variant="outline" className={cn('font-semibold', gradeColor(g.grade))}>
                          {g.grade}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Invoices */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Wallet className="h-4 w-4 text-amber-600" /> Fee Invoices
              </CardTitle>
            </CardHeader>
            <CardContent className="max-h-56 overflow-y-auto">
              {data.invoices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No invoices issued.</p>
              ) : (
                <div className="space-y-1.5">
                  {data.invoices.slice(0, 6).map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-xs">
                      <div className="min-w-0">
                        <p className="truncate font-mono font-medium">{inv.invoiceNo}</p>
                        <p className="text-muted-foreground">
                          {formatKES(inv.amountPaid)} / {formatKES(inv.amount)} · due {formatDate(inv.dueDate)}
                        </p>
                      </div>
                      <Badge variant="secondary" className={cn('border-transparent', statusColor(inv.status))}>
                        {inv.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="flex items-center justify-between gap-2 border-t bg-muted/30 p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={deleting}
          className="text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950"
        >
          {deleting ? 'Deleting…' : 'Delete Student'}
        </Button>
      </div>
    </>
  )
}

function MiniStat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any
  label: string
  value: string
  accent: 'emerald' | 'teal' | 'amber' | 'rose'
}) {
  const map: Record<string, string> = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    teal: 'bg-teal-500/10 text-teal-600 dark:text-teal-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
  }
  return (
    <div className="flex items-center gap-3 rounded-lg border p-3">
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', map[accent])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-bold">{value}</p>
      </div>
    </div>
  )
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: any
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="inline-flex items-center gap-2 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <span className="truncate text-right font-medium">{value}</span>
    </div>
  )
}
