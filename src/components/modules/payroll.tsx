'use client'
import { useState, useMemo } from 'react'
import { useFetch, apiPost, apiPut } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatKES, formatDate, statusColor } from '@/lib/format'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import {
  Banknote, Plus, CheckCircle2, Clock, Wallet, TrendingUp,
  ChevronRight, Search, Receipt, X, AlertCircle,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

interface PayrollData {
  stats: {
    total: number; pending: number; paid: number
    totalPayroll: number; paidTotal: number; avgNetPay: number
    totalTax: number; activeStaff: number
  }
  payslips: Array<{
    id: string; payslipNo: string; staffId: string; month: string; year: number
    basicSalary: number; allowances: number; deductions: number
    taxPAYE: number; nssf: number; nhif: number; netPay: number
    status: string; payDate: string | null; createdAt: string
    staffName: string; staffRole: string; staffDept: string
    staff: { employeeNo: string }
  }>
  byStatus: Array<{ name: string; count: number; total: number }>
  byMonth: Array<{ name: string; total: number; count: number }>
}

interface StaffListData {
  staff: Array<{
    id: string; employeeNo: string; firstName: string; lastName: string
    role: string; status: string; salary: number; employmentType: string
    department: { id: string; name: string } | null
  }>
  total: number
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const STATUS_BADGE: Record<string, string> = {
  Pending: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  Approved: 'border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-400',
  Paid: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
}

const STATUS_DOT: Record<string, string> = {
  Pending: '#f59e0b', Approved: '#14b8a6', Paid: '#10b981',
}

export function PayrollModule() {
  const { user } = useAuthStore()
  const { data, loading, refetch } = useFetch<PayrollData>('/api/payroll')
  const { data: staffData } = useFetch<StaffListData>('/api/staff?status=Active')

  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [showGenDialog, setShowGenDialog] = useState(false)
  const [selectedPayslip, setSelectedPayslip] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const filteredPayslips = useMemo(() => {
    if (!data) return []
    return data.payslips.filter(p => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false
      if (search) {
        const q = search.toLowerCase()
        if (!p.staffName.toLowerCase().includes(q) &&
            !p.payslipNo.toLowerCase().includes(q) &&
            !p.staff.employeeNo.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [data, statusFilter, search])

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
  const stats = d.stats

  const activeStaff = staffData?.staff || []

  const handleStatusUpdate = async (id: string, status: 'Approved' | 'Paid') => {
    setActionLoading(id)
    try {
      await apiPut(`/api/payroll/${id}`, { status, updatedBy: user?.name || 'Bursar' })
      toast.success(`Payslip ${status.toLowerCase()}`, {
        description: status === 'Paid' ? 'Payment recorded successfully.' : 'Payslip approved.',
      })
      refetch()
    } catch (e: any) {
      toast.error('Failed to update payslip', { description: e.message })
    } finally {
      setActionLoading(null)
    }
  }

  const selected = selectedPayslip ? d.payslips.find(p => p.id === selectedPayslip) : null

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 left-1/3 h-40 w-40 rounded-full bg-teal-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Banknote className="h-3 w-3" /> {stats.total} payslips · {stats.activeStaff} active staff
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Payroll Management</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Generate payslips, track statutory deductions (PAYE, NSSF, NHIF), and approve salary payments.
            </p>
          </div>
          <Button
            onClick={() => setShowGenDialog(true)}
            className="gap-2 bg-white text-emerald-700 hover:bg-white/90"
          >
            <Plus className="h-4 w-4" /> Generate Payslip
          </Button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">Total Payroll</p>
              <p className="text-xl font-bold">{formatKES(stats.totalPayroll)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <Clock className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">Pending Approval</p>
              <p className="text-xl font-bold">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">Paid (Total)</p>
              <p className="text-xl font-bold">{stats.paid}</p>
              <p className="truncate text-[11px] text-muted-foreground">{formatKES(stats.paidTotal)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs uppercase tracking-wide text-muted-foreground">Avg Net Pay</p>
              <p className="text-xl font-bold">{formatKES(stats.avgNetPay)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Payslips by Status</CardTitle>
            <CardDescription className="text-xs">Distribution across all records</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={d.byStatus} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                  {d.byStatus.map(s => <Cell key={s.name} fill={STATUS_DOT[s.name] || '#94a3b8'} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-2 flex flex-wrap justify-center gap-3 text-xs">
              {d.byStatus.map(s => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: STATUS_DOT[s.name] }} />
                  <span className="text-muted-foreground">{s.name}</span>
                  <span className="font-semibold">{s.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Payroll by Month</CardTitle>
            <CardDescription className="text-xs">Total net pay per pay period</CardDescription>
          </CardHeader>
          <CardContent>
            {d.byMonth.length === 0 ? (
              <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">No payslip data yet.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={d.byMonth} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="oklch(0.5 0.02 160)" angle={-15} textAnchor="end" height={60} />
                  <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" tickFormatter={(v) => v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v)} />
                  <Tooltip
                    contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }}
                    cursor={{ fill: 'oklch(0.96 0.01 150)' }}
                    formatter={(v: any) => formatKES(v)}
                  />
                  <Bar dataKey="total" name="Net Pay" radius={[6, 6, 0, 0]} maxBarSize={36}>
                    {d.byMonth.map((_, i) => <Cell key={i} fill={i === 0 ? '#0d9488' : '#10b981'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filter bar + table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Payslips</CardTitle>
              <CardDescription className="text-xs">{filteredPayslips.length} of {d.payslips.length} records · Statutory: PAYE · NSSF · NHIF</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search staff or payslip no…"
                  className="h-9 w-full pl-8 sm:w-60"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-9 w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {filteredPayslips.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <Receipt className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium">No payslips found</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {d.payslips.length === 0
                    ? 'Generate your first payslip to get started.'
                    : 'Try adjusting your filters.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="max-h-[32rem] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-card">
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead className="hidden md:table-cell">Period</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Basic</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Allow.</TableHead>
                    <TableHead className="text-right hidden lg:table-cell">Deduct.</TableHead>
                    <TableHead className="text-right">Net Pay</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayslips.map((p) => (
                    <TableRow
                      key={p.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => setSelectedPayslip(p.id)}
                    >
                      <TableCell>
                        <div className="font-medium">{p.staffName}</div>
                        <div className="text-xs text-muted-foreground">{p.staffRole} · {p.staffDept}</div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">{p.month} {p.year}</div>
                        <div className="text-xs text-muted-foreground">{p.payslipNo}</div>
                      </TableCell>
                      <TableCell className="text-right hidden sm:table-cell text-sm">{formatKES(p.basicSalary)}</TableCell>
                      <TableCell className="text-right hidden lg:table-cell text-sm text-emerald-600">+{formatKES(p.allowances)}</TableCell>
                      <TableCell className="text-right hidden lg:table-cell text-sm text-rose-600">-{formatKES(p.deductions + p.taxPAYE + p.nssf + p.nhif)}</TableCell>
                      <TableCell className="text-right">
                        <div className="font-semibold">{formatKES(p.netPay)}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('gap-1', STATUS_BADGE[p.status])}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_DOT[p.status] }} />
                          {p.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {p.status === 'Pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 gap-1 text-xs"
                              disabled={actionLoading === p.id}
                              onClick={() => handleStatusUpdate(p.id, 'Approved')}
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                            </Button>
                          )}
                          {(p.status === 'Pending' || p.status === 'Approved') && (
                            <Button
                              size="sm"
                              className="h-8 gap-1 bg-emerald-600 text-xs hover:bg-emerald-700"
                              disabled={actionLoading === p.id}
                              onClick={() => handleStatusUpdate(p.id, 'Paid')}
                            >
                              {actionLoading === p.id ? '…' : 'Pay'}
                            </Button>
                          )}
                          {p.status === 'Paid' && (
                            <span className="text-xs text-muted-foreground">
                              {p.payDate ? formatDate(p.payDate) : '—'}
                            </span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generate Payslip dialog */}
      <GeneratePayslipDialog
        open={showGenDialog}
        onOpenChange={setShowGenDialog}
        staff={activeStaff}
        userName={user?.name || 'Bursar'}
        onCreated={() => {
          refetch()
          setShowGenDialog(false)
        }}
      />

      {/* Payslip detail dialog */}
      <PayslipDetailDialog
        payslip={selected || null}
        onClose={() => setSelectedPayslip(null)}
        onUpdate={handleStatusUpdate}
        actionLoading={actionLoading}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Generate Payslip dialog
// ---------------------------------------------------------------------------
interface GenerateProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  staff: StaffListData['staff']
  userName: string
  onCreated: () => void
}

function GeneratePayslipDialog({ open, onOpenChange, staff, userName, onCreated }: GenerateProps) {
  const now = new Date()
  const [staffId, setStaffId] = useState('')
  const [month, setMonth] = useState(MONTHS[now.getMonth()])
  const [year, setYear] = useState(String(now.getFullYear()))
  const [basicSalary, setBasicSalary] = useState('')
  const [allowances, setAllowances] = useState('')
  const [deductions, setDeductions] = useState('')
  const [taxPAYE, setTaxPAYE] = useState('')
  const [nssf, setNssf] = useState('')
  const [nhif, setNhif] = useState('')
  const [saving, setSaving] = useState(false)

  const selectedStaff = staff.find(s => s.id === staffId)

  // Auto-fill basic salary from staff record
  const handleStaffSelect = (id: string) => {
    setStaffId(id)
    const s = staff.find(x => x.id === id)
    if (s) {
      setBasicSalary(String(s.salary || ''))
      // Estimate statutory deductions if blank
      const basic = s.salary || 0
      if (!nssf) setNssf('1080') // current standard NSSF Tier II upper bound approx
      if (!nhif) {
        // SHIF/NHIF band approximations
        const band = basic <= 5999 ? 150 : basic <= 11999 ? 400 : basic <= 29999 ? 850 : basic <= 999999 ? 1700 : 1700
        setNhif(String(band))
      }
      if (!taxPAYE && basic > 24000) {
        // Very rough PAYE estimate (3 bands @ 10/25/30 %, no reliefs)
        const t = basic * 12
        let tax = 0
        if (t > 24000 * 12) tax += Math.min(t - 24000 * 12, (32333 - 24000) * 12) * 0.25
        if (t > 32333 * 12) tax += (t - 32333 * 12) * 0.30
        if (t > 0) tax += 24000 * 12 * 0.10
        setTaxPAYE(String(Math.round(tax / 12)))
      }
    }
  }

  const basic = Number(basicSalary) || 0
  const allow = Number(allowances) || 0
  const ded = Number(deductions) || 0
  const tax = Number(taxPAYE) || 0
  const ns = Number(nssf) || 0
  const nh = Number(nhif) || 0
  const netPay = basic + allow - ded - tax - ns - nh

  const reset = () => {
    setStaffId(''); setBasicSalary(''); setAllowances(''); setDeductions('')
    setTaxPAYE(''); setNssf(''); setNhif('')
  }

  const handleSubmit = async () => {
    if (!staffId) { toast.error('Select a staff member'); return }
    if (!month || !year) { toast.error('Month and year are required'); return }
    if (basic <= 0) { toast.error('Basic salary must be greater than zero'); return }
    setSaving(true)
    try {
      await apiPost('/api/payroll', {
        staffId, month, year: Number(year),
        basicSalary: basic, allowances: allow, deductions: ded,
        taxPAYE: tax, nssf: ns, nhif: nh,
        status: 'Pending',
        createdBy: userName,
      })
      toast.success('Payslip generated', {
        description: `${selectedStaff?.firstName} ${selectedStaff?.lastName} — ${month} ${year} · ${formatKES(netPay)}`,
      })
      reset()
      onCreated()
    } catch (e: any) {
      const msg = await e?.message
      toast.error('Failed to generate payslip', { description: msg })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v) }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5 text-emerald-600" /> Generate Payslip
          </DialogTitle>
          <DialogDescription>
            Create a new payslip. Statutory deductions auto-estimate when you pick a staff member.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* Staff selector */}
          <div className="grid gap-2">
            <Label>Staff Member <span className="text-rose-500">*</span></Label>
            <Select value={staffId} onValueChange={handleStaffSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select active staff…" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {staff.length === 0 ? (
                  <SelectItem value="_none" disabled>No active staff found</SelectItem>
                ) : staff.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} · {s.employeeNo} · {s.role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedStaff && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                <AlertCircle className="h-3.5 w-3.5" />
                Base salary from staff record: <strong>{formatKES(selectedStaff.salary)}</strong> · {selectedStaff.employmentType}
              </div>
            )}
          </div>

          {/* Period */}
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Month <span className="text-rose-500">*</span></Label>
              <Select value={month} onValueChange={setMonth}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Year <span className="text-rose-500">*</span></Label>
              <Select value={year} onValueChange={setYear}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[now.getFullYear(), now.getFullYear() - 1, now.getFullYear() + 1].map(y => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Salary components */}
          <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Earnings</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label className="text-xs">Basic Salary (KES) <span className="text-rose-500">*</span></Label>
                <Input type="number" value={basicSalary} onChange={e => setBasicSalary(e.target.value)} placeholder="0" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">Allowances (KES)</Label>
                <Input type="number" value={allowances} onChange={e => setAllowances(e.target.value)} placeholder="0" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-rose-200/60 bg-rose-50/40 p-3 dark:border-rose-900/40 dark:bg-rose-950/20">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">Deductions</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="grid gap-1.5">
                <Label className="text-xs">Other Deduct.</Label>
                <Input type="number" value={deductions} onChange={e => setDeductions(e.target.value)} placeholder="0" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">PAYE Tax</Label>
                <Input type="number" value={taxPAYE} onChange={e => setTaxPAYE(e.target.value)} placeholder="0" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">NSSF</Label>
                <Input type="number" value={nssf} onChange={e => setNssf(e.target.value)} placeholder="0" />
              </div>
              <div className="grid gap-1.5">
                <Label className="text-xs">NHIF / SHIF</Label>
                <Input type="number" value={nhif} onChange={e => setNhif(e.target.value)} placeholder="0" />
              </div>
            </div>
          </div>

          {/* Net pay preview */}
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white">
            <div>
              <p className="text-xs uppercase tracking-wide text-white/80">Net Pay (auto-calculated)</p>
              <p className="text-2xl font-bold">{formatKES(netPay)}</p>
            </div>
            <div className="text-right text-xs text-white/80">
              <p>Basic + Allowances − Deductions</p>
              <p>− PAYE − NSSF − NHIF</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            {saving ? 'Generating…' : (<><Receipt className="h-4 w-4" /> Generate Payslip</>)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Payslip detail dialog
// ---------------------------------------------------------------------------
interface DetailProps {
  payslip: PayrollData['payslips'][number] | null
  onClose: () => void
  onUpdate: (id: string, status: 'Approved' | 'Paid') => void
  actionLoading: string | null
}

function PayslipDetailDialog({ payslip, onClose, onUpdate, actionLoading }: DetailProps) {
  if (!payslip) return null
  const gross = payslip.basicSalary + payslip.allowances
  const totalDeductions = payslip.deductions + payslip.taxPAYE + payslip.nssf + payslip.nhif

  return (
    <Dialog open={!!payslip} onOpenChange={(v) => { if (!v) onClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2"><Receipt className="h-5 w-5 text-emerald-600" /> Payslip Detail</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
          </DialogTitle>
          <DialogDescription>{payslip.payslipNo}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Staff */}
          <div className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2.5">
            <div>
              <p className="font-medium">{payslip.staffName}</p>
              <p className="text-xs text-muted-foreground">{payslip.staffRole} · {payslip.staffDept}</p>
            </div>
            <Badge variant="outline" className={cn('gap-1', STATUS_BADGE[payslip.status])}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: STATUS_DOT[payslip.status] }} />
              {payslip.status}
            </Badge>
          </div>

          {/* Period */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Pay Period</span>
            <span className="font-medium">{payslip.month} {payslip.year}</span>
          </div>
          {payslip.payDate && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Paid On</span>
              <span className="font-medium">{formatDate(payslip.payDate)}</span>
            </div>
          )}

          {/* Earnings */}
          <div className="space-y-1.5 rounded-lg border border-emerald-200/60 bg-emerald-50/40 p-3 dark:border-emerald-900/40 dark:bg-emerald-950/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700 dark:text-emerald-300">Earnings</p>
            <Line label="Basic Salary" value={formatKES(payslip.basicSalary)} />
            <Line label="Allowances" value={`+ ${formatKES(payslip.allowances)}`} />
            <Line label="Gross Pay" value={formatKES(gross)} bold />
          </div>

          {/* Deductions */}
          <div className="space-y-1.5 rounded-lg border border-rose-200/60 bg-rose-50/40 p-3 dark:border-rose-900/40 dark:bg-rose-950/20">
            <p className="text-xs font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">Deductions</p>
            <Line label="PAYE Tax" value={`- ${formatKES(payslip.taxPAYE)}`} />
            <Line label="NSSF" value={`- ${formatKES(payslip.nssf)}`} />
            <Line label="NHIF / SHIF" value={`- ${formatKES(payslip.nhif)}`} />
            {payslip.deductions > 0 && (
              <Line label="Other Deductions" value={`- ${formatKES(payslip.deductions)}`} />
            )}
            <Line label="Total Deductions" value={`- ${formatKES(totalDeductions)}`} bold />
          </div>

          {/* Net pay */}
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white">
            <span className="text-sm font-medium uppercase tracking-wide text-white/90">Net Pay</span>
            <span className="text-2xl font-bold">{formatKES(payslip.netPay)}</span>
          </div>

          {/* Actions */}
          {payslip.status !== 'Paid' && (
            <div className="flex gap-2 pt-1">
              {payslip.status === 'Pending' && (
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5"
                  disabled={actionLoading === payslip.id}
                  onClick={() => onUpdate(payslip.id, 'Approved')}
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </Button>
              )}
              <Button
                className="flex-1 gap-1.5 bg-emerald-600 hover:bg-emerald-700"
                disabled={actionLoading === payslip.id}
                onClick={() => onUpdate(payslip.id, 'Paid')}
              >
                <Banknote className="h-4 w-4" /> Mark as Paid
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Line({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={cn('text-muted-foreground', bold && 'font-semibold text-foreground')}>{label}</span>
      <span className={cn(bold && 'font-bold')}>{value}</span>
    </div>
  )
}
