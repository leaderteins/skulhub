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
import { formatDate, formatDateTime, timeAgo, statusColor } from '@/lib/format'
import { toast } from 'sonner'
import {
  UtensilsCrossed, Coffee, Sun, Moon, Cookie, Plus, ChevronRight,
  Users, ChefHat, CheckCircle2, Clock, X, CalendarDays,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

interface CafeteriaData {
  stats: {
    totalMenus: number; servedMenus: number; plannedMenus: number
    totalAttendance: number; totalServed: number; todayMeals: number
  }
  menus: Array<{
    id: string; date: string; mealType: string; item: string; accompaniment: string | null
    beverage: string | null; notes: string | null; servingsPlanned: number; servingsServed: number
    status: string; cook: string | null
    totalAttendance: number; studentAttendance: number; staffAttendance: number
    attendances: Array<{ id: string; personType: string; headcount: number; notes: string | null }>
  }>
  byMealType: Array<{ name: string; count: number }>
  byStatus: Array<{ name: string; count: number }>
  todayMeals: Array<{ id: string; date: string; mealType: string; item: string; accompaniment: string | null; beverage: string | null; status: string }>
}

const MEAL_META: Record<string, { icon: any; color: string; bg: string; text: string; dot: string }> = {
  Breakfast: { icon: Coffee, color: 'amber', bg: 'bg-amber-500/10', text: 'text-amber-600', dot: '#f59e0b' },
  Lunch: { icon: Sun, color: 'emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-600', dot: '#10b981' },
  'Tea Break': { icon: Cookie, color: 'violet', bg: 'bg-violet-500/10', text: 'text-violet-600', dot: '#8b5cf6' },
  Supper: { icon: Moon, color: 'indigo', bg: 'bg-indigo-500/10', text: 'text-indigo-600', dot: '#6366f1' },
}

const STATUS_BADGE: Record<string, string> = {
  Served: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  Planned: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  Cancelled: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
}

export function CafeteriaModule() {
  const { data, loading } = useFetch<CafeteriaData>('/api/cafeteria')
  const [mealTypeFilter, setMealTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)

  const params = new URLSearchParams()
  if (mealTypeFilter !== 'all') params.set('mealType', mealTypeFilter)
  if (statusFilter !== 'all') params.set('status', statusFilter)
  const { data: filtered } = useFetch<CafeteriaData>(`/api/cafeteria?${params.toString()}`, [mealTypeFilter, statusFilter])

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
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <UtensilsCrossed className="h-3 w-3" /> {stats.todayMeals} meals today · {stats.servedMenus} served · {stats.totalAttendance} diners total
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Cafeteria & Meals</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Manage daily menus, track dining attendance, and plan nutritious meals for students and staff.
            </p>
          </div>
          <Button variant="secondary" size="sm" className="bg-white text-orange-600 hover:bg-white/90" onClick={() => setShowAddDialog(true)}>
            <Plus className="mr-1.5 h-4 w-4" /> New Menu
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Menus</p>
              <p className="text-2xl font-bold">{stats.totalMenus}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Meals Served</p>
              <p className="text-2xl font-bold">{stats.servedMenus}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Diners</p>
              <p className="text-2xl font-bold">{stats.totalAttendance}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Servings Served</p>
              <p className="text-2xl font-bold">{stats.totalServed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's meals */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <ChefHat className="h-4 w-4 text-amber-500" />
            <CardTitle className="text-base">Today's Menu</CardTitle>
          </div>
          <CardDescription className="text-xs">{display.todayMeals.length} meals scheduled for today</CardDescription>
        </CardHeader>
        <CardContent>
          {display.todayMeals.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {display.todayMeals.map(m => {
                const meta = MEAL_META[m.mealType] || MEAL_META.Breakfast
                const Icon = meta.icon
                return (
                  <div key={m.id} className="rounded-xl border p-3 transition-colors hover:bg-muted/40">
                    <div className="flex items-center gap-2">
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', meta.bg, meta.text)}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold">{m.mealType}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(m.date).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                      <Badge variant="outline" className={cn('text-[10px]', STATUS_BADGE[m.status])}>{m.status}</Badge>
                    </div>
                    <div className="mt-2 space-y-0.5">
                      <p className="text-sm font-medium">{m.item}</p>
                      {m.accompaniment && <p className="text-[10px] text-muted-foreground">with {m.accompaniment}</p>}
                      {m.beverage && <p className="text-[10px] text-muted-foreground">{m.beverage}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : <p className="py-4 text-center text-xs text-muted-foreground">No meals scheduled for today.</p>}
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Menus by Meal Type</CardTitle>
            <CardDescription className="text-xs">Distribution across meal times</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={display.byMealType} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {display.byMealType.map(m => <Cell key={m.name} fill={MEAL_META[m.name]?.dot || '#94a3b8'} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-2 text-[10px]">
              {display.byMealType.map(m => {
                const Icon = MEAL_META[m.name]?.icon || Coffee
                return (
                  <div key={m.name} className="flex items-center gap-1">
                    <Icon className="h-2.5 w-2.5" style={{ color: MEAL_META[m.name]?.dot }} />
                    <span className="font-medium">{m.name}</span><span className="text-muted-foreground">{m.count}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Menu Status</CardTitle>
            <CardDescription className="text-xs">Planned vs served</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={display.byStatus} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} cursor={{ fill: 'oklch(0.96 0.01 150)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {display.byStatus.map(s => <Cell key={s.name} fill={s.name === 'Served' ? '#10b981' : s.name === 'Planned' ? '#f59e0b' : '#ef4444'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
          <Select value={mealTypeFilter} onValueChange={setMealTypeFilter}>
            <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Meal Type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Meals</SelectItem>
              {Object.keys(MEAL_META).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Planned">Planned</SelectItem>
              <SelectItem value="Served">Served</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Menu table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Menu History</CardTitle>
          <CardDescription className="text-xs">{display.menus.length} records · latest first</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="text-xs">Meal</TableHead>
                  <TableHead className="text-xs">Main Dish</TableHead>
                  <TableHead className="text-xs">Accompaniment</TableHead>
                  <TableHead className="text-xs">Beverage</TableHead>
                  <TableHead className="text-right text-xs">Planned</TableHead>
                  <TableHead className="text-right text-xs">Served</TableHead>
                  <TableHead className="text-right text-xs">Diners</TableHead>
                  <TableHead className="text-center text-xs">Status</TableHead>
                  <TableHead className="text-xs">Date</TableHead>
                  <TableHead className="text-right text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {display.menus.map(m => {
                  const meta = MEAL_META[m.mealType] || MEAL_META.Breakfast
                  const Icon = meta.icon
                  return (
                    <TableRow key={m.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedMenu(m.id)}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', meta.bg, meta.text)}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-medium">{m.mealType}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs font-medium">{m.item}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.accompaniment || '—'}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.beverage || '—'}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{m.servingsPlanned}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums">{m.servingsServed}</TableCell>
                      <TableCell className="text-right text-xs tabular-nums font-semibold">{m.totalAttendance}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={cn('text-[10px]', STATUS_BADGE[m.status])}>{m.status}</Badge>
                      </TableCell>
                      <TableCell className="text-[10px] text-muted-foreground">{formatDate(m.date)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedMenu(m.id) }}>
                          View <ChevronRight className="ml-0.5 h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          {display.menus.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-12 text-center text-sm text-muted-foreground">
              <UtensilsCrossed className="h-8 w-8" />
              <p>No menus match your filters.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail dialog */}
      {selectedMenu && <MenuDetailDialog menuId={selectedMenu} onClose={() => setSelectedMenu(null)} />}
      {/* Add dialog */}
      {showAddDialog && <AddMenuDialog onClose={() => setShowAddDialog(false)} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Menu Detail Dialog
// ---------------------------------------------------------------------------
function MenuDetailDialog({ menuId, onClose }: { menuId: string; onClose: () => void }) {
  const { data: menu, loading } = useFetch<any>(`/api/cafeteria/${menuId}`)

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto scrollbar-thin">
        {loading || !menu ? (
          <div className="p-6 space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UtensilsCrossed className="h-5 w-5 text-amber-500" /> Menu Details
              </DialogTitle>
              <DialogDescription>{menu.mealType} · {formatDateTime(menu.date)}</DialogDescription>
            </DialogHeader>

            {/* Menu header */}
            {(() => {
              const meta = MEAL_META[menu.mealType] || MEAL_META.Breakfast
              const Icon = meta.icon
              return (
                <div className="flex items-start gap-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-4 dark:from-amber-950/30 dark:to-orange-950/30">
                  <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', meta.bg, meta.text)}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold">{menu.item}</p>
                    <p className="text-xs text-muted-foreground">{menu.mealType} · {menu.cook ? `Cook: ${menu.cook}` : 'No cook assigned'}</p>
                    <div className="mt-1">
                      <Badge variant="outline" className={cn('text-[10px]', STATUS_BADGE[menu.status])}>{menu.status}</Badge>
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Meal details */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Accompaniment</p>
                <p className="text-sm font-medium">{menu.accompaniment || '—'}</p>
              </div>
              <div className="rounded-xl border p-3">
                <p className="text-[10px] uppercase text-muted-foreground">Beverage</p>
                <p className="text-sm font-medium">{menu.beverage || '—'}</p>
              </div>
            </div>

            {/* Servings grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border bg-muted/30 p-3 text-center">
                <p className="text-[10px] uppercase text-muted-foreground">Planned</p>
                <p className="text-lg font-bold">{menu.servingsPlanned}</p>
              </div>
              <div className="rounded-xl border bg-emerald-50/40 p-3 text-center dark:bg-emerald-950/20">
                <p className="text-[10px] uppercase text-emerald-700 dark:text-emerald-400">Served</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{menu.servingsServed}</p>
              </div>
              <div className="rounded-xl border bg-amber-50/40 p-3 text-center dark:bg-amber-950/20">
                <p className="text-[10px] uppercase text-amber-700 dark:text-amber-400">Diners</p>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{menu.attendances.reduce((s: number, a: any) => s + a.headcount, 0)}</p>
              </div>
            </div>

            {menu.notes && (
              <div className="rounded-lg bg-muted/40 p-3 text-xs">
                <span className="font-semibold">Notes: </span>{menu.notes}
              </div>
            )}

            {/* Attendance breakdown */}
            {menu.attendances.length > 0 && (
              <div>
                <p className="mb-2 text-sm font-semibold">Attendance Breakdown</p>
                <div className="space-y-1.5">
                  {menu.attendances.map((a: any) => (
                    <div key={a.id} className="flex items-center justify-between rounded-lg border p-2.5">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">{a.personType}</Badge>
                        {a.notes && <span className="text-[10px] text-muted-foreground">{a.notes}</span>}
                      </div>
                      <span className="text-sm font-bold">{a.headcount} diners</span>
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

// ---------------------------------------------------------------------------
// Add Menu Dialog
// ---------------------------------------------------------------------------
function AddMenuDialog({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    mealType: 'Breakfast', item: '', accompaniment: '', beverage: '', notes: '',
    servingsPlanned: '200', date: '', cook: '',
  })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!form.item || !form.date) { toast.error('Main dish and date are required'); return }
    setSaving(true)
    try {
      const res = await fetch('/api/cafeteria', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, status: 'Planned' }),
      })
      if (!res.ok) throw new Error('Failed to create menu')
      toast.success('Menu created successfully')
      onClose()
    } catch (e: any) { toast.error(e?.message || 'Failed to create menu') }
    finally { setSaving(false) }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-amber-500" /> New Meal Menu</DialogTitle>
          <DialogDescription>Plan a meal for the cafeteria</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Meal Type *</Label>
              <Select value={form.mealType} onValueChange={v => setForm({ ...form, mealType: v })}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.keys(MEAL_META).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Date & Time *</Label>
              <Input type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="mt-1" />
            </div>
          </div>
          <div><Label className="text-xs">Main Dish *</Label><Input value={form.item} onChange={e => setForm({ ...form, item: e.target.value })} placeholder="e.g. Ugali & Sukuma Wiki" className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Accompaniment</Label><Input value={form.accompaniment} onChange={e => setForm({ ...form, accompaniment: e.target.value })} placeholder="e.g. Beef Stew" className="mt-1" /></div>
            <div><Label className="text-xs">Beverage</Label><Input value={form.beverage} onChange={e => setForm({ ...form, beverage: e.target.value })} placeholder="e.g. Tea" className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Servings Planned</Label><Input type="number" value={form.servingsPlanned} onChange={e => setForm({ ...form, servingsPlanned: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Cook</Label><Input value={form.cook} onChange={e => setForm({ ...form, cook: e.target.value })} placeholder="Chef name" className="mt-1" /></div>
          </div>
          <div><Label className="text-xs">Notes</Label><Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1" rows={2} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving} className="bg-amber-600 hover:bg-amber-700">{saving ? 'Creating...' : 'Create Menu'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
