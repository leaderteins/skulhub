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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatDate, formatDateTime } from '@/lib/format'
import { useAuthStore } from '@/lib/auth-store'
import { toast } from 'sonner'
import {
  Building2, DoorOpen, CalendarCheck, Clock, Plus, Search, MapPin, Users,
  CheckCircle2, XCircle, Loader2, FlaskConical, Trophy, GraduationCap, TreePalm,
  PartyPopper, X, CalendarDays,
} from 'lucide-react'

interface FacilitiesData {
  stats: {
    totalFacilities: number; availableFacilities: number; bookedToday: number
    pendingApprovals: number; approvedBookings: number; completedBookings: number
    rejectedBookings: number; totalBookings: number; totalCapacity: number
  }
  facilities: Array<{
    id: string; name: string; type: string; capacity: number; location: string | null
    status: string; bookingCount: number; upcomingBookings: number
    latestBooking: { id: string; status: string; startDate: string; endDate: string; bookedBy: string; purpose: string } | null
  }>
  bookings: Array<{
    id: string; facilityId: string
    facility: { id: string; name: string; type: string; location: string | null; capacity: number }
    bookedBy: string; purpose: string; startDate: string; endDate: string
    status: string; createdAt: string
  }>
  byType: Array<{ name: string; count: number }>
  byStatus: Array<{ name: string; count: number }>
}

const TYPE_META: Record<string, { color: string; bg: string; icon: any }> = {
  Hall: { color: '#0d9488', bg: 'bg-teal-500/10 text-teal-600', icon: PartyPopper },
  Ground: { color: '#f59e0b', bg: 'bg-amber-500/10 text-amber-600', icon: Trophy },
  Lab: { color: '#8b5cf6', bg: 'bg-violet-500/10 text-violet-600', icon: FlaskConical },
  Classroom: { color: '#06b6d4', bg: 'bg-cyan-500/10 text-cyan-600', icon: GraduationCap },
  Field: { color: '#10b981', bg: 'bg-emerald-500/10 text-emerald-600', icon: TreePalm },
}

const FACILITY_STATUS_BADGE: Record<string, string> = {
  Available: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  Booked: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  Maintenance: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
  Reserved: 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-400',
}

const BOOKING_STATUS_BADGE: Record<string, string> = {
  Pending: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  Approved: 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-400',
  Rejected: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
  Completed: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
}

export function FacilitiesModule() {
  const { user } = useAuthStore()
  const { data, loading, refetch } = useFetch<FacilitiesData>('/api/facilities')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all')
  const [showBookingDialog, setShowBookingDialog] = useState(false)
  const [showFacilityDialog, setShowFacilityDialog] = useState(false)
  const [presetFacilityId, setPresetFacilityId] = useState<string | undefined>(undefined)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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

  const stats = data!.stats

  const filteredFacilities = data!.facilities.filter(f => {
    if (typeFilter !== 'all' && f.type !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!f.name.toLowerCase().includes(q) && !(f.location || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const filteredBookings = data!.bookings.filter(b => {
    if (bookingStatusFilter !== 'all' && b.status !== bookingStatusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!b.facility.name.toLowerCase().includes(q) &&
          !b.purpose.toLowerCase().includes(q) &&
          !b.bookedBy.toLowerCase().includes(q)) return false
    }
    return true
  })

  const openBooking = (facilityId?: string) => {
    setPresetFacilityId(facilityId)
    setShowBookingDialog(true)
  }

  const handleBookingStatus = async (id: string, facilityName: string, status: string) => {
    setActionLoading(id + status)
    try {
      await apiPut('/api/facilities', { id, status })
      toast.success(`Booking for ${facilityName} ${status.toLowerCase()}`)
      refetch()
    } catch (e: any) {
      toast.error(e.message || 'Failed to update booking')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header banner — teal gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-cyan-600 to-teal-700 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Building2 className="h-3 w-3" /> {stats.totalFacilities} facilities · {stats.availableFacilities} available · {stats.bookedToday} booked today
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Facility Booking</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Reserve halls, labs, grounds and classrooms. Approve requests and avoid scheduling conflicts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/15 text-white backdrop-blur hover:bg-white/25"
              onClick={() => setShowFacilityDialog(true)}
            >
              <Plus className="mr-1 h-4 w-4" /> Add Facility
            </Button>
            <Button
              size="sm"
              className="bg-white text-teal-700 hover:bg-white/90"
              onClick={() => openBooking()}
            >
              <CalendarCheck className="mr-1 h-4 w-4" /> New Booking
            </Button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Facilities</p>
              <p className="text-2xl font-bold">{stats.totalFacilities}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <DoorOpen className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Available</p>
              <p className="text-2xl font-bold">{stats.availableFacilities}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Booked Today</p>
              <p className="text-2xl font-bold">{stats.bookedToday}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending Approvals</p>
              <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search facility, purpose, booker..." className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {Object.keys(TYPE_META).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={bookingStatusFilter} onValueChange={setBookingStatusFilter}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Booking status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Bookings</SelectItem>
              {Object.keys(BOOKING_STATUS_BADGE).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Facility cards grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">Facilities</h3>
          <span className="text-xs text-muted-foreground">{filteredFacilities.length} shown</span>
        </div>
        {filteredFacilities.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
            <Building2 className="h-8 w-8" />
            <p>No facilities found. Add your first facility.</p>
            <Button variant="outline" size="sm" className="mt-1 h-7 text-xs" onClick={() => setShowFacilityDialog(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Add Facility
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredFacilities.map(f => {
              const meta = TYPE_META[f.type] || TYPE_META.Hall
              const Icon = meta.icon
              return (
                <Card key={f.id} className="stat-card group flex flex-col overflow-hidden transition-all hover:shadow-md">
                  <CardContent className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className={cn('flex h-11 w-11 items-center justify-center rounded-xl ring-1', meta.bg, 'ring-current/10')}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className={cn('text-[10px]', FACILITY_STATUS_BADGE[f.status] || 'border-slate-300 bg-slate-50 text-slate-700')}>
                        {f.status}
                      </Badge>
                    </div>
                    <div className="mt-3 min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{f.name}</p>
                      <p className="text-[11px] text-muted-foreground">{f.type}</p>
                    </div>
                    <div className="mt-3 space-y-1.5 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3 w-3" /> Capacity: <span className="font-medium text-foreground">{f.capacity}</span>
                      </div>
                      {f.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" /> {f.location}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <CalendarCheck className="h-3 w-3" /> {f.bookingCount} total bookings
                        {f.upcomingBookings > 0 && (
                          <Badge variant="outline" className="ml-1 border-amber-300 bg-amber-50 px-1.5 text-[9px] text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
                            {f.upcomingBookings} upcoming
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="mt-4 w-full bg-teal-600 hover:bg-teal-700"
                      onClick={() => openBooking(f.id)}
                      disabled={f.status === 'Maintenance'}
                    >
                      <CalendarCheck className="mr-1 h-3.5 w-3.5" /> Book Facility
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Bookings table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Bookings</CardTitle>
              <CardDescription className="text-xs">{filteredBookings.length} bookings · latest first</CardDescription>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => openBooking()}>
              <Plus className="mr-1 h-3.5 w-3.5" /> New
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">Facility</TableHead>
                  <TableHead className="text-xs">Booked By</TableHead>
                  <TableHead className="text-xs">Purpose</TableHead>
                  <TableHead className="text-xs">Start</TableHead>
                  <TableHead className="text-xs">End</TableHead>
                  <TableHead className="text-center text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map(b => {
                  const meta = TYPE_META[b.facility.type] || TYPE_META.Hall
                  const Icon = meta.icon
                  return (
                    <TableRow key={b.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', meta.bg)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">{b.facility.name}</p>
                            <p className="text-[10px] text-muted-foreground">{b.facility.type}{b.facility.location ? ` · ${b.facility.location}` : ''}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">{b.bookedBy}</TableCell>
                      <TableCell className="max-w-[220px]">
                        <p className="truncate text-xs">{b.purpose}</p>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDateTime(b.startDate)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDateTime(b.endDate)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn('text-[10px]', BOOKING_STATUS_BADGE[b.status])}>{b.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {b.status === 'Pending' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 border-teal-300 bg-teal-50 px-2 text-[11px] text-teal-700 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-400"
                                disabled={actionLoading === b.id + 'Approved'}
                                onClick={() => handleBookingStatus(b.id, b.facility.name, 'Approved')}
                              >
                                {actionLoading === b.id + 'Approved' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                                <span className="ml-1">Approve</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-[11px] text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950"
                                disabled={actionLoading === b.id + 'Rejected'}
                                onClick={() => handleBookingStatus(b.id, b.facility.name, 'Rejected')}
                              >
                                {actionLoading === b.id + 'Rejected' ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                                <span className="ml-1">Reject</span>
                              </Button>
                            </>
                          )}
                          {b.status === 'Approved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 border-emerald-300 bg-emerald-50 px-2 text-[11px] text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                              disabled={actionLoading === b.id + 'Completed'}
                              onClick={() => handleBookingStatus(b.id, b.facility.name, 'Completed')}
                            >
                              {actionLoading === b.id + 'Completed' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                              <span className="ml-1">Complete</span>
                            </Button>
                          )}
                          {(b.status === 'Rejected' || b.status === 'Completed') && (
                            <span className="text-[10px] text-muted-foreground">—</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          {filteredBookings.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <CalendarDays className="h-8 w-8" />
              <p>No bookings match your filters.</p>
              <Button variant="outline" size="sm" className="mt-1 h-7 text-xs" onClick={() => openBooking()}>
                <Plus className="mr-1 h-3.5 w-3.5" /> New Booking
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New booking dialog */}
      {showBookingDialog && (
        <NewBookingDialog
          facilities={data!.facilities}
          bookedBy={user?.name || 'Admin'}
          presetFacilityId={presetFacilityId}
          onClose={() => { setShowBookingDialog(false); setPresetFacilityId(undefined) }}
          onCreated={() => { setShowBookingDialog(false); setPresetFacilityId(undefined); refetch() }}
        />
      )}

      {/* Add facility dialog */}
      {showFacilityDialog && (
        <AddFacilityDialog
          onClose={() => setShowFacilityDialog(false)}
          onCreated={() => { setShowFacilityDialog(false); refetch() }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// New Booking Dialog
// ---------------------------------------------------------------------------
function NewBookingDialog({
  facilities, bookedBy, presetFacilityId, onClose, onCreated,
}: {
  facilities: FacilitiesData['facilities']
  bookedBy: string
  presetFacilityId?: string
  onClose: () => void
  onCreated: () => void
}) {
  const [facilityId, setFacilityId] = useState(presetFacilityId || '')
  const [purpose, setPurpose] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!facilityId) { toast.error('Please select a facility'); return }
    if (!purpose.trim()) { toast.error('Purpose is required'); return }
    if (!startDate || !endDate) { toast.error('Start and end dates are required'); return }
    if (new Date(endDate) < new Date(startDate)) { toast.error('End date must be after start date'); return }
    setSaving(true)
    try {
      await apiPost('/api/facilities', {
        type: 'booking',
        facilityId,
        purpose: purpose.trim(),
        startDate,
        endDate,
        bookedBy,
      })
      toast.success('Booking request submitted')
      onCreated()
    } catch (e: any) {
      toast.error(e.message || 'Failed to create booking')
    } finally {
      setSaving(false)
    }
  }

  // Default datetimes: next hour, +2 hours
  const now = new Date()
  const defaultStart = new Date(now.getTime() + 60 * 60 * 1000)
  defaultStart.setMinutes(0, 0, 0)
  const defaultEnd = new Date(defaultStart.getTime() + 2 * 60 * 60 * 1000)
  const toLocalInput = (d: Date) => {
    const tzOffset = d.getTimezoneOffset() * 60000
    return new Date(d.getTime() - tzOffset).toISOString().slice(0, 16)
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarCheck className="h-5 w-5 text-teal-500" /> New Booking
          </DialogTitle>
          <DialogDescription>Reserve a facility. Overlapping bookings are blocked.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Facility *</Label>
            <Select value={facilityId} onValueChange={setFacilityId}>
              <SelectTrigger><SelectValue placeholder="Select facility..." /></SelectTrigger>
              <SelectContent>
                {facilities.map(f => (
                  <SelectItem key={f.id} value={f.id} disabled={f.status === 'Maintenance'}>
                    {f.name} · {f.type} {f.status === 'Maintenance' ? '(Maintenance)' : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {facilities.length === 0 && (
              <p className="text-[11px] text-rose-600">No facilities available. Add one first.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Purpose *</Label>
            <Textarea value={purpose} onChange={e => setPurpose(e.target.value)} placeholder="e.g. Inter-house athletics, KCSE practical exam, Staff meeting..." rows={2} />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Start Date & Time *</Label>
              <Input
                type="datetime-local"
                value={startDate || toLocalInput(defaultStart)}
                onChange={e => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">End Date & Time *</Label>
              <Input
                type="datetime-local"
                value={endDate || toLocalInput(defaultEnd)}
                onChange={e => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="rounded-xl border border-teal-200 bg-teal-50 px-4 py-2.5 text-xs text-teal-800 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300">
            <CalendarDays className="mr-1 inline h-3.5 w-3.5" />
            Bookings are created with <strong>Pending</strong> status and require admin approval.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
            Request Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Add Facility Dialog
// ---------------------------------------------------------------------------
function AddFacilityDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('Hall')
  const [capacity, setCapacity] = useState('50')
  const [location, setLocation] = useState('')
  const [status, setStatus] = useState('Available')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Facility name is required'); return }
    setSaving(true)
    try {
      await apiPost('/api/facilities', {
        type: 'facility',
        name: name.trim(),
        facilityType: type,
        capacity: Number(capacity) || 50,
        location: location.trim() || null,
        status,
      })
      toast.success('Facility added')
      onCreated()
    } catch (e: any) {
      toast.error(e.message || 'Failed to add facility')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-teal-500" /> Add Facility
          </DialogTitle>
          <DialogDescription>Register a new bookable facility.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Facility Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Main Assembly Hall" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(TYPE_META).map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Capacity</Label>
              <Input type="number" min={1} value={capacity} onChange={e => setCapacity(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Location</Label>
            <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Block A, Ground Floor" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(FACILITY_STATUS_BADGE).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
            Add Facility
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
