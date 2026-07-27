'use client'
import { useState } from 'react'
import { useFetch } from '@/lib/api'
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
import { avatarColor, initials, fullName, formatDate, timeAgo, statusColor } from '@/lib/format'
import { toast } from 'sonner'
import {
  Home, BedDouble, DoorOpen, Users, ClipboardCheck, Plus, Search,
  ChevronRight, MapPin, User, Phone, Building2, Star, TrendingUp,
  CheckCircle2, X, Wrench,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

interface HostelData {
  stats: {
    totalDorms: number; totalCapacity: number; totalRooms: number
    totalAllocations: number; occupancyRate: number; totalInspections: number
  }
  dormitories: Array<{
    id: string; name: string; gender: string; capacity: number; location: string | null
    floors: number; status: string
    warden: { id: string; firstName: string; lastName: string; phone: string; employeeNo: string } | null
    activeAllocations: number; roomCount: number; fullRooms: number; availableRooms: number
    avgInspectionScore: number | null
    latestInspection: { id: string; date: string; overallScore: number; findings: string } | null
    rooms: Array<{ id: string; roomNumber: string; floor: number; capacity: number; occupied: number; status: string }>
  }>
  byGender: Array<{ name: string; count: number }>
}

const GENDER_COLORS: Record<string, string> = { Boys: '#0d9488', Girls: '#d97706', Mixed: '#8b5cf6' }
const GENDER_BADGE: Record<string, string> = {
  Boys: 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-400',
  Girls: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  Mixed: 'border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950 dark:text-violet-400',
}

function scoreColor(score: number) {
  if (score >= 8) return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800'
  if (score >= 6) return 'text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-950 dark:text-amber-400 dark:border-amber-800'
  return 'text-rose-600 bg-rose-50 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800'
}

export function HostelModule() {
  const { data, loading } = useFetch<HostelData>('/api/hostel')
  const [search, setSearch] = useState('')
  const [genderFilter, setGenderFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDorm, setSelectedDorm] = useState<string | null>(null)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (genderFilter !== 'all') params.set('gender', genderFilter)
  if (statusFilter !== 'all') params.set('status', statusFilter)
  const { data: filtered } = useFetch<HostelData>(`/api/hostel?${params.toString()}`, [search, genderFilter, statusFilter])

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-cyan-600 to-sky-700 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Home className="h-3 w-3" /> {stats.totalDorms} dorms · {stats.totalAllocations}/{stats.totalCapacity} beds occupied ({stats.occupancyRate}%)
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Hostel & Boarding</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Manage dormitories, bed allocations, and conduct regular welfare inspections.
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20">
              <Home className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Dormitories</p>
              <p className="text-2xl font-bold">{stats.totalDorms}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 ring-1 ring-cyan-500/20">
              <DoorOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Rooms</p>
              <p className="text-2xl font-bold">{stats.totalRooms}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <BedDouble className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Boarders</p>
              <p className="text-2xl font-bold">{stats.totalAllocations}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Occupancy Rate</p>
              <p className="text-2xl font-bold">{stats.occupancyRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Occupancy progress bar */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-2 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Overall Occupancy</p>
              <p className="text-xs text-muted-foreground">{stats.totalAllocations} of {stats.totalCapacity} beds filled</p>
            </div>
            <span className="text-2xl font-bold text-teal-600">{stats.occupancyRate}%</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 transition-all duration-700"
              style={{ width: `${stats.occupancyRate}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search dormitory name or location..." className="pl-9" />
          </div>
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Genders</SelectItem>
              <SelectItem value="Boys">Boys</SelectItem>
              <SelectItem value="Girls">Girls</SelectItem>
              <SelectItem value="Mixed">Mixed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Maintenance">Maintenance</SelectItem>
              <SelectItem value="Closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Dormitory cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {display.dormitories.map(d => (
          <Card key={d.id} className="stat-card cursor-pointer transition-all hover:shadow-lg" onClick={() => setSelectedDorm(d.id)}>
            <CardContent className="p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-md">
                    <Home className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{d.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">{d.location} · {d.floors} floor{d.floors > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <Badge variant="outline" className={cn('shrink-0 text-[10px]', GENDER_BADGE[d.gender])}>{d.gender}</Badge>
              </div>

              {/* Stats grid */}
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[9px] uppercase text-muted-foreground">Rooms</p>
                  <p className="text-sm font-bold">{d.roomCount}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[9px] uppercase text-muted-foreground">Occupied</p>
                  <p className="text-sm font-bold text-teal-600">{d.activeAllocations}</p>
                </div>
                <div className="rounded-lg bg-muted/40 p-2">
                  <p className="text-[9px] uppercase text-muted-foreground">Capacity</p>
                  <p className="text-sm font-bold">{d.capacity}</p>
                </div>
              </div>

              {/* Occupancy bar */}
              <div className="mt-2">
                <div className="mb-1 flex justify-between text-[10px]">
                  <span className="text-muted-foreground">Occupancy</span>
                  <span className="font-semibold">{d.capacity > 0 ? Math.round((d.activeAllocations / d.capacity) * 100) : 0}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-500" style={{ width: `${d.capacity > 0 ? (d.activeAllocations / d.capacity) * 100 : 0}%` }} />
                </div>
              </div>

              {/* Room availability */}
              <div className="mt-3 flex items-center gap-3 text-[10px]">
                <span className="flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5 text-emerald-500" />{d.availableRooms} available</span>
                <span className="flex items-center gap-1"><BedDouble className="h-2.5 w-2.5 text-amber-500" />{d.fullRooms} full</span>
              </div>

              {/* Warden + inspection */}
              <div className="mt-3 space-y-1.5 border-t pt-2 text-[10px]">
                {d.warden && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <User className="h-2.5 w-2.5" />
                    <span>Warden: <span className="font-medium text-foreground">{d.warden.firstName} {d.warden.lastName}</span></span>
                  </div>
                )}
                {d.avgInspectionScore !== null && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Star className="h-2.5 w-2.5 text-amber-500" />
                    <span>Avg Score: <span className={cn('font-bold', scoreColor(d.avgInspectionScore).split(' ')[0])}>{d.avgInspectionScore}/10</span></span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {display.dormitories.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
            <Home className="h-8 w-8" />
            <p>No dormitories match your filters.</p>
          </CardContent>
        </Card>
      )}

      {/* Detail dialog */}
      {selectedDorm && <DormitoryDetailDialog dormId={selectedDorm} onClose={() => setSelectedDorm(null)} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dormitory Detail Dialog
// ---------------------------------------------------------------------------
function DormitoryDetailDialog({ dormId, onClose }: { dormId: string; onClose: () => void }) {
  const { data: dorm, loading } = useFetch<any>(`/api/hostel/${dormId}`)

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto scrollbar-thin">
        {loading || !dorm ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-teal-500" /> {dorm.name}
              </DialogTitle>
              <DialogDescription>{dorm.gender} · {dorm.location} · {dorm.floors} floor{dorm.floors > 1 ? 's' : ''}</DialogDescription>
            </DialogHeader>

            {/* Info grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="border-teal-200/50 bg-teal-50/30 dark:bg-teal-950/10">
                <CardContent className="p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">Dormitory Info</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /><span>Capacity: {dorm.capacity} beds</span></div>
                    <div className="flex items-center gap-2"><DoorOpen className="h-3.5 w-3.5 text-muted-foreground" /><span>Rooms: {dorm.rooms.length}</span></div>
                    <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /><span>{dorm.location || 'N/A'}</span></div>
                    <div className="flex items-center gap-2"><Badge variant="secondary" className={cn('text-[10px]', statusColor(dorm.status))}>{dorm.status}</Badge></div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Warden</p>
                  {dorm.warden ? (
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" /><span className="font-medium">{dorm.warden.firstName} {dorm.warden.lastName}</span></div>
                      <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span>{dorm.warden.phone}</span></div>
                      <div className="flex items-center gap-2"><Badge variant="outline" className="text-[10px]">{dorm.warden.employeeNo}</Badge></div>
                    </div>
                  ) : <p className="text-xs text-muted-foreground">No warden assigned</p>}
                </CardContent>
              </Card>
            </div>

            {/* Rooms table */}
            <div>
              <p className="mb-2 text-sm font-semibold">Rooms & Occupancy ({dorm.rooms.length})</p>
              <div className="max-h-64 overflow-y-auto scrollbar-thin rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-xs">Room</TableHead>
                      <TableHead className="text-center text-xs">Floor</TableHead>
                      <TableHead className="text-center text-xs">Capacity</TableHead>
                      <TableHead className="text-center text-xs">Occupied</TableHead>
                      <TableHead className="text-center text-xs">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dorm.rooms.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-xs font-medium">{r.roomNumber}</TableCell>
                        <TableCell className="text-center text-xs">{r.floor}</TableCell>
                        <TableCell className="text-center text-xs">{r.capacity}</TableCell>
                        <TableCell className="text-center text-xs font-semibold">{r.occupied}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className={cn('text-[10px]',
                            r.status === 'Full' ? 'border-rose-300 text-rose-700 dark:border-rose-800 dark:text-rose-400'
                            : r.status === 'Maintenance' ? 'border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400'
                            : 'border-emerald-300 text-emerald-700 dark:border-emerald-800 dark:text-emerald-400'
                          )}>{r.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Inspections */}
            {dorm.inspections.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <ClipboardCheck className="h-4 w-4 text-teal-500" /> Inspection History ({dorm.inspections.length})
                </p>
                <div className="max-h-48 space-y-2 overflow-y-auto scrollbar-thin pr-1">
                  {dorm.inspections.map((insp: any) => (
                    <div key={insp.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={cn('text-[10px] font-bold', scoreColor(insp.overallScore))}>{insp.overallScore}/10</Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(insp.date)}</span>
                          {insp.inspectedBy && <span className="text-[10px] text-muted-foreground">· by {insp.inspectedBy}</span>}
                        </div>
                      </div>
                      {insp.findings && <p className="mt-1 text-xs">{insp.findings}</p>}
                      <div className="mt-1.5 flex gap-3 text-[10px] text-muted-foreground">
                        <span>Cleanliness: <span className="font-semibold">{insp.cleanliness}/10</span></span>
                        <span>Organization: <span className="font-semibold">{insp.organization}/10</span></span>
                        <span>Discipline: <span className="font-semibold">{insp.discipline}/10</span></span>
                      </div>
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
