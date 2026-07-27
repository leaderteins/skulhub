'use client'
import { useState } from 'react'
import { useFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatKES, formatNumber, formatDate, timeAgo, statusColor } from '@/lib/format'
import { toast } from 'sonner'
import {
  Package, Wrench, AlertTriangle, TrendingDown, Plus, Search, ChevronRight,
  MapPin, User, Tag, DollarSign, Calendar, Settings as SettingsIcon, X, ClipboardCheck,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

interface InventoryData {
  stats: {
    totalAssets: number; totalValue: number; purchaseValue: number
    depreciation: number; underRepair: number; maintenanceDue: number
  }
  assets: Array<{
    id: string; assetTag: string; name: string; category: string; description: string | null
    serialNumber: string | null; purchaseDate: string | null; purchaseCost: number
    currentValue: number; condition: string; status: string; location: string | null
    assignedTo: string | null; quantity: number; notes: string | null
    maintenanceCount: number; lastMaintenance: string | null
    maintenances: Array<{ id: string; date: string; type: string; description: string; cost: number; status: string; nextDueDate: string | null; vendor: string | null; technician: string | null }>
  }>
  byCategory: Array<{ name: string; count: number; value: number }>
  byCondition: Array<{ name: string; count: number }>
  byStatus: Array<{ name: string; count: number }>
}

const CATEGORY_COLORS: Record<string, string> = {
  Furniture: '#10b981', Electronics: '#06b6d4', 'Lab Equipment': '#8b5cf6',
  Sports: '#f59e0b', Kitchen: '#ef4444', Stationery: '#14b8a6', Vehicle: '#0d9488', Other: '#64748b',
}
const CATEGORY_ICONS: Record<string, any> = {
  Furniture: Package, Electronics: Package, 'Lab Equipment': Package, Sports: Package,
  Kitchen: Package, Stationery: Package, Vehicle: Package, Other: Package,
}

const CONDITION_BADGE: Record<string, string> = {
  Excellent: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  Good: 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-400',
  Fair: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  Poor: 'border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950 dark:text-orange-400',
  Damaged: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
}

const STATUS_BADGE: Record<string, string> = {
  'In Use': 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  'In Storage': 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400',
  'Under Repair': 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  Disposed: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
  Lost: 'border-rose-500 bg-rose-100 text-rose-800 dark:border-rose-700 dark:bg-rose-950 dark:text-rose-400',
}

export function InventoryModule() {
  const { data, loading } = useFetch<InventoryData>('/api/inventory')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [conditionFilter, setConditionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (categoryFilter !== 'all') params.set('category', categoryFilter)
  if (conditionFilter !== 'all') params.set('condition', conditionFilter)
  if (statusFilter !== 'all') params.set('status', statusFilter)
  const { data: filtered } = useFetch<InventoryData>(`/api/inventory?${params.toString()}`, [search, categoryFilter, conditionFilter, statusFilter])

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Package className="h-3 w-3" /> {stats.totalAssets} assets · {formatKES(stats.totalValue)} total value
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Inventory & Assets</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Track school equipment, furniture, and vehicles with maintenance scheduling and depreciation.
            </p>
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
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Assets</p>
              <p className="text-2xl font-bold">{stats.totalAssets}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Current Value</p>
              <p className="text-2xl font-bold">{formatKES(stats.totalValue)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20">
              <TrendingDown className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Depreciation</p>
              <p className="text-2xl font-bold">{formatKES(stats.depreciation)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-500/10 text-orange-600 ring-1 ring-orange-500/20">
              <Wrench className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Under Repair</p>
              <p className="text-2xl font-bold">{stats.underRepair}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Value by category */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Asset Value by Category</CardTitle>
            <CardDescription className="text-xs">Current value distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={display.byCategory} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="oklch(0.5 0.02 160)" angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" tickFormatter={(v) => `${v / 1000000}M`} />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} formatter={(v: number) => formatKES(v)} cursor={{ fill: 'oklch(0.96 0.01 150)' }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {display.byCategory.map(c => <Cell key={c.name} fill={CATEGORY_COLORS[c.name] || '#94a3b8'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Condition distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Asset Conditions</CardTitle>
            <CardDescription className="text-xs">Condition breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={display.byCondition} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {display.byCondition.map(c => <Cell key={c.name} fill={c.name === 'Excellent' ? '#10b981' : c.name === 'Good' ? '#14b8a6' : c.name === 'Fair' ? '#f59e0b' : c.name === 'Poor' ? '#f97316' : '#ef4444'} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-2 text-[10px]">
              {display.byCondition.map(c => (
                <div key={c.name} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: c.name === 'Excellent' ? '#10b981' : c.name === 'Good' ? '#14b8a6' : c.name === 'Fair' ? '#f59e0b' : c.name === 'Poor' ? '#f97316' : '#ef4444' }} />
                  <span className="font-medium">{c.name}</span><span className="text-muted-foreground">{c.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search asset tag, name, serial, location..." className="pl-9" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {Object.keys(CATEGORY_COLORS).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Condition" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              {Object.keys(CONDITION_BADGE).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {Object.keys(STATUS_BADGE).map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Assets table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Asset Register</CardTitle>
          <CardDescription className="text-xs">{display.assets.length} assets · latest first</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">Asset Tag</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-right text-xs">Qty</TableHead>
                  <TableHead className="text-right text-xs">Value</TableHead>
                  <TableHead className="text-center text-xs">Condition</TableHead>
                  <TableHead className="text-center text-xs">Status</TableHead>
                  <TableHead className="text-xs">Location</TableHead>
                  <TableHead className="text-right text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {display.assets.map(a => (
                  <TableRow key={a.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedAsset(a.id)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: `${CATEGORY_COLORS[a.category]}15` }}>
                          <Package className="h-4 w-4" style={{ color: CATEGORY_COLORS[a.category] }} />
                        </div>
                        <span className="text-xs font-mono font-semibold">{a.assetTag}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-medium">{a.name}</p>
                      {a.serialNumber && <p className="text-[10px] text-muted-foreground">SN: {a.serialNumber}</p>}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{a.category}</Badge></TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{a.quantity}</TableCell>
                    <TableCell className="text-right text-xs font-semibold tabular-nums">{formatKES(a.currentValue)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn('text-[10px]', CONDITION_BADGE[a.condition])}>{a.condition}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn('text-[10px]', STATUS_BADGE[a.status])}>{a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{a.location || '—'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedAsset(a.id) }}>
                        View <ChevronRight className="ml-0.5 h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {display.assets.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <Package className="h-8 w-8" />
              <p>No assets match your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      {selectedAsset && <AssetDetailDialog assetId={selectedAsset} onClose={() => setSelectedAsset(null)} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Asset Detail Dialog
// ---------------------------------------------------------------------------
function AssetDetailDialog({ assetId, onClose }: { assetId: string; onClose: () => void }) {
  const { data: asset, loading } = useFetch<any>(`/api/inventory/${assetId}`)

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto scrollbar-thin">
        {loading || !asset ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-amber-500" /> Asset Details
              </DialogTitle>
              <DialogDescription>{asset.assetTag} · {asset.name}</DialogDescription>
            </DialogHeader>

            {/* Asset header */}
            <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:from-amber-950/30 dark:to-orange-950/30">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl" style={{ backgroundColor: `${CATEGORY_COLORS[asset.category]}15` }}>
                <Package className="h-6 w-6" style={{ color: CATEGORY_COLORS[asset.category] }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-base font-bold">{asset.name}</p>
                <p className="text-xs text-muted-foreground">{asset.assetTag} · {asset.serialNumber || 'No serial'}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-[10px]">{asset.category}</Badge>
                  <Badge variant="outline" className={cn('text-[10px]', CONDITION_BADGE[asset.condition])}>{asset.condition}</Badge>
                  <Badge variant="outline" className={cn('text-[10px]', STATUS_BADGE[asset.status])}>{asset.status}</Badge>
                </div>
              </div>
            </div>

            {/* Value grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border bg-muted/30 p-3 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">Purchase Cost</p>
                <p className="text-sm font-bold">{formatKES(asset.purchaseCost)}</p>
              </div>
              <div className="rounded-xl border bg-emerald-50/40 p-3 text-center dark:bg-emerald-950/20">
                <p className="text-[10px] uppercase text-emerald-700 dark:text-emerald-400">Current Value</p>
                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{formatKES(asset.currentValue)}</p>
              </div>
              <div className="rounded-xl border bg-rose-50/40 p-3 text-center dark:bg-rose-950/20">
                <p className="text-[10px] uppercase text-rose-700 dark:text-rose-400">Depreciation</p>
                <p className="text-sm font-bold text-rose-700 dark:text-rose-400">{formatKES(asset.purchaseCost - asset.currentValue)}</p>
              </div>
            </div>

            {/* Details grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Card className="border-amber-200/50 bg-amber-50/30 dark:bg-amber-950/10">
                <CardContent className="p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">Asset Info</p>
                  <div className="space-y-1.5 text-sm">
                    {asset.description && <p className="text-xs">{asset.description}</p>}
                    <div className="flex items-center gap-2"><Tag className="h-3.5 w-3.5 text-muted-foreground" /><span>Quantity: {asset.quantity}</span></div>
                    {asset.purchaseDate && <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /><span>Purchased: {formatDate(asset.purchaseDate)}</span></div>}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Location & Assignment</p>
                  <div className="space-y-1.5 text-sm">
                    {asset.location && <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-muted-foreground" /><span>{asset.location}</span></div>}
                    {asset.assignedTo && <div className="flex items-center gap-2"><User className="h-3.5 w-3.5 text-muted-foreground" /><span>{asset.assignedTo}</span></div>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {asset.notes && (
              <div className="rounded-lg bg-muted/40 p-3 text-xs">
                <span className="font-semibold">Notes: </span>{asset.notes}
              </div>
            )}

            {/* Maintenance history */}
            {asset.maintenances.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <Wrench className="h-4 w-4 text-amber-500" /> Maintenance History ({asset.maintenances.length})
                </p>
                <div className="max-h-48 space-y-2 overflow-y-auto scrollbar-thin pr-1">
                  {asset.maintenances.map((m: any) => (
                    <div key={m.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{m.type}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(m.date)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {m.cost > 0 && <span className="text-xs font-semibold">{formatKES(m.cost)}</span>}
                          <Badge variant="secondary" className={cn('text-[10px]', statusColor(m.status))}>{m.status}</Badge>
                        </div>
                      </div>
                      <p className="mt-1 text-xs">{m.description}</p>
                      <div className="mt-1 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                        {m.vendor && <span>Vendor: {m.vendor}</span>}
                        {m.technician && <span>· Technician: {m.technician}</span>}
                        {m.nextDueDate && <span>· Next due: {formatDate(m.nextDueDate)}</span>}
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
