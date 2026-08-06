'use client'
import { useFetch, apiPost, apiPut, apiDelete } from '@/lib/api'
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
import { cn, avatarColor, initials, fullName, formatDateTime, timeAgo, statusColor } from '@/lib/format'
import { toast } from 'sonner'
import {
  DoorOpen, User, Phone, Car, Clock, LogIn, LogOut, Plus, Search, ChevronRight, X,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

const PURPOSE_COLORS: Record<string, string> = {
  'Parent Visit': '#10b981', 'Meeting': '#06b6d4', 'Delivery': '#f59e0b',
  'Official': '#8b5cf6', 'Contractor': '#ef4444', 'Other': '#64748b',
}

interface VisitorData {
  stats: { total: number; checkedIn: number; checkedOut: number; todayCount: number }
  visitors: Array<{
    id: string; visitorName: string; idNumber: string | null; phone: string | null
    purpose: string; personToSee: string | null; vehicleReg: string | null
    checkInTime: string; checkOutTime: string | null; status: string; notes: string | null
    recordedBy: string | null
  }>
  byPurpose: Array<{ name: string; count: number }>
}

export function VisitorsModule() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [purposeFilter, setPurposeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (purposeFilter !== 'all') params.set('purpose', purposeFilter)
  if (statusFilter !== 'all') params.set('status', statusFilter)
  const { data, loading } = useFetch<VisitorData>(`/api/visitors?${params.toString()}`, [refreshKey, search, purposeFilter, statusFilter])

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

  const d = data!
  const handleCheckout = async (id: string) => {
    try {
      await apiPut(`/api/visitors/${id}`, { checkOut: true })
      toast.success('Visitor checked out')
      setRefreshKey(k => k + 1)
    } catch (e: any) { toast.error('Failed to check out') }
  }

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-emerald-950 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-emerald-500/20 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <DoorOpen className="h-3 w-3" /> {d.stats.checkedIn} currently on premises · {d.stats.todayCount} arrived today
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Visitors & Gate</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">Track visitors, vehicles, and gate entries in real-time.</p>
          </div>
          <Button variant="secondary" size="sm" className="bg-white text-slate-800 hover:bg-white/90" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Visitor
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/20"><DoorOpen className="h-5 w-5" /></div>
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Total Visitors</p><p className="text-2xl font-bold">{d.stats.total}</p></div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"><LogIn className="h-5 w-5" /></div>
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Checked In</p><p className="text-2xl font-bold">{d.stats.checkedIn}</p></div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20"><LogOut className="h-5 w-5" /></div>
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Checked Out</p><p className="text-2xl font-bold">{d.stats.checkedOut}</p></div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20"><Clock className="h-5 w-5" /></div>
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Today</p><p className="text-2xl font-bold">{d.stats.todayCount}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, ID, phone, vehicle..." className="pl-9" />
          </div>
          <Select value={purposeFilter} onValueChange={setPurposeFilter}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Purpose" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Purposes</SelectItem>
              {Object.keys(PURPOSE_COLORS).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Checked In">Checked In</SelectItem>
              <SelectItem value="Checked Out">Checked Out</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Gate Register</CardTitle><CardDescription className="text-xs">{d.visitors.length} records</CardDescription></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">Visitor</TableHead>
                  <TableHead className="text-xs">Purpose</TableHead>
                  <TableHead className="text-xs">Person to See</TableHead>
                  <TableHead className="text-xs">Vehicle</TableHead>
                  <TableHead className="text-xs">Check In</TableHead>
                  <TableHead className="text-center text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.visitors.map(v => (
                  <TableRow key={v.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8"><AvatarFallback className={cn('text-[10px] font-semibold text-white', avatarColor(v.visitorName))}>{v.visitorName.split(' ').map(n => n[0]).join('').slice(0, 2)}</AvatarFallback></Avatar>
                        <div><p className="text-sm font-medium">{v.visitorName}</p>{v.idNumber && <p className="text-[10px] text-muted-foreground">ID: {v.idNumber}</p>}{v.phone && <p className="text-[10px] text-muted-foreground">{v.phone}</p>}</div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{v.purpose}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{v.personToSee || '—'}</TableCell>
                    <TableCell className="text-xs font-mono">{v.vehicleReg || '—'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{timeAgo(v.checkInTime)}</TableCell>
                    <TableCell className="text-center"><Badge variant="secondary" className={cn('text-[10px]', statusColor(v.status))}>{v.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      {v.status === 'Checked In' && (
                        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleCheckout(v.id)}><LogOut className="mr-1 h-3 w-3" /> Check Out</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {d.visitors.length === 0 && <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground"><DoorOpen className="h-8 w-8" /><p>No visitors match your filters.</p></div>}
        </CardContent>
      </Card>

      {showAddDialog && <AddVisitorDialog onClose={() => setShowAddDialog(false)} onCreated={() => setRefreshKey(k => k + 1)} userName={user?.name || 'Gate Officer'} />}
    </div>
  )
}

function AddVisitorDialog({ onClose, onCreated, userName }: { onClose: () => void; onCreated: () => void; userName: string }) {
  const [form, setForm] = useState({ visitorName: '', idNumber: '', phone: '', purpose: 'Parent Visit', personToSee: '', vehicleReg: '', notes: '' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.visitorName) { toast.error('Visitor name is required'); return }
    setSaving(true)
    try {
      await apiPost('/api/visitors', { ...form, vehicleReg: form.vehicleReg.toUpperCase() || null, recordedBy: userName })
      toast.success('Visitor checked in')
      onCreated(); onClose()
    } catch (e: any) { toast.error('Failed to check in visitor') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-slate-600" /> New Visitor Check-In</DialogTitle><DialogDescription>Register a visitor at the gate</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Visitor Name *</Label><Input value={form.visitorName} onChange={e => setForm({ ...form, visitorName: e.target.value })} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">ID Number</Label><Input value={form.idNumber} onChange={e => setForm({ ...form, idNumber: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Purpose</Label><Select value={form.purpose} onValueChange={v => setForm({ ...form, purpose: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(PURPOSE_COLORS).map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select></div>
            <div><Label className="text-xs">Person to See</Label><Input value={form.personToSee} onChange={e => setForm({ ...form, personToSee: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label className="text-xs">Vehicle Registration</Label><Input value={form.vehicleReg} onChange={e => setForm({ ...form, vehicleReg: e.target.value.toUpperCase() })} placeholder="e.g. KDA 123A" className="mt-1 font-mono" /></div>
          <div><Label className="text-xs">Recorded By</Label><Input value={userName} readOnly className="mt-1 bg-muted/40" /></div>
          <div className="flex justify-end gap-2 pt-2"><Button variant="outline" size="sm" onClick={onClose}>Cancel</Button><Button size="sm" onClick={handleSubmit} disabled={saving} className="bg-slate-700 hover:bg-slate-800">{saving ? 'Checking in...' : 'Check In Visitor'}</Button></div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
