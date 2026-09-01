'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  Bus, MapPin, Clock, Users, Navigation, Play, Square, UserCheck,
  Plus, Loader2, Route, Phone, CheckCircle2
} from 'lucide-react'

interface Trip {
  id: string
  routeId: string | null
  vehicleId: string | null
  driverId: string | null
  direction: string
  status: string
  departureAt: string | null
  arrivalAt: string | null
  boardingCount: number
  boardings?: Boarding[]
}

interface Boarding {
  id: string
  studentId: string
  action: string
  stopName: string | null
  gps: string | null
  timestamp: string
}

interface Student {
  id: string
  admissionNo: string
  firstName: string
  lastName: string
  gender: string
}

interface Route {
  id: string
  name: string
  startPoint: string
  endPoint: string
}

interface Vehicle {
  id: string
  registration: string
  type: string
  capacity: number
}

export function BusTrackingModule() {
  const [trips, setTrips] = useState<Trip[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [routes, setRoutes] = useState<Route[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [selectedTrip, setSelectedTrip] = useState<string | null>(null)
  const [boardings, setBoardings] = useState<Boarding[]>([])
  const [loading, setLoading] = useState(true)
  const [newTripOpen, setNewTripOpen] = useState(false)
  const [simOpen, setSimOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [newTrip, setNewTrip] = useState({ routeId: '', vehicleId: '', direction: 'to_school' })
  const [simBoard, setSimBoard] = useState({ studentId: '', action: 'board', stopName: 'School Gate' })

  const fetchData = useCallback(async () => {
    try {
      const [tripRes, stuRes, transportRes] = await Promise.all([
        fetch('/api/transport/trips').then(r => r.json()).catch(() => ({ trips: [] })),
        fetch('/api/students').then(r => r.json()).catch(() => ({ students: [] })),
        fetch('/api/transport').then(r => r.json()).catch(() => ({ vehicles: [], routes: [] })),
      ])
      setTrips(tripRes.trips || [])
      setStudents(stuRes.students || [])
      setRoutes(transportRes.routes || [])
      setVehicles(transportRes.vehicles || [])
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 5000)
    return () => clearInterval(id)
  }, [fetchData])

  // Fetch boardings when selected trip changes
  useEffect(() => {
    if (!selectedTrip) {
      setBoardings([])
      return
    }
    let cancelled = false
    async function fetchBoardings() {
      try {
        const res = await fetch(`/api/transport/board?tripId=${selectedTrip}`)
        const data = await res.json()
        if (!cancelled) setBoardings(data.boardings || [])
      } catch {
        // silent
      }
    }
    fetchBoardings()
    const id = setInterval(fetchBoardings, 5000)
    return () => { cancelled = true; clearInterval(id) }
  }, [selectedTrip])

  const activeTrips = trips.filter(t => t.status === 'in_progress')
  const completedToday = trips.filter(t => t.status === 'completed').length
  const onBusesNow = boardings.filter(b => b.action === 'board').length

  async function handleStartTrip() {
    setBusy(true)
    try {
      const res = await fetch('/api/transport/trips', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routeId: newTrip.routeId || undefined,
          vehicleId: newTrip.vehicleId || undefined,
          direction: newTrip.direction,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Trip started', { description: `Direction: ${newTrip.direction === 'to_school' ? 'To School' : 'From School'}` })
      setNewTripOpen(false)
      setNewTrip({ routeId: '', vehicleId: '', direction: 'to_school' })
      fetchData()
      setSelectedTrip(data.trip.id)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleCompleteTrip(tripId: string) {
    setBusy(true)
    try {
      const res = await fetch(`/api/transport/trips?id=${tripId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Trip completed')
      fetchData()
      if (selectedTrip === tripId) setSelectedTrip(null)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSimBoard() {
    if (!selectedTrip) { toast.error('Select a trip first'); return }
    if (!simBoard.studentId) { toast.error('Select a student'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/transport/board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId: selectedTrip,
          studentId: simBoard.studentId,
          action: simBoard.action,
          stopName: simBoard.stopName,
          gps: '-1.2864,36.8172', // demo GPS coordinates (Nairobi)
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      const stu = students.find(s => s.id === simBoard.studentId)
      toast.success(simBoard.action === 'board' ? 'Boarded' : 'Alighted', {
        description: `${stu?.firstName} ${stu?.lastName} — ${simBoard.stopName}`,
      })
      setSimOpen(false)
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  const selectedTripObj = trips.find(t => t.id === selectedTrip)
  const boardedStudents = boardings.filter(b => b.action === 'board').map(b => b.studentId)
  const alightedStudents = boardings.filter(b => b.action === 'alight').map(b => b.studentId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Navigation className="h-6 w-6 text-emerald-600" /> Live Bus Tracking
          </h2>
          <p className="text-sm text-muted-foreground">
            Real-time student boarding &amp; alighting with parent notifications
          </p>
        </div>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setNewTripOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" /> Start New Trip
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Trips" value={activeTrips.length} icon={Navigation} accent="emerald" sub="buses currently running" />
        <StatCard label="Students On Buses" value={onBusesNow} icon={Users} accent="teal" sub="boarded, not alighted" />
        <StatCard label="Completed Today" value={completedToday} icon={CheckCircle2} accent="cyan" sub="trips finished" />
        <StatCard label="Total Boardings" value={boardings.filter(b => b.action === 'board').length} icon={UserCheck} accent="amber" sub="for selected trip" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Active trips list */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bus className="h-4 w-4 text-emerald-600" /> Active Trips
            </CardTitle>
            <CardDescription className="text-xs">Tap to view boarding manifest</CardDescription>
          </CardHeader>
          <CardContent>
            {activeTrips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Bus className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No active trips.</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setNewTripOpen(true)}>
                  <Play className="mr-1.5 h-3.5 w-3.5" /> Start Trip
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {activeTrips.map((t) => {
                    const isSelected = selectedTrip === t.id
                    const route = routes.find(r => r.id === t.routeId)
                    const vehicle = vehicles.find(v => v.id === t.vehicleId)
                    return (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTrip(t.id)}
                        className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${isSelected ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20' : ''}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {route?.name || `Trip ${t.id.slice(-6)}`}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">
                              {vehicle?.registration || 'Unassigned'} · {t.direction === 'to_school' ? 'To School' : 'From School'}
                            </p>
                          </div>
                          <Badge variant="outline" className="border-emerald-300 bg-emerald-50/50 text-emerald-700">
                            <span className="mr-1 flex h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                            Live
                          </Badge>
                        </div>
                        <div className="mt-1.5 flex items-center justify-between text-[10px] text-muted-foreground">
                          <span>{t.boardingCount} boarded</span>
                          {t.departureAt && (
                            <span>Departed {new Date(t.departureAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>

        {/* Selected trip boarding manifest */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <UserCheck className="h-4 w-4 text-emerald-600" /> Boarding Manifest
              </CardTitle>
              <CardDescription className="text-xs">
                {selectedTripObj ? `${selectedTripObj.direction === 'to_school' ? 'To School' : 'From School'} · updates every 5s` : 'Select a trip to view manifest'}
              </CardDescription>
            </div>
            {selectedTripObj && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setSimOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Log Event
                </Button>
                <Button variant="outline" size="sm" className="text-rose-600 hover:bg-rose-50" onClick={() => handleCompleteTrip(selectedTripObj.id)} disabled={busy}>
                  <Square className="mr-1.5 h-3.5 w-3.5" /> Complete
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent>
            {!selectedTripObj ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Bus className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Select an active trip to view its boarding manifest</p>
              </div>
            ) : boardings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <UserCheck className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No boardings logged yet. Use "Log Event" to simulate.</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {boardings.map((b) => {
                    const stu = students.find(s => s.id === b.studentId)
                    const isBoard = b.action === 'board'
                    return (
                      <div key={b.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isBoard ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950' : 'bg-violet-50 text-violet-600 dark:bg-violet-950'}`}>
                          {isBoard ? <UserCheck className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {stu ? `${stu.firstName} ${stu.lastName}` : `Student ${b.studentId.slice(-6)}`}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {isBoard ? 'Boarded' : 'Alighted'} · {b.stopName || 'Unknown stop'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium tabular-nums">
                            {new Date(b.timestamp).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                          {b.gps && (
                            <Badge variant="outline" className="mt-0.5 text-[10px]">
                              <MapPin className="mr-1 h-2.5 w-2.5" /> GPS
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Parent notifications preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Phone className="h-4 w-4 text-emerald-600" /> Parent Notifications Preview
          </CardTitle>
          <CardDescription className="text-xs">What parents see in real-time (SMS/WhatsApp)</CardDescription>
        </CardHeader>
        <CardContent>
          {boardings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No notifications to show yet.</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {boardings.slice(0, 6).map((b) => {
                const stu = students.find(s => s.id === b.studentId)
                if (!stu) return null
                const isBoard = b.action === 'board'
                return (
                  <div key={b.id} className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-3 dark:border-emerald-900 dark:from-emerald-950/30 dark:to-teal-950/30">
                    <div className="flex items-start gap-2">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white">
                        {isBoard ? <UserCheck className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">
                          {stu.firstName} {stu.lastName}
                        </p>
                        <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                          {isBoard ? 'boarded' : 'alighted'} the bus
                        </p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {new Date(b.timestamp).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true })} · {b.stopName || 'School Gate'}
                        </p>
                      </div>
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Trip Dialog */}
      <Dialog open={newTripOpen} onOpenChange={setNewTripOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Navigation className="h-5 w-5 text-emerald-600" /> Start New Bus Trip</DialogTitle>
            <DialogDescription>Begin a new bus trip for tracking student boarding.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Route</Label>
              <Select value={newTrip.routeId} onValueChange={(v) => setNewTrip({ ...newTrip, routeId: v })}>
                <SelectTrigger><SelectValue placeholder="Select route" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {routes.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">No routes configured</div>
                  ) : routes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Vehicle</Label>
              <Select value={newTrip.vehicleId} onValueChange={(v) => setNewTrip({ ...newTrip, vehicleId: v })}>
                <SelectTrigger><SelectValue placeholder="Select vehicle" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {vehicles.length === 0 ? (
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">No vehicles configured</div>
                  ) : vehicles.map((v) => (
                    <SelectItem key={v.id} value={v.id}>{v.registration} · {v.type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Direction</Label>
              <Select value={newTrip.direction} onValueChange={(v) => setNewTrip({ ...newTrip, direction: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="to_school">To School (Morning)</SelectItem>
                  <SelectItem value="from_school">From School (Evening)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewTripOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={busy} onClick={handleStartTrip}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Play className="mr-1.5 h-4 w-4" />} Start Trip
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Boarding Simulator Dialog */}
      <Dialog open={simOpen} onOpenChange={setSimOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5 text-emerald-600" /> Log Boarding Event</DialogTitle>
            <DialogDescription>Simulate a student boarding or alighting the bus.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Student</Label>
              <Select value={simBoard.studentId} onValueChange={(v) => setSimBoard({ ...simBoard, studentId: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {students.slice(0, 100).map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} · {s.admissionNo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Action</Label>
                <Select value={simBoard.action} onValueChange={(v) => setSimBoard({ ...simBoard, action: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="board">Board Bus</SelectItem>
                    <SelectItem value="alight">Alight Bus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="stop">Stop Name</Label>
                <Input id="stop" value={simBoard.stopName} onChange={(e) => setSimBoard({ ...simBoard, stopName: e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSimOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={busy} onClick={handleSimBoard}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <UserCheck className="mr-1.5 h-4 w-4" />} Log Event
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent, sub }: {
  label: string
  value: number
  icon: any
  accent: 'emerald' | 'teal' | 'cyan' | 'amber'
  sub: string
}) {
  const accentClasses = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400',
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
  }
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${accentClasses[accent]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
