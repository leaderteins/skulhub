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
  Fingerprint, Bus, Clock, Users, Activity, Cpu, Wifi, WifiOff, Plus, RefreshCw,
  UserCheck, MapPin, CheckCircle2, XCircle, Loader2
} from 'lucide-react'

interface Device {
  id: string
  name: string
  deviceType: string
  location: string | null
  status: string
  lastSeen: string | null
  secret?: string
}

interface BioLog {
  id: string
  personId: string
  personType: string
  action: string
  location: string | null
  gps: string | null
  verified: boolean
  timestamp: string
  deviceId: string | null
}

interface Student {
  id: string
  admissionNo: string
  firstName: string
  lastName: string
  gender: string
  status: string
}

const ACTION_META: Record<string, { label: string; color: string; icon: any }> = {
  check_in: { label: 'Checked In', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950', icon: UserCheck },
  check_out: { label: 'Checked Out', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950', icon: Clock },
  board_bus: { label: 'Boarded Bus', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950', icon: Bus },
  alight_bus: { label: 'Alighted Bus', color: 'text-violet-600 bg-violet-50 dark:bg-violet-950', icon: MapPin },
}

export function BiometricModule() {
  const [devices, setDevices] = useState<Device[]>([])
  const [logs, setLogs] = useState<BioLog[]>([])
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [addDeviceOpen, setAddDeviceOpen] = useState(false)
  const [simulatorOpen, setSimulatorOpen] = useState(false)
  const [enrollOpen, setEnrollOpen] = useState(false)
  const [newDevice, setNewDevice] = useState({ name: '', deviceType: 'fingerprint', location: '' })
  const [simTap, setSimTap] = useState({ personId: '', action: 'check_in', deviceId: '', location: 'Main Gate' })
  const [enrollStudent, setEnrollStudent] = useState({ personId: '', fingerIndex: '0' })
  const [busy, setBusy] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [devRes, logRes, stuRes] = await Promise.all([
        fetch('/api/biometric/devices').then(r => r.json()).catch(() => ({ devices: [] })),
        fetch('/api/biometric/logs?limit=30').then(r => r.json()).catch(() => ({ logs: [] })),
        fetch('/api/students').then(r => r.json()).catch(() => ({ students: [] })),
      ])
      setDevices(devRes.devices || [])
      setLogs(logRes.logs || [])
      setStudents(stuRes.students || [])
    } catch (e) {
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

  const todayLogs = logs.filter(l => {
    const d = new Date(l.timestamp)
    const now = new Date()
    return d.toDateString() === now.toDateString()
  })

  const checkedInNow = new Set(
    todayLogs
      .filter(l => l.action === 'check_in')
      .map(l => l.personId)
  )
  const checkedOutIds = new Set(
    todayLogs
      .filter(l => l.action === 'check_out')
      .map(l => l.personId)
  )
  const onCampusNow = [...checkedInNow].filter(id => !checkedOutIds.has(id)).length

  async function handleAddDevice() {
    if (!newDevice.name) { toast.error('Device name is required'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/biometric/devices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newDevice),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      toast.success('Device registered', { description: `${newDevice.name} is now active` })
      setAddDeviceOpen(false)
      setNewDevice({ name: '', deviceType: 'fingerprint', location: '' })
      fetchData()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleSimulateTap() {
    if (!simTap.personId) { toast.error('Select a student'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/biometric/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: simTap.personId,
          personType: 'student',
          action: simTap.action,
          location: simTap.location,
          deviceId: simTap.deviceId || undefined,
          verified: true,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      const stu = students.find(s => s.id === simTap.personId)
      const actionLabel = ACTION_META[simTap.action]?.label || simTap.action
      toast.success('Tap recorded', {
        description: `${stu?.firstName} ${stu?.lastName} — ${actionLabel} at ${simTap.location}`,
      })
      setSimulatorOpen(false)
      fetchData()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleEnroll() {
    if (!enrollStudent.personId) { toast.error('Select a student'); return }
    setBusy(true)
    try {
      const res = await fetch('/api/biometric/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personId: enrollStudent.personId,
          personType: 'student',
          fingerIndex: parseInt(enrollStudent.fingerIndex),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      const stu = students.find(s => s.id === enrollStudent.personId)
      toast.success('Fingerprint enrolled', {
        description: `${stu?.firstName} ${stu?.lastName} — Finger ${enrollStudent.fingerIndex} registered`,
      })
      setEnrollOpen(false)
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Fingerprint className="h-6 w-6 text-emerald-600" /> Biometric Attendance
          </h2>
          <p className="text-sm text-muted-foreground">
            Real-time fingerprint &amp; RFID taps from school gates and buses
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setEnrollOpen(true)}>
            <Fingerprint className="mr-1.5 h-4 w-4" /> Enroll
          </Button>
          <Button variant="outline" size="sm" onClick={() => setSimulatorOpen(true)}>
            <Cpu className="mr-1.5 h-4 w-4" /> Simulator
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setAddDeviceOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Device
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Check-ins" value={todayLogs.filter(l => l.action === 'check_in').length} icon={UserCheck} accent="emerald" sub="students tapped in" />
        <StatCard label="On Campus Now" value={onCampusNow} icon={Users} accent="teal" sub="checked in, not out" />
        <StatCard label="Active Devices" value={devices.filter(d => d.status === 'active').length} icon={Wifi} accent="cyan" sub={`of ${devices.length} registered`} />
        <StatCard label="Pending Enrollment" value={Math.max(0, students.length - new Set(logs.map(l => l.personId)).size)} icon={Fingerprint} accent="amber" sub="students without templates" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Live tap feed */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4 text-emerald-600" /> Live Tap Feed
              </CardTitle>
              <CardDescription className="text-xs">Real-time biometric events (updates every 5s)</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchData}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Fingerprint className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No taps yet. Use the Simulator to demo.</p>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {logs.map((log) => {
                    const stu = students.find(s => s.id === log.personId)
                    const meta = ACTION_META[log.action] || { label: log.action, color: 'text-gray-600 bg-gray-50', icon: Activity }
                    const Icon = meta.icon
                    return (
                      <div key={log.id} className="flex items-center gap-3 rounded-lg border p-2.5 hover:bg-muted/50">
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${meta.color}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">
                            {stu ? `${stu.firstName} ${stu.lastName}` : `Student ${log.personId.slice(-6)}`}
                          </p>
                          <p className="truncate text-xs text-muted-foreground">
                            {meta.label} · {log.location || 'Unknown location'}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-medium tabular-nums">
                            {new Date(log.timestamp).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </p>
                          {log.verified ? (
                            <Badge variant="outline" className="mt-0.5 border-emerald-300 bg-emerald-50/50 text-[10px] text-emerald-700">Verified</Badge>
                          ) : (
                            <Badge variant="outline" className="mt-0.5 border-rose-300 bg-rose-50/50 text-[10px] text-rose-700">Failed</Badge>
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

        {/* Devices panel */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Cpu className="h-4 w-4 text-emerald-600" /> Devices
            </CardTitle>
            <CardDescription className="text-xs">Registered biometric scanners</CardDescription>
          </CardHeader>
          <CardContent>
            {devices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Cpu className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No devices registered yet.</p>
                <Button size="sm" variant="outline" className="mt-3" onClick={() => setAddDeviceOpen(true)}>
                  <Plus className="mr-1.5 h-3.5 w-3.5" /> Register Device
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {devices.map((d) => {
                    const isActive = d.status === 'active'
                    return (
                      <div key={d.id} className="rounded-lg border p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{d.name}</p>
                            <p className="truncate text-xs text-muted-foreground">{d.location || 'No location set'}</p>
                          </div>
                          <Badge variant="outline" className={isActive ? 'border-emerald-300 bg-emerald-50/50 text-emerald-700' : 'border-muted bg-muted text-muted-foreground'}>
                            {isActive ? <Wifi className="mr-1 h-2.5 w-2.5" /> : <WifiOff className="mr-1 h-2.5 w-2.5" />}
                            {d.status}
                          </Badge>
                        </div>
                        <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                          <Badge variant="secondary" className="text-[10px]">{d.deviceType}</Badge>
                          {d.lastSeen && (
                            <span>Last seen {new Date(d.lastSeen).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true })}</span>
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

      {/* Today's attendance grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-emerald-600" /> Today's Attendance Grid
          </CardTitle>
          <CardDescription className="text-xs">Visual overview of who has checked in today</CardDescription>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students enrolled.</p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
              {students.slice(0, 48).map((s) => {
                const checkedIn = checkedInNow.has(s.id)
                const checkedOut = checkedOutIds.has(s.id)
                const color = checkedOut
                  ? 'border-amber-300 bg-amber-50 dark:bg-amber-950/30'
                  : checkedIn
                    ? 'border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30'
                    : 'border-muted bg-muted/30'
                return (
                  <div key={s.id} className={`rounded-lg border p-2 text-center ${color}`}>
                    <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-[10px] font-semibold text-white">
                      {s.firstName[0]}{s.lastName[0]}
                    </div>
                    <p className="truncate text-[10px] font-medium">{s.firstName} {s.lastName[0]}.</p>
                    <p className="text-[9px] text-muted-foreground">{s.admissionNo}</p>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Device Dialog */}
      <Dialog open={addDeviceOpen} onOpenChange={setAddDeviceOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Cpu className="h-5 w-5 text-emerald-600" /> Register Biometric Device</DialogTitle>
            <DialogDescription>Add a ZKTeco scanner, RFID reader, or bus tablet to the system.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="dev-name">Device Name</Label>
              <Input id="dev-name" placeholder="e.g. Main Gate Scanner" value={newDevice.name} onChange={(e) => setNewDevice({ ...newDevice, name: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Device Type</Label>
              <Select value={newDevice.deviceType} onValueChange={(v) => setNewDevice({ ...newDevice, deviceType: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="fingerprint">Fingerprint Scanner</SelectItem>
                  <SelectItem value="rfid">RFID Reader</SelectItem>
                  <SelectItem value="face">Facial Recognition</SelectItem>
                  <SelectItem value="tablet">Bus Tablet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dev-loc">Location</Label>
              <Input id="dev-loc" placeholder="e.g. Main Gate, Bus 3" value={newDevice.location} onChange={(e) => setNewDevice({ ...newDevice, location: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDeviceOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={busy} onClick={handleAddDevice}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Plus className="mr-1.5 h-4 w-4" />} Register
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Simulator Dialog */}
      <Dialog open={simulatorOpen} onOpenChange={setSimulatorOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Cpu className="h-5 w-5 text-emerald-600" /> Biometric Tap Simulator</DialogTitle>
            <DialogDescription>Simulate a fingerprint tap for demo purposes (no hardware needed).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Student</Label>
              <Select value={simTap.personId} onValueChange={(v) => setSimTap({ ...simTap, personId: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {students.slice(0, 100).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} · {s.admissionNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Action</Label>
                <Select value={simTap.action} onValueChange={(v) => setSimTap({ ...simTap, action: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="check_in">Check In</SelectItem>
                    <SelectItem value="check_out">Check Out</SelectItem>
                    <SelectItem value="board_bus">Board Bus</SelectItem>
                    <SelectItem value="alight_bus">Alight Bus</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Device</Label>
                <Select value={simTap.deviceId} onValueChange={(v) => setSimTap({ ...simTap, deviceId: v })}>
                  <SelectTrigger><SelectValue placeholder="Any device" /></SelectTrigger>
                  <SelectContent>
                    {devices.map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sim-loc">Location</Label>
              <Input id="sim-loc" value={simTap.location} onChange={(e) => setSimTap({ ...simTap, location: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSimulatorOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={busy} onClick={handleSimulateTap}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Fingerprint className="mr-1.5 h-4 w-4" />} Simulate Tap
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enroll Dialog */}
      <Dialog open={enrollOpen} onOpenChange={setEnrollOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Fingerprint className="h-5 w-5 text-emerald-600" /> Enroll Fingerprint</DialogTitle>
            <DialogDescription>Register a student's fingerprint template for biometric attendance.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Student</Label>
              <Select value={enrollStudent.personId} onValueChange={(v) => setEnrollStudent({ ...enrollStudent, personId: v })}>
                <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
                <SelectContent className="max-h-60">
                  {students.slice(0, 100).map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} · {s.admissionNo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Finger</Label>
              <Select value={enrollStudent.fingerIndex} onValueChange={(v) => setEnrollStudent({ ...enrollStudent, fingerIndex: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Right Thumb</SelectItem>
                  <SelectItem value="1">Right Index</SelectItem>
                  <SelectItem value="2">Right Middle</SelectItem>
                  <SelectItem value="3">Left Thumb</SelectItem>
                  <SelectItem value="4">Left Index</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnrollOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={busy} onClick={handleEnroll}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Fingerprint className="mr-1.5 h-4 w-4" />} Enroll
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
