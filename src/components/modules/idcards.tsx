'use client'
import { useState, useMemo } from 'react'
import { useFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn, avatarColor, initials, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import {
  CreditCard, Search, Printer, School, GraduationCap, Users, IdCard,
  Droplet, MapPin, Calendar, User, Hash, ShieldCheck,
} from 'lucide-react'

interface Person {
  id: string
  type: 'Student' | 'Staff'
  admissionNo?: string
  employeeNo?: string
  firstName: string
  lastName: string
  fullName: string
  gender: string
  role?: string
  className?: string | null
  department?: string | null
  bloodGroup?: string | null
  email: string | null
  phone: string | null
  photoUrl: string | null
  status: string
  boarding?: boolean
}

interface IdCardsData {
  stats: { totalStudents: number; totalStaff: number; cardsGenerated: number }
  people: Person[]
}

const VALID_UNTIL = new Date(new Date().getFullYear() + 1, 11, 31) // Dec 31 next year

function generateBarcode(seed: string): string {
  // Pseudo-barcode: deterministic pattern of | and spaces from the seed
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  let s = ''
  for (let i = 0; i < 28; i++) {
    hash = (hash * 31 + i * 17) & 0xffffffff
    const m = Math.abs(hash) % 5
    s += m === 0 ? ' ' : m === 1 ? '▌' : m === 2 ? '▎' : m === 3 ? '█' : '▌'
  }
  return s
}

export function IdCardsModule() {
  const [tab, setTab] = useState<'students' | 'staff'>('students')
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const params = new URLSearchParams()
  params.set('type', tab)
  if (search) params.set('search', search)
  const { data, loading } = useFetch<IdCardsData>(`/api/idcards?${params.toString()}`, [tab, search])

  const selected = useMemo(() => {
    if (!data || !selectedId) return null
    return data.people.find(p => p.id === selectedId) || data.people[0] || null
  }, [data, selectedId])

  // When data loads and nothing is selected, default to first
  const effectiveSelected = selected || (data?.people[0] || null)

  return (
    <div className="space-y-6">
      {/* Cyan gradient header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 via-teal-500 to-emerald-600 p-6 text-white shadow-xl print:hidden">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <IdCard className="h-3 w-3" /> Generate & print ID cards for students and staff
            </div>
            <h2 className="text-2xl font-bold tracking-tight">ID Card Generation</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Search for a student or staff member, preview their ID card, and print it instantly.
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 print:hidden">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <GraduationCap className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{data?.stats.totalStudents ?? '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Staff</p>
              <p className="text-2xl font-bold">{data?.stats.totalStaff ?? '—'}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 ring-1 ring-cyan-500/20">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Cards Generated</p>
              <p className="text-2xl font-bold">{data?.stats.cardsGenerated ?? '—'}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => { setTab(v as any); setSelectedId(null) }} className="print:hidden">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="students" className="gap-1.5"><GraduationCap className="h-4 w-4" /> Students</TabsTrigger>
          <TabsTrigger value="staff" className="gap-1.5"><Users className="h-4 w-4" /> Staff</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          <div className="grid gap-4 lg:grid-cols-5">
            {/* People list */}
            <div className="lg:col-span-2">
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">{tab === 'students' ? 'Students' : 'Staff'}</CardTitle>
                      <CardDescription className="text-xs">{data?.people.length || 0} records</CardDescription>
                    </div>
                  </div>
                  <div className="relative mt-1">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder={tab === 'students' ? 'Search name or admission no...' : 'Search name or employee no...'}
                      className="pl-9"
                    />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[560px]">
                    {loading && !data ? (
                      <div className="space-y-2 p-3">
                        {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
                      </div>
                    ) : data && data.people.length > 0 ? (
                      <div className="space-y-0.5 p-2">
                        {data.people.map(p => {
                          const isSel = effectiveSelected?.id === p.id
                          return (
                            <button
                              key={p.id}
                              onClick={() => setSelectedId(p.id)}
                              className={cn(
                                'flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-all',
                                isSel ? 'bg-cyan-500/10 ring-1 ring-cyan-500/30' : 'hover:bg-muted/60'
                              )}
                            >
                              <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white', avatarColor(p.fullName))}>
                                {initials(p.firstName, p.lastName)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium">{p.fullName}</p>
                                <p className="truncate text-[10px] text-muted-foreground">
                                  {tab === 'students' ? p.admissionNo : p.employeeNo}
                                  {tab === 'students' && p.className ? ` · ${p.className}` : ''}
                                  {tab === 'staff' && p.department ? ` · ${p.department}` : ''}
                                </p>
                              </div>
                              {isSel && <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-600" />}
                            </button>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                        <Search className="h-8 w-8" />
                        <p>No matches found</p>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* ID card preview */}
            <div className="lg:col-span-3">
              <Card className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <CardTitle className="text-base">ID Card Preview</CardTitle>
                      <CardDescription className="text-xs">
                        {effectiveSelected ? `Card for ${effectiveSelected.fullName}` : 'Select a person to preview'}
                      </CardDescription>
                    </div>
                    {effectiveSelected && (
                      <Button
                        size="sm"
                        className="bg-cyan-600 hover:bg-cyan-700"
                        onClick={() => {
                          toast.success('Opening print dialog...')
                          setTimeout(() => window.print(), 300)
                        }}
                      >
                        <Printer className="mr-1.5 h-4 w-4" /> Print ID Card
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="flex justify-center bg-muted/30 p-6 print:p-0 print:bg-white">
                  {effectiveSelected ? (
                    <IdCardPreview person={effectiveSelected} />
                  ) : (
                    <div className="flex h-[400px] flex-col items-center justify-center gap-2 text-sm text-muted-foreground">
                      <CreditCard className="h-10 w-10" />
                      <p>Select a {tab === 'students' ? 'student' : 'staff member'} to preview their ID card</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function IdCardPreview({ person }: { person: Person }) {
  const idNumber = person.type === 'Student' ? person.admissionNo : person.employeeNo
  const roleOrClass = person.type === 'Student' ? person.className : person.department
  const barcode = generateBarcode(idNumber || person.id)

  return (
    <div className="print-container">
      <div className="w-[340px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200 print:shadow-none print:ring-0">
        {/* Header with school logo + name */}
        <div className="relative bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 px-4 pb-3 pt-4 text-white">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-white/10 blur-xl" />
          <div className="relative flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 ring-2 ring-white/40 backdrop-blur">
              <School className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold tracking-tight">SkulHub Academy</p>
              <p className="truncate text-[9px] text-white/80">Excellence in Education · Est. 1998</p>
            </div>
          </div>
          <div className="relative mt-2 flex items-center justify-between">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider backdrop-blur">
              <IdCard className="h-2.5 w-2.5" /> Identity Card
            </span>
            <span className="text-[9px] font-medium text-white/80">{new Date().getFullYear()} Academic Year</span>
          </div>
        </div>

        {/* Body */}
        <div className="px-4 py-4">
          <div className="flex items-start gap-3">
            {/* Photo placeholder */}
            <div className={cn('flex h-20 w-20 shrink-0 items-center justify-center rounded-xl text-2xl font-bold text-white ring-2 ring-slate-100', avatarColor(person.fullName))}>
              {initials(person.firstName, person.lastName)}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="truncate text-base font-bold text-slate-900">{person.fullName}</p>
              <div className="inline-flex items-center gap-1 rounded-md bg-cyan-50 px-1.5 py-0.5 text-[10px] font-semibold text-cyan-700 ring-1 ring-cyan-200">
                <ShieldCheck className="h-2.5 w-2.5" /> {person.type}
              </div>
              <div className="space-y-0.5 pt-1">
                <Field icon={Hash} label={person.type === 'Student' ? 'Adm No' : 'Emp No'} value={idNumber || '—'} />
                <Field icon={User} label={person.type === 'Student' ? 'Class' : 'Dept'} value={roleOrClass || '—'} />
              </div>
            </div>
          </div>

          {/* Info grid */}
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-dashed border-slate-200 pt-3">
            <Field icon={User} label="Gender" value={person.gender || '—'} />
            <Field icon={Droplet} label="Blood" value={person.bloodGroup || 'N/A'} />
            {person.type === 'Student' && (
              <Field icon={GraduationCap} label="Status" value={(person as any).boarding ? 'Boarding' : 'Day Scholar'} />
            )}
            {person.phone && <Field icon={User} label="Phone" value={person.phone} />}
            {person.email && <Field icon={User} label="Email" value={person.email} />}
          </div>
        </div>

        {/* Barcode + valid until */}
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-mono text-lg leading-none tracking-tighter text-slate-900">{barcode}</p>
              <p className="mt-1 font-mono text-[10px] text-slate-500">ID-{idNumber || '------'}</p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-[9px] uppercase tracking-wide text-slate-400">Valid Until</p>
              <p className="text-xs font-semibold text-slate-700">{formatDate(VALID_UNTIL)}</p>
            </div>
          </div>
        </div>

        {/* Footer strip */}
        <div className="bg-emerald-600 px-4 py-1.5">
          <p className="text-center text-[9px] font-medium text-white/90">
            If found, please return to SkulHub Academy · +254 700 000 000
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3 w-3 shrink-0 text-slate-400" />
      <span className="text-[10px] uppercase tracking-wide text-slate-400">{label}:</span>
      <span className="truncate text-[11px] font-semibold text-slate-700">{value}</span>
    </div>
  )
}
