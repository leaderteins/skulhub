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
import { formatKES, formatDate } from '@/lib/format'
import { useAuthStore } from '@/lib/auth-store'
import { toast } from 'sonner'
import {
  ShoppingCart, Package, Clock, CheckCircle2, Truck, Plus, Search,
  Phone, Mail, MapPin, User, Building2, Tag, DollarSign, X, Loader2,
  FileText, TrendingUp, Ban,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
} from 'recharts'

interface ProcurementData {
  stats: {
    totalOrders: number; pendingOrders: number; approvedOrders: number
    deliveredOrders: number; cancelledOrders: number; totalSuppliers: number
    totalValue: number; pendingValue: number; deliveredValue: number
  }
  suppliers: Array<{
    id: string; name: string; category: string; contact: string | null
    phone: string | null; email: string | null; address: string | null
    status: string; createdAt: string; orderCount: number; totalSpent: number; pendingCount: number
  }>
  purchaseOrders: Array<{
    id: string; poNumber: string; supplierId: string
    supplier: { id: string; name: string; category: string; phone: string | null; email: string | null }
    item: string; description: string | null; quantity: number; unitPrice: number
    totalAmount: number; status: string; requestedBy: string | null; approvedBy: string | null
    orderDate: string; deliveryDate: string | null; createdAt: string
  }>
  byCategory: Array<{ name: string; count: number }>
  byStatus: Array<{ name: string; count: number; value: number }>
}

const CATEGORY_META: Record<string, { color: string; bg: string; icon: any }> = {
  Stationery: { color: '#0d9488', bg: 'bg-teal-500/10 text-teal-600', icon: FileText },
  Food: { color: '#f59e0b', bg: 'bg-amber-500/10 text-amber-600', icon: Package },
  Equipment: { color: '#8b5cf6', bg: 'bg-violet-500/10 text-violet-600', icon: Package },
  Services: { color: '#06b6d4', bg: 'bg-cyan-500/10 text-cyan-600', icon: Building2 },
  Other: { color: '#64748b', bg: 'bg-slate-500/10 text-slate-600', icon: Tag },
}

const STATUS_BADGE: Record<string, string> = {
  Pending: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  Approved: 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-400',
  Delivered: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  Cancelled: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
}

export function ProcurementModule() {
  const { user } = useAuthStore()
  const { data, loading, refetch } = useFetch<ProcurementData>('/api/procurement')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showPODialog, setShowPODialog] = useState(false)
  const [showSupplierDialog, setShowSupplierDialog] = useState(false)
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

  // Client-side filter (API already supports filters; doing it client-side for snappy UX)
  const filteredPOs = data!.purchaseOrders.filter(po => {
    if (statusFilter !== 'all' && po.status !== statusFilter) return false
    if (categoryFilter !== 'all' && po.supplier.category !== categoryFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!po.poNumber.toLowerCase().includes(q) &&
          !po.item.toLowerCase().includes(q) &&
          !po.supplier.name.toLowerCase().includes(q) &&
          !(po.requestedBy || '').toLowerCase().includes(q)) return false
    }
    return true
  })

  const handleStatusChange = async (id: string, poNumber: string, status: string) => {
    setActionLoading(id + status)
    try {
      await apiPut('/api/procurement', { id, status, approvedBy: user?.name })
      toast.success(`${poNumber} marked as ${status}`)
      refetch()
    } catch (e: any) {
      toast.error(e.message || 'Failed to update order status')
    } finally {
      setActionLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header banner — amber gradient */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-amber-600 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <ShoppingCart className="h-3 w-3" /> {stats.totalOrders} orders · {stats.totalSuppliers} suppliers · {formatKES(stats.totalValue)} total
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Procurement</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Manage suppliers, raise purchase orders, and track approvals & deliveries.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="bg-white/15 text-white backdrop-blur hover:bg-white/25"
              onClick={() => setShowSupplierDialog(true)}
            >
              <Plus className="mr-1 h-4 w-4" /> Add Supplier
            </Button>
            <Button
              size="sm"
              className="bg-white text-amber-700 hover:bg-white/90"
              onClick={() => setShowPODialog(true)}
            >
              <FileText className="mr-1 h-4 w-4" /> New PO
            </Button>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{stats.totalOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{stats.pendingOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Delivered</p>
              <p className="text-2xl font-bold">{stats.deliveredOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold">{formatKES(stats.totalValue)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Suppliers + category distribution */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Suppliers list */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Suppliers</CardTitle>
                <CardDescription className="text-xs">{data!.suppliers.length} registered vendors</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setShowSupplierDialog(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Add
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {data!.suppliers.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-center text-sm text-muted-foreground">
                  <Building2 className="h-8 w-8" />
                  <p>No suppliers yet. Add your first vendor.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {data!.suppliers.map(s => {
                    const meta = CATEGORY_META[s.category] || CATEGORY_META.Other
                    const Icon = meta.icon
                    return (
                      <div key={s.id} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
                        <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', meta.bg)}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-semibold">{s.name}</p>
                            <Badge variant="outline" className="shrink-0 text-[10px]">{s.category}</Badge>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                            {s.contact && <span className="inline-flex items-center gap-1"><User className="h-3 w-3" />{s.contact}</span>}
                            {s.phone && <span className="inline-flex items-center gap-1"><Phone className="h-3 w-3" />{s.phone}</span>}
                            {s.email && <span className="inline-flex items-center gap-1"><Mail className="h-3 w-3" />{s.email}</span>}
                            {s.address && <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{s.address}</span>}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-semibold">{s.orderCount} orders</p>
                          <p className="text-[11px] text-muted-foreground">{formatKES(s.totalSpent)}</p>
                          {s.pendingCount > 0 && (
                            <Badge variant="outline" className="mt-0.5 border-amber-300 bg-amber-50 text-[10px] text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400">
                              {s.pendingCount} pending
                            </Badge>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Status distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Order Status</CardTitle>
            <CardDescription className="text-xs">By count & value</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie
                  data={data!.byStatus}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={42}
                  outerRadius={70}
                  paddingAngle={3}
                >
                  {data!.byStatus.map(s => (
                    <Cell
                      key={s.name}
                      fill={s.name === 'Pending' ? '#f59e0b' : s.name === 'Approved' ? '#14b8a6' : s.name === 'Delivered' ? '#10b981' : '#ef4444'}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 space-y-1">
              {data!.byStatus.map(s => (
                <div key={s.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: s.name === 'Pending' ? '#f59e0b' : s.name === 'Approved' ? '#14b8a6' : s.name === 'Delivered' ? '#10b981' : '#ef4444' }}
                    />
                    <span className="font-medium">{s.name}</span>
                  </div>
                  <span className="text-muted-foreground">{s.count} · {formatKES(s.value)}</span>
                </div>
              ))}
              {data!.byStatus.length === 0 && (
                <p className="py-4 text-center text-xs text-muted-foreground">No orders yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search PO number, item, supplier..." className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.keys(STATUS_BADGE).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.keys(CATEGORY_META).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Purchase orders table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Purchase Orders</CardTitle>
          <CardDescription className="text-xs">{filteredPOs.length} orders · latest first</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">PO Number</TableHead>
                  <TableHead className="text-xs">Supplier</TableHead>
                  <TableHead className="text-xs">Item</TableHead>
                  <TableHead className="text-right text-xs">Qty</TableHead>
                  <TableHead className="text-right text-xs">Unit Price</TableHead>
                  <TableHead className="text-right text-xs">Total</TableHead>
                  <TableHead className="text-center text-xs">Status</TableHead>
                  <TableHead className="text-xs">Order Date</TableHead>
                  <TableHead className="text-right text-xs">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPOs.map(po => {
                  const meta = CATEGORY_META[po.supplier.category] || CATEGORY_META.Other
                  return (
                    <TableRow key={po.id} className="hover:bg-muted/50">
                      <TableCell>
                        <span className="font-mono text-xs font-semibold text-amber-700 dark:text-amber-400">{po.poNumber}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-lg', meta.bg)}>
                            <meta.icon className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-xs font-medium">{po.supplier.name}</p>
                            <p className="text-[10px] text-muted-foreground">{po.supplier.category}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-medium">{po.item}</p>
                        {po.description && <p className="max-w-[200px] truncate text-[10px] text-muted-foreground">{po.description}</p>}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{po.quantity}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{formatKES(po.unitPrice)}</TableCell>
                      <TableCell className="text-right text-xs font-semibold tabular-nums">{formatKES(po.totalAmount)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn('text-[10px]', STATUS_BADGE[po.status])}>{po.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{formatDate(po.orderDate)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {po.status === 'Pending' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 border-teal-300 bg-teal-50 px-2 text-[11px] text-teal-700 hover:bg-teal-100 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-400"
                              disabled={actionLoading === po.id + 'Approved'}
                              onClick={() => handleStatusChange(po.id, po.poNumber, 'Approved')}
                            >
                              {actionLoading === po.id + 'Approved' ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                              <span className="ml-1">Approve</span>
                            </Button>
                          )}
                          {po.status === 'Approved' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 border-emerald-300 bg-emerald-50 px-2 text-[11px] text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400"
                              disabled={actionLoading === po.id + 'Delivered'}
                              onClick={() => handleStatusChange(po.id, po.poNumber, 'Delivered')}
                            >
                              {actionLoading === po.id + 'Delivered' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Truck className="h-3 w-3" />}
                              <span className="ml-1">Deliver</span>
                            </Button>
                          )}
                          {(po.status === 'Pending' || po.status === 'Approved') && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[11px] text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950"
                              disabled={actionLoading === po.id + 'Cancelled'}
                              onClick={() => handleStatusChange(po.id, po.poNumber, 'Cancelled')}
                              title="Cancel order"
                            >
                              {actionLoading === po.id + 'Cancelled' ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
                            </Button>
                          )}
                          {(po.status === 'Delivered' || po.status === 'Cancelled') && (
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
          {filteredPOs.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <ShoppingCart className="h-8 w-8" />
              <p>No purchase orders match your filters.</p>
              <Button variant="outline" size="sm" className="mt-1 h-7 text-xs" onClick={() => setShowPODialog(true)}>
                <Plus className="mr-1 h-3.5 w-3.5" /> Create PO
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* New PO dialog */}
      {showPODialog && (
        <NewPODialog
          suppliers={data!.suppliers}
          requestedBy={user?.name || 'Admin'}
          onClose={() => setShowPODialog(false)}
          onCreated={() => { setShowPODialog(false); refetch() }}
        />
      )}

      {/* Add supplier dialog */}
      {showSupplierDialog && (
        <AddSupplierDialog
          onClose={() => setShowSupplierDialog(false)}
          onCreated={() => { setShowSupplierDialog(false); refetch() }}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// New Purchase Order Dialog
// ---------------------------------------------------------------------------
function NewPODialog({
  suppliers, requestedBy, onClose, onCreated,
}: {
  suppliers: ProcurementData['suppliers']
  requestedBy: string
  onClose: () => void
  onCreated: () => void
}) {
  const [supplierId, setSupplierId] = useState('')
  const [item, setItem] = useState('')
  const [description, setDescription] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('')
  const [saving, setSaving] = useState(false)

  const qty = Math.max(1, Number(quantity) || 0)
  const price = Math.max(0, Number(unitPrice) || 0)
  const total = qty * price

  const handleSave = async () => {
    if (!supplierId) { toast.error('Please select a supplier'); return }
    if (!item.trim()) { toast.error('Item is required'); return }
    if (price <= 0) { toast.error('Unit price must be greater than 0'); return }
    setSaving(true)
    try {
      await apiPost('/api/procurement', {
        type: 'po',
        supplierId,
        item: item.trim(),
        description: description.trim() || null,
        quantity: qty,
        unitPrice: price,
        requestedBy,
      })
      toast.success('Purchase order created')
      onCreated()
    } catch (e: any) {
      toast.error(e.message || 'Failed to create purchase order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-500" /> New Purchase Order
          </DialogTitle>
          <DialogDescription>Raise a new PO. The PO number is auto-generated.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Supplier *</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="Select supplier..." /></SelectTrigger>
              <SelectContent>
                {suppliers.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name} · {s.category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {suppliers.length === 0 && (
              <p className="text-[11px] text-rose-600">No suppliers yet — add one first.</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Item *</Label>
            <Input value={item} onChange={e => setItem(e.target.value)} placeholder="e.g. A4 Exercise Books (200pg)" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Specs, brand, colour, etc." rows={2} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Quantity *</Label>
              <Input type="number" min={1} value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Unit Price (KES) *</Label>
              <Input type="number" min={0} value={unitPrice} onChange={e => setUnitPrice(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-950/40">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-800 dark:text-amber-300">Total Amount</span>
            </div>
            <span className="text-lg font-bold text-amber-700 dark:text-amber-400">{formatKES(total)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
            Create PO
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Add Supplier Dialog
// ---------------------------------------------------------------------------
function AddSupplierDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Stationery')
  const [contact, setContact] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Supplier name is required'); return }
    setSaving(true)
    try {
      await apiPost('/api/procurement', {
        type: 'supplier',
        name: name.trim(),
        category,
        contact: contact.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
      })
      toast.success('Supplier added')
      onCreated()
    } catch (e: any) {
      toast.error(e.message || 'Failed to add supplier')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-amber-500" /> Add Supplier
          </DialogTitle>
          <DialogDescription>Register a new vendor for procurement.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Supplier Name *</Label>
            <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Text Book Centre" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.keys(CATEGORY_META).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Contact Person</Label>
              <Input value={contact} onChange={e => setContact(e.target.value)} placeholder="John Doe" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Phone</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+254 7XX XXX XXX" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Email</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sales@supplier.com" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Address</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Nairobi, Kenya" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
            {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Plus className="mr-1 h-4 w-4" />}
            Add Supplier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
