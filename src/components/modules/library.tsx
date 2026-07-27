'use client'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useFetch, apiPost, apiPut } from '@/lib/api'
import {
  cn, formatDate, formatKES, initials, avatarColor, statusColor,
} from '@/lib/format'
import { StatCard, SectionHeader, EmptyState } from '@/components/shared'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import {
  BookOpen, Search, Plus, BookMarked, BookCheck, BookX,
  ArrowRightLeft, AlertTriangle, RotateCcw, BookCopy, Library as LibraryIcon,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Book {
  id: string
  isbn: string | null
  title: string
  author: string
  category: string
  publisher: string | null
  yearPublished: number | null
  copiesTotal: number
  copiesAvailable: number
  shelfLocation: string | null
  status: string
  activeLoans: number
  overdueLoans: number
  createdAt: string
}

interface CatalogData {
  books: Book[]
  categories: string[]
  stats: {
    totalTitles: number
    totalCopies: number
    availableCopies: number
    borrowedCopies: number
    overdueCopies: number
  }
}

interface Loan {
  id: string
  bookId: string
  studentId: string | null
  borrowerName: string
  borrowDate: string
  dueDate: string
  returnDate: string | null
  status: string
  fine: number
  computedFine: number
  book: { id: string; title: string; author: string; isbn: string | null }
  student: { id: string; firstName: string; lastName: string; admissionNo: string } | null
}

interface LoanData {
  loans: Loan[]
  summary: {
    total: number
    borrowed: number
    overdue: number
    returned: number
    lost: number
    totalFines: number
  }
}

interface StudentOption {
  id: string
  admissionNo: string
  firstName: string
  lastName: string
}

const LOAN_TAB_STATUSES = ['All', 'Borrowed', 'Overdue', 'Returned', 'Lost'] as const

// ---------------------------------------------------------------------------
// Main module
// ---------------------------------------------------------------------------
export function LibraryModule() {
  return (
    <div className="space-y-6">
      <SectionHeader
        title="Library"
        description="Manage books, track loans, and monitor returns and fines."
        icon={LibraryIcon}
      />
      <Tabs defaultValue="catalog">
        <TabsList className="w-full sm:w-auto">
          <TabsTrigger value="catalog" className="flex-1 sm:flex-none gap-1.5">
            <BookCopy className="h-3.5 w-3.5" /> Catalog
          </TabsTrigger>
          <TabsTrigger value="loans" className="flex-1 sm:flex-none gap-1.5">
            <ArrowRightLeft className="h-3.5 w-3.5" /> Loans
          </TabsTrigger>
        </TabsList>
        <TabsContent value="catalog" className="mt-4">
          <CatalogTab />
        </TabsContent>
        <TabsContent value="loans" className="mt-4">
          <LoansTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Catalog Tab
// ---------------------------------------------------------------------------
function CatalogTab() {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [debounced, setDebounced] = useState('')

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 350)
    return () => clearTimeout(t)
  }, [search])

  const url = `/api/library?search=${encodeURIComponent(debounced)}&category=${encodeURIComponent(category)}`
  const { data, loading, error, refetch } = useFetch<CatalogData>(url)
  const [addOpen, setAddOpen] = useState(false)

  const books = data?.books ?? []
  const stats = data?.stats

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Titles" value={stats?.totalTitles ?? 0}
          icon={BookMarked} accent="emerald" loading={loading}
        />
        <StatCard
          label="Total Copies" value={stats?.totalCopies ?? 0}
          icon={BookOpen} accent="teal" loading={loading}
        />
        <StatCard
          label="Available" value={stats?.availableCopies ?? 0}
          icon={BookCheck} accent="cyan" loading={loading}
        />
        <StatCard
          label="Borrowed" value={stats?.borrowedCopies ?? 0}
          icon={BookX} accent="amber" loading={loading}
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by title, author, ISBN, publisher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v === '__all' ? '' : v)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__all">All categories</SelectItem>
            {data?.categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setAddOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Add Book
        </Button>
      </div>

      {error && (
        <Card className="border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30">
          <CardContent className="p-4 text-sm text-rose-700 dark:text-rose-300">
            Failed to load books: {error}
          </CardContent>
        </Card>
      )}

      {/* Book grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}><CardContent className="p-4 space-y-3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-2 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent></Card>
          ))}
        </div>
      ) : books.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No books found"
          description="Try a different search, or add a new book to the catalog."
          action={
            <Button onClick={() => setAddOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Plus className="h-4 w-4" /> Add Book
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {books.map((b) => (
            <BookCard key={b.id} book={b} onBorrowed={refetch} />
          ))}
        </div>
      )}

      <AddBookDialog open={addOpen} onOpenChange={setAddOpen} onAdded={refetch} categories={data?.categories ?? []} />
    </div>
  )
}

function BookCard({ book, onBorrowed }: { book: Book; onBorrowed: () => void }) {
  const [open, setOpen] = useState(false)
  const pct = book.copiesTotal > 0 ? (book.copiesAvailable / book.copiesTotal) * 100 : 0
  const isAvailable = book.copiesAvailable > 0

  return (
    <Card className="flex flex-col transition-all hover:shadow-md">
      <CardContent className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="line-clamp-2 font-semibold leading-tight">{book.title}</h4>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">by {book.author}</p>
          </div>
          <Badge variant="outline" className="shrink-0 text-[10px]">{book.category}</Badge>
        </div>

        <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
          {book.isbn && <p className="truncate"><span className="font-medium">ISBN:</span> {book.isbn}</p>}
          {book.shelfLocation && (
            <p><span className="font-medium">Shelf:</span> {book.shelfLocation}</p>
          )}
          {book.yearPublished && (
            <p><span className="font-medium">Year:</span> {book.yearPublished}</p>
          )}
        </div>

        {/* Availability bar */}
        <div className="mt-3">
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Availability</span>
            <span className={cn(
              'font-semibold',
              isAvailable ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
            )}>
              {book.copiesAvailable}/{book.copiesTotal} copies
            </span>
          </div>
          <Progress
            value={pct}
            className={cn('h-2', pct === 0 && '[&>div]:bg-rose-500', pct > 0 && pct < 50 && '[&>div]:bg-amber-500', pct >= 50 && '[&>div]:bg-emerald-500')}
          />
        </div>

        {book.overdueLoans > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-3 w-3" />
            {book.overdueLoans} overdue loan{book.overdueLoans > 1 ? 's' : ''}
          </div>
        )}

        <div className="mt-auto pt-4">
          <Button
            onClick={() => setOpen(true)}
            disabled={!isAvailable}
            className="w-full gap-2"
            variant={isAvailable ? 'default' : 'secondary'}
          >
            <BookOpen className="h-4 w-4" />
            {isAvailable ? 'Borrow' : 'Out of Stock'}
          </Button>
        </div>
      </CardContent>

      <IssueBookDialog
        open={open}
        onOpenChange={setOpen}
        preselectedBookId={book.id}
        bookLabel={`${book.title} — ${book.author}`}
        onIssued={onBorrowed}
      />
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Loans Tab
// ---------------------------------------------------------------------------
function LoansTab() {
  const [status, setStatus] = useState<string>('All')
  const [issueOpen, setIssueOpen] = useState(false)
  const [tick, setTick] = useState(0)

  const url = `/api/library/loans?status=${encodeURIComponent(status === 'All' ? '' : status)}&_=${tick}`
  const { data, loading, error, refetch } = useFetch<LoanData>(url)

  const loans = data?.loans ?? []
  const summary = data?.summary

  async function handleReturn(loan: Loan) {
    if (!confirm(`Mark "${loan.book.title}" as returned for ${loan.borrowerName}?`)) return
    try {
      const res = await apiPut<{ fine: number; daysOverdue: number }>(`/api/library/loans`, {
        loanId: loan.id, action: 'return',
      })
      if (res.fine > 0) {
        toast.success(`Book returned`, {
          description: `Overdue by ${res.daysOverdue} day(s). Fine: ${formatKES(res.fine)}`,
        })
      } else {
        toast.success('Book returned successfully')
      }
      refetch()
    } catch (e: unknown) {
      toast.error('Failed to return book', { description: (e as Error).message })
    }
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Loans" value={summary?.total ?? 0} icon={ArrowRightLeft} accent="emerald" loading={loading} />
        <StatCard label="Active" value={(summary?.borrowed ?? 0) + (summary?.overdue ?? 0)} icon={BookOpen} accent="teal" loading={loading} />
        <StatCard label="Overdue" value={summary?.overdue ?? 0} icon={AlertTriangle} accent="rose" loading={loading} />
        <StatCard label="Outstanding Fines" value={formatKES(summary?.totalFines ?? 0)} icon={BookX} accent="amber" loading={loading} />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LOAN_TAB_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{s === 'All' ? 'All Loans' : s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={() => setIssueOpen(true)} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
          <Plus className="h-4 w-4" /> Issue Book
        </Button>
      </div>

      {error && (
        <Card className="border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30">
          <CardContent className="p-4 text-sm text-rose-700 dark:text-rose-300">
            Failed to load loans: {error}
          </CardContent>
        </Card>
      )}

      {/* Loans table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-2 p-4">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : loans.length === 0 ? (
            <EmptyState
              icon={ArrowRightLeft}
              title="No loans found"
              description="Issue a book to create the first loan record."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Borrower</TableHead>
                    <TableHead>Book</TableHead>
                    <TableHead className="hidden md:table-cell">Borrowed</TableHead>
                    <TableHead className="hidden md:table-cell">Due</TableHead>
                    <TableHead className="hidden lg:table-cell">Returned</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Fine</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loans.map((l) => {
                    const isOverdue = l.status === 'Overdue' || (l.status === 'Borrowed' && new Date(l.dueDate) < new Date())
                    return (
                      <TableRow key={l.id} className={cn(isOverdue && 'bg-rose-50/50 dark:bg-rose-950/20')}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className={cn('text-[10px] font-semibold text-white', avatarColor(l.borrowerName))}>
                                {initials(l.borrowerName.split(' ')[0], l.borrowerName.split(' ')[1] || '')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">{l.borrowerName}</p>
                              {l.student && (
                                <p className="truncate text-[10px] text-muted-foreground">{l.student.admissionNo}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[200px]">
                            <p className="truncate text-sm font-medium">{l.book.title}</p>
                            <p className="truncate text-[10px] text-muted-foreground">{l.book.author}</p>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                          {formatDate(l.borrowDate)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-xs">
                          <span className={cn(isOverdue && 'font-medium text-rose-600 dark:text-rose-400')}>
                            {formatDate(l.dueDate)}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                          {l.returnDate ? formatDate(l.returnDate) : '—'}
                        </TableCell>
                        <TableCell>
                          <span className={cn('rounded px-2 py-0.5 text-[11px] font-medium', statusColor(l.status))}>
                            {l.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-xs">
                          {(l.computedFine || l.fine) > 0 ? (
                            <span className="font-semibold text-rose-600 dark:text-rose-400">
                              {formatKES(l.computedFine || l.fine)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {(l.status === 'Borrowed' || l.status === 'Overdue') && (
                            <Button
                              size="sm" variant="outline"
                              onClick={() => handleReturn(l)}
                              className="gap-1.5 h-7 text-xs"
                            >
                              <RotateCcw className="h-3 w-3" /> Return
                            </Button>
                          )}
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

      <IssueBookDialog
        open={issueOpen}
        onOpenChange={setIssueOpen}
        onIssued={() => { refetch(); setTick((t) => t + 1) }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Add Book Dialog
// ---------------------------------------------------------------------------
function AddBookDialog({
  open, onOpenChange, onAdded, categories,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onAdded: () => void
  categories: string[]
}) {
  const [form, setForm] = useState({
    isbn: '', title: '', author: '', category: 'General',
    publisher: '', yearPublished: '', copiesTotal: '1', shelfLocation: '',
  })
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    if (!form.title.trim() || !form.author.trim()) {
      toast.error('Title and author are required')
      return
    }
    setSaving(true)
    try {
      await apiPost('/api/library', {
        isbn: form.isbn.trim() || undefined,
        title: form.title.trim(),
        author: form.author.trim(),
        category: form.category.trim() || 'General',
        publisher: form.publisher.trim() || undefined,
        yearPublished: form.yearPublished ? Number(form.yearPublished) : undefined,
        copiesTotal: Number(form.copiesTotal) || 1,
        shelfLocation: form.shelfLocation.trim() || undefined,
      })
      toast.success('Book added to catalog')
      setForm({ isbn: '', title: '', author: '', category: 'General', publisher: '', yearPublished: '', copiesTotal: '1', shelfLocation: '' })
      onAdded()
      onOpenChange(false)
    } catch (e: unknown) {
      toast.error('Failed to add book', { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookMarked className="h-4 w-4 text-emerald-600" /> Add New Book
          </DialogTitle>
          <DialogDescription>Register a new title in the library catalog.</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Title *</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Author *</Label>
            <Input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Category</Label>
            <Input
              list="book-categories"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
            <datalist id="book-categories">
              {categories.map((c) => <option key={c} value={c} />)}
            </datalist>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">ISBN</Label>
            <Input value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Year Published</Label>
            <Input type="number" value={form.yearPublished} onChange={(e) => setForm({ ...form, yearPublished: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Publisher</Label>
            <Input value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Shelf Location</Label>
            <Input placeholder="e.g. A-12" value={form.shelfLocation} onChange={(e) => setForm({ ...form, shelfLocation: e.target.value })} />
          </div>
          <div className="col-span-2 space-y-1.5">
            <Label className="text-xs">Number of Copies</Label>
            <Input type="number" min={1} value={form.copiesTotal} onChange={(e) => setForm({ ...form, copiesTotal: e.target.value })} />
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSave} disabled={saving} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> {saving ? 'Adding...' : 'Add Book'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Issue Book Dialog
// ---------------------------------------------------------------------------
function IssueBookDialog({
  open, onOpenChange, onIssued, preselectedBookId, bookLabel,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onIssued: () => void
  preselectedBookId?: string
  bookLabel?: string
}) {
  const { data: catalog } = useFetch<CatalogData>('/api/library')
  const { data: studentData } = useFetch<{ students: StudentOption[] }>('/api/students?pageSize=500')

  const availableBooks = (catalog?.books ?? []).filter((b) => b.copiesAvailable > 0)
  const students = studentData?.students ?? []

  const [bookId, setBookId] = useState<string>(preselectedBookId || '')
  const [studentId, setStudentId] = useState<string>('')
  const [borrowerName, setBorrowerName] = useState('')
  const [saving, setSaving] = useState(false)

  // Sync preselected book when dialog opens
  useEffect(() => {
    if (open && preselectedBookId) setBookId(preselectedBookId)
    if (!open) { setBookId(''); setStudentId(''); setBorrowerName('') }
  }, [open, preselectedBookId])

  const dueDate = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 14)
    return d
  }, [])

  async function handleIssue() {
    const finalBookId = bookId || preselectedBookId
    if (!finalBookId) { toast.error('Select a book to issue'); return }
    if (!borrowerName.trim()) { toast.error('Borrower name is required'); return }
    setSaving(true)
    try {
      await apiPost('/api/library/loans', {
        bookId: finalBookId,
        studentId: studentId || undefined,
        borrowerName: borrowerName.trim(),
      })
      toast.success('Book issued successfully', {
        description: `Due on ${formatDate(dueDate)}`,
      })
      onIssued()
      onOpenChange(false)
      setBookId(''); setStudentId(''); setBorrowerName('')
    } catch (e: unknown) {
      toast.error('Failed to issue book', { description: (e as Error).message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-4 w-4 text-teal-600" /> Issue Book
          </DialogTitle>
          <DialogDescription>
            Loan period is 14 days. Overdue fine: KES 20/day.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {preselectedBookId && bookLabel ? (
            <div className="rounded-lg border bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
              <p className="text-xs text-muted-foreground">Selected Book</p>
              <p className="text-sm font-medium">{bookLabel}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label className="text-xs">Book *</Label>
              <Select value={bookId} onValueChange={setBookId}>
                <SelectTrigger><SelectValue placeholder="Select an available book..." /></SelectTrigger>
                <SelectContent>
                  {availableBooks.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.title} — {b.author} ({b.copiesAvailable} avail)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs">Borrower (Student)</Label>
            <Select
              value={studentId}
              onValueChange={(v) => {
                if (v === '__manual') { setStudentId(''); return }
                setStudentId(v)
                const s = students.find((st) => st.id === v)
                if (s) setBorrowerName(`${s.firstName} ${s.lastName}`)
              }}
            >
              <SelectTrigger><SelectValue placeholder="Select a student (or type manually below)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__manual">— Type manually —</SelectItem>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.admissionNo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Borrower Name *</Label>
            <Input
              placeholder="Full name of the borrower"
              value={borrowerName}
              onChange={(e) => setBorrowerName(e.target.value)}
            />
          </div>

          <div className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Borrow Date</span>
              <span className="font-medium">{formatDate(new Date())}</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Due Date (14 days)</span>
              <span className="font-medium text-emerald-600 dark:text-emerald-400">{formatDate(dueDate)}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleIssue} disabled={saving} className="gap-2 bg-teal-600 hover:bg-teal-700">
            <BookOpen className="h-4 w-4" /> {saving ? 'Issuing...' : 'Issue Book'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
