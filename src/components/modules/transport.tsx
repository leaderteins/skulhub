'use client'
import { useEffect, useState } from 'react'
import { useFetch, apiPost, apiPut, apiDelete } from '@/lib/api'
import {
  cn,
  formatKES,
  formatNumber,
  fullName,
  initials,
  avatarColor,
  statusColor,
} from '@/lib/format'
import { StatCard, SectionHeader, EmptyState } from '@/components/shared'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  Bus,
  Route as RouteIcon,
  Users,
  Wrench,
  Plus,
  Phone,
  MapPin,
  ArrowRight,
  Gauge,
  Trash2,
  Save,
  CircleDot,
  Calendar,
  IdCard,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface RouteBrief {
  id: string
  name: string
  startPoint: string
  endPoint: string
  distanceKm: number
  fare: number
}
interface Vehicle {
  id: string
  registration: string
  type: string
  capacity: number
  make: string | null
  model: string | null
  year: number | null
  status: string
  assignedRouteId: string | null
  route: RouteBrief | null
}
interface Driver {
  id: string
  firstName: string
  lastName: string
  phone: string | null
  employeeNo: string
  status: string
}
interface TransportRoute {
  id: string
  name: string
  startPoint: string
  endPoint: string
  stops: string | null
  distanceKm: number
  fare: number
  vehicleId: string | null
  driverId: string | null
  vehicle: { id: string; registration: string; type: string; capacity: number } | null
  driver: Driver | null
}
interface TransportData {
  vehicles: Vehicle[]
  routes: TransportRoute[]
  drivers: Driver[]
  summary: {
    totalVehicles: number
    active: number
    maintenance: number
    totalCapacity: number
    totalRoutes: number
  }
}

const VEHICLE_TYPES = ['Bus', 'Van', 'Saloon Car']
const VEHICLE_STATUSES = ['Active', 'Maintenance', 'Inactive']

const VEHICLE_TYPE_VARIANT: Record<string, string> = {
  Bus: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Van: 'bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400',
  'Saloon Car': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
}

const VEHICLE_TYPE_ICON: Record<string, typeof Bus> = {
  Bus: Bus,
  Van: Bus,
  'Saloon Car': Bus,
}

// ---------------------------------------------------------------------------
// Module
// ---------------------------------------------------------------------------
export function TransportModule() {
  const { data, loading, refetch } = useFetch<TransportData>('/api/transport')

  const [vehicleDialogOpen, setVehicleDialogOpen] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null)
  const [routeDialogOpen, setRouteDialogOpen] = useState(false)
  const [deleteVehicleId, setDeleteVehicleId] = useState<string | null>(null)

  if (loading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  const { vehicles, routes, drivers, summary } = data

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Transport Management"
        description="Manage school vehicles, routes, drivers and assignments"
        icon={Bus}
        action={
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRouteDialogOpen(true)}
            >
              <RouteIcon className="mr-1.5 h-4 w-4" /> Add Route
            </Button>
            <Button size="sm" onClick={() => { setEditingVehicle(null); setVehicleDialogOpen(true) }}>
              <Plus className="mr-1.5 h-4 w-4" /> Add Vehicle
            </Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Vehicles"
          value={summary.totalVehicles}
          icon={Bus}
          accent="emerald"
          footer={<span className="text-muted-foreground">{summary.active} active</span>}
        />
        <StatCard
          label="Active Routes"
          value={summary.totalRoutes}
          icon={RouteIcon}
          accent="teal"
          footer={<span className="text-muted-foreground">across fleet</span>}
        />
        <StatCard
          label="Total Capacity"
          value={formatNumber(summary.totalCapacity)}
          icon={Users}
          accent="cyan"
          footer={<span className="text-muted-foreground">seats available</span>}
        />
        <StatCard
          label="In Maintenance"
          value={summary.maintenance}
          icon={Wrench}
          accent="amber"
          footer={<span className="text-muted-foreground">off the road</span>}
        />
      </div>

      {/* Vehicles grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold tracking-tight">Vehicles</h3>
          <span className="text-xs text-muted-foreground">{vehicles.length} registered</span>
        </div>
        {vehicles.length === 0 ? (
          <EmptyState
            icon={Bus}
            title="No vehicles registered"
            description="Add your first school vehicle to get started."
            action={
              <Button size="sm" onClick={() => { setEditingVehicle(null); setVehicleDialogOpen(true) }}>
                <Plus className="mr-1.5 h-4 w-4" /> Add Vehicle
              </Button>
            }
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {vehicles.map((v) => {
              const Icon = VEHICLE_TYPE_ICON[v.type] || Bus
              return (
                <Card
                  key={v.id}
                  className="group cursor-pointer overflow-hidden transition-all hover:shadow-md hover:ring-1 hover:ring-emerald-500/30"
                  onClick={() => { setEditingVehicle(v); setVehicleDialogOpen(true) }}
                >
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-mono text-base font-bold tracking-tight">
                            {v.registration}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="outline" className={cn('h-5 px-1.5 text-[10px] font-semibold', VEHICLE_TYPE_VARIANT[v.type])}>
                              {v.type}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Badge className={cn('h-5 px-1.5 text-[10px] font-semibold', statusColor(v.status))}>
                        {v.status}
                      </Badge>
                    </div>

                    {/* Body */}
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Make / Model</span>
                        <span className="font-medium">
                          {[v.make, v.model].filter(Boolean).join(' ') || '—'}
                          {v.year ? ` · ${v.year}` : ''}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Capacity</span>
                        <span className="font-medium">{v.capacity} seats</span>
                      </div>
                      <Separator className="my-1" />
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <RouteIcon className="h-3.5 w-3.5" /> Route
                        </span>
                        {v.route ? (
                          <span className="truncate text-right font-medium text-emerald-600 dark:text-emerald-400">
                            {v.route.name}
                          </span>
                        ) : (
                          <span className="text-xs italic text-muted-foreground">Unassigned</span>
                        )}
                      </div>
                    </div>

                    {/* Footer hint */}
                    <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <CircleDot className="h-3 w-3" /> Click to manage
                      </span>
                      <span className="opacity-0 transition-opacity group-hover:opacity-100">
                        Edit →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Routes section */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold tracking-tight">Transport Routes</h3>
            <p className="text-xs text-muted-foreground">Pick-up and drop-off routes assigned to vehicles and drivers</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setRouteDialogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add Route
          </Button>
        </div>
        {routes.length === 0 ? (
          <EmptyState
            icon={RouteIcon}
            title="No routes defined"
            description="Create your first transport route."
            action={
              <Button size="sm" onClick={() => setRouteDialogOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" /> Add Route
              </Button>
            }
          />
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <div className="grid grid-cols-1 gap-px bg-border md:grid-cols-2 lg:grid-cols-3">
              {routes.map((r) => (
                <div
                  key={r.id}
                  className="bg-background p-4 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold tracking-tight">{r.name}</p>
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">{r.startPoint}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span className="font-medium text-rose-600 dark:text-rose-400">{r.endPoint}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      {formatKES(r.fare)}
                    </Badge>
                  </div>

                  {r.stops && (
                    <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
                      Stops: {r.stops}
                    </p>
                  )}

                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      <Gauge className="h-3 w-3" /> {r.distanceKm} km
                    </span>
                    {r.vehicle ? (
                      <span className="inline-flex items-center gap-1 text-muted-foreground">
                        <Bus className="h-3 w-3" /> {r.vehicle.registration}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                        <Bus className="h-3 w-3" /> No vehicle
                      </span>
                    )}
                  </div>

                  {r.driver ? (
                    <div className="mt-3 flex items-center gap-2 border-t pt-3">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className={cn('text-[10px] font-semibold text-white', avatarColor(r.driver.id))}>
                          {initials(r.driver.firstName, r.driver.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium">
                          {fullName(r.driver)}
                        </p>
                        <p className="truncate text-[10px] text-muted-foreground">
                          {r.driver.phone || 'No phone'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-2 border-t pt-3 text-xs text-muted-foreground">
                      <Phone className="h-3 w-3" /> Driver not assigned
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Vehicle dialog (add/edit) */}
      <VehicleDialog
        open={vehicleDialogOpen}
        onOpenChange={setVehicleDialogOpen}
        vehicle={editingVehicle}
        routes={routes}
        onSaved={() => { refetch(); setVehicleDialogOpen(false) }}
        onDelete={(id) => { setDeleteVehicleId(id); setVehicleDialogOpen(false) }}
      />

      {/* Route dialog */}
      <RouteDialog
        open={routeDialogOpen}
        onOpenChange={setRouteDialogOpen}
        drivers={drivers}
        onSaved={() => { refetch(); setRouteDialogOpen(false) }}
      />

      {/* Delete confirm */}
      <AlertDialog
        open={!!deleteVehicleId}
        onOpenChange={(o) => !o && setDeleteVehicleId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this vehicle?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove the vehicle record. Any route currently assigned
              to this vehicle will be detached. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={async () => {
                if (!deleteVehicleId) return
                try {
                  await apiDelete(`/api/transport/${deleteVehicleId}`)
                  toast.success('Vehicle deleted')
                  setDeleteVehicleId(null)
                  refetch()
                } catch (e: unknown) {
                  toast.error(e instanceof Error ? e.message : 'Failed to delete vehicle')
                }
              }}
            >
              <Trash2 className="mr-1.5 h-4 w-4" /> Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Vehicle add/edit dialog
// ---------------------------------------------------------------------------
interface VehicleDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  vehicle: Vehicle | null
  routes: TransportRoute[]
  onSaved: () => void
  onDelete: (id: string) => void
}
function VehicleDialog({ open, onOpenChange, vehicle, routes, onSaved, onDelete }: VehicleDialogProps) {
  const isEdit = !!vehicle
  const [saving, setSaving] = useState(false)

  const [registration, setRegistration] = useState('')
  const [type, setType] = useState('Bus')
  const [capacity, setCapacity] = useState('30')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [year, setYear] = useState('')
  const [status, setStatus] = useState('Active')
  const [assignedRouteId, setAssignedRouteId] = useState('none')

  // Sync form when vehicle changes
  useEffect(() => {
    if (open) {
      setRegistration(vehicle?.registration || '')
      setType(vehicle?.type || 'Bus')
      setCapacity(String(vehicle?.capacity ?? 30))
      setMake(vehicle?.make || '')
      setModel(vehicle?.model || '')
      setYear(vehicle?.year ? String(vehicle.year) : '')
      setStatus(vehicle?.status || 'Active')
      setAssignedRouteId(vehicle?.assignedRouteId || 'none')
    }
  }, [open, vehicle])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!registration.trim()) {
      toast.error('Vehicle registration is required')
      return
    }
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        registration: registration.trim().toUpperCase(),
        type,
        capacity: Number(capacity) || 0,
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        year: year ? Number(year) : undefined,
        status,
        assignedRouteId: assignedRouteId === 'none' ? null : assignedRouteId,
      }
      if (isEdit && vehicle) {
        // Don't send undefined fields on update
        Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k])
        await apiPut(`/api/transport/${vehicle.id}`, payload)
        toast.success('Vehicle updated')
      } else {
        await apiPost('/api/transport', payload)
        toast.success('Vehicle added')
      }
      onSaved()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save vehicle')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Vehicle' : 'Register New Vehicle'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Update vehicle details, status, or assign a transport route.'
              : 'Add a new vehicle to the school transport fleet.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="v-reg">Registration Number *</Label>
              <Input
                id="v-reg"
                value={registration}
                onChange={(e) => setRegistration(e.target.value.toUpperCase())}
                placeholder="KDA 123A"
                className="font-mono"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger id="v-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VEHICLE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-cap">Capacity (seats)</Label>
              <Input
                id="v-cap"
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-make">Make</Label>
              <Input
                id="v-make"
                value={make}
                onChange={(e) => setMake(e.target.value)}
                placeholder="Toyota"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-model">Model</Label>
              <Input
                id="v-model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="Coaster"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-year">Year</Label>
              <Input
                id="v-year"
                type="number"
                min={1980}
                max={new Date().getFullYear() + 1}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2022"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="v-status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="v-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VEHICLE_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="v-route">Assigned Route</Label>
              <Select value={assignedRouteId} onValueChange={setAssignedRouteId}>
                <SelectTrigger id="v-route"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Unassigned —</SelectItem>
                  {routes.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name} ({r.startPoint} → {r.endPoint})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-between">
            <div>
              {isEdit && vehicle && (
                <Button
                  type="button"
                  variant="outline"
                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  onClick={() => onDelete(vehicle.id)}
                >
                  <Trash2 className="mr-1.5 h-4 w-4" /> Delete
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
                <Save className="mr-1.5 h-4 w-4" />
                {saving ? 'Saving...' : isEdit ? 'Save Changes' : 'Add Vehicle'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Route add dialog
// ---------------------------------------------------------------------------
interface RouteDialogProps {
  open: boolean
  onOpenChange: (o: boolean) => void
  drivers: Driver[]
  onSaved: () => void
}
function RouteDialog({ open, onOpenChange, drivers, onSaved }: RouteDialogProps) {
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState('')
  const [startPoint, setStartPoint] = useState('')
  const [endPoint, setEndPoint] = useState('')
  const [stops, setStops] = useState('')
  const [distanceKm, setDistanceKm] = useState('')
  const [fare, setFare] = useState('')
  const [driverId, setDriverId] = useState('none')

  useEffect(() => {
    if (open) {
      setName(''); setStartPoint(''); setEndPoint(''); setStops('')
      setDistanceKm(''); setFare(''); setDriverId('none')
    }
  }, [open])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !startPoint.trim() || !endPoint.trim()) {
      toast.error('Route name, start and end points are required')
      return
    }
    setSaving(true)
    try {
      await apiPost('/api/transport/routes', {
        name: name.trim(),
        startPoint: startPoint.trim(),
        endPoint: endPoint.trim(),
        stops: stops.trim() || undefined,
        distanceKm: Number(distanceKm) || 0,
        fare: Number(fare) || 0,
        driverId: driverId === 'none' ? null : driverId,
      })
      toast.success('Route created')
      onSaved()
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to create route')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Add Transport Route</DialogTitle>
          <DialogDescription>
            Define a new pick-up / drop-off route. You can assign a vehicle and driver later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="r-name">Route Name *</Label>
            <Input
              id="r-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Rongai Route"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-start">Start Point *</Label>
              <Input
                id="r-start"
                value={startPoint}
                onChange={(e) => setStartPoint(e.target.value)}
                placeholder="e.g. Ongata Rongai"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-end">End Point *</Label>
              <Input
                id="r-end"
                value={endPoint}
                onChange={(e) => setEndPoint(e.target.value)}
                placeholder="e.g. School Campus"
                required
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-stops">Stops (comma-separated)</Label>
            <Input
              id="r-stops"
              value={stops}
              onChange={(e) => setStops(e.target.value)}
              placeholder="e.g. Tuala, Kandizi, Maasai Lodge"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="r-dist">Distance (km)</Label>
              <Input
                id="r-dist"
                type="number"
                min={0}
                step="0.1"
                value={distanceKm}
                onChange={(e) => setDistanceKm(e.target.value)}
                placeholder="25.5"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="r-fare">Fare (KES)</Label>
              <Input
                id="r-fare"
                type="number"
                min={0}
                value={fare}
                onChange={(e) => setFare(e.target.value)}
                placeholder="1500"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="r-driver">Assign Driver</Label>
            <Select value={driverId} onValueChange={setDriverId}>
              <SelectTrigger id="r-driver"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— None —</SelectItem>
                {drivers.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {fullName(d)} · {d.employeeNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {drivers.length === 0 && (
              <p className="text-xs text-muted-foreground">
                Tip: Add staff with role &quot;Driver&quot; from the Staff module to assign drivers here.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="mr-1.5 h-4 w-4" />
              {saving ? 'Creating...' : 'Create Route'}
            </Button>
          </DialogFooter>
        </form>

        <div className="rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 font-medium text-foreground">
            <MapPin className="h-3.5 w-3.5" /> Quick info
          </div>
          <p className="mt-1">
            Routes can be linked to vehicles from the vehicle card. To track a driver,
            assign them here or later via the vehicle edit dialog.
          </p>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            <span className="inline-flex items-center gap-1"><IdCard className="h-3 w-3" /> Use clear names</span>
            <span className="inline-flex items-center gap-1"><Calendar className="h-3 w-3" /> Term-bound fares</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
