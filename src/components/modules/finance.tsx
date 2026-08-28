'use client'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useFetch, apiPost, apiDelete } from '@/lib/api'
import {
  cn, formatKES, formatNumber, formatDate, formatDateTime, formatCompact,
  initials, avatarColor,
} from '@/lib/format'
import { printWithLetterhead, formatKESForPrint, generateCashReference, generateReceiptNumber } from '@/lib/print-utils'
import { StatCard, SectionHeader, EmptyState } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  Wallet, Receipt, TrendingUp, TrendingDown, Search, Plus,
  FileText, Coins, HandCoins, PiggyBank, ArrowLeft, ArrowRight,
  Eye, Calendar, Smartphone, ChevronRight, X, RefreshCw, Loader2,
  CheckCircle2, Clock, ShieldCheck, GraduationCap, Landmark, Banknote,
  CreditCard, BadgeDollarSign, CircleDollarSign, AlertCircle, BanknoteIcon,
  Users, Zap, Wrench, Package, Bus, MoreHorizontal, Trash2, Target, Wallet2,
  Printer, Download,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Print helpers — payment receipt
// ---------------------------------------------------------------------------
function printPaymentReceipt(p: {
  invoiceNo: string
  studentName: string
  admissionNo: string
  classLevel: string
  amount: number
  method: string
  reference: string
  payerName: string
  payerPhone: string
  paymentDate: Date
}) {
  const bodyHtml = `
    <div class="info-grid">
      <div class="info-card">
        <div class="label">Receipt For</div>
        <div class="value">${p.studentName}<br><span style="font-size:11px;color:#6b7280;font-weight:400">${p.admissionNo} · ${p.classLevel}</span></div>
      </div>
      <div class="info-card">
        <div class="label">Invoice Number</div>
        <div class="value">${p.invoiceNo}</div>
      </div>
      <div class="info-card">
        <div class="label">Payment Date</div>
        <div class="value">${p.paymentDate.toLocaleString()}</div>
      </div>
      <div class="info-card">
        <div class="label">Payment Method</div>
        <div class="value">${p.method}</div>
      </div>
      <div class="info-card">
        <div class="label">Reference</div>
        <div class="value" style="font-family:monospace">${p.reference}</div>
      </div>
      <div class="info-card">
        <div class="label">Payer</div>
        <div class="value">${p.payerName || '—'}<br><span style="font-size:11px;color:#6b7280;font-weight:400">${p.payerPhone || ''}</span></div>
      </div>
    </div>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th style="text-align:right">Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Fee Payment — Invoice ${p.invoiceNo}</td>
          <td style="text-align:right">${formatKESForPrint(p.amount)}</td>
        </tr>
        <tr class="total-row">
          <td>Total Paid</td>
          <td style="text-align:right">${formatKESForPrint(p.amount)}</td>
        </tr>
      </tbody>
    </table>
    <p style="margin-top:24px;font-size:11px;color:#6b7280">
      This is an official receipt for the payment recorded above. Please retain
      for your records. For queries, contact the school finance office.
    </p>
  `
  printWithLetterhead({
    title: 'PAYMENT RECEIPT',
    subtitle: p.reference,
    school: null,
    bodyHtml,
  })
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface FinanceOverview {
  totalBilled: number
  totalCollected: number
  totalOutstanding: number
  todayCollection: number
  totalExpenses: number
  collectionRate: number
  invoicesByStatus: { status: string; count: number }[]
  paymentsByMethod: { method: string; count: number; total: number }[]
  trend: { month: string; revenue: number; expenses: number }[]
  expensesByCategory: { category: string; total: number; count: number }[]
  counts: { invoices: number; payments: number }
}

interface InvoiceRow {
  id: string
  invoiceNo: string
  studentId: string
  admissionNo: string
  studentName: string
  boarding: boolean
  classLevel: string
  stream: string
  feeStructure: { id: string; name: string; boarding: boolean } | null
  academicYear: string
  term: string
  amount: number
  amountPaid: number
  balance: number
  status: string
  dueDate: string
  issueDate: string
  paymentsCount: number
}

interface FeeStructureOption {
  id: string
  name: string
  boarding: boolean
  totalAmount: number
  academicYear: string
  term: string
  dueDate: string | null
  classLevel: string
}

interface InvoicesResponse {
  invoices: InvoiceRow[]
  total: number
  page: number
  pageSize: number
  totalPages: number
  classLevels: { id: string; name: string; stage: string }[]
  feeStructures: FeeStructureOption[]
  statusCounts: { status: string; count: number }[]
}

interface PaymentRow {
  id: string
  amount: number
  method: string
  reference: string
  payerName: string
  payerPhone: string
  receivedBy: string
  receivedAt: string
  invoiceId: string
  invoiceNo: string
  studentId: string | null
  admissionNo: string
  studentName: string
  classLevel: string
  stream: string
}

interface PaymentsResponse {
  payments: PaymentRow[]
  total: number
  methodSummary: { method: string; total: number; count: number }[]
}

interface ExpenseRow {
  id: string
  category: string
  description: string
  amount: number
  date: string
  paymentMethod: string
  recipient: string
}

interface ExpensesResponse {
  expenses: ExpenseRow[]
  total: number
  totalCount: number
  byCategory: { category: string; total: number; count: number }[]
  budgets: { category: string; budget: number; actual: number; variance: number; utilization: number; count: number }[]
  monthlyTrend: { month: string; amount: number }[]
  totalBudget: number
  totalActual: number
}

interface ScholarshipRow {
  id: string
  name: string
  provider: string
  amount: number
  coverage: string
  academicYear: string
  status: string
  startDate: string
  endDate: string | null
  studentId: string | null
  admissionNo: string
  studentName: string
  boarding: boolean
  classLevel: string
  stream: string
}

interface ScholarshipsResponse {
  scholarships: ScholarshipRow[]
  total: number
  totalAmount: number
  byCoverage: { coverage: string; total: number; count: number }[]
  byStatus: { status: string; total: number; count: number }[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const METHOD_COLORS: Record<string, string> = {
  'M-Pesa': '#10b981',
  'Cash': '#f59e0b',
  'Bank Transfer': '#06b6d4',
  'Cheque': '#8b5cf6',
  'Card': '#64748b',
}
const CATEGORY_COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#64748b']
const COVERAGE_COLORS: Record<string, string> = {
  'Full': '#10b981',
  'Partial': '#f59e0b',
  'Half': '#06b6d4',
}

const STATUS_OPTIONS = ['Unpaid', 'Partially Paid', 'Paid', 'Overdue', 'Cancelled']
const METHOD_OPTIONS = ['M-Pesa', 'Cash', 'Bank Transfer', 'Cheque', 'Card']
const EXPENSE_CATEGORIES = ['Salaries', 'Utilities', 'Maintenance', 'Supplies', 'Transport', 'Other']
const COVERAGE_OPTIONS = ['Full', 'Partial', 'Half']

// Expense category metadata with icons, colors, and descriptions
const EXPENSE_CATEGORY_META: Record<string, { icon: any; color: string; bg: string; text: string; desc: string }> = {
  Salaries: { icon: Users, color: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', desc: 'Staff salaries & wages' },
  Utilities: { icon: Zap, color: '#06b6d4', bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', desc: 'Electricity, water, internet' },
  Maintenance: { icon: Wrench, color: '#8b5cf6', bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', desc: 'Repairs & servicing' },
  Supplies: { icon: Package, color: '#f59e0b', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', desc: 'Stationery & materials' },
  Transport: { icon: Bus, color: '#ec4899', bg: 'bg-pink-500/10', text: 'text-pink-600 dark:text-pink-400', desc: 'Fuel & vehicle costs' },
  Other: { icon: MoreHorizontal, color: '#64748b', bg: 'bg-slate-500/10', text: 'text-slate-600 dark:text-slate-400', desc: 'Miscellaneous' },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function invoiceStatusClass(s: string): string {
  switch (s) {
    case 'Paid':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
    case 'Partially Paid':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-900'
    case 'Unpaid':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-rose-200 dark:border-rose-900'
    case 'Overdue':
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400 border-rose-200 dark:border-rose-900'
    case 'Cancelled':
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function methodClass(m: string): string {
  switch (m) {
    case 'M-Pesa':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
    case 'Cash':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-900'
    case 'Bank Transfer':
      return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900'
    case 'Cheque':
      return 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400 border-violet-200 dark:border-violet-900'
    case 'Card':
      return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function coverageClass(c: string): string {
  switch (c) {
    case 'Full':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
    case 'Partial':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-900'
    case 'Half':
      return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400 border-cyan-200 dark:border-cyan-900'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

function MethodIcon({ method, className }: { method: string; className?: string }) {
  switch (method) {
    case 'M-Pesa': return <Smartphone className={className} />
    case 'Cash': return <Banknote className={className} />
    case 'Bank Transfer': return <Landmark className={className} />
    case 'Cheque': return <BanknoteIcon className={className} />
    case 'Card': return <CreditCard className={className} />
    default: return <Coins className={className} />
  }
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', invoiceStatusClass(status))}>
      {status === 'Paid' && <CheckCircle2 className="h-3 w-3" />}
      {status === 'Unpaid' && <Clock className="h-3 w-3" />}
      {status === 'Overdue' && <AlertCircle className="h-3 w-3" />}
      {status}
    </span>
  )
}

function MethodBadge({ method }: { method: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', methodClass(method))}>
      <MethodIcon method={method} className="h-3 w-3" />
      {method}
    </span>
  )
}

function CoverageBadge({ coverage }: { coverage: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold', coverageClass(coverage))}>
      <ShieldCheck className="h-3 w-3" />
      {coverage}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Student picker (debounced search via /api/students)
// ---------------------------------------------------------------------------
interface PickedStudent {
  id: string
  admissionNo: string
  name: string
  boarding: boolean
  classLevel: string
  stream: string
}

function StudentPicker({
  value, onChange, required = true,
}: {
  value: PickedStudent | null
  onChange: (s: PickedStudent | null) => void
  required?: boolean
}) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  const url = debounced.length >= 1
    ? `/api/students?search=${encodeURIComponent(debounced)}&pageSize=12`
    : null
  const { data, loading } = useFetch<{ students: any[] }>(url)

  const students: PickedStudent[] = useMemo(() => {
    if (!data?.students) return []
    return data.students.map(s => ({
      id: s.id,
      admissionNo: s.admissionNo,
      name: `${s.firstName} ${s.lastName}`,
      boarding: s.boarding,
      classLevel: s.currentEnrollment?.stream?.classLevel?.name || '—',
      stream: s.currentEnrollment?.stream?.name || '—',
    }))
  }, [data])

  return (
    <div className="space-y-2">
      <Label>Student {required && <span className="text-rose-500">*</span>}</Label>
      {value ? (
        <div className="flex items-center justify-between rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-2.5">
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-9 w-9">
              <AvatarFallback className={cn('text-xs font-semibold text-white', avatarColor(value.id))}>
                {initials(value.name.split(' ')[0], value.name.split(' ')[1])}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{value.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {value.admissionNo} · {value.classLevel} {value.stream}
              </p>
            </div>
          </div>
          <Button
            type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0"
            onClick={() => { onChange(null); setQuery('') }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              placeholder="Search by admission no. or name…"
              className="pl-9"
              onFocus={() => setOpen(true)}
              onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            />
            {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
          </div>
          {open && (debounced.length >= 1) && (
            <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-popover shadow-lg">
              {students.length === 0 && !loading ? (
                <div className="p-3 text-sm text-muted-foreground text-center">No students found</div>
              ) : (
                students.map(s => (
                  <button
                    key={s.id} type="button"
                    className="flex w-full items-center justify-between gap-2 border-b px-3 py-2 text-left last:border-b-0 hover:bg-accent"
                    onClick={() => { onChange(s); setOpen(false); setQuery('') }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{s.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {s.admissionNo} · {s.classLevel} {s.stream}
                      </p>
                    </div>
                    {s.boarding && <Badge variant="outline" className="shrink-0 text-[10px]">Boarding</Badge>}
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Invoice picker (search invoices for payment recording)
// ---------------------------------------------------------------------------
interface PickedInvoice {
  id: string
  invoiceNo: string
  studentName: string
  admissionNo: string
  classLevel: string
  amount: number
  amountPaid: number
  balance: number
  status: string
  dueDate: string
}

function InvoicePicker({ value, onChange }: { value: PickedInvoice | null; onChange: (i: PickedInvoice | null) => void }) {
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  const url = debounced.length >= 1
    ? `/api/finance/invoices?search=${encodeURIComponent(debounced)}&pageSize=15`
    : null
  const { data, loading } = useFetch<InvoicesResponse>(url)

  const invoices: PickedInvoice[] = useMemo(() => {
    if (!data?.invoices) return []
    return data.invoices
      .filter(i => i.status !== 'Paid' && i.status !== 'Cancelled')
      .map(i => ({
        id: i.id, invoiceNo: i.invoiceNo, studentName: i.studentName, admissionNo: i.admissionNo,
        classLevel: i.classLevel, amount: i.amount, amountPaid: i.amountPaid, balance: i.balance,
        status: i.status, dueDate: i.dueDate,
      }))
  }, [data])

  return (
    <div className="space-y-2">
      <Label>Invoice <span className="text-rose-500">*</span></Label>
      {value ? (
        <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-3 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <p className="font-mono text-sm font-semibold truncate">{value.invoiceNo}</p>
            </div>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => { onChange(null); setQuery('') }}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-sm text-foreground truncate">{value.studentName} · <span className="text-muted-foreground">{value.admissionNo}</span></p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Amount: <span className="font-semibold text-foreground">{formatKES(value.amount)}</span></span>
            <span>Paid: <span className="font-semibold text-foreground">{formatKES(value.amountPaid)}</span></span>
            <span>Balance: <span className="font-semibold text-rose-600 dark:text-rose-400">{formatKES(value.balance)}</span></span>
            <StatusBadge status={value.status} />
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              placeholder="Search by invoice no., name or admission no…"
              className="pl-9"
              onFocus={() => setOpen(true)}
              onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
            />
            {loading && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
          </div>
          {open && debounced.length >= 1 && (
            <div className="absolute z-50 mt-1 max-h-72 w-full overflow-y-auto rounded-lg border bg-popover shadow-lg">
              {invoices.length === 0 && !loading ? (
                <div className="p-3 text-sm text-muted-foreground text-center">No outstanding invoices found</div>
              ) : (
                invoices.map(i => (
                  <button
                    key={i.id} type="button"
                    className="flex w-full items-center justify-between gap-2 border-b px-3 py-2 text-left last:border-b-0 hover:bg-accent"
                    onClick={() => { onChange(i); setOpen(false); setQuery('') }}
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-semibold truncate">{i.invoiceNo}</p>
                      <p className="truncate text-xs text-muted-foreground">{i.studentName} · {i.admissionNo} · {i.classLevel}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold">{formatKES(i.balance)}</p>
                      <StatusBadge status={i.status} />
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Record Payment Dialog (shared between Invoices + Payments tabs)
// ---------------------------------------------------------------------------
function RecordPaymentDialog({
  open, onOpenChange, invoice, onRecorded,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  invoice: PickedInvoice | null
  onRecorded: () => void
}) {
  const [selectedInvoice, setSelectedInvoice] = useState<PickedInvoice | null>(invoice)
  const [amount, setAmount] = useState<string>('')
  const [method, setMethod] = useState<string>('M-Pesa')
  const [reference, setReference] = useState('')
  const [payerName, setPayerName] = useState('')
  const [payerPhone, setPayerPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Sync when dialog opens / invoice prop changes
  useEffect(() => {
    if (open) {
      setSelectedInvoice(invoice)
      // Default amount = outstanding balance
      setAmount(invoice ? String(invoice.balance) : '')
      setMethod('M-Pesa')
      setReference('')
      setPayerName(invoice?.studentName ? `${invoice.studentName.split(' ')[0]} Guardian` : '')
      setPayerPhone('')
    }
  }, [open, invoice])

  // Auto-generate reference for Cash and Bank Transfer (not free text)
  // For M-Pesa and Cheque, the user enters the actual transaction/cheque number.
  useEffect(() => {
    if (method === 'Cash') {
      setReference(generateCashReference())
    } else if (method === 'Bank Transfer') {
      setReference('BT-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000))
    }
  }, [method])

  // Update default amount when selected invoice changes (if user clears amount)
  useEffect(() => {
    if (selectedInvoice && !amount) {
      setAmount(String(selectedInvoice.balance))
    }
  }, [selectedInvoice])

  const handleSubmit = async () => {
    if (!selectedInvoice) { toast.error('Please select an invoice'); return }
    const amt = parseFloat(amount)
    if (!Number.isFinite(amt) || amt <= 0) { toast.error('Enter a valid amount'); return }
    if (amt > selectedInvoice.balance + 0.01) {
      toast.error(`Amount exceeds outstanding balance of ${formatKES(selectedInvoice.balance)}`)
      return
    }
    setSubmitting(true)
    try {
      const res = await apiPost('/api/finance/payments', {
        invoiceId: selectedInvoice.id,
        amount: amt,
        method,
        reference: reference.trim() || null,
        payerName: payerName.trim() || null,
        payerPhone: payerPhone.trim() || null,
      })
      toast.success(`Payment of ${formatKES(amt)} recorded`, {
        description: `${selectedInvoice.invoiceNo} → ${res.invoice.status}`,
        action: {
          label: 'Print Receipt',
          onClick: () => {
            printPaymentReceipt({
              invoiceNo: selectedInvoice.invoiceNo,
              studentName: selectedInvoice.studentName,
              admissionNo: selectedInvoice.admissionNo,
              classLevel: selectedInvoice.classLevel,
              amount: amt,
              method,
              reference: reference.trim() || generateReceiptNumber(),
              payerName: payerName.trim() || '',
              payerPhone: payerPhone.trim() || '',
              paymentDate: new Date(),
            })
          },
        },
      })
      onOpenChange(false)
      onRecorded()
    } catch (e: any) {
      toast.error('Failed to record payment', { description: e?.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <HandCoins className="h-4 w-4" />
            </span>
            Record Payment
          </DialogTitle>
          <DialogDescription>
            Record a payment against a student invoice. M-Pesa is the default method.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* M-Pesa info banner */}
          <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 p-3">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white shrink-0">
                <Smartphone className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">M-Pesa Paybill</p>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Paybill <span className="font-bold font-mono">522522</span> · Account = <span className="font-bold">Admission No.</span>
                </p>
              </div>
            </div>
          </div>

          {!invoice && (
            <InvoicePicker value={selectedInvoice} onChange={setSelectedInvoice} />
          )}

          {selectedInvoice && (
            <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Invoice</p>
                <p className="font-mono font-semibold">{selectedInvoice.invoiceNo}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Student</p>
                <p className="font-medium truncate">{selectedInvoice.studentName}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="font-semibold">{formatKES(selectedInvoice.amount)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Outstanding</p>
                <p className="font-semibold text-rose-600 dark:text-rose-400">{formatKES(selectedInvoice.balance)}</p>
              </div>
            </div>
          )}

          <div className="grid gap-3">
            <div className="grid gap-2">
              <Label htmlFor="pay-amount">Amount (KES) <span className="text-rose-500">*</span></Label>
              <Input id="pay-amount" type="number" min="1" step="1" value={amount}
                onChange={(e) => setAmount(e.target.value)} placeholder="0" />
              {selectedInvoice && selectedInvoice.balance > 0 && (
                <button type="button" className="self-start text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                  onClick={() => setAmount(String(selectedInvoice.balance))}>
                  Use full balance ({formatKES(selectedInvoice.balance)})
                </button>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Payment Method</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {METHOD_OPTIONS.map(m => (
                    <SelectItem key={m} value={m}>
                      <span className="flex items-center gap-2">
                        <MethodIcon method={m} className="h-3.5 w-3.5" />
                        {m}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="pay-ref">
                  Reference
                  {(method === 'Cash' || method === 'Bank Transfer') && (
                    <span className="ml-1 text-[10px] text-emerald-600">(auto-generated)</span>
                  )}
                </Label>
                <Input
                  id="pay-ref"
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  readOnly={method === 'Cash' || method === 'Bank Transfer'}
                  className={(method === 'Cash' || method === 'Bank Transfer') ? 'bg-muted font-mono text-xs cursor-not-allowed' : ''}
                  placeholder={method === 'M-Pesa' ? 'e.g. QG7X9P2KM1' : method === 'Cheque' ? 'Cheque no.' : 'Reference'}
                />
                {(method === 'Cash' || method === 'Bank Transfer') && (
                  <p className="text-[10px] text-muted-foreground">
                    System-generated reference for tracking. Cannot be edited.
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="pay-phone">Payer Phone</Label>
                <Input id="pay-phone" value={payerPhone} onChange={(e) => setPayerPhone(e.target.value)}
                  placeholder="+2547XX XXX XXX" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="pay-name">Payer Name</Label>
              <Input id="pay-name" value={payerName} onChange={(e) => setPayerName(e.target.value)}
                placeholder="e.g. John Mwangi (Guardian)" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleSubmit} disabled={submitting || !selectedInvoice}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Record Payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// M-Pesa Daraja STK Push dialog
// ---------------------------------------------------------------------------
type StkStep = 'form' | 'sending' | 'waiting' | 'success' | 'failed' | 'not-configured'

interface MpesaConfigState {
  configured: boolean
  missing: string[]
  env: 'sandbox' | 'production'
  shortcode: string | null
  callbackUrl: string | null
}

function StkPushDialog({
  open, onOpenChange, invoice, onCompleted,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  invoice: PickedInvoice | null
  onCompleted: () => void
}) {
  const [selectedInvoice, setSelectedInvoice] = useState<PickedInvoice | null>(invoice)
  const [phone, setPhone] = useState('')
  const [amount, setAmount] = useState<string>('')
  const [step, setStep] = useState<StkStep>('form')
  const [paymentId, setPaymentId] = useState<string | null>(null)
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<string | null>(null)
  const [resultDesc, setResultDesc] = useState<string>('')
  const [simulating, setSimulating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [pollTimer, setPollTimer] = useState<ReturnType<typeof setInterval> | null>(null)

  // --- Load M-Pesa config status when dialog opens -------------------------
  const [config, setConfig] = useState<MpesaConfigState | null>(null)
  useEffect(() => {
    if (!open) return
    setConfig(null)
    fetch('/api/mpesa/config')
      .then(r => r.ok ? r.json() : null)
      .then(j => {
        if (j) setConfig({
          configured: !!j.configured,
          missing: j.missing || [],
          env: j.env === 'production' ? 'production' : 'sandbox',
          shortcode: j.shortcode || null,
          callbackUrl: j.callbackUrl || null,
        })
      })
      .catch(() => {
        // ignore — fail gracefully, treat as not configured
      })
  }, [open])

  // --- Reset state whenever dialog opens / invoice changes ----------------
  useEffect(() => {
    if (open) {
      setSelectedInvoice(invoice)
      setPhone('')
      setAmount(invoice ? String(invoice.balance) : '')
      setStep('form')
      setPaymentId(null)
      setCheckoutRequestId(null)
      setReceipt(null)
      setResultDesc('')
    } else {
      // Cleanup polling when closed
      if (pollTimer) {
        clearInterval(pollTimer)
        setPollTimer(null)
      }
    }
  }, [open, invoice])

  // --- Cleanup polling on unmount -----------------------------------------
  useEffect(() => {
    return () => {
      if (pollTimer) clearInterval(pollTimer)
    }
  }, [pollTimer])

  // --- Poll /api/payments/[id] for status updates -------------------------
  function startPolling(pid: string) {
    if (pollTimer) clearInterval(pollTimer)
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`/api/payments/${pid}`)
        if (!r.ok) return
        const j = await r.json()
        if (j.status === 'Completed') {
          clearInterval(interval)
          setPollTimer(null)
          setReceipt(j.mpesaReceiptNumber || j.reference || null)
          setResultDesc(j.mpesaResultDesc || 'Payment confirmed')
          setStep('success')
          toast.success('M-Pesa payment received', {
            description: j.mpesaReceiptNumber ? `Receipt ${j.mpesaReceiptNumber}` : undefined,
          })
          onCompleted()
        } else if (j.status === 'Failed') {
          clearInterval(interval)
          setPollTimer(null)
          setResultDesc(j.mpesaResultDesc || 'Payment failed or cancelled')
          setStep('failed')
        }
        // else keep polling (Pending)
      } catch {
        // ignore transient errors
      }
    }, 3000)
    setPollTimer(interval)
  }

  // --- Submit STK Push -----------------------------------------------------
  async function handleSubmit() {
    if (!selectedInvoice) { toast.error('Please select an invoice'); return }
    if (!phone.trim()) { toast.error('Phone number is required'); return }
    const amt = parseFloat(amount)
    if (!Number.isFinite(amt) || amt <= 0) { toast.error('Enter a valid amount'); return }
    if (amt > selectedInvoice.balance + 0.01) {
      toast.error(`Amount exceeds outstanding balance of ${formatKES(selectedInvoice.balance)}`)
      return
    }
    setSubmitting(true)
    setStep('sending')
    try {
      const r = await fetch('/api/mpesa/stk-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId: selectedInvoice.id,
          phone: phone.trim(),
          amount: amt,
        }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        // Show the helpful "not configured" message verbatim when that's the case
        if (j?.error && j.error.includes('not configured')) {
          setStep('not-configured')
          setConfig(null)
        } else {
          setStep('form')
        }
        toast.error(j?.error || 'Failed to initiate STK Push')
        return
      }
      setPaymentId(j.paymentId)
      setCheckoutRequestId(j.checkoutRequestId)
      setStep('waiting')
      toast.success('STK Push sent', {
        description: 'Check the parent\'s phone for the M-Pesa prompt',
      })
      startPolling(j.paymentId)
    } catch (e: any) {
      setStep('form')
      toast.error('Network error', { description: e?.message })
    } finally {
      setSubmitting(false)
    }
  }

  // --- Simulate (dev helper to demo the callback flow without real Daraja)
  async function handleSimulate(success: boolean) {
    if (!paymentId) return
    setSimulating(true)
    try {
      const r = await fetch('/api/mpesa/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId, success }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) {
        toast.error(j?.error || 'Simulation failed')
        return
      }
      // The next polling tick will pick up the new status; but trigger one immediately
      if (pollTimer) clearInterval(pollTimer)
      const immediate = setInterval(async () => {
        try {
          const pr = await fetch(`/api/payments/${paymentId}`)
          const pj = await pr.json()
          if (pj.status === 'Completed' || pj.status === 'Failed') {
            clearInterval(immediate)
            setPollTimer(null)
            if (pj.status === 'Completed') {
              setReceipt(pj.mpesaReceiptNumber || pj.reference || null)
              setResultDesc(pj.mpesaResultDesc || 'Payment confirmed')
              setStep('success')
              toast.success('M-Pesa payment received', {
                description: pj.mpesaReceiptNumber ? `Receipt ${pj.mpesaReceiptNumber}` : undefined,
              })
              onCompleted()
            } else {
              setResultDesc(pj.mpesaResultDesc || 'Payment failed')
              setStep('failed')
            }
          }
        } catch { /* ignore */ }
      }, 1000)
      setPollTimer(immediate)
    } catch (e: any) {
      toast.error('Network error', { description: e?.message })
    } finally {
      setSimulating(false)
    }
  }

  const configured = !!config?.configured
  const isWaiting = step === 'waiting'

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!isWaiting || !o) onOpenChange(o) }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Smartphone className="h-4 w-4" />
            </span>
            Pay via M-Pesa (STK Push)
          </DialogTitle>
          <DialogDescription>
            Send a Lipa na M-Pesa prompt to the parent's phone. They enter their PIN to authorise.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* --- Not configured alert ----------------------------------- */}
          {step === 'not-configured' || (config && !configured) ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                    M-Pesa STK Push not configured
                  </p>
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-400">
                    Go to <span className="font-semibold">Settings → M-Pesa</span> to add your
                    Daraja API credentials (Consumer Key, Consumer Secret, Passkey and Shortcode).
                  </p>
                  {config && config.missing.length > 0 && (
                    <p className="mt-2 text-[11px] text-amber-700 dark:text-amber-400">
                      Missing: <span className="font-mono">{config.missing.join(', ')}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {/* --- FORM step ---------------------------------------------- */}
          {step === 'form' && (
            <>
              {/* M-Pesa info banner */}
              <div className="rounded-lg border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-3 dark:border-emerald-900 dark:from-emerald-950/40 dark:to-teal-950/40">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white shrink-0">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                      Daraja STK Push {config && <span className="opacity-70">· {config.env}</span>}
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      {config?.shortcode
                        ? <>Shortcode <span className="font-mono font-bold">{config.shortcode}</span> · Parent gets an M-Pesa prompt</>
                        : 'Loading configuration…'}
                    </p>
                  </div>
                </div>
              </div>

              {!invoice && (
                <InvoicePicker value={selectedInvoice} onChange={(i) => {
                  setSelectedInvoice(i)
                  if (i && !amount) setAmount(String(i.balance))
                }} />
              )}

              {selectedInvoice && (
                <div className="grid grid-cols-2 gap-3 rounded-lg border bg-muted/30 p-3 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice</p>
                    <p className="font-mono font-semibold">{selectedInvoice.invoiceNo}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Student</p>
                    <p className="font-medium truncate">{selectedInvoice.studentName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="font-semibold">{formatKES(selectedInvoice.amount)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Outstanding</p>
                    <p className="font-semibold text-rose-600 dark:text-rose-400">{formatKES(selectedInvoice.balance)}</p>
                  </div>
                </div>
              )}

              <div className="grid gap-3">
                <div className="grid gap-2">
                  <Label htmlFor="stk-phone">Parent Phone Number <span className="text-rose-500">*</span></Label>
                  <Input
                    id="stk-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0712345678 or +254712345678"
                    inputMode="tel"
                    autoComplete="off"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    The phone that will receive the M-Pesa prompt. Must be a Safaricom line registered for M-Pesa.
                  </p>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="stk-amount">Amount (KES) <span className="text-rose-500">*</span></Label>
                  <Input
                    id="stk-amount"
                    type="number"
                    min="1"
                    step="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                  />
                  {selectedInvoice && selectedInvoice.balance > 0 && (
                    <button type="button" className="self-start text-xs text-emerald-600 hover:underline dark:text-emerald-400"
                      onClick={() => setAmount(String(selectedInvoice.balance))}>
                      Use full balance ({formatKES(selectedInvoice.balance)})
                    </button>
                  )}
                </div>
              </div>
            </>
          )}

          {/* --- SENDING step ------------------------------------------- */}
          {step === 'sending' && (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
              <p className="text-sm font-medium">Contacting Daraja…</p>
              <p className="text-xs text-muted-foreground">Authenticating and sending the STK Push request.</p>
            </div>
          )}

          {/* --- WAITING step ------------------------------------------- */}
          {isWaiting && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3 py-4 text-center">
                <div className="relative">
                  <Smartphone className="h-12 w-12 text-emerald-600 dark:text-emerald-400" />
                  <span className="absolute -right-1 -top-1 flex h-3 w-3">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold">Check your phone for the M-Pesa prompt…</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Waiting for the parent to enter their M-Pesa PIN.
                    This page updates automatically.
                  </p>
                </div>
              </div>

              {selectedInvoice && (
                <div className="grid grid-cols-2 gap-2 rounded-lg border bg-muted/30 p-3 text-xs">
                  <div>
                    <p className="text-muted-foreground">Invoice</p>
                    <p className="font-mono font-semibold">{selectedInvoice.invoiceNo}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-semibold">{formatKES(parseFloat(amount) || 0)}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground">Phone</p>
                    <p className="font-mono">{phone}</p>
                  </div>
                  {checkoutRequestId && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground">CheckoutRequestID</p>
                      <p className="font-mono text-[10px] truncate">{checkoutRequestId}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Local-dev Simulate helper (Daraja can't reach localhost) */}
              <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/30">
                <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                  Simulate callback (for local demo)
                </p>
                <p className="mt-0.5 text-[10px] text-amber-700/80 dark:text-amber-400/80">
                  Daraja can't POST to a localhost URL. Use these buttons to trigger the
                  same callback flow locally.
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    size="sm" variant="outline"
                    disabled={simulating}
                    onClick={() => handleSimulate(true)}
                    className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400"
                  >
                    {simulating ? <Loader2 className="mr-1.5 h-3 w-3 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3 w-3" />}
                    Simulate Approve
                  </Button>
                  <Button
                    size="sm" variant="outline"
                    disabled={simulating}
                    onClick={() => handleSimulate(false)}
                    className="border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400"
                  >
                    <X className="mr-1.5 h-3 w-3" />
                    Simulate Decline
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* --- SUCCESS step ------------------------------------------- */}
          {step === 'success' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div>
                <p className="text-base font-semibold">Payment received</p>
                <p className="mt-1 text-xs text-muted-foreground">{resultDesc}</p>
              </div>
              {receipt && (
                <div className="w-full max-w-xs rounded-lg border bg-muted/30 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">M-Pesa Receipt</p>
                  <p className="font-mono text-lg font-bold text-emerald-700 dark:text-emerald-400">{receipt}</p>
                </div>
              )}
              {selectedInvoice && (
                <p className="text-xs text-muted-foreground">
                  Invoice <span className="font-mono font-medium">{selectedInvoice.invoiceNo}</span> has been updated.
                </p>
              )}
            </div>
          )}

          {/* --- FAILED step -------------------------------------------- */}
          {step === 'failed' && (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
                <AlertCircle className="h-8 w-8" />
              </div>
              <div>
                <p className="text-base font-semibold">Payment not completed</p>
                <p className="mt-1 text-xs text-muted-foreground">{resultDesc || 'The STK Push failed or was cancelled.'}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setStep('form')}>
                <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Try Again
              </Button>
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'form' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting || !selectedInvoice || !phone.trim() || !amount}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Smartphone className="h-4 w-4" />}
                Send M-Pesa Prompt
              </Button>
            </>
          )}
          {step === 'not-configured' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          )}
          {(step === 'success' || step === 'failed') && (
            <Button onClick={() => onOpenChange(false)} className="bg-emerald-600 hover:bg-emerald-700">
              Done
            </Button>
          )}
          {isWaiting && (
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Close window</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------
function OverviewTab() {
  const { data, loading, error, refetch } = useFetch<FinanceOverview>('/api/finance')

  if (error) {
    return <EmptyState icon={AlertCircle} title="Failed to load finance overview" description={error} action={<Button onClick={refetch} variant="outline">Retry</Button>} />
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Financial health snapshot — billed, collected, outstanding and expenses.
        </p>
        <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
          <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} /> Refresh
        </Button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Billed" value={loading ? '—' : formatKES(data?.totalBilled || 0)} icon={FileText} accent="emerald" loading={loading} />
        <StatCard label="Collected" value={loading ? '—' : formatKES(data?.totalCollected || 0)} icon={CircleDollarSign} accent="teal" loading={loading} />
        <StatCard label="Outstanding" value={loading ? '—' : formatKES(data?.totalOutstanding || 0)} icon={TrendingDown} accent="rose" loading={loading} />
        <StatCard label="Collection Rate" value={loading ? '—' : `${data?.collectionRate ?? 0}%`} icon={BadgeDollarSign} accent="amber" loading={loading} />
        <StatCard label="Today's Collection" value={loading ? '—' : formatKES(data?.todayCollection || 0)} icon={Coins} accent="cyan" loading={loading} />
        <StatCard label="Total Expenses" value={loading ? '—' : formatKES(data?.totalExpenses || 0)} icon={Receipt} accent="violet" loading={loading} />
      </div>

      {/* Collection rate progress */}
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">Overall Collection Rate</p>
              <p className="text-xs text-muted-foreground">Collected vs total billed (excludes cancelled invoices)</p>
            </div>
            <div className="flex items-center gap-3 sm:w-1/2">
              <Progress value={data?.collectionRate || 0} className="h-3 flex-1" />
              <span className="w-12 text-right text-sm font-bold text-emerald-600 dark:text-emerald-400">{data?.collectionRate ?? 0}%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Revenue vs Expenses trend */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Revenue vs Expenses
            </CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-64 w-full" /> : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data?.trend || []} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" className="dark:stroke-slate-800" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="oklch(0.5 0 0)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0 0)" tickFormatter={(v) => formatCompact(v)} />
                  <Tooltip
                    formatter={(v: number) => formatKES(v)}
                    contentStyle={{ borderRadius: 8, border: '1px solid oklch(0.9 0 0)', fontSize: 12 }}
                  />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="expenses" name="Expenses" stroke="#f43f5e" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Payments by method donut */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Payments by Method
            </CardTitle>
            <CardDescription>Last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-64 w-full" /> : (
              <div className="flex flex-col items-center">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={data?.paymentsByMethod || []}
                      dataKey="total"
                      nameKey="method"
                      innerRadius={55} outerRadius={85} paddingAngle={2}
                    >
                      {(data?.paymentsByMethod || []).map((entry) => (
                        <Cell key={entry.method} fill={METHOD_COLORS[entry.method] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number, _n, p: any) => [formatKES(v), p?.payload?.method || '']}
                      contentStyle={{ borderRadius: 8, border: '1px solid oklch(0.9 0 0)', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 w-full space-y-1.5">
                  {(data?.paymentsByMethod || []).sort((a, b) => b.total - a.total).map(m => (
                    <div key={m.method} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: METHOD_COLORS[m.method] || '#94a3b8' }} />
                        <span className="font-medium">{m.method}</span>
                        <span className="text-muted-foreground">({m.count})</span>
                      </div>
                      <span className="font-semibold">{formatKES(m.total)}</span>
                    </div>
                  ))}
                  {(data?.paymentsByMethod || []).length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">No payments in the last 30 days</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Invoices by status + Expenses by category */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              Invoices by Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-32 w-full" /> : (
              <div className="space-y-2.5">
                {(data?.invoicesByStatus || []).sort((a, b) => b.count - a.count).map(s => {
                  const total = (data?.invoicesByStatus || []).reduce((sum, x) => sum + x.count, 0) || 1
                  const pct = Math.round((s.count / total) * 100)
                  return (
                    <div key={s.status} className="flex items-center gap-3">
                      <div className="w-32 shrink-0">
                        <StatusBadge status={s.status} />
                      </div>
                      <div className="flex-1">
                        <Progress value={pct} className="h-2.5" />
                      </div>
                      <div className="w-20 shrink-0 text-right text-sm font-semibold">{s.count}</div>
                      <div className="w-12 shrink-0 text-right text-xs text-muted-foreground">{pct}%</div>
                    </div>
                  )
                })}
                {(data?.invoicesByStatus || []).length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">No invoices yet</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              Expenses by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-32 w-full" /> : (
              <div className="space-y-2.5">
                {(data?.expensesByCategory || []).sort((a, b) => b.total - a.total).map((c, idx) => {
                  const total = (data?.expensesByCategory || []).reduce((s, x) => s + x.total, 0) || 1
                  const pct = Math.round((c.total / total) * 100)
                  return (
                    <div key={c.category} className="flex items-center gap-3">
                      <div className="w-24 shrink-0 flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }} />
                        <span className="text-xs font-medium">{c.category}</span>
                      </div>
                      <div className="flex-1">
                        <Progress value={pct} className="h-2.5" />
                      </div>
                      <div className="w-24 shrink-0 text-right text-sm font-semibold">{formatKES(c.total)}</div>
                    </div>
                  )
                })}
                {(data?.expensesByCategory || []).length === 0 && (
                  <p className="text-center text-sm text-muted-foreground py-4">No expenses recorded</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Invoices tab
// ---------------------------------------------------------------------------
function GenerateInvoiceDialog({
  open, onOpenChange, feeStructures, onCreated,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  feeStructures: FeeStructureOption[]
  onCreated: () => void
}) {
  const [student, setStudent] = useState<PickedStudent | null>(null)
  const [feeStructureId, setFeeStructureId] = useState<string>('custom')
  const [amount, setAmount] = useState<string>('')
  const [dueDate, setDueDate] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setStudent(null)
      setFeeStructureId('custom')
      setAmount('')
      const d = new Date()
      d.setDate(d.getDate() + 30)
      setDueDate(d.toISOString().slice(0, 10))
    }
  }, [open])

  const selectedFs = feeStructures.find(f => f.id === feeStructureId)

  const handleSubmit = async () => {
    if (!student) { toast.error('Please select a student'); return }
    const amt = selectedFs ? selectedFs.totalAmount : parseFloat(amount)
    if (!Number.isFinite(amt) || amt <= 0) { toast.error('Enter a valid amount'); return }
    setSubmitting(true)
    try {
      const body: any = {
        studentId: student.id,
        feeStructureId: selectedFs?.id || undefined,
        amount: selectedFs ? undefined : amt,
        dueDate,
      }
      const res = await apiPost('/api/finance/invoices', body)
      toast.success(`Invoice ${res.invoiceNo} created`, {
        description: `${student.name} · ${formatKES(res.amount)}`,
      })
      onOpenChange(false)
      onCreated()
    } catch (e: any) {
      toast.error('Failed to create invoice', { description: e?.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <FileText className="h-4 w-4" />
            </span>
            Generate Invoice
          </DialogTitle>
          <DialogDescription>
            Create a new fee invoice for a student. Invoice no. is auto-generated.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <StudentPicker value={student} onChange={setStudent} />

          <div className="grid gap-2">
            <Label>Fee Structure</Label>
            <Select value={feeStructureId} onValueChange={setFeeStructureId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="custom">Custom amount</SelectItem>
                {feeStructures.map(f => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name} — {formatKES(f.totalAmount)} ({f.boarding ? 'Boarding' : 'Day'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedFs && (
              <div className="rounded-lg border bg-muted/30 p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-semibold">{formatKES(selectedFs.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Academic Year / Term</span>
                  <span className="font-medium">{selectedFs.academicYear} · {selectedFs.term}</span>
                </div>
                {selectedFs.dueDate && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Default Due Date</span>
                    <span className="font-medium">{formatDate(selectedFs.dueDate)}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {feeStructureId === 'custom' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="inv-amount">Amount (KES) <span className="text-rose-500">*</span></Label>
                <Input id="inv-amount" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inv-due">Due Date <span className="text-rose-500">*</span></Label>
                <Input id="inv-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
          )}
          {selectedFs && !dueDate && (
            <div className="grid gap-2">
              <Label htmlFor="inv-due-2">Due Date</Label>
              <Input id="inv-due-2" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !student}
            className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Generate Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ViewInvoiceDialog({
  open, onOpenChange, invoice, onRecordPayment, onStkPush,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  invoice: InvoiceRow | null
  onRecordPayment: (i: InvoiceRow) => void
  onStkPush: (i: InvoiceRow) => void
}) {
  if (!invoice) return null
  const pct = invoice.amount > 0 ? Math.min(100, Math.round((invoice.amountPaid / invoice.amount) * 100)) : 0

  // Print invoice with school letterhead — opens a new window with the
  // print dialog. User can save as PDF or send to a physical printer.
  const printInvoice = (inv: InvoiceRow) => {
    const statusClass = inv.status === 'Paid' ? 'badge-paid' : inv.status === 'Partially Paid' ? 'badge-partial' : inv.status === 'Cancelled' ? 'badge-cancelled' : 'badge-unpaid'
    const bodyHtml = `
      <div class="info-grid">
        <div class="info-card">
          <div class="label">Invoice Number</div>
          <div class="value">${inv.invoiceNo}</div>
        </div>
        <div class="info-card">
          <div class="label">Status</div>
          <div class="value"><span class="badge ${statusClass}">${inv.status}</span></div>
        </div>
        <div class="info-card">
          <div class="label">Student</div>
          <div class="value">${inv.studentName}<br><span style="font-size:11px;color:#6b7280;font-weight:400">${inv.admissionNo} · ${inv.classLevel}</span></div>
        </div>
        <div class="info-card">
          <div class="label">Academic Period</div>
          <div class="value">${inv.academicYear} · ${inv.term}</div>
        </div>
        <div class="info-card">
          <div class="label">Issue Date</div>
          <div class="value">${formatDate(inv.issueDate)}</div>
        </div>
        <div class="info-card">
          <div class="label">Due Date</div>
          <div class="value">${formatDate(inv.dueDate)}</div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>School Fees — ${inv.term} ${inv.academicYear}<br><span style="font-size:11px;color:#6b7280">${inv.classLevel}</span></td>
            <td style="text-align:right">${formatKESForPrint(inv.amount)}</td>
          </tr>
          <tr class="total-row">
            <td>Total Billed</td>
            <td style="text-align:right">${formatKESForPrint(inv.amount)}</td>
          </tr>
          <tr>
            <td>Amount Paid</td>
            <td style="text-align:right;color:#059669">${formatKESForPrint(inv.amountPaid)}</td>
          </tr>
          <tr>
            <td>Balance Due</td>
            <td style="text-align:right;color:#dc2626;font-weight:700">${formatKESForPrint(inv.balance)}</td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top:24px;font-size:11px;color:#6b7280">
        Please make payment via M-Pesa Paybill or at the school bursar's office before the due date.
        Late payments may attract a surcharge. For queries, contact the finance office.
      </p>
    `
    printWithLetterhead({
      title: 'INVOICE',
      subtitle: inv.invoiceNo,
      school: null, // school info loaded from API in a real impl
      bodyHtml,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Invoice <span className="font-mono">{invoice.invoiceNo}</span>
          </DialogTitle>
          <DialogDescription>
            Issued {formatDate(invoice.issueDate)} · Due {formatDate(invoice.dueDate)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Student */}
          <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className={cn('text-xs font-semibold text-white', avatarColor(invoice.studentId))}>
                {initials(invoice.studentName.split(' ')[0], invoice.studentName.split(' ')[1])}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="font-medium truncate">{invoice.studentName}</p>
              <p className="text-xs text-muted-foreground">
                {invoice.admissionNo} · {invoice.classLevel} {invoice.stream}
                {invoice.boarding && <Badge variant="outline" className="ml-2 text-[10px]">Boarding</Badge>}
              </p>
            </div>
            <StatusBadge status={invoice.status} />
          </div>

          {/* Fee structure */}
          {invoice.feeStructure && (
            <div className="text-xs text-muted-foreground">
              Fee Structure: <span className="font-medium text-foreground">{invoice.feeStructure.name}</span>
              {invoice.feeStructure.boarding && <Badge variant="outline" className="ml-2 text-[10px]">Boarding</Badge>}
            </div>
          )}

          {/* Amount breakdown */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-base font-bold">{formatKES(invoice.amount)}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 p-3">
              <p className="text-xs text-muted-foreground">Paid</p>
              <p className="text-base font-bold text-emerald-700 dark:text-emerald-400">{formatKES(invoice.amountPaid)}</p>
            </div>
            <div className="rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-3">
              <p className="text-xs text-muted-foreground">Balance</p>
              <p className="text-base font-bold text-rose-700 dark:text-rose-400">{formatKES(invoice.balance)}</p>
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Payment progress</span>
              <span className="font-semibold">{pct}%</span>
            </div>
            <Progress value={pct} className="h-2.5" />
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{invoice.academicYear} · {invoice.term}</span>
            <span>Payments recorded: <span className="font-semibold text-foreground">{invoice.paymentsCount}</span></span>
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          <Button
            variant="outline"
            onClick={() => printInvoice(invoice)}
            className="gap-1.5 border-violet-300 text-violet-700 hover:bg-violet-50 dark:border-violet-900 dark:text-violet-400 dark:hover:bg-violet-950"
          >
            <Printer className="h-4 w-4" /> Print Invoice
          </Button>
          {invoice.status !== 'Paid' && invoice.status !== 'Cancelled' && (
            <>
              <Button
                variant="outline"
                onClick={() => { onOpenChange(false); onStkPush(invoice) }}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400 dark:hover:bg-emerald-950"
              >
                <Smartphone className="h-4 w-4" /> M-Pesa STK Push
              </Button>
              <Button
                onClick={() => { onOpenChange(false); onRecordPayment(invoice) }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <HandCoins className="h-4 w-4" /> Record Payment
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function InvoicesTab() {
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<string>('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [classLevel, setClassLevel] = useState<string>('')
  const [generateOpen, setGenerateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [viewInvoice, setViewInvoice] = useState<InvoiceRow | null>(null)
  const [viewOpen, setViewOpen] = useState(false)
  const [payInvoice, setPayInvoice] = useState<PickedInvoice | null>(null)
  const [payOpen, setPayOpen] = useState(false)
  const [stkInvoice, setStkInvoice] = useState<PickedInvoice | null>(null)
  const [stkOpen, setStkOpen] = useState(false)
  const pageSize = 15

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [search])

  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })
  if (status) params.set('status', status)
  if (debouncedSearch) params.set('search', debouncedSearch)
  if (classLevel) params.set('classLevel', classLevel)

  const { data, loading, error, refetch } = useFetch<InvoicesResponse>(`/api/finance/invoices?${params.toString()}`)

  const handleRecordPayment = (inv: InvoiceRow) => {
    setPayInvoice({
      id: inv.id, invoiceNo: inv.invoiceNo, studentName: inv.studentName, admissionNo: inv.admissionNo,
      classLevel: inv.classLevel, amount: inv.amount, amountPaid: inv.amountPaid, balance: inv.balance,
      status: inv.status, dueDate: inv.dueDate,
    })
    setPayOpen(true)
  }

  const handleStkPush = (inv: InvoiceRow) => {
    setStkInvoice({
      id: inv.id, invoiceNo: inv.invoiceNo, studentName: inv.studentName, admissionNo: inv.admissionNo,
      classLevel: inv.classLevel, amount: inv.amount, amountPaid: inv.amountPaid, balance: inv.balance,
      status: inv.status, dueDate: inv.dueDate,
    })
    setStkOpen(true)
  }

  const handleView = (inv: InvoiceRow) => {
    setViewInvoice(inv)
    setViewOpen(true)
  }

  // Print invoice directly from the table row (without opening the view dialog)
  const handlePrint = (inv: InvoiceRow) => {
    const statusClass = inv.status === 'Paid' ? 'badge-paid' : inv.status === 'Partially Paid' ? 'badge-partial' : inv.status === 'Cancelled' ? 'badge-cancelled' : 'badge-unpaid'
    printWithLetterhead({
      title: 'INVOICE',
      subtitle: inv.invoiceNo,
      school: null,
      bodyHtml: `
        <div class="info-grid">
          <div class="info-card"><div class="label">Invoice Number</div><div class="value">${inv.invoiceNo}</div></div>
          <div class="info-card"><div class="label">Status</div><div class="value"><span class="badge ${statusClass}">${inv.status}</span></div></div>
          <div class="info-card"><div class="label">Student</div><div class="value">${inv.studentName}<br><span style="font-size:11px;color:#6b7280;font-weight:400">${inv.admissionNo} · ${inv.classLevel}</span></div></div>
          <div class="info-card"><div class="label">Academic Period</div><div class="value">${inv.academicYear} · ${inv.term}</div></div>
          <div class="info-card"><div class="label">Issue Date</div><div class="value">${formatDate(inv.issueDate)}</div></div>
          <div class="info-card"><div class="label">Due Date</div><div class="value">${formatDate(inv.dueDate)}</div></div>
        </div>
        <table>
          <thead><tr><th>Description</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>
            <tr><td>School Fees — ${inv.term} ${inv.academicYear}<br><span style="font-size:11px;color:#6b7280">${inv.classLevel}</span></td><td style="text-align:right">${formatKESForPrint(inv.amount)}</td></tr>
            <tr class="total-row"><td>Total Billed</td><td style="text-align:right">${formatKESForPrint(inv.amount)}</td></tr>
            <tr><td>Amount Paid</td><td style="text-align:right;color:#059669">${formatKESForPrint(inv.amountPaid)}</td></tr>
            <tr><td>Balance Due</td><td style="text-align:right;color:#dc2626;font-weight:700">${formatKESForPrint(inv.balance)}</td></tr>
          </tbody>
        </table>
        <p style="margin-top:24px;font-size:11px;color:#6b7280">Please make payment via M-Pesa Paybill or at the school bursar's office before the due date.</p>
      `,
    })
  }

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by invoice no., name or admission no…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearch('')}>
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={status} onValueChange={(v) => { setStatus(v === 'all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="All statuses" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  {STATUS_OPTIONS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={classLevel} onValueChange={(v) => { setClassLevel(v === 'all' ? '' : v); setPage(1) }}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="All classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {(data?.classLevels || []).map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setGenerateOpen(true)}>
                <Plus className="h-4 w-4" /> Generate Invoice
              </Button>
              <Button variant="outline" className="border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950" onClick={() => setBulkOpen(true)}>
                <Users className="h-4 w-4" /> Bulk Bill by Class
              </Button>
            </div>
          </div>

          {/* Status count chips */}
          {(data?.statusCounts || []).length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
              <span className="text-xs text-muted-foreground">Quick filter:</span>
              <button
                className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium transition',
                  !status ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400'
                    : 'border-border hover:bg-accent')}
                onClick={() => { setStatus(''); setPage(1) }}
              >
                All ({data?.statusCounts.reduce((s, x) => s + x.count, 0) || 0})
              </button>
              {(data?.statusCounts || []).map(s => (
                <button
                  key={s.status}
                  className={cn('rounded-full border px-2.5 py-0.5 text-xs font-medium transition',
                    status === s.status ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400'
                      : 'border-border hover:bg-accent')}
                  onClick={() => { setStatus(s.status); setPage(1) }}
                >
                  {s.status} ({s.count})
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6"><EmptyState icon={AlertCircle} title="Failed to load invoices" description={error} action={<Button onClick={refetch} variant="outline">Retry</Button>} /></div>
          ) : loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (data?.invoices || []).length === 0 ? (
            <div className="p-6"><EmptyState icon={FileText} title="No invoices found" description="Try adjusting filters or generate a new invoice." /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="hidden md:table-cell">Class</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right hidden sm:table-cell">Paid</TableHead>
                    <TableHead className="text-right">Balance</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">Due</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.invoices || []).map(inv => (
                    <TableRow key={inv.id} className="hover:bg-muted/40 cursor-pointer" onClick={() => handleView(inv)}>
                      <TableCell className="font-mono font-semibold text-xs">{inv.invoiceNo}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-8 w-8 shrink-0">
                            <AvatarFallback className={cn('text-[10px] font-semibold text-white', avatarColor(inv.studentId))}>
                              {initials(inv.studentName.split(' ')[0], inv.studentName.split(' ')[1])}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{inv.studentName}</p>
                            <p className="text-xs text-muted-foreground">{inv.admissionNo}{inv.boarding && ' · Boarding'}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{inv.classLevel} <span className="text-muted-foreground">{inv.stream}</span></TableCell>
                      <TableCell className="text-right font-semibold text-sm">{formatKES(inv.amount)}</TableCell>
                      <TableCell className="text-right hidden sm:table-cell text-sm text-emerald-600 dark:text-emerald-400">{formatKES(inv.amountPaid)}</TableCell>
                      <TableCell className="text-right font-semibold text-sm text-rose-600 dark:text-rose-400">{formatKES(inv.balance)}</TableCell>
                      <TableCell><StatusBadge status={inv.status} /></TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{formatDate(inv.dueDate)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          {inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                            <Button size="sm" variant="ghost" className="h-8 px-2 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950"
                              onClick={() => handleRecordPayment(inv)}>
                              <HandCoins className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline ml-1">Pay</span>
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleView(inv)} title="View invoice">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-violet-600 hover:text-violet-700" onClick={() => handlePrint(inv)} title="Print invoice">
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
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

      {/* Pagination */}
      {data && data.total > pageSize && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, data.total)} of {data.total}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>
              <ArrowLeft className="h-4 w-4" /> Prev
            </Button>
            <span className="text-sm">Page {page} of {data.totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage(p => Math.min(data.totalPages, p + 1))}>
              Next <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <GenerateInvoiceDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        feeStructures={data?.feeStructures || []}
        onCreated={() => { refetch(); toast.success('Invoice list refreshed') }}
      />

      {/* Bulk Invoice Dialog */}
      {bulkOpen && (
        <BulkInvoiceDialog
          classLevels={data?.classLevels || []}
          onClose={() => setBulkOpen(false)}
          onCreated={() => { refetch() }}
        />
      )}
      <ViewInvoiceDialog
        open={viewOpen}
        onOpenChange={setViewOpen}
        invoice={viewInvoice}
        onRecordPayment={handleRecordPayment}
        onStkPush={handleStkPush}
      />
      <RecordPaymentDialog
        open={payOpen}
        onOpenChange={setPayOpen}
        invoice={payInvoice}
        onRecorded={() => refetch()}
      />
      <StkPushDialog
        open={stkOpen}
        onOpenChange={setStkOpen}
        invoice={stkInvoice}
        onCompleted={() => refetch()}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Payments tab
// ---------------------------------------------------------------------------
function PaymentsTab() {
  const [method, setMethod] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [recordOpen, setRecordOpen] = useState(false)
  const [stkOpen, setStkOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const params = new URLSearchParams()
  if (method) params.set('method', method)
  if (from) params.set('from', from)
  if (to) params.set('to', to)

  const { data, loading, error, refetch } = useFetch<PaymentsResponse>(`/api/finance/payments?${params.toString()}`, [refreshKey])

  const onRecorded = () => {
    refetch()
    setRefreshKey(k => k + 1)
  }

  return (
    <div className="space-y-4">
      {/* M-Pesa info banner */}
      <div className="overflow-hidden rounded-xl border border-emerald-200 dark:border-emerald-900 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
        <div className="flex flex-col items-start gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">M-Pesa Daraja STK Push</p>
              <p className="text-xs text-emerald-50">
                Send a Lipa na M-Pesa prompt to the parent's phone — they enter their PIN to pay.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="bg-white text-emerald-700 hover:bg-emerald-50"
              onClick={() => setStkOpen(true)}
            >
              <Smartphone className="h-4 w-4" /> Pay via M-Pesa STK Push
            </Button>
            <Button
              variant="secondary"
              className="bg-white/20 text-white hover:bg-white/30 backdrop-blur"
              onClick={() => setRecordOpen(true)}
            >
              <HandCoins className="h-4 w-4" /> Record Manual Payment
            </Button>
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">From</span>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-[150px]" />
              <span className="text-sm text-muted-foreground">to</span>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-[150px]" />
            </div>
            <div className="flex items-center gap-2 sm:ml-auto">
              <Select value={method} onValueChange={(v) => setMethod(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[160px]"><SelectValue placeholder="All methods" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  {METHOD_OPTIONS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
              {(method || from || to) && (
                <Button variant="ghost" size="sm" onClick={() => { setMethod(''); setFrom(''); setTo('') }}>
                  <X className="h-4 w-4" /> Clear
                </Button>
              )}
            </div>
          </div>

          {/* Method summary chips */}
          {(data?.methodSummary || []).length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-3">
              <span className="text-xs text-muted-foreground">Totals:</span>
              {(data?.methodSummary || []).sort((a, b) => b.total - a.total).map(m => (
                <div key={m.method} className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium', methodClass(m.method))}>
                  {m.method}: <span className="font-bold">{formatKES(m.total)}</span>
                  <span className="opacity-70">({m.count})</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6"><EmptyState icon={AlertCircle} title="Failed to load payments" description={error} action={<Button onClick={refetch} variant="outline">Retry</Button>} /></div>
          ) : loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (data?.payments || []).length === 0 ? (
            <div className="p-6"><EmptyState icon={HandCoins} title="No payments found" description="Adjust filters or record a new payment." /></div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reference</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead className="hidden md:table-cell">Payer</TableHead>
                    <TableHead className="hidden lg:table-cell">Invoice</TableHead>
                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(data?.payments || []).map(p => (
                    <TableRow key={p.id} className="hover:bg-muted/40">
                      <TableCell className="font-mono text-xs">
                        {p.reference || <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          {p.studentId && (
                            <Avatar className="h-8 w-8 shrink-0">
                              <AvatarFallback className={cn('text-[10px] font-semibold text-white', avatarColor(p.studentId))}>
                                {initials(p.studentName.split(' ')[0], p.studentName.split(' ')[1])}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{p.studentName || '—'}</p>
                            <p className="text-xs text-muted-foreground">{p.admissionNo}{p.classLevel !== '—' && ` · ${p.classLevel}`}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-700 dark:text-emerald-400">{formatKES(p.amount)}</TableCell>
                      <TableCell><MethodBadge method={p.method} /></TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm">
                          <p className="font-medium truncate">{p.payerName || '—'}</p>
                          {p.payerPhone && <p className="text-xs text-muted-foreground">{p.payerPhone}</p>}
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell font-mono text-xs text-muted-foreground">{p.invoiceNo}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{formatDateTime(p.receivedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <RecordPaymentDialog
        open={recordOpen}
        onOpenChange={setRecordOpen}
        invoice={null}
        onRecorded={onRecorded}
      />
      <StkPushDialog
        open={stkOpen}
        onOpenChange={setStkOpen}
        invoice={null}
        onCompleted={onRecorded}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Expenses tab
// ---------------------------------------------------------------------------
function AddExpenseDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: () => void }) {
  const [category, setCategory] = useState('Utilities')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer')
  const [recipient, setRecipient] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setCategory('Utilities'); setDescription(''); setAmount('')
      setDate(new Date().toISOString().slice(0, 10)); setPaymentMethod('Bank Transfer'); setRecipient('')
    }
  }, [open])

  const handleSubmit = async () => {
    if (!description.trim()) { toast.error('Description is required'); return }
    const amt = parseFloat(amount)
    if (!Number.isFinite(amt) || amt <= 0) { toast.error('Enter a valid amount'); return }
    setSubmitting(true)
    try {
      await apiPost('/api/finance/expenses', {
        category, description: description.trim(), amount: amt, date,
        paymentMethod, recipient: recipient.trim() || null,
      })
      toast.success('Expense recorded', { description: `${category} · ${formatKES(amt)}` })
      onOpenChange(false)
      onCreated()
    } catch (e: any) {
      toast.error('Failed to record expense', { description: e?.message })
    } finally {
      setSubmitting(false)
    }
  }

  const selectedMeta = EXPENSE_CATEGORY_META[category] || EXPENSE_CATEGORY_META.Other

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={cn('flex h-7 w-7 items-center justify-center rounded-lg', selectedMeta.bg, selectedMeta.text)}>
              <Receipt className="h-4 w-4" />
            </span>
            Add Expense
          </DialogTitle>
          <DialogDescription>Record a school expenditure.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Category selector with visual cards */}
          <div>
            <Label className="mb-2 block">Category <span className="text-rose-500">*</span></Label>
            <div className="grid grid-cols-3 gap-2">
              {EXPENSE_CATEGORIES.map(c => {
                const meta = EXPENSE_CATEGORY_META[c] || EXPENSE_CATEGORY_META.Other
                const Icon = meta.icon
                const selected = category === c
                return (
                  <button
                    key={c}
                    onClick={() => setCategory(c)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 rounded-xl border p-3 text-center transition-all',
                      selected ? cn('border-2', meta.bg, meta.text) : 'border-border hover:bg-muted/50'
                    )}
                  >
                    <Icon className="h-5 w-5" style={{ color: meta.color }} />
                    <span className="text-[10px] font-medium">{c}</span>
                  </button>
                )
              })}
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">{selectedMeta.desc}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="exp-amount">Amount (KES) <span className="text-rose-500">*</span></Label>
              <Input id="exp-amount" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="exp-date">Date</Label>
              <Input id="exp-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="exp-desc">Description <span className="text-rose-500">*</span></Label>
            <Input id="exp-desc" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Electricity bill — March 2025" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Bank Transfer', 'M-Pesa', 'Cheque', 'Cash', 'Card'].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="exp-recipient">Recipient</Label>
              <Input id="exp-recipient" value={recipient} onChange={(e) => setRecipient(e.target.value)}
                placeholder="e.g. KPLC, Supplier Co., Staff Payroll" />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}
            className="bg-violet-600 hover:bg-violet-700 text-white">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Expense
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ExpensesTab() {
  const [category, setCategory] = useState('')
  const [month, setMonth] = useState('')
  const [addOpen, setAddOpen] = useState(false)
  const [budgetOpen, setBudgetOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')

  const params = new URLSearchParams()
  if (category) params.set('category', category)
  if (month) params.set('month', month)

  const { data, loading, error, refetch } = useFetch<ExpensesResponse>(`/api/finance/expenses?${params.toString()}`, [refreshKey])

  const onCreated = () => {
    refetch()
    setRefreshKey(k => k + 1)
  }

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/api/finance/expenses/${id}`)
      toast.success('Expense deleted')
      onCreated()
    } catch (e: any) {
      toast.error('Failed to delete expense', { description: e?.message })
    }
  }

  const filteredExpenses = (data?.expenses || []).filter(e =>
    !search || e.description.toLowerCase().includes(search.toLowerCase()) || e.recipient.toLowerCase().includes(search.toLowerCase())
  )

  const totalActual = data?.totalActual || 0
  const totalBudget = data?.totalBudget || 0
  const budgetUtilization = totalBudget > 0 ? Math.round((totalActual / totalBudget) * 100) : 0

  return (
    <div className="space-y-4">
      {/* Budget vs Actual summary banner */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Budget</p>
                <p className="text-2xl font-bold text-emerald-600">{formatKES(totalBudget)}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
                <Target className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Actual Spent</p>
                <p className="text-2xl font-bold text-violet-600">{formatKES(totalActual)}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20">
                <Receipt className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Remaining</p>
                <p className={cn('text-2xl font-bold', totalBudget - totalActual < 0 ? 'text-rose-600' : 'text-teal-600')}>
                  {formatKES(totalBudget - totalActual)}
                </p>
                <p className="text-[10px] text-muted-foreground">{budgetUtilization}% utilized</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20">
                <Wallet2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget utilization progress */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-emerald-600" /> Budget Utilization</CardTitle>
              <CardDescription>Term 1, 2025 — {budgetUtilization}% of budget spent</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => setBudgetOpen(true)}>
              <Target className="mr-1.5 h-3.5 w-3.5" /> Set Budgets
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {(data?.budgets || []).map(b => {
            const meta = EXPENSE_CATEGORY_META[b.category] || EXPENSE_CATEGORY_META.Other
            const Icon = meta.icon
            const overBudget = b.utilization > 100
            return (
              <div key={b.category} className="flex items-center gap-3">
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-lg', meta.bg, meta.text)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium">{b.category}</span>
                    <span className="text-muted-foreground">
                      {formatKES(b.actual)} / {formatKES(b.budget)}
                      <span className={cn('ml-1.5 font-semibold', overBudget ? 'text-rose-600' : b.utilization > 80 ? 'text-amber-600' : 'text-emerald-600')}>
                        ({b.utilization}%)
                      </span>
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', overBudget ? 'bg-rose-500' : b.utilization > 80 ? 'bg-amber-500' : 'bg-emerald-500')}
                      style={{ width: `${Math.min(100, b.utilization)}%` }}
                    />
                  </div>
                </div>
                <div className={cn('shrink-0 text-right text-xs font-semibold', b.variance >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                  {b.variance >= 0 ? '+' : ''}{formatCompact(b.variance)}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Monthly trend + Category breakdown */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-violet-600" /> Monthly Expense Trend</CardTitle>
            <CardDescription>Last 6 months</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={data?.monthlyTrend || []} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" tickFormatter={(v) => formatCompact(v)} />
                  <Tooltip formatter={(v: number) => formatKES(v)} contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} cursor={{ fill: 'oklch(0.96 0.01 150)' }} />
                  <Bar dataKey="amount" radius={[6, 6, 0, 0]} maxBarSize={50} fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4 text-violet-600" /> Expenses by Category</CardTitle>
            <CardDescription>Total: {formatKES(data?.total || 0)}</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? <Skeleton className="h-48 w-full" /> : (data?.byCategory || []).length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">No expenses recorded</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(data?.byCategory || []).map((c, i) => ({ name: c.category, total: c.total, fill: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" tickFormatter={(v) => formatCompact(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" width={80} />
                  <Tooltip formatter={(v: number) => formatKES(v)} contentStyle={{ borderRadius: 8, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} />
                  <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                    {(data?.byCategory || []).map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expense records table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Expense Records</CardTitle>
              <CardDescription>{filteredExpenses.length} of {data?.totalCount || 0} records · Total: {formatKES(data?.total || 0)}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search..."
                  className="w-40 pl-9"
                />
              </div>
              <Select value={category} onValueChange={(v) => setCategory(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[150px]"><SelectValue placeholder="All categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={month || 'all'} onValueChange={(v) => setMonth(v === 'all' ? '' : v)}>
                <SelectTrigger className="w-[140px]"><SelectValue placeholder="All months" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All months</SelectItem>
                  {Array.from({ length: 6 }).map((_, i) => {
                    const d = new Date()
                    d.setMonth(d.getMonth() - i)
                    const val = d.toISOString().slice(0, 7)
                    return <SelectItem key={val} value={val}>{d.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}</SelectItem>
                  })}
                </SelectContent>
              </Select>
              <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setAddOpen(true)}>
                <Plus className="h-4 w-4" /> Add Expense
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {error ? (
            <div className="p-6"><EmptyState icon={AlertCircle} title="Failed to load expenses" description={error} action={<Button onClick={refetch} variant="outline">Retry</Button>} /></div>
          ) : loading ? (
            <div className="space-y-2 p-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filteredExpenses.length === 0 ? (
            <div className="p-6"><EmptyState icon={Receipt} title="No expenses found" description="Adjust filters or add a new expense." /></div>
          ) : (
            <div className="overflow-x-auto max-h-[420px] overflow-y-auto scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Category</TableHead>
                    <TableHead className="text-xs">Description</TableHead>
                    <TableHead className="text-right text-xs">Amount</TableHead>
                    <TableHead className="hidden md:table-cell text-xs">Method</TableHead>
                    <TableHead className="hidden lg:table-cell text-xs">Recipient</TableHead>
                    <TableHead className="text-right text-xs"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredExpenses.map(e => {
                    const meta = EXPENSE_CATEGORY_META[e.category] || EXPENSE_CATEGORY_META.Other
                    const Icon = meta.icon
                    return (
                      <TableRow key={e.id} className="group hover:bg-muted/40">
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(e.date)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', meta.bg, meta.text)}>
                              <Icon className="h-3.5 w-3.5" />
                            </div>
                            <span className="text-xs font-medium">{e.category}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm max-w-[240px] truncate">{e.description}</TableCell>
                        <TableCell className="text-right font-semibold text-violet-700 dark:text-violet-400 whitespace-nowrap">{formatKES(e.amount)}</TableCell>
                        <TableCell className="hidden md:table-cell"><MethodBadge method={e.paymentMethod} /></TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{e.recipient || '—'}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 opacity-0 group-hover:opacity-100 text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950"
                            onClick={() => handleDelete(e.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AddExpenseDialog open={addOpen} onOpenChange={setAddOpen} onCreated={onCreated} />
      {budgetOpen && <SetBudgetDialog open={budgetOpen} onOpenChange={setBudgetOpen} onCreated={onCreated} />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Set Budget Dialog
// ---------------------------------------------------------------------------
function SetBudgetDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: () => void }) {
  const [budgets, setBudgets] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      fetch('/api/finance/budgets')
        .then(r => r.json())
        .then(d => {
          const map: Record<string, string> = {}
          d.budgets.forEach((b: any) => { map[b.category] = String(b.amount) })
          setBudgets(map)
        })
        .catch(() => {})
    }
  }, [open])

  const handleSubmit = async () => {
    setSaving(true)
    try {
      for (const [cat, amt] of Object.entries(budgets)) {
        if (amt && parseFloat(amt) > 0) {
          await apiPost('/api/finance/budgets', { category: cat, amount: parseFloat(amt) })
        }
      }
      toast.success('Budgets updated successfully')
      onOpenChange(false)
      onCreated()
    } catch (e: any) {
      toast.error('Failed to update budgets', { description: e?.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Target className="h-4 w-4" />
            </span>
            Set Category Budgets
          </DialogTitle>
          <DialogDescription>Allocate budget limits for each expense category (Term 1, 2025).</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {EXPENSE_CATEGORIES.map(cat => {
            const meta = EXPENSE_CATEGORY_META[cat] || EXPENSE_CATEGORY_META.Other
            const Icon = meta.icon
            return (
              <div key={cat} className="flex items-center gap-3">
                <div className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', meta.bg, meta.text)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <Label className="text-xs font-medium">{cat}</Label>
                  <p className="text-[10px] text-muted-foreground">{meta.desc}</p>
                </div>
                <div className="relative w-32">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">Ksh</span>
                  <Input
                    type="number"
                    value={budgets[cat] || ''}
                    onChange={e => setBudgets({ ...budgets, [cat]: e.target.value })}
                    className="pl-9"
                    placeholder="0"
                  />
                </div>
              </div>
            )
          })}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
            Save Budgets
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Scholarships tab
// ---------------------------------------------------------------------------
function AddScholarshipDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: () => void }) {
  const [student, setStudent] = useState<PickedStudent | null>(null)
  const [name, setName] = useState('')
  const [provider, setProvider] = useState('')
  const [amount, setAmount] = useState('')
  const [coverage, setCoverage] = useState('Full')
  const [academicYear, setAcademicYear] = useState('2025')
  const [status, setStatus] = useState('Active')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) {
      setStudent(null); setName(''); setProvider(''); setAmount('')
      setCoverage('Full'); setAcademicYear('2025'); setStatus('Active')
      setStartDate(new Date().toISOString().slice(0, 10)); setEndDate('')
    }
  }, [open])

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error('Scholarship name is required'); return }
    const amt = parseFloat(amount)
    if (!Number.isFinite(amt) || amt <= 0) { toast.error('Enter a valid amount'); return }
    setSubmitting(true)
    try {
      await apiPost('/api/finance/scholarships', {
        studentId: student?.id || null,
        name: name.trim(),
        provider: provider.trim() || null,
        amount: amt,
        coverage,
        academicYear,
        status,
        startDate,
        endDate: endDate || null,
      })
      toast.success('Scholarship created', { description: `${name} · ${formatKES(amt)}` })
      onOpenChange(false)
      onCreated()
    } catch (e: any) {
      toast.error('Failed to create scholarship', { description: e?.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <GraduationCap className="h-4 w-4" />
            </span>
            Add Scholarship
          </DialogTitle>
          <DialogDescription>Award a scholarship or bursary to a student.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <StudentPicker value={student} onChange={setStudent} required={false} />

          <div className="grid gap-2">
            <Label htmlFor="sch-name">Scholarship Name <span className="text-rose-500">*</span></Label>
            <Input id="sch-name" value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Equity Wings to Fly" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="sch-provider">Provider</Label>
              <Input id="sch-provider" value={provider} onChange={(e) => setProvider(e.target.value)}
                placeholder="e.g. NGO, Government, Corporate" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sch-amount">Amount (KES) <span className="text-rose-500">*</span></Label>
              <Input id="sch-amount" type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label>Coverage</Label>
              <Select value={coverage} onValueChange={setCoverage}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {COVERAGE_OPTIONS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Academic Year</Label>
              <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} placeholder="2025" />
            </div>
            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Active', 'Expired', 'Revoked'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="sch-start">Start Date</Label>
              <Input id="sch-start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sch-end">End Date</Label>
              <Input id="sch-end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add Scholarship
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ScholarshipsTab() {
  const [addOpen, setAddOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const { data, loading, error, refetch } = useFetch<ScholarshipsResponse>('/api/finance/scholarships', [refreshKey])

  const onCreated = () => {
    refetch()
    setRefreshKey(k => k + 1)
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Scholarships" value={loading ? '—' : (data?.total || 0)} icon={GraduationCap} accent="emerald" loading={loading} />
        <StatCard label="Total Awarded" value={loading ? '—' : formatKES(data?.totalAmount || 0)} icon={BadgeDollarSign} accent="teal" loading={loading} />
        <StatCard label="Full Coverage" value={loading ? '—' : (data?.byCoverage.find(c => c.coverage === 'Full')?.count || 0)} icon={ShieldCheck} accent="cyan" loading={loading} />
        <StatCard label="Active" value={loading ? '—' : (data?.byStatus.find(s => s.status === 'Active')?.count || 0)} icon={CheckCircle2} accent="amber" loading={loading} />
      </div>

      {/* List */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Awarded scholarships and bursaries</p>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" /> Add Scholarship
        </Button>
      </div>

      {error ? (
        <EmptyState icon={AlertCircle} title="Failed to load scholarships" description={error} action={<Button onClick={refetch} variant="outline">Retry</Button>} />
      ) : loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : (data?.scholarships || []).length === 0 ? (
        <EmptyState icon={GraduationCap} title="No scholarships yet" description="Add a scholarship or bursary to get started." />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {(data?.scholarships || []).map(s => (
            <Card key={s.id} className="overflow-hidden transition-all hover:shadow-md">
              <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-4 text-white">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/20 backdrop-blur">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{s.name}</p>
                      <p className="text-xs text-emerald-50">{s.provider || 'Provider —'}</p>
                    </div>
                  </div>
                  <CoverageBadge coverage={s.coverage} />
                </div>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-emerald-50">Amount</p>
                    <p className="text-xl font-bold">{formatKES(s.amount)}</p>
                  </div>
                  <span className={cn(
                    'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold',
                    s.status === 'Active' ? 'bg-white/25 text-white' : 'bg-white/10 text-emerald-50'
                  )}>
                    {s.status === 'Active' && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    {s.status}
                  </span>
                </div>
              </div>
              <CardContent className="p-4 space-y-3">
                {/* Student */}
                <div className="flex items-center gap-2.5">
                  {s.studentId ? (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className={cn('text-[10px] font-semibold text-white', avatarColor(s.studentId))}>
                        {initials(s.studentName.split(' ')[0], s.studentName.split(' ')[1])}
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.studentName}</p>
                    {s.admissionNo && (
                      <p className="text-xs text-muted-foreground">
                        {s.admissionNo} · {s.classLevel} {s.stream}
                        {s.boarding && ' · Boarding'}
                      </p>
                    )}
                  </div>
                </div>

                {/* Dates */}
                <div className="flex items-center justify-between text-xs text-muted-foreground border-t pt-2">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>From {formatDate(s.startDate)}</span>
                  </div>
                  {s.endDate && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>Until {formatDate(s.endDate)}</span>
                    </div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  AY <span className="font-medium text-foreground">{s.academicYear}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddScholarshipDialog open={addOpen} onOpenChange={setAddOpen} onCreated={onCreated} />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main module
// ---------------------------------------------------------------------------
export function FinanceModule() {
  const [tab, setTab] = useState('overview')

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Finance & Fees"
        description="Invoices, payments, M-Pesa collections, scholarships & expenses"
        icon={Wallet}
      />

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="overflow-x-auto">
          <TabsList className="flex w-max min-w-full">
            <TabsTrigger value="overview" className="gap-1.5">
              <Wallet className="h-3.5 w-3.5" /> Overview
            </TabsTrigger>
            <TabsTrigger value="invoices" className="gap-1.5">
              <FileText className="h-3.5 w-3.5" /> Invoices
            </TabsTrigger>
            <TabsTrigger value="payments" className="gap-1.5">
              <HandCoins className="h-3.5 w-3.5" /> Payments
            </TabsTrigger>
            <TabsTrigger value="expenses" className="gap-1.5">
              <Receipt className="h-3.5 w-3.5" /> Expenses
            </TabsTrigger>
            <TabsTrigger value="scholarships" className="gap-1.5">
              <GraduationCap className="h-3.5 w-3.5" /> Scholarships
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-4"><OverviewTab /></TabsContent>
        <TabsContent value="invoices" className="mt-4"><InvoicesTab /></TabsContent>
        <TabsContent value="payments" className="mt-4"><PaymentsTab /></TabsContent>
        <TabsContent value="expenses" className="mt-4"><ExpensesTab /></TabsContent>
        <TabsContent value="scholarships" className="mt-4"><ScholarshipsTab /></TabsContent>
      </Tabs>
    </div>
  )
}

// ---------------------------------------------------------------------------
// BulkInvoiceDialog — generate invoices for all students in a class level
// ---------------------------------------------------------------------------
function BulkInvoiceDialog({ classLevels, onClose, onCreated }: {
  classLevels: any[]
  onClose: () => void
  onCreated: () => void
}) {
  const [classLevelId, setClassLevelId] = useState('')
  const [amount, setAmount] = useState('')
  const [term, setTerm] = useState('Term 1')
  const [academicYear, setAcademicYear] = useState(String(new Date().getFullYear()))
  const [dueDate, setDueDate] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!classLevelId) { toast.error('Please select a class/grade'); return }
    if (!amount || parseFloat(amount) <= 0) { toast.error('Please enter a valid amount'); return }
    if (!dueDate) { toast.error('Please select a due date'); return }

    setSubmitting(true)
    try {
      const res = await fetch('/api/finance/invoices/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classLevelId,
          amount: parseFloat(amount),
          term,
          academicYear,
          dueDate,
          description: description.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`${data.count} invoices generated!`, {
          description: `Total: KES ${data.totalAmount.toLocaleString()} for ${term} ${academicYear}`,
        })
        onClose()
        onCreated()
      } else {
        toast.error(data?.error || 'Failed to generate invoices')
      }
    } catch (e: any) {
      toast.error(e?.message || 'Network error')
    }
    setSubmitting(false)
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-teal-600" /> Bulk Invoice Generation
          </DialogTitle>
          <DialogDescription>
            Generate invoices for ALL students in a specific class/grade at once.
            Each student gets their own individual invoice.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs">Class / Grade Level *</Label>
            <Select value={classLevelId} onValueChange={setClassLevelId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select class (e.g. Grade 10, Form 2)" /></SelectTrigger>
              <SelectContent>
                {classLevels.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name} ({c.stage})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Amount per Student (KES) *</Label>
              <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="e.g. 35000" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Due Date *</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Term *</Label>
              <Select value={term} onValueChange={setTerm}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Term 1">Term 1</SelectItem>
                  <SelectItem value="Term 2">Term 2</SelectItem>
                  <SelectItem value="Term 3">Term 3</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Academic Year *</Label>
              <Input value={academicYear} onChange={e => setAcademicYear(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Description (optional)</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Term 1 Tuition + Boarding" className="mt-1" />
          </div>
          <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-3 dark:border-teal-800 dark:bg-teal-950/20">
            <p className="text-xs text-teal-700 dark:text-teal-400">
              <strong>How it works:</strong> The system will find all active students in the selected class,
              create an individual invoice for each one with the specified amount, term, and due date.
              Invoices can then be paid individually via M-Pesa, cash, or bank transfer.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting} className="bg-teal-600 hover:bg-teal-700">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
            {submitting ? 'Generating...' : 'Generate Invoices'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
