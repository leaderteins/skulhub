'use client'
import { useState } from 'react'
import { useFetch, apiPost, apiPut } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
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
import { cn, formatDate, timeAgo, statusColor } from '@/lib/format'
import { toast } from 'sonner'
import {
  PackagePlus, Plus, Search, ChevronRight, Clock, CheckCircle2, XCircle,
  AlertTriangle, Package, ChefHat, BookOpen, Beaker, Wrench, Trophy, FileText,
  Truck, X,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

const REQUEST_TYPES = [
  { type: 'Kitchen', label: 'Kitchen Supplies', icon: ChefHat, color: '#ef4444' },
  { type: 'Stationery', label: 'Stationery', icon: FileText, color: '#3b82f6' },
  { type: 'Cleaning', label: 'Cleaning Materials', icon: Package, color: '#10b981' },
  { type: 'Maintenance', label: 'Maintenance', icon: Wrench, color: '#8b5cf6' },
  { type: 'Lab', label: 'Lab Equipment', icon: Beaker, color: '#06b6d4' },
  { type: 'Sports', label: 'Sports Equipment', icon: Trophy, color: '#f59e0b' },
  { type: 'Other', label: 'Other', icon: Package, color: '#64748b' },
]

const URGENCY_META: Record<string, { color: string; bg: string; text: string; dot: string }> = {
  Low: { color: 'slate', bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', dot: '#64748b' },
  Normal: { color: 'emerald', bg: 'bg-emerald-100 dark:bg-emerald-950', text: 'text-emerald-600 dark:text-emerald-400', dot: '#10b981' },
  High: { color: 'amber', bg: 'bg-amber-100 dark:bg-amber-950', text: 'text-amber-600 dark:text-amber-400', dot: '#f59e0b' },
  Urgent: { color: 'rose', bg: 'bg-rose-100 dark:bg-rose-950', text: 'text-rose-600 dark:text-rose-400', dot: '#ef4444' },
}

const STATUS_BADGE: Record<string, string> = {
  Pending: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  Approved: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  Rejected: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
  Fulfilled: 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-400',
  'Partially Fulfilled': 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-400',
}

interface RequestData {
  stats: { total: number; pending: number; approved: number; fulfilled: number; rejected: number; urgent: number }
  requests: Array<{
    id: string; requestNo: string; requestType: string; itemName: string; description: string | null
    quantity: number; unit: string; urgency: string; requestedBy: string; requesterRole: string
    department: string | null; status: string; approvedBy: string | null; approvedAt: string | null
    fulfilledBy: string | null; fulfilledAt: string | null; fulfilledQty: number
    rejectionReason: string | null; notes: string | null; createdAt: string
  }>
  byType: Array<{ name: string; count: number }>
  byDepartment: Array<{ name: string; count: number }>
}

export function InventoryRequestsModule() {
  const { user, canEdit } = useAuthStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [fulfillDialog, setFulfillDialog] = useState<{ id: string; itemName: string; quantity: number } | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter !== 'all') params.set('status', statusFilter)
  if (typeFilter !== 'all') params.set('type', typeFilter)
  const { data, loading } = useFetch<RequestData>(`/api/inventory-requests?${params.toString()}`, [refreshKey, search, statusFilter, typeFilter])

  const canManage = canEdit('inventory') || canEdit('cafeteria')

  const handleApprove = async (id: string) => {
    try {
      await apiPut(`/api/inventory-requests/${id}`, { status: 'Approved', approvedBy: user?.name || 'Admin' })
      toast.success('Request approved')
      setRefreshKey(k => k + 1)
    } catch { toast.error('Failed to approve') }
  }

  const handleReject = async (id: string) => {
    try {
      await apiPut(`/api/inventory-requests/${id}`, { status: 'Rejected', approvedBy: user?.name || 'Admin', rejectionReason: 'Request denied by store keeper' })
      toast.success('Request rejected')
      setRefreshKey(k => k + 1)
    } catch { toast.error('Failed to reject') }
  }

  const handleFulfill = async (id: string, fulfilledQty: number, totalQty: number) => {
    try {
      const status = fulfilledQty >= totalQty ? 'Fulfilled' : 'Partially Fulfilled'
      await apiPut(`/api/inventory-requests/${id}`, { status, fulfilledBy: user?.name || 'Store Keeper', fulfilledQty })
      toast.success(`Request ${status.toLowerCase()}`)
      setFulfillDialog(null)
      setRefreshKey(k => k + 1)
    } catch { toast.error('Failed to fulfill') }
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-red-500 to-rose-600 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <PackagePlus className="h-3 w-3" /> {d.stats.pending} pending · {d.stats.urgent} urgent · {d.stats.fulfilled} fulfilled
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Inventory Requests</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Staff can request items from the store — kitchen supplies, stationery, lab equipment, and more.
              Store keepers approve and fulfill requests.
            </p>
          </div>
          <Button variant="secondary" size="sm" className="bg-white text-orange-600 hover:bg-white/90" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Request
          </Button>
        </div>
      </div>

      {/* Urgent alert */}
      {d.stats.urgent > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-rose-300 bg-rose-50 p-4 dark:border-rose-800 dark:bg-rose-950/30">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-rose-500/15 text-rose-600">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-rose-700 dark:text-rose-400">{d.stats.urgent} Urgent Request{d.stats.urgent > 1 ? 's' : ''} Need Attention</p>
            <p className="text-xs text-rose-600/80 dark:text-rose-400/80">Please review and process urgent inventory requests.</p>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20"><PackagePlus className="h-5 w-5" /></div>
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Total Requests</p><p className="text-2xl font-bold">{d.stats.total}</p></div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20"><Clock className="h-5 w-5" /></div>
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Pending</p><p className="text-2xl font-bold">{d.stats.pending}</p></div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"><CheckCircle2 className="h-5 w-5" /></div>
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Approved</p><p className="text-2xl font-bold">{d.stats.approved}</p></div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20"><Package className="h-5 w-5" /></div>
            <div><p className="text-xs uppercase tracking-wide text-muted-foreground">Fulfilled</p><p className="text-2xl font-bold">{d.stats.fulfilled}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Requests by Type</CardTitle><CardDescription className="text-xs">Distribution across categories</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={d.byType} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {d.byType.map((t, i) => { const meta = REQUEST_TYPES.find(r => r.type === t.name); return <Cell key={i} fill={meta?.color || '#94a3b8'} /> })}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-2 text-[10px]">
              {d.byType.map(t => { const meta = REQUEST_TYPES.find(r => r.type === t.name); return (
                <div key={t.name} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: meta?.color || '#94a3b8' }} /><span className="font-medium">{t.name}</span><span className="text-muted-foreground">{t.count}</span></div>
              )})}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Requests by Department</CardTitle><CardDescription className="text-xs">Which departments need most</CardDescription></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={d.byDepartment} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="oklch(0.5 0.02 160)" />
                <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} cursor={{ fill: 'oklch(0.96 0.01 150)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40} fill="#f97316" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search item, request no, requester..." className="pl-9" />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Type" /></SelectTrigger>
            <SelectContent><SelectItem value="all">All Types</SelectItem>{REQUEST_TYPES.map(t => <SelectItem key={t.type} value={t.type}>{t.label}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Approved">Approved</SelectItem>
              <SelectItem value="Rejected">Rejected</SelectItem>
              <SelectItem value="Fulfilled">Fulfilled</SelectItem>
              <SelectItem value="Partially Fulfilled">Partially Fulfilled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Requests table */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">All Requests</CardTitle><CardDescription className="text-xs">{d.requests.length} records</CardDescription></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">Request</TableHead>
                  <TableHead className="text-xs">Type</TableHead>
                  <TableHead className="text-xs">Item</TableHead>
                  <TableHead className="text-right text-xs">Qty</TableHead>
                  <TableHead className="text-center text-xs">Urgency</TableHead>
                  <TableHead className="text-xs">Requested By</TableHead>
                  <TableHead className="text-center text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {d.requests.map(r => {
                  const typeMeta = REQUEST_TYPES.find(t => t.type === r.requestType) || REQUEST_TYPES[6]
                  const TypeIcon = typeMeta.icon
                  const urgMeta = URGENCY_META[r.urgency] || URGENCY_META.Normal
                  return (
                    <TableRow key={r.id} className="hover:bg-muted/50">
                      <TableCell><span className="font-mono text-[10px] font-semibold">{r.requestNo}</span></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-lg" style={{ backgroundColor: `${typeMeta.color}15` }}><TypeIcon className="h-3.5 w-3.5" style={{ color: typeMeta.color }} /></div>
                          <span className="text-[10px]">{r.requestType}</span>
                        </div>
                      </TableCell>
                      <TableCell><p className="text-xs font-medium">{r.itemName}</p>{r.description && <p className="text-[10px] text-muted-foreground truncate max-w-[150px]">{r.description}</p>}</TableCell>
                      <TableCell className="text-right text-xs font-semibold tabular-nums">{r.quantity} {r.unit}</TableCell>
                      <TableCell className="text-center"><Badge variant="outline" className={cn('text-[10px]', urgMeta.bg, urgMeta.text)}>{r.urgency}</Badge></TableCell>
                      <TableCell><p className="text-xs font-medium">{r.requestedBy}</p><p className="text-[10px] text-muted-foreground">{r.department || r.requesterRole}</p></TableCell>
                      <TableCell className="text-center"><Badge variant="outline" className={cn('text-[10px]', STATUS_BADGE[r.status])}>{r.status}</Badge></TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">{timeAgo(r.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {canManage && r.status === 'Pending' && (
                            <>
                              <Button variant="outline" size="sm" className="h-7 text-[10px] text-emerald-600 hover:bg-emerald-50" onClick={() => handleApprove(r.id)}><CheckCircle2 className="mr-0.5 h-3 w-3" /> Approve</Button>
                              <Button variant="outline" size="sm" className="h-7 text-[10px] text-rose-600 hover:bg-rose-50" onClick={() => handleReject(r.id)}><XCircle className="mr-0.5 h-3 w-3" /> Reject</Button>
                            </>
                          )}
                          {canManage && (r.status === 'Approved' || r.status === 'Partially Fulfilled') && (
                            <Button variant="outline" size="sm" className="h-7 text-[10px] text-teal-600 hover:bg-teal-50" onClick={() => setFulfillDialog({ id: r.id, itemName: r.itemName, quantity: r.quantity })}><Package className="mr-0.5 h-3 w-3" /> Fulfill</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          {d.requests.length === 0 && <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground"><PackagePlus className="h-8 w-8" /><p>No requests match your filters.</p></div>}
        </CardContent>
      </Card>

      {/* New Request Dialog */}
      {showAddDialog && <NewRequestDialog onClose={() => setShowAddDialog(false)} onCreated={() => setRefreshKey(k => k + 1)} userName={user?.name || 'Staff'} userRole={user?.role || 'Staff'} />}

      {/* Fulfill Dialog */}
      {fulfillDialog && <FulfillDialog data={fulfillDialog} onClose={() => setFulfillDialog(null)} onFulfill={handleFulfill} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// New Request Dialog
// ---------------------------------------------------------------------------
function NewRequestDialog({ onClose, onCreated, userName, userRole }: { onClose: () => void; onCreated: () => void; userName: string; userRole: string }) {
  const [form, setForm] = useState({
    requestType: 'Kitchen', itemName: '', description: '', quantity: '1', unit: 'pcs',
    urgency: 'Normal', department: '', notes: '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.itemName) { toast.error('Item name is required'); return }
    setSaving(true)
    try {
      await apiPost('/api/inventory-requests', { ...form, quantity: Number(form.quantity), requestedBy: userName, requesterRole: userRole })
      toast.success('Request submitted successfully')
      onCreated(); onClose()
    } catch (e: any) { toast.error('Failed to submit request') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-orange-500" /> New Inventory Request</DialogTitle>
          <DialogDescription>Request items from the store</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {/* Type selector with icons */}
          <div>
            <Label className="text-xs">Request Type</Label>
            <div className="mt-1 grid grid-cols-4 gap-1.5">
              {REQUEST_TYPES.map(t => {
                const Icon = t.icon
                const selected = form.requestType === t.type
                return (
                  <button key={t.type} onClick={() => setForm({ ...form, requestType: t.type })}
                    className={cn('flex flex-col items-center gap-1 rounded-lg border p-2 transition-all', selected ? 'border-2' : 'border-border hover:bg-muted/40')}
                    style={selected ? { borderColor: t.color, backgroundColor: `${t.color}10` } : {}}>
                    <Icon className="h-4 w-4" style={{ color: t.color }} />
                    <span className="text-[9px] font-medium">{t.type}</span>
                  </button>
                )
              })}
            </div>
          </div>
          <div><Label className="text-xs">Item Name *</Label><Input value={form.itemName} onChange={e => setForm({ ...form, itemName: e.target.value })} placeholder="e.g. Cooking oil, A4 paper, Bunsen burner" className="mt-1" /></div>
          <div><Label className="text-xs">Description</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Additional details..." className="mt-1" rows={2} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs">Quantity *</Label><Input type="number" min="1" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Unit</Label><Select value={form.unit} onValueChange={v => setForm({ ...form, unit: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="pcs">pcs</SelectItem><SelectItem value="kg">kg</SelectItem><SelectItem value="litres">litres</SelectItem><SelectItem value="boxes">boxes</SelectItem><SelectItem value="packs">packs</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Urgency</Label><Select value={form.urgency} onValueChange={v => setForm({ ...form, urgency: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Normal">Normal</SelectItem><SelectItem value="High">High</SelectItem><SelectItem value="Urgent">Urgent</SelectItem></SelectContent></Select></div>
          </div>
          <div><Label className="text-xs">Department</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="e.g. Kitchen, Library, Science Lab" className="mt-1" /></div>
          <div className="rounded-lg bg-muted/30 p-2.5 text-[10px] text-muted-foreground">Request will be submitted as: <span className="font-semibold">{userName}</span> ({userRole})</div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving} className="bg-orange-600 hover:bg-orange-700">{saving ? 'Submitting...' : 'Submit Request'}</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Fulfill Dialog
// ---------------------------------------------------------------------------
function FulfillDialog({ data, onClose, onFulfill }: { data: { id: string; itemName: string; quantity: number }; onClose: () => void; onFulfill: (id: string, qty: number, total: number) => void }) {
  const [fulfilledQty, setFulfilledQty] = useState(String(data.quantity))
  const [saving, setSaving] = useState(false)

  const handleFulfill = async () => {
    setSaving(true)
    await onFulfill(data.id, parseInt(fulfilledQty) || 0, data.quantity)
    setSaving(false)
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-teal-500" /> Fulfill Request</DialogTitle><DialogDescription>{data.itemName} (requested: {data.quantity})</DialogDescription></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Quantity to Fulfill</Label><Input type="number" min="0" max={data.quantity} value={fulfilledQty} onChange={e => setFulfilledQty(e.target.value)} className="mt-1" /></div>
          <p className="text-[10px] text-muted-foreground">If you fulfill less than requested, the status will be "Partially Fulfilled".</p>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleFulfill} disabled={saving} className="bg-teal-600 hover:bg-teal-700">{saving ? 'Fulfilling...' : 'Fulfill'}</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
