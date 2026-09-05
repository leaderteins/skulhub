'use client'
import { useState, useEffect, Fragment } from 'react'
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandList, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { formatKES, formatNumber, formatDate, timeAgo, statusColor } from '@/lib/format'
import { toast } from 'sonner'
import {
  Package, Wrench, AlertTriangle, TrendingDown, Plus, Search, ChevronRight,
  MapPin, User, Tag, DollarSign, Calendar, ClipboardCheck, ShoppingCart, Truck,
  CheckCircle2, XCircle, Boxes, ChevronsUpDown, Check, FileText, ClipboardList,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Shared constants & helpers
// ---------------------------------------------------------------------------

const CATEGORY_COLORS: Record<string, string> = {
  Furniture: '#10b981', Electronics: '#06b6d4', 'Lab Equipment': '#14b8a6',
  Sports: '#f59e0b', Kitchen: '#ef4444', Stationery: '#0d9488', Vehicle: '#0891b2', Other: '#64748b',
}

const CATEGORIES = ['Furniture', 'Electronics', 'Lab Equipment', 'Sports', 'Kitchen', 'Stationery', 'Vehicle', 'Other']
const CONDITIONS = ['Excellent', 'Good', 'Fair', 'Poor', 'Damaged']
const STATUSES = ['In Use', 'In Storage', 'Under Repair', 'Disposed', 'Lost']
const UNITS = ['pcs', 'kg', 'litres', 'boxes', 'packs', 'reams', 'rolls', 'sets']
const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent']

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

const RESTOCK_STATUS_BADGE: Record<string, string> = {
  Pending: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  Approved: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  Rejected: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
  Ordered: 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-400',
  Received: 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-400',
}

const PO_STATUS_BADGE: Record<string, string> = {
  Pending: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  Approved: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  Ordered: 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-400',
  Received: 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-400',
  Cancelled: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
}

const PRIORITY_BADGE: Record<string, string> = {
  Low: 'border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400',
  Normal: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  High: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  Urgent: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
}

const STOCKTAKE_STATUS_BADGE: Record<string, string> = {
  Recorded: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  Reviewed: 'border-cyan-300 bg-cyan-50 text-cyan-700 dark:border-cyan-800 dark:bg-cyan-950 dark:text-cyan-400',
  Adjusted: 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-400',
}

interface Asset {
  id: string; assetTag: string; name: string; category: string; description: string | null
  serialNumber: string | null; purchaseDate: string | null; purchaseCost: number
  currentValue: number; condition: string; status: string; location: string | null
  assignedTo: string | null; quantity: number; quantityInStock: number; reorderLevel: number
  unitPrice: number; unit: string; supplierName: string | null; notes: string | null
  isLowStock: boolean
  maintenanceCount: number; lastMaintenance: string | null
  maintenances: Array<{ id: string; date: string; type: string; description: string; cost: number; status: string; nextDueDate: string | null; vendor: string | null; technician: string | null }>
}
interface InventoryData {
  stats: {
    totalAssets: number; totalValue: number; purchaseValue: number
    depreciation: number; underRepair: number; maintenanceDue: number
    lowStockCount: number; trackedCount: number
  }
  assets: Asset[]
  lowStockItems: Array<{ id: string; name: string; assetTag: string; category: string; quantityInStock: number; reorderLevel: number; unitPrice: number; unit: string; supplierName: string | null }>
  byCategory: Array<{ name: string; count: number; value: number }>
  byCondition: Array<{ name: string; count: number }>
  byStatus: Array<{ name: string; count: number }>
}

// ---------------------------------------------------------------------------
// Main module
// ---------------------------------------------------------------------------

export function InventoryModule() {
  const [tab, setTab] = useState('inventory')

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Boxes className="h-3 w-3" /> Stocktake → Restock → Purchase → Receive
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Inventory & Procurement</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Track stock, run stocktakes, raise restock requests, and convert approved requests
              into purchase orders that update stock on receipt.
            </p>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="inventory"><Package className="h-4 w-4" /> Inventory</TabsTrigger>
          <TabsTrigger value="stocktake"><ClipboardCheck className="h-4 w-4" /> Stocktake</TabsTrigger>
          <TabsTrigger value="restock"><ShoppingCart className="h-4 w-4" /> Restock Requests</TabsTrigger>
          <TabsTrigger value="po"><FileText className="h-4 w-4" /> Purchase Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory"><InventoryTab /></TabsContent>
        <TabsContent value="stocktake"><StocktakeTab /></TabsContent>
        <TabsContent value="restock"><RestockTab /></TabsContent>
        <TabsContent value="po"><PurchaseOrderTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// ===========================================================================
// 1. INVENTORY TAB
// ===========================================================================

function InventoryTab() {
  const { data, loading } = useFetch<InventoryData>('/api/inventory')
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [conditionFilter, setConditionFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [lowOnly, setLowOnly] = useState(false)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (categoryFilter !== 'all') params.set('category', categoryFilter)
  if (conditionFilter !== 'all') params.set('condition', conditionFilter)
  if (statusFilter !== 'all') params.set('status', statusFilter)
  if (lowOnly) params.set('lowStock', '1')
  const { data: filtered } = useFetch<InventoryData>(`/api/inventory?${params.toString()}`, [refreshKey, search, categoryFilter, conditionFilter, statusFilter, lowOnly])

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

  const display = filtered || data || { stats: {}, dormitories: [], items: [], menus: [], assets: [], meals: [] }
  const stats = display.stats

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{stats.totalAssets}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20">
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
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 ring-1 ring-cyan-500/20">
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
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Low Stock Alerts</p>
              <p className="text-2xl font-bold">{stats.lowStockCount}<span className="ml-1 text-xs text-muted-foreground">/ {stats.trackedCount}</span></p>
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
              {CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={conditionFilter} onValueChange={setConditionFilter}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Condition" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Conditions</SelectItem>
              {CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            variant={lowOnly ? 'default' : 'outline'}
            onClick={() => setLowOnly(v => !v)}
            className="md:w-auto"
          >
            <AlertTriangle className="h-4 w-4" /> Low stock only
          </Button>
          <Button onClick={() => setShowAddDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> New Item
          </Button>
        </CardContent>
      </Card>

      {/* Assets table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Asset Register</CardTitle>
          <CardDescription className="text-xs">{display.assets.length} items · latest first</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">Asset Tag</TableHead>
                  <TableHead className="text-xs">Name</TableHead>
                  <TableHead className="text-xs">Category</TableHead>
                  <TableHead className="text-right text-xs">In Stock</TableHead>
                  <TableHead className="text-right text-xs">Reorder @</TableHead>
                  <TableHead className="text-right text-xs">Unit Price</TableHead>
                  <TableHead className="text-center text-xs">Condition</TableHead>
                  <TableHead className="text-center text-xs">Status</TableHead>
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
                    <TableCell className="text-right">
                      <span className={cn('text-xs tabular-nums font-semibold', a.isLowStock && 'text-rose-600 dark:text-rose-400')}>
                        {formatNumber(a.quantityInStock)} {a.unit}
                      </span>
                      {a.isLowStock && <div className="text-[9px] text-rose-500">below reorder</div>}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums text-muted-foreground">{formatNumber(a.reorderLevel)}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{formatKES(a.unitPrice)}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn('text-[10px]', CONDITION_BADGE[a.condition])}>{a.condition}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn('text-[10px]', STATUS_BADGE[a.status])}>{a.status}</Badge>
                    </TableCell>
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
              <p>No items match your filters.</p>
              <Button size="sm" onClick={() => setShowAddDialog(true)} className="mt-2 bg-emerald-600 hover:bg-emerald-700">
                <Plus className="h-4 w-4" /> Add your first inventory item
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create dialog */}
      {showAddDialog && (
        <CreateAssetDialog
          onClose={() => setShowAddDialog(false)}
          onCreated={() => { setShowAddDialog(false); setRefreshKey(k => k + 1); toast.success('Inventory item created') }}
        />
      )}

      {/* Detail dialog */}
      {selectedAsset && (
        <AssetDetailDialog
          assetId={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onMutated={() => setRefreshKey(k => k + 1)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Item name combobox — Popover + Command pattern.
// Shows all existing item names (across every category) so the user can reuse them.
// ---------------------------------------------------------------------------

interface ItemNameComboboxProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  category?: string
}

function ItemNameCombobox({ value, onChange, placeholder = 'Select or type a new item name...', category }: ItemNameComboboxProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (query) params.set('q', query)
  const { data } = useFetch<{ items: Array<{ name: string; category: string }>; count: number }>(`/api/inventory/items?${params.toString()}`, [query, category, open])

  // Category-based suggestions — shown when no existing items match
  const CATEGORY_SUGGESTIONS: Record<string, string[]> = {
    'Furniture': ['Desks', 'Chairs', 'Tables', 'Cupboards', 'Shelves', 'Benches', 'Whiteboards', 'Bookshelves'],
    'Electronics': ['Projectors', 'Computers', 'Printers', 'Scanners', 'Speakers', 'Extension Cables', 'UPS Units', 'Routers'],
    'Lab Equipment': ['Microscopes', 'Beakers', 'Test Tubes', 'Bunsen Burners', 'Tripod Stands', 'Pipettes', 'Graduated Cylinders', 'Lab Coats'],
    'Sports': ['Footballs', 'Basketballs', 'Volleyballs', 'Rackets', 'Skipping Ropes', 'Javelins', 'Shot Put', 'Hurdles', 'Cones'],
    'Kitchen': ['Rice (50kg)', 'Cooking Oil (20L)', 'Beans (90kg)', 'Maize Flour (90kg)', 'Sugar (50kg)', 'Salt (10kg)', 'Cooking Pots', 'Serving Spoons', 'Tea Leaves (5kg)', 'Detergent (10L)'],
    'Stationery': ['Exercise Books (48pg)', 'Pens (Blue)', 'Pens (Black)', 'Pencils', 'Rulers', 'Erasers', 'A4 Reams', 'Chalk (White)', 'Markers', 'Files', 'Staples', 'Paper Clips'],
    'Vehicle': ['School Bus', 'Van', 'Saloon Car', 'Spare Tyres', 'Engine Oil (5L)', 'Brake Fluid (1L)'],
    'Other': ['First Aid Kit', 'Fire Extinguisher', 'Wall Clock', 'Dustbins', 'Mops', 'Brooms'],
  }

  const suggestions = category ? (CATEGORY_SUGGESTIONS[category] || []) : []
  const items = data?.items || []
  const exactMatch = items.some(i => i.name.toLowerCase() === value.toLowerCase())
  const canCreateNew = (value.trim().length > 0 || query.trim().length > 0) && !exactMatch
  const previewName = value.trim() || query.trim()

  // Filter suggestions by query
  const filteredSuggestions = query
    ? suggestions.filter(s => s.toLowerCase().includes(query.toLowerCase()))
    : suggestions

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          <span className={cn('truncate', !value && 'text-muted-foreground')}>
            {value || placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search existing items or type a new name..."
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {query.trim() ? 'No matches — type above to add as new.' : 'Start typing to search existing items.'}
            </CommandEmpty>
            {canCreateNew && (
              <CommandGroup heading="Create New">
                <CommandItem
                  onSelect={() => { onChange(previewName); setOpen(false) }}
                  className="text-emerald-700 dark:text-emerald-400"
                >
                  <Plus className="h-4 w-4" /> &ldquo;{previewName}&rdquo; (new item)
                </CommandItem>
              </CommandGroup>
            )}
            {filteredSuggestions.length > 0 && (
              <CommandGroup heading={`Suggested for ${category}`}>
                {filteredSuggestions.map(s => (
                  <CommandItem
                    key={s}
                    value={s}
                    onSelect={() => { onChange(s); setOpen(false) }}
                  >
                    <Check className={cn('h-4 w-4', value === s ? 'opacity-100' : 'opacity-0')} />
                    <span className="flex-1 truncate">{s}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {items.length > 0 && (
              <CommandGroup heading="Reuse Existing">
                {items.map(i => (
                  <CommandItem
                    key={i.name}
                    value={i.name}
                    onSelect={() => { onChange(i.name); setOpen(false) }}
                  >
                    <Check className={cn('h-4 w-4', value === i.name ? 'opacity-100' : 'opacity-0')} />
                    <span className="flex-1 truncate">{i.name}</span>
                    <Badge variant="outline" className="text-[9px]">{i.category}</Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ---------------------------------------------------------------------------
// Create Asset Dialog — with item-name combobox
// ---------------------------------------------------------------------------

function CreateAssetDialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState('Stationery')
  const [condition, setCondition] = useState('Good')
  const [status, setStatus] = useState('In Storage')
  const [unit, setUnit] = useState('pcs')
  const [quantity, setQuantity] = useState('1')
  const [quantityInStock, setQuantityInStock] = useState('0')
  const [reorderLevel, setReorderLevel] = useState('0')
  const [unitPrice, setUnitPrice] = useState('0')
  const [supplierName, setSupplierName] = useState('')
  const [location, setLocation] = useState('')
  const [description, setDescription] = useState('')
  const [purchaseCost, setPurchaseCost] = useState('0')
  const [saving, setSaving] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error('Item name is required')
      return
    }
    setSaving(true)
    try {
      await apiPost('/api/inventory', {
        name: name.trim(),
        category,
        condition,
        status,
        unit,
        quantity: Number(quantity) || 1,
        quantityInStock: Number(quantityInStock) || 0,
        reorderLevel: Number(reorderLevel) || 0,
        unitPrice: Number(unitPrice) || 0,
        supplierName: supplierName || null,
        location: location || null,
        description: description || null,
        purchaseCost: Number(purchaseCost) || 0,
        currentValue: Number(purchaseCost) || 0,
      })
      onCreated()
    } catch (e: any) {
      toast.error(e.message || 'Failed to create item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-emerald-600" /> Add Inventory Item
          </DialogTitle>
          <DialogDescription>
            Pick an existing item name from the dropdown to reuse, or type a new one. Set a reorder level
            above 0 to enable low-stock tracking and restock requests.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Item name combobox */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Item Name <span className="text-rose-500">*</span></Label>
            <ItemNameCombobox value={name} onChange={setName} category={category} />
            <p className="text-[10px] text-muted-foreground">
              The dropdown lists all item names already used across every category — pick one to reuse, or type a new name.
            </p>
          </div>

          {/* Category & unit */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Unit of measure</Label>
              <Select value={unit} onValueChange={setUnit}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantities & reorder */}
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Total Qty</Label>
              <Input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">In Stock</Label>
              <Input type="number" value={quantityInStock} onChange={e => setQuantityInStock(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Reorder Level</Label>
              <Input type="number" value={reorderLevel} onChange={e => setReorderLevel(e.target.value)} />
              <p className="text-[9px] text-muted-foreground">0 = not tracked</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Unit Price (KES)</Label>
              <Input type="number" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} />
            </div>
          </div>

          {/* Condition & status */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Condition</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CONDITIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>

          {/* Location & supplier */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Location</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Store Room A" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Preferred Supplier</Label>
              <Input value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="e.g. Office Point Ltd" />
            </div>
          </div>

          {/* Cost & description */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Purchase Cost (KES)</Label>
              <Input type="number" value={purchaseCost} onChange={e => setPurchaseCost(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Description</Label>
              <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving || !name.trim()} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? 'Saving…' : 'Create Item'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Asset detail dialog
// ---------------------------------------------------------------------------

function AssetDetailDialog({ assetId, onClose }: { assetId: string; onClose: () => void; onMutated: () => void }) {
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
                <Package className="h-5 w-5 text-emerald-600" /> Asset Details
              </DialogTitle>
              <DialogDescription>{asset.assetTag} · {asset.name}</DialogDescription>
            </DialogHeader>

            {/* Asset header */}
            <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 p-4 dark:from-emerald-950/30 dark:to-teal-950/30">
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

            {/* Stock & reorder panel */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border bg-muted/30 p-3 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">In Stock</p>
                <p className="text-sm font-bold">{formatNumber(asset.quantityInStock)} {asset.unit}</p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">Reorder At</p>
                <p className="text-sm font-bold">{formatNumber(asset.reorderLevel)}</p>
              </div>
              <div className="rounded-xl border bg-muted/30 p-3 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">Unit Price</p>
                <p className="text-sm font-bold">{formatKES(asset.unitPrice)}</p>
              </div>
              <div className={cn('rounded-xl border p-3 text-center', asset.reorderLevel > 0 && asset.quantityInStock <= asset.reorderLevel ? 'bg-rose-50 dark:bg-rose-950/30' : 'bg-emerald-50/40 dark:bg-emerald-950/20')}>
                <p className="text-[10px] uppercase text-muted-foreground">Stock Status</p>
                <p className="text-sm font-bold">
                  {asset.reorderLevel > 0
                    ? (asset.quantityInStock <= asset.reorderLevel ? 'LOW' : 'OK')
                    : 'Not tracked'}
                </p>
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
              <Card className="border-emerald-200/50 bg-emerald-50/30 dark:bg-emerald-950/10">
                <CardContent className="p-4">
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Asset Info</p>
                  <div className="space-y-1.5 text-sm">
                    {asset.description && <p className="text-xs">{asset.description}</p>}
                    <div className="flex items-center gap-2"><Tag className="h-3.5 w-3.5 text-muted-foreground" /><span>Total quantity: {asset.quantity}</span></div>
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
                    {asset.supplierName && <div className="flex items-center gap-2"><Truck className="h-3.5 w-3.5 text-muted-foreground" /><span>{asset.supplierName}</span></div>}
                  </div>
                </CardContent>
              </Card>
            </div>

            {asset.notes && (
              <div className="rounded-lg bg-muted/40 p-3 text-xs">
                <span className="font-semibold">Notes: </span>{asset.notes}
              </div>
            )}

            {asset.stocktakes?.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
                  <ClipboardCheck className="h-4 w-4 text-emerald-500" /> Recent Stocktakes ({asset.stocktakes.length})
                </p>
                <div className="max-h-40 space-y-2 overflow-y-auto scrollbar-thin pr-1">
                  {asset.stocktakes.map((s: any) => (
                    <div key={s.id} className="rounded-lg border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{s.recordNo}</Badge>
                          <span className="text-xs text-muted-foreground">{formatDate(s.stocktakeDate)}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground">sys {s.systemQuantity}</span>
                          <span>→</span>
                          <span className="font-semibold">count {s.countedQuantity}</span>
                          <Badge variant="outline" className={cn('text-[10px]', s.discrepancy < 0 ? 'border-rose-300 bg-rose-50 text-rose-700' : s.discrepancy > 0 ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-slate-300 bg-slate-50 text-slate-700')}>
                            Δ {s.discrepancy > 0 ? '+' : ''}{s.discrepancy}
                          </Badge>
                        </div>
                      </div>
                      {s.notes && <p className="mt-1 text-xs text-muted-foreground">{s.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {asset.maintenances?.length > 0 && (
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
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={onClose}>Close</Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('inventory:quick-restock', { detail: { assetId: asset.id, name: asset.name } }))
                  onClose()
                }}
              >
                <ShoppingCart className="h-4 w-4" /> Request Restock
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ===========================================================================
// 2. STOCKTAKE TAB
// ===========================================================================

interface StocktakeData {
  stats: { total: number; pendingReview: number; shortages: number; adjustments: number; surplus: number }
  records: Array<{
    id: string; recordNo: string; assetId: string; assetName: string; category: string
    assetTag: string | null; systemQuantity: number; countedQuantity: number; discrepancy: number
    notes: string | null; status: string; countedBy: string; stocktakeDate: string
    createdAt: string; currentStock: number | null
  }>
}

function StocktakeTab() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter !== 'all') params.set('status', statusFilter)
  const { data, loading } = useFetch<StocktakeData>(`/api/inventory/stocktake?${params.toString()}`, [refreshKey, search, statusFilter])

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <ClipboardCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Counts</p>
              <p className="text-2xl font-bold">{data?.stats.total ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold">{data?.stats.pendingReview ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Shortages Found</p>
              <p className="text-2xl font-bold">{data?.stats.shortages ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Stock Adjusted</p>
              <p className="text-2xl font-bold">{data?.stats.adjustments ?? 0}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by item, record no, counter, notes..." className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Recorded">Recorded</SelectItem>
              <SelectItem value="Reviewed">Reviewed</SelectItem>
              <SelectItem value="Adjusted">Adjusted</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> New Stocktake
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Stocktake Records</CardTitle>
          <CardDescription className="text-xs">{data?.records.length ?? 0} records · latest first</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">Record No</TableHead>
                    <TableHead className="text-xs">Item</TableHead>
                    <TableHead className="text-right text-xs">System</TableHead>
                    <TableHead className="text-right text-xs">Counted</TableHead>
                    <TableHead className="text-right text-xs">Discrepancy</TableHead>
                    <TableHead className="text-xs">Counted By</TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-center text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.records.map(r => (
                    <TableRow key={r.id} className="hover:bg-muted/50">
                      <TableCell>
                        <p className="text-xs font-mono font-semibold">{r.recordNo}</p>
                        {r.assetTag && <p className="text-[9px] text-muted-foreground">{r.assetTag}</p>}
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-medium">{r.assetName}</p>
                        <Badge variant="outline" className="text-[9px]">{r.category}</Badge>
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{r.systemQuantity}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums font-semibold">{r.countedQuantity}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={cn('text-[10px]', r.discrepancy < 0 ? 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400' : r.discrepancy > 0 ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400' : 'border-slate-300 bg-slate-50 text-slate-700')}>
                          {r.discrepancy > 0 ? '+' : ''}{r.discrepancy}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{r.countedBy}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <p>{formatDate(r.stocktakeDate)}</p>
                        <p className="text-[9px]">{timeAgo(r.createdAt)}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn('text-[10px]', STOCKTAKE_STATUS_BADGE[r.status])}>{r.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(data?.records.length ?? 0) === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                  <ClipboardCheck className="h-8 w-8" />
                  <p>No stocktake records yet.</p>
                  <Button size="sm" onClick={() => setShowAdd(true)} className="mt-2 bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4" /> Record first stocktake
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showAdd && (
        <StocktakeDialog
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); setRefreshKey(k => k + 1); toast.success('Stocktake recorded') }}
        />
      )}
    </div>
  )
}

function StocktakeDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [assetId, setAssetId] = useState('')
  const [countedQuantity, setCountedQuantity] = useState('0')
  const [notes, setNotes] = useState('')
  const [countedBy, setCountedBy] = useState('Store Keeper')
  const [adjustStock, setAdjustStock] = useState(false)
  const [saving, setSaving] = useState(false)

  const { data: inv } = useFetch<InventoryData>('/api/inventory')
  const trackedAssets = (inv?.assets || []).filter(a => a.reorderLevel > 0)
  const allAssets = inv?.assets || []
  const selected = allAssets.find(a => a.id === assetId)
  const systemQty = selected?.quantityInStock ?? 0
  const counted = Number(countedQuantity) || 0
  const discrepancy = counted - systemQty

  const handleSave = async () => {
    if (!assetId) { toast.error('Select an item to count'); return }
    setSaving(true)
    try {
      await apiPost('/api/inventory/stocktake', {
        assetId,
        countedQuantity: counted,
        notes: notes || null,
        countedBy,
        adjustStock,
      })
      onSaved()
    } catch (e: any) {
      toast.error(e.message || 'Failed to save stocktake')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5 text-emerald-600" /> New Stocktake
          </DialogTitle>
          <DialogDescription>
            Count physical stock and record any discrepancy vs the system quantity.
            Tick &ldquo;Adjust stock&rdquo; to immediately update the live stock level.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Item to Count <span className="text-rose-500">*</span></Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger><SelectValue placeholder="Select inventory item..." /></SelectTrigger>
              <SelectContent className="max-h-72">
                {trackedAssets.length > 0 && (
                  <>
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-400">Tracked Items (reorder on)</p>
                    {trackedAssets.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} · {formatNumber(a.quantityInStock)} {a.unit} in stock
                      </SelectItem>
                    ))}
                  </>
                )}
                {allAssets.filter(a => a.reorderLevel === 0).length > 0 && (
                  <>
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">Other Items</p>
                    {allAssets.filter(a => a.reorderLevel === 0).map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} · {formatNumber(a.quantityInStock)} {a.unit}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {selected && (
            <div className="rounded-lg border bg-emerald-50/40 p-3 dark:bg-emerald-950/20">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">System Qty</p>
                  <p className="text-base font-bold tabular-nums">{systemQty} {selected.unit}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Counted</p>
                  <p className="text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-400">{counted} {selected.unit}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground">Discrepancy</p>
                  <p className={cn('text-base font-bold tabular-nums', discrepancy < 0 ? 'text-rose-600 dark:text-rose-400' : discrepancy > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400')}>
                    {discrepancy > 0 ? '+' : ''}{discrepancy}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Counted Quantity</Label>
              <Input type="number" value={countedQuantity} onChange={e => setCountedQuantity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Counted By</Label>
              <Input value={countedBy} onChange={e => setCountedBy(e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notes / Reason for Discrepancy</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g. Damaged stock, theft suspected, miscount..." />
          </div>

          <label className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 text-xs dark:border-emerald-800 dark:bg-emerald-950/20 cursor-pointer">
            <input
              type="checkbox"
              checked={adjustStock}
              onChange={e => setAdjustStock(e.target.checked)}
              className="mt-0.5 h-4 w-4 accent-emerald-600"
            />
            <span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400">Adjust stock now</span>
              <br />
              <span className="text-muted-foreground">Sets the live stock level to the counted quantity and marks this record as &ldquo;Adjusted&rdquo;.</span>
            </span>
          </label>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !assetId} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? 'Saving…' : 'Record Stocktake'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ===========================================================================
// 3. RESTOCK REQUESTS TAB
// ===========================================================================

interface RestockData {
  stats: { total: number; pending: number; approved: number; ordered: number; received: number; rejected: number; totalEstimate: number; pendingEstimate: number }
  requests: Array<{
    id: string; requestNo: string; assetId: string; assetName: string; category: string
    requestedQuantity: number; unitPrice: number; estimatedCost: number
    suggestedSupplierId: string | null; suggestedSupplier: string | null
    reason: string | null; priority: string; status: string; requestedBy: string
    approvedBy: string | null; approvedAt: string | null; rejectedReason: string | null
    purchaseOrderId: string | null; notes: string | null; createdAt: string; updatedAt: string
    asset: { id: string; name: string; assetTag: string; category: string; quantityInStock: number; reorderLevel: number; unitPrice: number; supplierName: string | null } | null
  }>
}

function RestockTab() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [poDialog, setPoDialog] = useState<{ requestId: string; requestNo: string; assetName: string } | null>(null)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter !== 'all') params.set('status', statusFilter)
  if (priorityFilter !== 'all') params.set('priority', priorityFilter)
  const { data, loading } = useFetch<RestockData>(`/api/inventory/restock-request?${params.toString()}`, [refreshKey, search, statusFilter, priorityFilter])

  // Listen for quick-restock events from asset detail dialog
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { assetId: string; name: string }
      setShowAdd(true)
      window.__pendingRestockAsset = detail
    }
    window.addEventListener('inventory:quick-restock', handler)
    return () => window.removeEventListener('inventory:quick-restock', handler)
  }, [])

  const handleApprove = async (id: string) => {
    try {
      await apiPut(`/api/inventory/restock-request/${id}`, { status: 'Approved', approvedBy: 'Admin' })
      toast.success('Restock request approved')
      setRefreshKey(k => k + 1)
    } catch (e: any) { toast.error(e.message || 'Failed to approve') }
  }
  const handleReject = async (id: string) => {
    try {
      await apiPut(`/api/inventory/restock-request/${id}`, { status: 'Rejected', rejectedReason: 'Rejected by approver' })
      toast.success('Restock request rejected')
      setRefreshKey(k => k + 1)
    } catch (e: any) { toast.error(e.message || 'Failed to reject') }
  }

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <ShoppingCart className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{data?.stats.pending ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{data?.stats.approved ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 ring-1 ring-cyan-500/20">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Ordered</p>
              <p className="text-2xl font-bold">{data?.stats.ordered ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending Estimate</p>
              <p className="text-2xl font-bold">{formatKES(data?.stats.pendingEstimate ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by request no, item, requester, supplier..." className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {['Pending', 'Approved', 'Ordered', 'Received', 'Rejected'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> New Request
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Restock Requests</CardTitle>
          <CardDescription className="text-xs">{data?.requests.length ?? 0} requests · latest first</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">Request No</TableHead>
                    <TableHead className="text-xs">Item</TableHead>
                    <TableHead className="text-right text-xs">Qty</TableHead>
                    <TableHead className="text-right text-xs">Est. Cost</TableHead>
                    <TableHead className="text-xs">Supplier</TableHead>
                    <TableHead className="text-center text-xs">Priority</TableHead>
                    <TableHead className="text-center text-xs">Status</TableHead>
                    <TableHead className="text-right text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.requests.map(r => (
                    <TableRow key={r.id} className="hover:bg-muted/50">
                      <TableCell>
                        <p className="text-xs font-mono font-semibold">{r.requestNo}</p>
                        <p className="text-[9px] text-muted-foreground">{timeAgo(r.createdAt)}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-xs font-medium">{r.assetName}</p>
                        <Badge variant="outline" className="text-[9px]">{r.category}</Badge>
                        {r.asset && r.asset.reorderLevel > 0 && (
                          <p className="text-[9px] text-muted-foreground">stock: {r.asset.quantityInStock} / reorder {r.asset.reorderLevel}</p>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{r.requestedQuantity}</TableCell>
                      <TableCell className="text-right text-xs font-semibold tabular-nums">{formatKES(r.estimatedCost)}</TableCell>
                      <TableCell className="text-xs">{r.suggestedSupplier || <span className="text-muted-foreground">—</span>}</TableCell>
                      <TableCell className="text-center"><Badge variant="outline" className={cn('text-[10px]', PRIORITY_BADGE[r.priority])}>{r.priority}</Badge></TableCell>
                      <TableCell className="text-center"><Badge variant="outline" className={cn('text-[10px]', RESTOCK_STATUS_BADGE[r.status])}>{r.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {r.status === 'Pending' && (
                            <>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700" onClick={() => handleApprove(r.id)}>
                                <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-rose-600 hover:text-rose-700" onClick={() => handleReject(r.id)}>
                                <XCircle className="h-3.5 w-3.5" /> Reject
                              </Button>
                            </>
                          )}
                          {r.status === 'Approved' && (
                            <Button size="sm" className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => setPoDialog({ requestId: r.id, requestNo: r.requestNo, assetName: r.assetName })}>
                              <FileText className="h-3.5 w-3.5" /> Create PO
                            </Button>
                          )}
                          {r.status === 'Ordered' && <Badge variant="outline" className="text-[10px]">PO created</Badge>}
                          {r.status === 'Received' && <Badge variant="outline" className="text-[10px] border-teal-300 bg-teal-50 text-teal-700">Completed</Badge>}
                          {r.status === 'Rejected' && r.rejectedReason && (
                            <span className="text-[10px] text-rose-500" title={r.rejectedReason}>rejected</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(data?.requests.length ?? 0) === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                  <ShoppingCart className="h-8 w-8" />
                  <p>No restock requests yet.</p>
                  <Button size="sm" onClick={() => setShowAdd(true)} className="mt-2 bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4" /> Create restock request
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showAdd && (
        <RestockDialog
          onClose={() => { setShowAdd(false); window.__pendingRestockAsset = undefined }}
          onSaved={() => { setShowAdd(false); setRefreshKey(k => k + 1); toast.success('Restock request created') }}
        />
      )}

      {poDialog && (
        <CreatePOFromRestockDialog
          request={poDialog}
          onClose={() => setPoDialog(null)}
          onCreated={() => { setPoDialog(null); setRefreshKey(k => k + 1); toast.success('Purchase order created') }}
        />
      )}
    </div>
  )
}

function RestockDialog({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const pendingAsset = (typeof window !== 'undefined' ? (window as any).__pendingRestockAsset : undefined) as { assetId: string; name: string } | undefined
  const [assetId, setAssetId] = useState(pendingAsset?.assetId || '')
  const [requestedQuantity, setRequestedQuantity] = useState('10')
  const [unitPrice, setUnitPrice] = useState('0')
  const [supplierId, setSupplierId] = useState('')
  const [suggestedSupplier, setSuggestedSupplier] = useState('')
  const [reason, setReason] = useState('Low stock')
  const [priority, setPriority] = useState('Normal')
  const [requestedBy, setRequestedBy] = useState('Store Keeper')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: inv } = useFetch<InventoryData>('/api/inventory')
  const { data: sup } = useFetch<{ suppliers: Array<{ id: string; name: string; category: string }> }>('/api/inventory/suppliers')
  const allAssets = inv?.assets || []
  const lowStock = allAssets.filter(a => a.isLowStock)
  const selected = allAssets.find(a => a.id === assetId)

  const estimatedCost = (Number(requestedQuantity) || 0) * (Number(unitPrice) || (selected?.unitPrice ?? 0))

  const handleSave = async () => {
    if (!assetId) { toast.error('Select an item'); return }
    setSaving(true)
    try {
      await apiPost('/api/inventory/restock-request', {
        assetId,
        requestedQuantity: Number(requestedQuantity) || 1,
        unitPrice: Number(unitPrice) || (selected?.unitPrice ?? 0),
        suggestedSupplierId: supplierId || null,
        suggestedSupplier: suggestedSupplier || (selected?.supplierName ?? null),
        reason,
        priority,
        requestedBy,
        notes: notes || null,
      })
      onSaved()
    } catch (e: any) {
      toast.error(e.message || 'Failed to create request')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-emerald-600" /> New Restock Request
          </DialogTitle>
          <DialogDescription>
            Request more stock for an item. The request can be approved, then converted to a
            purchase order which updates stock on receipt.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Item <span className="text-rose-500">*</span></Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger><SelectValue placeholder="Select item..." /></SelectTrigger>
              <SelectContent className="max-h-72">
                {lowStock.length > 0 && (
                  <>
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase text-rose-600 dark:text-rose-400">Low Stock ({lowStock.length})</p>
                    {lowStock.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} · {formatNumber(a.quantityInStock)}/{formatNumber(a.reorderLevel)} {a.unit}
                      </SelectItem>
                    ))}
                  </>
                )}
                {allAssets.filter(a => !a.isLowStock).length > 0 && (
                  <>
                    <p className="px-2 py-1 text-[10px] font-semibold uppercase text-muted-foreground">All Other Items</p>
                    {allAssets.filter(a => !a.isLowStock).map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} · {formatNumber(a.quantityInStock)} {a.unit}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          {selected && (
            <div className="grid grid-cols-3 gap-2 rounded-lg border bg-emerald-50/40 p-3 text-center dark:bg-emerald-950/20">
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">In Stock</p>
                <p className="text-sm font-bold tabular-nums">{formatNumber(selected.quantityInStock)} {selected.unit}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Reorder At</p>
                <p className="text-sm font-bold tabular-nums">{formatNumber(selected.reorderLevel)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase text-muted-foreground">Unit Price</p>
                <p className="text-sm font-bold tabular-nums">{formatKES(selected.unitPrice)}</p>
              </div>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Requested Quantity</Label>
              <Input type="number" value={requestedQuantity} onChange={e => setRequestedQuantity(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Unit Price (KES)</Label>
              <Input type="number" value={unitPrice} onChange={e => setUnitPrice(e.target.value)} placeholder="leave 0 to use item default" />
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Estimated Total Cost</span>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-400">{formatKES(estimatedCost)}</span>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Suggested Supplier</Label>
              <Select value={supplierId} onValueChange={(v) => { setSupplierId(v === 'none' ? '' : v); setSuggestedSupplier(v === 'none' ? '' : (sup?.suppliers.find(s => s.id === v)?.name || '')) }}>
                <SelectTrigger><SelectValue placeholder="Pick supplier (optional)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— Free text below —</SelectItem>
                  {sup?.suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Or Supplier Name</Label>
              <Input value={suggestedSupplier} onChange={e => setSuggestedSupplier(e.target.value)} placeholder="Free text supplier" />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Reason</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Low stock', 'Stocktake shortage', 'Damaged', 'New term demand', 'Routine reorder', 'Other'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Requested By</Label>
            <Input value={requestedBy} onChange={e => setRequestedBy(e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional notes for the approver" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || !assetId} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? 'Saving…' : 'Create Request'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function CreatePOFromRestockDialog({ request, onClose, onCreated }: { request: { requestId: string; requestNo: string; assetName: string }; onClose: () => void; onCreated: () => void }) {
  const [supplierId, setSupplierId] = useState('')
  const [saving, setSaving] = useState(false)
  const { data: sup } = useFetch<{ suppliers: Array<{ id: string; name: string; category: string }> }>('/api/inventory/suppliers')

  const handleCreate = async () => {
    if (!supplierId) { toast.error('Select a supplier'); return }
    setSaving(true)
    try {
      await apiPost('/api/inventory/purchase-order', {
        restockRequestId: request.requestId,
        supplierId,
      })
      onCreated()
    } catch (e: any) {
      toast.error(e.message || 'Failed to create PO')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" /> Create Purchase Order
          </DialogTitle>
          <DialogDescription>
            From restock request <span className="font-mono font-semibold">{request.requestNo}</span> for
            &ldquo;{request.assetName}&rdquo;.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            The PO will be auto-filled with the restock&apos;s quantity, unit price and line item,
            then marked <Badge variant="outline" className="text-[10px]">Approved</Badge> and the restock
            will move to <Badge variant="outline" className="text-[10px]">Ordered</Badge>.
          </p>
          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Supplier <span className="text-rose-500">*</span></Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="Pick supplier..." /></SelectTrigger>
              <SelectContent>
                {sup?.suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name} · {s.category}</SelectItem>)}
              </SelectContent>
            </Select>
            {(!sup || sup.suppliers.length === 0) && (
              <p className="text-[10px] text-amber-600">No active suppliers found. Add suppliers via the Procurement module first.</p>
            )}
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving || !supplierId} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? 'Creating…' : 'Create Purchase Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ===========================================================================
// 4. PURCHASE ORDERS TAB
// ===========================================================================

interface POData {
  stats: { total: number; pending: number; approved: number; ordered: number; received: number; cancelled: number; totalValue: number; pendingValue: number }
  orders: Array<{
    id: string; poNumber: string; supplierId: string
    supplier: { id: string; name: string; category: string; phone: string | null; email: string | null } | null
    item: string; description: string | null; quantity: number; unitPrice: number; totalAmount: number
    status: string; requestedBy: string | null; approvedBy: string | null
    orderDate: string; deliveryDate: string | null; receivedDate: string | null
    restockRequestId: string | null; notes: string | null; createdAt: string
    items: Array<{ id: string; assetId: string | null; itemName: string; quantity: number; unitPrice: number; totalPrice: number; receivedQuantity: number }>
  }>
}

function PurchaseOrderTab() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (statusFilter !== 'all') params.set('status', statusFilter)
  const { data, loading } = useFetch<POData>(`/api/inventory/purchase-order?${params.toString()}`, [refreshKey, search, statusFilter])

  const handleAction = async (id: string, status: string) => {
    try {
      await apiPut(`/api/inventory/purchase-order/${id}`, { status })
      const msg = status === 'Received' ? 'PO marked as received — stock updated!' : `PO ${status.toLowerCase()}`
      toast.success(msg)
      setRefreshKey(k => k + 1)
    } catch (e: any) { toast.error(e.message || `Failed to ${status.toLowerCase()} PO`) }
  }

  return (
    <div className="space-y-4">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending</p>
              <p className="text-2xl font-bold">{data?.stats.pending ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Approved</p>
              <p className="text-2xl font-bold">{data?.stats.approved ?? 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-600 ring-1 ring-cyan-500/20">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Ordered</p>
              <p className="text-2xl font-bold">{data?.stats.ordered ?? 0}</p>
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
              <p className="text-2xl font-bold">{formatKES(data?.stats.totalValue ?? 0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by PO no, item, supplier..." className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {['Pending', 'Approved', 'Ordered', 'Received', 'Cancelled'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setShowAdd(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> New PO
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Purchase Orders</CardTitle>
          <CardDescription className="text-xs">{data?.orders.length ?? 0} orders · latest first</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="text-xs">PO No</TableHead>
                    <TableHead className="text-xs">Supplier</TableHead>
                    <TableHead className="text-xs">Item(s)</TableHead>
                    <TableHead className="text-right text-xs">Qty</TableHead>
                    <TableHead className="text-right text-xs">Total</TableHead>
                    <TableHead className="text-xs">Order Date</TableHead>
                    <TableHead className="text-center text-xs">Status</TableHead>
                    <TableHead className="text-right text-xs">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.orders.map(po => {
                    const isExpanded = expanded === po.id
                    const hasItems = po.items.length > 0
                    return (
                      <Fragment key={po.id}>
                        <TableRow className="hover:bg-muted/50">
                          <TableCell>
                            <p className="text-xs font-mono font-semibold">{po.poNumber}</p>
                            {po.restockRequestId && <p className="text-[9px] text-emerald-600">from restock</p>}
                            <p className="text-[9px] text-muted-foreground">{timeAgo(po.createdAt)}</p>
                          </TableCell>
                          <TableCell>
                            <p className="text-xs font-medium">{po.supplier?.name || '—'}</p>
                            {po.supplier?.category && <Badge variant="outline" className="text-[9px]">{po.supplier.category}</Badge>}
                          </TableCell>
                          <TableCell>
                            <p className="text-xs">{po.item}</p>
                            {hasItems && (
                              <button
                                onClick={() => setExpanded(isExpanded ? null : po.id)}
                                className="text-[10px] text-emerald-600 hover:underline"
                              >
                                {isExpanded ? 'Hide' : 'Show'} {po.items.length} line item{po.items.length !== 1 ? 's' : ''}
                              </button>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs tabular-nums">{po.quantity}</TableCell>
                          <TableCell className="text-right text-xs font-semibold tabular-nums">{formatKES(po.totalAmount)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            <p>{formatDate(po.orderDate)}</p>
                            {po.receivedDate && <p className="text-[9px] text-emerald-600">recv: {formatDate(po.receivedDate)}</p>}
                          </TableCell>
                          <TableCell className="text-center"><Badge variant="outline" className={cn('text-[10px]', PO_STATUS_BADGE[po.status])}>{po.status}</Badge></TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              {po.status === 'Pending' && (
                                <Button size="sm" className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-700" onClick={() => handleAction(po.id, 'Approved')}>
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                                </Button>
                              )}
                              {po.status === 'Approved' && (
                                <Button size="sm" className="h-7 px-2 text-xs bg-cyan-600 hover:bg-cyan-700" onClick={() => handleAction(po.id, 'Ordered')}>
                                  <Truck className="h-3.5 w-3.5" /> Order
                                </Button>
                              )}
                              {po.status === 'Ordered' && (
                                <Button size="sm" className="h-7 px-2 text-xs bg-teal-600 hover:bg-teal-700" onClick={() => handleAction(po.id, 'Received')}>
                                  <CheckCircle2 className="h-3.5 w-3.5" /> Mark Received
                                </Button>
                              )}
                              {po.status === 'Received' && <Badge variant="outline" className="text-[10px] border-teal-300 bg-teal-50 text-teal-700">Stock updated</Badge>}
                              {po.status === 'Cancelled' && <Badge variant="outline" className="text-[10px]">Cancelled</Badge>}
                            </div>
                          </TableCell>
                        </TableRow>
                        {isExpanded && hasItems && (
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={8} className="p-3">
                              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                                {po.items.map(it => (
                                  <div key={it.id} className="rounded-lg border bg-background p-3 text-xs">
                                    <p className="font-medium">{it.itemName}</p>
                                    <div className="mt-1 flex items-center justify-between text-muted-foreground">
                                      <span>{it.quantity} × {formatKES(it.unitPrice)}</span>
                                      <span className="font-semibold text-foreground">{formatKES(it.totalPrice)}</span>
                                    </div>
                                    {it.assetId && <Badge variant="outline" className="mt-1 text-[9px]">linked to asset</Badge>}
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </Fragment>
                    )
                  })}
                </TableBody>
              </Table>
              {(data?.orders.length ?? 0) === 0 && (
                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
                  <FileText className="h-8 w-8" />
                  <p>No purchase orders yet.</p>
                  <Button size="sm" onClick={() => setShowAdd(true)} className="mt-2 bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4" /> Create purchase order
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showAdd && (
        <CreatePODialog
          onClose={() => setShowAdd(false)}
          onCreated={() => { setShowAdd(false); setRefreshKey(k => k + 1); toast.success('Purchase order created') }}
        />
      )}
    </div>
  )
}

function CreatePODialog({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [supplierId, setSupplierId] = useState('')
  const [requestedBy, setRequestedBy] = useState('Admin')
  const [status, setStatus] = useState('Pending')
  const [notes, setNotes] = useState('')
  const [items, setItems] = useState<Array<{ assetId: string; itemName: string; quantity: string; unitPrice: string }>>([
    { assetId: '', itemName: '', quantity: '1', unitPrice: '0' },
  ])
  const [saving, setSaving] = useState(false)

  const { data: sup } = useFetch<{ suppliers: Array<{ id: string; name: string; category: string }> }>('/api/inventory/suppliers')
  const { data: inv } = useFetch<InventoryData>('/api/inventory')

  const total = items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0)

  const updateItem = (i: number, patch: Partial<typeof items[0]>) => {
    setItems(prev => prev.map((it, idx) => idx === i ? { ...it, ...patch } : it))
  }
  // When an asset is selected from the dropdown, auto-fill itemName + unitPrice from the asset
  const onAssetSelect = (i: number, assetId: string) => {
    const asset = inv?.assets.find(a => a.id === assetId)
    if (asset) {
      updateItem(i, { assetId, itemName: asset.name, unitPrice: String(asset.unitPrice || 0) })
    } else {
      updateItem(i, { assetId: '' })
    }
  }

  const handleSave = async () => {
    if (!supplierId) { toast.error('Select a supplier'); return }
    const cleanItems = items
      .filter(it => it.itemName.trim() || it.assetId)
      .map(it => ({
        assetId: it.assetId || null,
        itemName: it.itemName.trim() || 'Item',
        quantity: Math.max(1, Number(it.quantity) || 1),
        unitPrice: Math.max(0, Number(it.unitPrice) || 0),
      }))
    if (cleanItems.length === 0) { toast.error('Add at least one line item'); return }
    setSaving(true)
    try {
      await apiPost('/api/inventory/purchase-order', {
        supplierId,
        items: cleanItems,
        requestedBy,
        status,
        notes: notes || null,
      })
      onCreated()
    } catch (e: any) {
      toast.error(e.message || 'Failed to create PO')
    } finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-emerald-600" /> New Purchase Order
          </DialogTitle>
          <DialogDescription>
            Create a free-form PO with one or more line items. When received, every line item linked
            to an inventory asset will bump that asset&apos;s stock level.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-1">
              <Label className="text-xs font-medium">Supplier <span className="text-rose-500">*</span></Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <SelectTrigger><SelectValue placeholder="Pick supplier..." /></SelectTrigger>
                <SelectContent>
                  {sup?.suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              {(!sup || sup.suppliers.length === 0) && (
                <p className="text-[10px] text-amber-600">No suppliers yet. Add via Procurement module.</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Requested By</Label>
              <Input value={requestedBy} onChange={e => setRequestedBy(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Initial Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Pending', 'Approved', 'Ordered'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Line items */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium">Line Items</Label>
              <Button
                size="sm" variant="outline"
                onClick={() => setItems(prev => [...prev, { assetId: '', itemName: '', quantity: '1', unitPrice: '0' }])}
              >
                <Plus className="h-3 w-3" /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 rounded-lg border p-2">
                  <div className="col-span-12 sm:col-span-5">
                    <Select value={it.assetId} onValueChange={(v) => v === 'none' ? onAssetSelect(i, '') : onAssetSelect(i, v)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pick inventory item (or type below)" /></SelectTrigger>
                      <SelectContent className="max-h-72">
                        <SelectItem value="none">— Free text —</SelectItem>
                        {(inv?.assets || []).map(a => (
                          <SelectItem key={a.id} value={a.id}>{a.name} ({a.category})</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="mt-1 h-8 text-xs"
                      value={it.itemName}
                      onChange={e => updateItem(i, { itemName: e.target.value, assetId: '' })}
                      placeholder="Or type item name"
                    />
                  </div>
                  <div className="col-span-4 sm:col-span-3">
                    <Label className="text-[9px] uppercase text-muted-foreground">Qty</Label>
                    <Input type="number" className="h-8 text-xs" value={it.quantity} onChange={e => updateItem(i, { quantity: e.target.value })} />
                  </div>
                  <div className="col-span-5 sm:col-span-3">
                    <Label className="text-[9px] uppercase text-muted-foreground">Unit Price</Label>
                    <Input type="number" className="h-8 text-xs" value={it.unitPrice} onChange={e => updateItem(i, { unitPrice: e.target.value })} />
                  </div>
                  <div className="col-span-3 sm:col-span-1 flex items-end">
                    {items.length > 1 && (
                      <Button size="sm" variant="ghost" className="h-8 w-full text-rose-600 hover:text-rose-700" onClick={() => setItems(prev => prev.filter((_, idx) => idx !== i))}>
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 dark:border-emerald-800 dark:bg-emerald-950/20">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">PO Total</span>
              <span className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{formatKES(total)}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium">Notes</Label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Optional notes" />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? 'Saving…' : 'Create Purchase Order'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Augment the Window type for the cross-component restock trigger
declare global {
  interface Window { __pendingRestockAsset?: { assetId: string; name: string } }
}
