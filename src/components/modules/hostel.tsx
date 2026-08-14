'use client'
import { useState, useMemo, useEffect } from 'react'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { avatarColor, initials, fullName, formatDate, timeAgo, statusColor } from '@/lib/format'
import { toast } from 'sonner'
import {
  Home, BedDouble, DoorOpen, Users, ClipboardCheck, Plus, Search,
  ChevronRight, MapPin, User, Phone, Building2, Star, TrendingUp,
  CheckCircle2, X, Wrench, UserPlus, LogOut, AlertTriangle, Loader2, Bed, ChevronDown, ChevronRight as ChevronR,
} from 'lucide-react'

interface HostelData {
  stats: {
    totalDorms: number; totalCapacity: number; totalRooms: number; totalBeds: number; occupiedBeds: number
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

// Bed status badges: Available=emerald, Occupied=amber, Maintenance=rose
function bedStatusBadge(status: string): string {
  if (status === 'Occupied') return 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400'
  if (status === 'Maintenance') return 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400'
  return 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
}

function roomStatusBadge(status: string): string {
  if (status === 'Full') return 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400'
  if (status === 'Maintenance') return 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400'
  return 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
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
  const [assignOpen, setAssignOpen] = useState(false)

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
              <Home className="h-3 w-3" /> {stats.totalDorms} dorms · {stats.occupiedBeds}/{stats.totalBeds} beds occupied ({stats.occupancyRate}%)
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Hostel & Boarding</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Manage dormitories, bed allocations, and conduct regular welfare inspections.
            </p>
          </div>
          <Button
            onClick={() => setAssignOpen(true)}
            className="bg-white text-teal-700 hover:bg-white/90 shadow-lg"
          >
            <UserPlus className="mr-2 h-4 w-4" /> Assign Student to Bed
          </Button>
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
              <p className="text-xs text-muted-foreground">{stats.occupiedBeds} of {stats.totalBeds} beds filled</p>
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
      {selectedDorm && <DormitoryDetailDialog dormId={selectedDorm} onClose={() => setSelectedDorm(null)} onAssign={() => setAssignOpen(true)} />}

      {/* Assign student to bed dialog (top-level entry) */}
      <AssignStudentDialog open={assignOpen} onOpenChange={setAssignOpen} onAssigned={() => setSelectedDorm(null)} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dormitory Detail Dialog
// ---------------------------------------------------------------------------
function DormitoryDetailDialog({ dormId, onClose, onAssign }: { dormId: string; onClose: () => void; onAssign: () => void }) {
  const { data: dorm, loading, refetch } = useFetch<any>(`/api/hostel/${dormId}`)
  const [expandedRooms, setExpandedRooms] = useState<Record<string, boolean>>({})
  const [vacateTarget, setVacateTarget] = useState<{ bedId: string; bedNumber: string; occupantName: string } | null>(null)
  const [maintTarget, setMaintTarget] = useState<{ bedId: string; bedNumber: string; occupantName: string | null } | null>(null)
  const [busyBedId, setBusyBedId] = useState<string | null>(null)
  const [assignForRoom, setAssignForRoom] = useState<{ roomId: string; bedId: string | null } | null>(null)

  const toggleRoom = (roomId: string) => setExpandedRooms(prev => ({ ...prev, [roomId]: !prev[roomId] }))

  const handleVacate = async () => {
    if (!vacateTarget) return
    setBusyBedId(vacateTarget.bedId)
    try {
      await apiPost('/api/hostel/vacate', { bedId: vacateTarget.bedId, reason: 'Manual checkout' })
      toast.success(`${vacateTarget.occupantName} checked out from ${vacateTarget.bedNumber}`)
      setVacateTarget(null)
      refetch()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to vacate bed')
    } finally {
      setBusyBedId(null)
    }
  }

  const handleMarkMaintenance = async (confirmVacate: boolean) => {
    if (!maintTarget) return
    setBusyBedId(maintTarget.bedId)
    try {
      const r = await fetch(`/api/hostel/beds/${maintTarget.bedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Maintenance', vacateIfOccupied: confirmVacate }),
      })
      const json = await r.json()
      if (!r.ok) {
        toast.error(json?.error || `Failed (${r.status})`)
      } else {
        toast.success(`${maintTarget.bedNumber} marked as Maintenance`)
        setMaintTarget(null)
        refetch()
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update bed')
    } finally {
      setBusyBedId(null)
    }
  }

  const handleRestore = async (bedId: string, bedNumber: string) => {
    setBusyBedId(bedId)
    try {
      const r = await fetch(`/api/hostel/beds/${bedId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'Available' }),
      })
      const json = await r.json()
      if (!r.ok) {
        toast.error(json?.error || `Failed (${r.status})`)
      } else {
        toast.success(`${bedNumber} restored to Available`)
        refetch()
      }
    } catch (e: any) {
      toast.error(e?.message || 'Failed to restore bed')
    } finally {
      setBusyBedId(null)
    }
  }

  return (
    <>
      <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
        <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto scrollbar-thin">
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

              {/* Rooms + Beds */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-sm font-semibold">Rooms & Beds ({dorm.rooms.length})</p>
                  <Button size="sm" variant="outline" onClick={onAssign} className="h-7 text-xs">
                    <UserPlus className="mr-1 h-3 w-3" /> Assign Student
                  </Button>
                </div>
                <div className="max-h-[28rem] space-y-2 overflow-y-auto scrollbar-thin pr-1">
                  {dorm.rooms.map((r: any) => {
                    const expanded = !!expandedRooms[r.id]
                    const beds = r.beds || []
                    const occupiedCount = beds.filter((b: any) => b.status === 'Occupied').length
                    return (
                      <div key={r.id} className="rounded-lg border">
                        <button
                          onClick={() => toggleRoom(r.id)}
                          className="flex w-full items-center justify-between p-3 text-left hover:bg-muted/40"
                        >
                          <div className="flex items-center gap-2">
                            {expanded
                              ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              : <ChevronR className="h-4 w-4 text-muted-foreground" />}
                            <span className="text-sm font-medium">{r.roomNumber}</span>
                            <Badge variant="outline" className={cn('text-[10px]', roomStatusBadge(r.status))}>{r.status}</Badge>
                          </div>
                          <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                            <span>Floor {r.floor}</span>
                            <span className="font-semibold text-foreground">{occupiedCount}/{r.capacity}</span>
                            <span>occupied</span>
                          </div>
                        </button>
                        {expanded && (
                          <div className="border-t bg-muted/20 p-2">
                            {beds.length === 0 ? (
                              <p className="px-2 py-3 text-xs text-muted-foreground">No beds configured for this room.</p>
                            ) : (
                              <div className="grid gap-2 sm:grid-cols-2">
                                {beds.map((b: any) => (
                                  <BedCard
                                    key={b.id}
                                    bed={b}
                                    roomNumber={r.roomNumber}
                                    busy={busyBedId === b.id}
                                    onAssign={() => setAssignForRoom({ roomId: r.id, bedId: b.id })}
                                    onVacate={() => setVacateTarget({
                                      bedId: b.id,
                                      bedNumber: `${r.roomNumber} · ${b.bedNumber}`,
                                      occupantName: b.student ? `${b.student.firstName} ${b.student.lastName}` : '',
                                    })}
                                    onMaintenance={() => setMaintTarget({
                                      bedId: b.id,
                                      bedNumber: `${r.roomNumber} · ${b.bedNumber}`,
                                      occupantName: b.student ? `${b.student.firstName} ${b.student.lastName}` : null,
                                    })}
                                    onRestore={() => handleRestore(b.id, `${r.roomNumber} · ${b.bedNumber}`)}
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
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

      {/* Vacate confirmation */}
      <AlertDialog open={!!vacateTarget} onOpenChange={(o) => { if (!o) setVacateTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LogOut className="h-5 w-5 text-amber-500" /> Vacate Bed
            </AlertDialogTitle>
            <AlertDialogDescription>
              Check out <span className="font-semibold text-foreground">{vacateTarget?.occupantName}</span> from{' '}
              <span className="font-semibold text-foreground">{vacateTarget?.bedNumber}</span>?
              The bed will become Available and the student will no longer be a boarder (unless assigned elsewhere).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVacate}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              Yes, Vacate Bed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Maintenance confirmation (bed occupied) */}
      <AlertDialog open={!!maintTarget && !!maintTarget?.occupantName} onOpenChange={(o) => { if (!o) setMaintTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-rose-500" /> Mark Bed for Maintenance
            </AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-semibold text-foreground">{maintTarget?.bedNumber}</span> is currently occupied by{' '}
              <span className="font-semibold text-foreground">{maintTarget?.occupantName}</span>.
              Putting this bed into Maintenance will check them out. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleMarkMaintenance(true)}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Vacate & Mark Maintenance
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Maintenance confirmation (bed empty) */}
      <AlertDialog open={!!maintTarget && !maintTarget?.occupantName} onOpenChange={(o) => { if (!o) setMaintTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5 text-rose-500" /> Mark Bed for Maintenance
            </AlertDialogTitle>
            <AlertDialogDescription>
              Mark <span className="font-semibold text-foreground">{maintTarget?.bedNumber}</span> as under Maintenance? It will be unavailable for assignment until restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleMarkMaintenance(false)}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              Mark as Maintenance
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Per-bed assign dialog (uses same flow as top-level assign but with bed preselected) */}
      {assignForRoom && (
        <AssignStudentDialog
          open
          onOpenChange={(o) => { if (!o) setAssignForRoom(null) }}
          preselectedBedId={assignForRoom.bedId}
          preselectedRoomId={assignForRoom.roomId}
          dormitoryId={dorm?.id}
          onAssigned={() => { setAssignForRoom(null); refetch() }}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Bed card (inside the expanded room)
// ---------------------------------------------------------------------------
function BedCard({
  bed, roomNumber, busy, onAssign, onVacate, onMaintenance, onRestore,
}: {
  bed: any
  roomNumber: string
  busy: boolean
  onAssign: () => void
  onVacate: () => void
  onMaintenance: () => void
  onRestore: () => void
}) {
  const occupant = bed.student
  return (
    <div className={cn(
      'rounded-lg border p-2.5 transition-all',
      bed.status === 'Occupied' ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900/50 dark:bg-amber-950/10'
      : bed.status === 'Maintenance' ? 'border-rose-200 bg-rose-50/40 dark:border-rose-900/50 dark:bg-rose-950/10'
      : 'border-emerald-200 bg-emerald-50/40 dark:border-emerald-900/50 dark:bg-emerald-950/10',
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-md',
            bed.status === 'Occupied' ? 'bg-amber-500/15 text-amber-600'
            : bed.status === 'Maintenance' ? 'bg-rose-500/15 text-rose-600'
            : 'bg-emerald-500/15 text-emerald-600',
          )}>
            <Bed className="h-3.5 w-3.5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold truncate">{bed.bedNumber}</p>
            <Badge variant="outline" className={cn('text-[9px] mt-0.5', bedStatusBadge(bed.status))}>{bed.status}</Badge>
          </div>
        </div>
        {busy && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>

      {occupant ? (
        <div className="mt-2 flex items-center gap-2 border-t pt-2">
          <Avatar className="h-6 w-6">
            <AvatarFallback className={cn('text-[9px] text-white', avatarColor(occupant.id))}>
              {initials(occupant.firstName, occupant.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium truncate">{occupant.firstName} {occupant.lastName}</p>
            <p className="text-[10px] text-muted-foreground truncate">{occupant.admissionNo}</p>
          </div>
        </div>
      ) : (
        bed.status !== 'Maintenance' && (
          <p className="mt-2 border-t pt-2 text-[10px] italic text-muted-foreground">Empty bed</p>
        )
      )}

      {/* Actions */}
      <div className="mt-2 flex flex-wrap gap-1">
        {bed.status === 'Available' && (
          <Button size="sm" variant="outline" onClick={onAssign} className="h-6 px-2 text-[10px] text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
            <UserPlus className="mr-1 h-3 w-3" /> Assign
          </Button>
        )}
        {bed.status === 'Occupied' && (
          <>
            <Button size="sm" variant="outline" onClick={onAssign} className="h-6 px-2 text-[10px]">
              <Users className="mr-1 h-3 w-3" /> Reassign
            </Button>
            <Button size="sm" variant="outline" onClick={onVacate} className="h-6 px-2 text-[10px] text-amber-700 hover:text-amber-800 dark:text-amber-400">
              <LogOut className="mr-1 h-3 w-3" /> Vacate
            </Button>
          </>
        )}
        {bed.status === 'Maintenance' ? (
          <Button size="sm" variant="outline" onClick={onRestore} className="h-6 px-2 text-[10px] text-emerald-700 hover:text-emerald-800 dark:text-emerald-400">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Restore
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={onMaintenance} className="h-6 px-2 text-[10px] text-rose-600 hover:text-rose-700 dark:text-rose-400">
            <Wrench className="mr-1 h-3 w-3" /> Maint.
          </Button>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Assign Student to Bed Dialog
// ---------------------------------------------------------------------------
interface AssignStudentDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  preselectedBedId?: string | null
  preselectedRoomId?: string | null
  dormitoryId?: string
  onAssigned?: () => void
}

interface StudentSearchResult {
  id: string; admissionNo: string; firstName: string; lastName: string; gender: string
  phone?: string | null; boarding: boolean; status: string; photoUrl?: string | null
  currentEnrollment: any | null
  currentBed: { id: string; bedNumber: string; room: { id: string; roomNumber: string; dormitory: { name: string; gender: string } } } | null
}

interface BedOption {
  id: string; bedNumber: string; status: string; studentId: string | null
  student: { id: string; admissionNo: string; firstName: string; lastName: string } | null
  room: { id: string; roomNumber: string; capacity: number; occupied: number; status: string; dormitory: { id: string; name: string; gender: string } }
}

function AssignStudentDialog({ open, onOpenChange, preselectedBedId, preselectedRoomId, dormitoryId, onAssigned }: AssignStudentDialogProps) {
  // 1) Fetch list of dormitories (with rooms) for the cascading selectors
  const { data: hostelData, loading: loadingHostel } = useFetch<{ dormitories: any[] }>('/api/hostel')

  // 2) Form state
  const [dormId, setDormId] = useState<string | null>(dormitoryId || null)
  const [roomId, setRoomId] = useState<string | null>(preselectedRoomId || null)
  const [bedId, setBedId] = useState<string | null>(preselectedBedId || null)
  const [studentQuery, setStudentQuery] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<StudentSearchResult | null>(null)
  const [studentOpen, setStudentOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [warning, setWarning] = useState<{ code: string; message: string; details?: any } | null>(null)
  const [notes, setNotes] = useState('')

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setDormId(dormitoryId || null)
      setRoomId(preselectedRoomId || null)
      setBedId(preselectedBedId || null)
      setStudentQuery('')
      setSelectedStudent(null)
      setWarning(null)
      setNotes('')
    }
  }, [open, preselectedBedId, preselectedRoomId, dormitoryId])

  // Reset room/bed when dorm changes
  useEffect(() => {
    if (!open) return
    if (dormId && dormId !== dormitoryId) {
      setRoomId(null)
      setBedId(null)
    }
  }, [dormId])

  // Reset bed when room changes
  useEffect(() => {
    if (!open) return
    if (roomId && roomId !== preselectedRoomId) {
      setBedId(null)
    }
  }, [roomId])

  // Filter dormitories/rooms/beds based on current selections
  const dormitories = hostelData?.dormitories || []
  const selectedDorm = dormitories.find((d: any) => d.id === dormId)
  const rooms = useMemo(() => {
    if (!dormId) return []
    const d = dormitories.find((d: any) => d.id === dormId)
    return d?.rooms || []
  }, [dormId, dormitories])

  // Fetch beds for the selected room (so we can show occupant info too)
  const bedsUrl = roomId ? `/api/hostel/beds?roomId=${roomId}` : null
  const { data: bedsData, loading: loadingBeds } = useFetch<{ beds: BedOption[] }>(bedsUrl, [roomId])
  const beds = bedsData?.beds || []

  // 3) Student search (debounced via useEffect on studentQuery)
  const [studentResults, setStudentResults] = useState<StudentSearchResult[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  useEffect(() => {
    if (!studentOpen) return
    const q = studentQuery.trim()
    if (q.length < 1) {
      setStudentResults([])
      return
    }
    let cancelled = false
    setLoadingStudents(true)
    const t = setTimeout(() => {
      fetch(`/api/hostel/students/search?search=${encodeURIComponent(q)}&limit=20`)
        .then(async (r) => {
          if (!r.ok) return
          const json = await r.json()
          if (!cancelled) setStudentResults(json.students || [])
        })
        .catch(() => {})
        .finally(() => { if (!cancelled) setLoadingStudents(false) })
    }, 250)
    return () => { cancelled = true; clearTimeout(t) }
  }, [studentQuery, studentOpen])

  const selectedBed = beds.find(b => b.id === bedId) || null

  const canAssign = !!bedId && !!selectedStudent && !submitting

  const handleAssign = async (force: boolean) => {
    if (!bedId || !selectedStudent) return
    setSubmitting(true)
    setWarning(null)
    try {
      const r = await fetch('/api/hostel/assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bedId, studentId: selectedStudent.id, force, notes: notes.trim() || undefined }),
      })
      const json = await r.json()
      if (!r.ok) {
        if (r.status === 409 && (json.code === 'BED_OCCUPIED' || json.code === 'STUDENT_ALREADY_ASSIGNED' || json.code === 'GENDER_MISMATCH' || json.code === 'BED_MAINTENANCE' || json.code === 'ROOM_MAINTENANCE')) {
          setWarning({
            code: json.code,
            message: json.error || 'Conflict',
            details: json.currentOccupant || json.previousBed || null,
          })
          return
        }
        toast.error(json?.error || `Failed (${r.status})`)
        return
      }
      if (json.noOp) {
        toast.info(json.message || 'Student already assigned to this bed')
      } else {
        toast.success(`${selectedStudent.firstName} ${selectedStudent.lastName} assigned to ${selectedBed?.bedNumber || 'bed'}`)
      }
      onOpenChange(false)
      onAssigned?.()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to assign student')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!submitting) onOpenChange(o) }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-teal-500" /> Assign Student to Bed
          </DialogTitle>
          <DialogDescription>
            Select a hostel, room, and bed, then search for a student by name or admission number.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Step 1: Hostel */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">1. Select Hostel</Label>
            {loadingHostel ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select value={dormId || ''} onValueChange={setDormId}>
                <SelectTrigger><SelectValue placeholder="Choose a dormitory..." /></SelectTrigger>
                <SelectContent>
                  {dormitories.map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>
                      <span className="flex items-center gap-2">
                        <Home className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{d.name}</span>
                        <Badge variant="outline" className={cn('ml-1 text-[9px]', GENDER_BADGE[d.gender])}>{d.gender}</Badge>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Step 2: Room */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">2. Select Room</Label>
            <Select value={roomId || ''} onValueChange={setRoomId} disabled={!dormId}>
              <SelectTrigger><SelectValue placeholder={dormId ? 'Choose a room...' : 'Select a hostel first'} /></SelectTrigger>
              <SelectContent>
                {rooms.map((r: any) => (
                  <SelectItem key={r.id} value={r.id} disabled={r.status === 'Maintenance'}>
                    <span className="flex items-center gap-2">
                      <DoorOpen className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{r.roomNumber}</span>
                      <span className="text-[10px] text-muted-foreground">Floor {r.floor} · {r.occupied}/{r.capacity}</span>
                      {r.status !== 'Available' && (
                        <Badge variant="outline" className={cn('ml-1 text-[9px]', roomStatusBadge(r.status))}>{r.status}</Badge>
                      )}
                    </span>
                  </SelectItem>
                ))}
                {rooms.length === 0 && dormId && (
                  <p className="px-3 py-2 text-xs text-muted-foreground">No rooms in this dormitory.</p>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Step 3: Bed */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">3. Select Bed</Label>
            {!roomId ? (
              <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">Select a room to see its beds.</p>
            ) : loadingBeds ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : beds.length === 0 ? (
              <p className="rounded-md border border-dashed p-3 text-center text-xs text-muted-foreground">No beds configured for this room.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {beds.map((b) => {
                  const isSelected = b.id === bedId
                  return (
                    <button
                      key={b.id}
                      onClick={() => setBedId(b.id)}
                      disabled={b.status === 'Maintenance'}
                      className={cn(
                        'rounded-lg border p-2 text-left transition-all disabled:cursor-not-allowed disabled:opacity-50',
                        isSelected ? 'border-teal-500 bg-teal-50 ring-2 ring-teal-500/30 dark:bg-teal-950/30' : 'hover:border-teal-300',
                        b.status === 'Occupied' && !isSelected && 'border-amber-200 bg-amber-50/30 dark:border-amber-900/50 dark:bg-amber-950/10',
                        b.status === 'Maintenance' && 'border-rose-200 bg-rose-50/30 dark:border-rose-900/50 dark:bg-rose-950/10',
                        b.status === 'Available' && !isSelected && 'border-emerald-200 bg-emerald-50/30 dark:border-emerald-900/50 dark:bg-emerald-950/10',
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold">{b.bedNumber}</span>
                        <Bed className={cn('h-3 w-3',
                          b.status === 'Occupied' ? 'text-amber-500'
                          : b.status === 'Maintenance' ? 'text-rose-500'
                          : 'text-emerald-500',
                        )} />
                      </div>
                      <Badge variant="outline" className={cn('mt-1 text-[9px]', bedStatusBadge(b.status))}>{b.status}</Badge>
                      {b.student && (
                        <p className="mt-1 truncate text-[10px] text-muted-foreground">
                          {b.student.firstName} {b.student.lastName[0]}.
                        </p>
                      )}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {/* Selected bed info */}
          {selectedBed && (
            <div className="rounded-md border border-teal-200 bg-teal-50/50 p-3 text-xs dark:border-teal-900/50 dark:bg-teal-950/10">
              <div className="flex items-center gap-2">
                <Bed className="h-4 w-4 text-teal-500" />
                <span className="font-semibold">Selected: {selectedBed.bedNumber}</span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">Room {selectedBed.room.roomNumber}, {selectedBed.room.dormitory.name}</span>
              </div>
              {selectedBed.student && (
                <p className="mt-1 text-amber-700 dark:text-amber-400">
                  Currently occupied by {selectedBed.student.firstName} {selectedBed.student.lastName} ({selectedBed.student.admissionNo}) — reassigning will vacate them.
                </p>
              )}
            </div>
          )}

          {/* Step 4: Student search */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">4. Search & Select Student</Label>
            <Popover open={studentOpen} onOpenChange={setStudentOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className="w-full justify-start font-normal"
                  disabled={!bedId}
                >
                  {selectedStudent ? (
                    <span className="flex w-full items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className={cn('text-[10px] text-white', avatarColor(selectedStudent.id))}>
                          {initials(selectedStudent.firstName, selectedStudent.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{selectedStudent.firstName} {selectedStudent.lastName}</span>
                      <Badge variant="outline" className="text-[9px]">{selectedStudent.admissionNo}</Badge>
                      {selectedStudent.currentBed && (
                        <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400">
                          Current: {selectedStudent.currentBed.bedNumber}
                        </Badge>
                      )}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Search className="h-4 w-4" /> {bedId ? 'Search student by name or admission no...' : 'Select a bed first'}
                    </span>
                  )}
                  <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command shouldFilter={false}>
                  <CommandInput
                    placeholder="Type name or admission number..."
                    value={studentQuery}
                    onValueChange={setStudentQuery}
                  />
                  <CommandList>
                    {loadingStudents ? (
                      <div className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                      </div>
                    ) : studentResults.length === 0 ? (
                      studentQuery.trim()
                        ? <CommandEmpty>No students found. Try a different search.</CommandEmpty>
                        : <p className="px-3 py-6 text-center text-xs text-muted-foreground">Start typing to search students...</p>
                    ) : (
                      <CommandGroup heading="Students">
                        {studentResults.map((s) => (
                          <CommandItem
                            key={s.id}
                            value={s.id}
                            onSelect={() => { setSelectedStudent(s); setStudentOpen(false); setWarning(null) }}
                          >
                            <Avatar className="h-7 w-7">
                              <AvatarFallback className={cn('text-[10px] text-white', avatarColor(s.id))}>
                                {initials(s.firstName, s.lastName)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {s.firstName} {s.lastName}
                                <span className="ml-1.5 text-[10px] text-muted-foreground">{s.admissionNo}</span>
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {s.gender}
                                {s.currentEnrollment?.stream?.classLevel?.name ? ` · ${s.currentEnrollment.stream.classLevel.name}` : ''}
                                {s.currentBed ? ` · currently in ${s.currentBed.bedNumber} (${s.currentBed.room.roomNumber})` : ' · no bed'}
                              </p>
                            </div>
                            {s.currentBed && (
                              <Badge variant="outline" className="text-[9px] border-amber-300 text-amber-700 dark:border-amber-800 dark:text-amber-400">
                                Boarding
                              </Badge>
                            )}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes (optional) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-muted-foreground">Notes (optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Prefect room, medical ground floor, etc."
              className="min-h-[60px] resize-none text-sm"
            />
          </div>

          {/* Warning state */}
          {warning && (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-xs dark:border-amber-800 dark:bg-amber-950/30">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    {warning.code === 'BED_OCCUPIED' && 'Bed is already occupied'}
                    {warning.code === 'STUDENT_ALREADY_ASSIGNED' && 'Student already assigned elsewhere'}
                    {warning.code === 'GENDER_MISMATCH' && 'Gender mismatch'}
                    {warning.code === 'BED_MAINTENANCE' && 'Bed under maintenance'}
                    {warning.code === 'ROOM_MAINTENANCE' && 'Room under maintenance'}
                  </p>
                  <p className="mt-0.5 text-amber-700 dark:text-amber-400">{warning.message}</p>
                </div>
              </div>
              {(warning.code === 'BED_OCCUPIED' || warning.code === 'STUDENT_ALREADY_ASSIGNED') && (
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-amber-400 text-amber-700 hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
                    onClick={() => handleAssign(true)}
                    disabled={submitting}
                  >
                    {submitting ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1 h-3 w-3" />}
                    Confirm Reassign
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Cancel</Button>
          <Button
            onClick={() => handleAssign(false)}
            disabled={!canAssign || !!warning}
            className="bg-teal-600 hover:bg-teal-700"
          >
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
            Assign Student
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
