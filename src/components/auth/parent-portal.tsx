'use client'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import {
  School,
  ArrowLeft,
  ArrowRight,
  User,
  Phone,
  Building2,
  Wallet,
  AlertCircle,
  CalendarDays,
  BookOpen,
  Megaphone,
  CalendarClock,
  RefreshCw,
  LogOut,
  Sparkles,
  GraduationCap,
  FileText,
  Send,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import { useFetch } from '@/lib/api'
import {
  formatKES,
  formatDate,
  initials,
  statusColor,
  gradeColor,
} from '@/lib/format'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LookupResult {
  student: {
    id: string
    name: string
    admissionNo: string
    classLevel: string
    stream: string
    photo: string | null
  }
  schoolName: string
}

interface DashboardData {
  student: {
    id: string
    admissionNo: string
    name: string
    firstName: string
    lastName: string
    gender: string
    boarding: boolean
    photo: string | null
    classLevel: string
    stream: string
    status: string
  }
  school: { id: string; name: string; slug: string } | null
  guardian: {
    name: string
    phone: string
    relation: string
  } | null
  fees: {
    totalBilled: number
    totalPaid: number
    totalBalance: number
    invoices: Array<{
      id: string
      invoiceNo: string
      academicYear: string
      term: string
      amount: number
      amountPaid: number
      balance: number
      status: string
      dueDate: string
      issueDate: string
    }>
  }
  attendance: Array<{ id: string; date: string; status: string }>
  grades: Array<{
    id: string
    subject: string
    marks: number
    grade: string
    points: number
    remarks: string | null
    exam: string
    examType: string
    term: string
  }>
  announcements: Array<{
    id: string
    title: string
    body: string
    priority: string
    pinned: boolean
    publishedAt: string
    authorName: string | null
  }>
  events: Array<{
    id: string
    title: string
    description: string | null
    category: string
    startDate: string
    endDate: string | null
    location: string | null
    status: string
  }>
}

const ATTENDANCE_BADGE: Record<string, string> = {
  Present:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Late: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Absent: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
  Excused:
    'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  Sick: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400',
}

const EVENT_CATEGORY_COLOR: Record<string, string> = {
  Academic: 'text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950',
  Sports: 'text-orange-700 bg-orange-50 dark:text-orange-400 dark:bg-orange-950',
  Cultural: 'text-pink-700 bg-pink-50 dark:text-pink-400 dark:bg-pink-950',
  Meeting: 'text-violet-700 bg-violet-50 dark:text-violet-400 dark:bg-violet-950',
  Trip: 'text-cyan-700 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-950',
  Holiday: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Exam: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
  General: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ParentPortal() {
  const { setAuthView } = useAuthStore()
  const [schoolCode, setSchoolCode] = useState('')
  const [admissionNo, setAdmissionNo] = useState('')
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)
  const [studentId, setStudentId] = useState<string | null>(null)
  const [schoolName, setSchoolName] = useState<string>('')
  const [paying, setPaying] = useState<string | null>(null)
  const [payDialog, setPayDialog] = useState<{ invoiceId: string; amount: number } | null>(null)
  const [payPhone, setPayPhone] = useState('')

  const {
    data: dashboard,
    loading: dashLoading,
    error,
    refetch,
  } = useFetch<DashboardData>(studentId ? `/api/parent/${studentId}` : null)

  // --- Step 1: verify identity ------------------------------------------
  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!schoolCode.trim() || !admissionNo.trim() || !phone.trim()) {
      toast.error('All fields are required')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/parent/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolCode: schoolCode.trim(),
          admissionNo: admissionNo.trim(),
          phone: phone.trim(),
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error('Lookup failed', {
          description: data?.error || 'Please try again.',
        })
        setLoading(false)
        return
      }
      const result = data as LookupResult
      toast.success('Verified', {
        description: `${result.student.name} · ${result.schoolName}`,
      })
      setStudentId(result.student.id)
      setSchoolName(result.schoolName)
    } catch {
      toast.error('Lookup failed', { description: 'Please try again.' })
    }
    setLoading(false)
  }

  const fillDemo = async () => {
    try {
      const res = await fetch('/api/parent/demo')
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error('No demo data available', {
          description: data?.error || 'Seed the database first.',
        })
        return
      }
      setSchoolCode(data.schoolCode)
      setAdmissionNo(data.admissionNo)
      setPhone(data.phone)
      toast.success('Demo credentials filled', {
        description: `${data.studentName} at ${data.schoolName}`,
      })
    } catch {
      toast.error('Could not load demo credentials')
    }
  }

  const exitPortal = () => {
    setStudentId(null)
    setSchoolCode('')
    setAdmissionNo('')
    setPhone('')
    setSchoolName('')
  }

  // --- M-Pesa payment handler ---
  const handlePayInvoice = (invoiceId: string) => {
    const inv = dashboard?.fees?.invoices?.find(i => i.id === invoiceId)
    if (!inv) return
    setPayDialog({ invoiceId, amount: inv.balance })
    setPayPhone(dashboard?.guardian?.phone || phone || '')
  }

  const confirmPayment = async () => {
    if (!payDialog || !studentId) return
    if (!payPhone.trim()) { toast.error('Phone number is required'); return }
    setPaying(payDialog.invoiceId)
    try {
      const res = await fetch('/api/mpesa/parent-pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          invoiceId: payDialog.invoiceId,
          phone: payPhone.trim(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      if (data.demo) {
        toast.success('Payment logged (demo mode)', {
          description: data.message,
          duration: 6000,
        })
      } else {
        toast.success('STK Push sent!', {
          description: `Check your phone (${data.phone}) and enter your M-Pesa PIN to pay KES ${data.amount?.toLocaleString()}.`,
          duration: 10000,
        })
      }
      setPayDialog(null)
      setTimeout(() => refetch(), 3000) // refresh after 3s
    } catch (e: any) {
      toast.error('Payment failed', { description: e.message })
    } finally {
      setPaying(null)
    }
  }

  // --- Dashboard view ---------------------------------------------------
  if (studentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
        <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur dark:bg-slate-900/80">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <School className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Parent Portal</p>
                <p className="text-xs text-muted-foreground">
                  {schoolName || dashboard?.school?.name || 'SkulHub'}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refetch}
                disabled={dashLoading}
              >
                <RefreshCw
                  className={`mr-2 h-3.5 w-3.5 ${dashLoading ? 'animate-spin' : ''}`}
                />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAuthView('login')}
              >
                <ArrowLeft className="mr-2 h-3.5 w-3.5" /> To login
              </Button>
              <Button variant="ghost" size="sm" onClick={exitPortal}>
                <LogOut className="mr-2 h-3.5 w-3.5" /> Exit
              </Button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6">
          {dashLoading && !dashboard && (
            <div className="flex items-center justify-center py-20">
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-600" />
            </div>
          )}

          {error && !dashLoading && (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <AlertCircle className="h-8 w-8 text-rose-500" />
                <p className="text-sm font-semibold">Failed to load dashboard</p>
                <p className="text-xs text-muted-foreground">{error}</p>
                <Button size="sm" variant="outline" onClick={refetch}>
                  Retry
                </Button>
              </CardContent>
            </Card>
          )}

          {dashboard && (
            <div className="space-y-6">
              {/* Student header */}
              <Card className="border-0 shadow-md">
                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                  <Avatar className="h-16 w-16 border-2 border-emerald-200">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-600 text-lg font-bold text-white">
                      {initials(dashboard.student?.firstName, dashboard.student?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-foreground">
                        {dashboard.student?.name || 'Student'}
                      </h2>
                      <Badge variant="outline" className={statusColor(dashboard.student?.status || 'Active')}>
                        {dashboard.student?.status || 'Active'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={
                          dashboard.student?.boarding
                            ? 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400'
                            : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400'
                        }
                      >
                        {dashboard.student?.boarding ? 'Boarding' : 'Day Scholar'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Admission No:{' '}
                      <span className="font-medium text-foreground">
                        {dashboard.student?.admissionNo || '—'}
                      </span>
                      {' · '}Class:{' '}
                      <span className="font-medium text-foreground">
                        {dashboard.student?.classLevel || '—'}
                      </span>
                      {' · '}Stream:{' '}
                      <span className="font-medium text-foreground">
                        {dashboard.student?.stream || '—'}
                      </span>
                    </p>
                    {dashboard.guardian && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Guardian: {dashboard.guardian.name} ({dashboard.guardian.relation}) ·{' '}
                        {dashboard.guardian.phone}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-6 lg:grid-cols-3">
                {/* Fee summary */}
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Wallet className="h-4 w-4 text-emerald-600" /> Fee Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="rounded-xl border bg-slate-50/50 p-3 dark:bg-slate-900/30">
                        <p className="text-xs text-muted-foreground">Total Billed</p>
                        <p className="text-base font-bold text-foreground sm:text-lg">
                          {formatKES(dashboard.fees.totalBilled)}
                        </p>
                      </div>
                      <div className="rounded-xl border bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
                        <p className="text-xs text-muted-foreground">Paid</p>
                        <p className="text-base font-bold text-emerald-700 dark:text-emerald-400 sm:text-lg">
                          {formatKES(dashboard.fees.totalPaid)}
                        </p>
                      </div>
                      <div className="rounded-xl border bg-rose-50/50 p-3 dark:bg-rose-950/20">
                        <p className="text-xs text-muted-foreground">Balance</p>
                        <p className="text-base font-bold text-rose-700 dark:text-rose-400 sm:text-lg">
                          {formatKES(dashboard.fees.totalBalance)}
                        </p>
                      </div>
                    </div>
                    {dashboard.fees.invoices.length > 0 ? (
                      <div className="mt-4 max-h-64 overflow-y-auto pr-1">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b text-xs text-muted-foreground">
                              <th className="py-2 text-left font-medium">Invoice</th>
                              <th className="py-2 text-left font-medium">Term</th>
                              <th className="py-2 text-right font-medium">Amount</th>
                              <th className="py-2 text-right font-medium">Balance</th>
                              <th className="py-2 text-left font-medium">Status</th>
                              <th className="py-2 text-right font-medium">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {dashboard.fees.invoices.map(inv => (
                              <tr key={inv.id} className="border-b last:border-0">
                                <td className="py-2 font-mono text-xs">{inv.invoiceNo}</td>
                                <td className="py-2 text-xs">
                                  {inv.term} {inv.academicYear}
                                </td>
                                <td className="py-2 text-right">{formatKES(inv.amount)}</td>
                                <td className="py-2 text-right">{formatKES(inv.balance)}</td>
                                <td className="py-2">
                                  <span
                                    className={`rounded px-2 py-0.5 text-xs ${statusColor(inv.status)}`}
                                  >
                                    {inv.status}
                                  </span>
                                </td>
                                <td className="py-2 text-right">
                                  {inv.balance > 0 && inv.status !== 'Paid' && inv.status !== 'Cancelled' && (
                                    <Button
                                      size="sm"
                                      className="bg-emerald-600 hover:bg-emerald-700 text-xs h-7"
                                      onClick={() => handlePayInvoice(inv.id)}
                                      disabled={paying === inv.id}
                                    >
                                      {paying === inv.id ? (
                                        <><Loader2 className="mr-1 h-3 w-3 animate-spin" /> Sending...</>
                                      ) : (
                                        <><Wallet className="mr-1 h-3 w-3" /> Pay M-Pesa</>
                                      )}
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-muted-foreground">No invoices yet.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Recent attendance */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CalendarDays className="h-4 w-4 text-teal-600" /> Recent Attendance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboard.attendance.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No records yet.</p>
                    ) : (
                      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                        {dashboard.attendance.map(a => (
                          <div
                            key={a.id}
                            className="flex items-center justify-between gap-2 rounded-lg border p-2"
                          >
                            <span className="text-sm text-muted-foreground">
                              {formatDate(a.date, { weekday: 'short', month: 'short', day: 'numeric' })}
                            </span>
                            <span
                              className={`rounded px-2 py-0.5 text-xs font-medium ${
                                ATTENDANCE_BADGE[a.status] ||
                                'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                              }`}
                            >
                              {a.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {/* Recent grades with teacher remarks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <BookOpen className="h-4 w-4 text-emerald-600" /> Recent Grades & Remarks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboard.grades.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        No grades published yet.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {dashboard.grades.map(g => (
                          <div key={g.id} className="rounded-lg border p-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-medium">{g.subject}</p>
                                <p className="truncate text-xs text-muted-foreground">
                                  {g.exam} · {g.term}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-semibold text-foreground">
                                  {g.marks}
                                </span>
                                <span
                                  className={`rounded border px-2 py-0.5 text-xs font-bold ${gradeColor(
                                    g.grade
                                  )}`}
                                >
                                  {g.grade}
                                </span>
                              </div>
                            </div>
                            {g.remarks && (
                              <div className="mt-2 rounded bg-muted/50 p-2">
                                <p className="text-[10px] font-semibold uppercase text-muted-foreground">Teacher's Remark</p>
                                <p className="text-xs text-foreground">{g.remarks}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Homework + Comments Diary */}
                <ParentHomeworkSection admissionNo={lookup?.student.admissionNo || ''} />


                {/* Timetable */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <CalendarClock className="h-4 w-4 text-cyan-600" /> Weekly Timetable
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboard.timetable && dashboard.timetable.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b">
                              <th className="p-1.5 text-left text-[10px] text-muted-foreground">Time</th>
                              {['Mon','Tue','Wed','Thu','Fri'].map(d => (
                                <th key={d} className="p-1.5 text-center text-[10px] font-medium text-muted-foreground">{d}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {Array.from(new Set(dashboard.timetable.map((t: any) => t.startTime))).map(time => (
                              <tr key={time} className="border-b border-muted/30">
                                <td className="p-1.5 text-[10px] font-medium text-muted-foreground whitespace-nowrap">{time}</td>
                                {['Monday','Tuesday','Wednesday','Thursday','Friday'].map(day => {
                                  const entry = dashboard.timetable.find((t: any) => t.dayOfWeek === day && t.startTime === time)
                                  return (
                                    <td key={day} className="p-1 text-center">
                                      {entry ? (
                                        <div className="rounded-md bg-emerald-50 px-1.5 py-1 dark:bg-emerald-950/20">
                                          <p className="text-[9px] font-semibold text-emerald-700 dark:text-emerald-400">{entry.subject?.name || '—'}</p>
                                          <p className="text-[8px] text-muted-foreground">{entry.room || ''}</p>
                                        </div>
                                      ) : <span className="text-[9px] text-muted-foreground/30">—</span>}
                                    </td>
                                  )
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No timetable available.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Announcements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Megaphone className="h-4 w-4 text-amber-600" /> Announcements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboard.announcements.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No announcements.</p>
                    ) : (
                      <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                        {dashboard.announcements.map(a => (
                          <div key={a.id} className="rounded-lg border p-3">
                            <div className="flex items-center gap-2">
                              <p className="flex-1 text-sm font-semibold">{a.title}</p>
                              {a.pinned && (
                                <Badge
                                  variant="outline"
                                  className="text-amber-600 dark:text-amber-400"
                                >
                                  Pinned
                                </Badge>
                              )}
                            </div>
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {a.body}
                            </p>
                            <p className="mt-1 text-[10px] text-muted-foreground">
                              {a.authorName} · {formatDate(a.publishedAt)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Upcoming events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <CalendarClock className="h-4 w-4 text-violet-600" /> Upcoming Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {dashboard.events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No upcoming events scheduled.
                    </p>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {dashboard.events.map(e => (
                        <div key={e.id} className="rounded-lg border p-3">
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold">{e.title}</p>
                            <span
                              className={`rounded px-2 py-0.5 text-[10px] font-medium ${
                                EVENT_CATEGORY_COLOR[e.category] || EVENT_CATEGORY_COLOR.General
                              }`}
                            >
                              {e.category}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(e.startDate, {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                            })}
                            {e.location ? ` · ${e.location}` : ''}
                          </p>
                          {e.description && (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {e.description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>

        {/* M-Pesa Payment Dialog */}
        <Dialog open={!!payDialog} onOpenChange={() => setPayDialog(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-emerald-600" /> Pay via M-Pesa
              </DialogTitle>
              <DialogDescription>
                Amount: <strong>KES {payDialog?.amount.toLocaleString()}</strong>
                <br />
                An STK Push will be sent to your phone. Enter your M-Pesa PIN to complete.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label htmlFor="pay-phone">M-Pesa Phone Number</Label>
                <Input
                  id="pay-phone"
                  value={payPhone}
                  onChange={(e) => setPayPhone(e.target.value)}
                  placeholder="0712345678 or +254712345678"
                />
                <p className="mt-1 text-[10px] text-muted-foreground">
                  Use the phone number registered with M-Pesa
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPayDialog(null)}>Cancel</Button>
              <Button
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={confirmPayment}
                disabled={!!paying}
              >
                {paying ? (
                  <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Sending...</>
                ) : (
                  <><Wallet className="mr-1.5 h-4 w-4" /> Send STK Push</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  // --- Login view -------------------------------------------------------
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
      {/* Decorative blobs */}
      <div className="absolute -left-20 -top-20 h-72 w-72 rounded-full bg-emerald-300/30 blur-3xl" />
      <div className="absolute -bottom-20 -right-20 h-72 w-72 rounded-full bg-teal-300/30 blur-3xl" />

      <div className="relative z-10 grid w-full max-w-5xl gap-6 lg:grid-cols-2">
        {/* Left: Branding (desktop only) */}
        <div className="hidden flex-col justify-center p-8 lg:flex">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/30">
              <School className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">SkulHub</h1>
              <p className="text-sm text-muted-foreground">Parent Portal</p>
            </div>
          </div>
          <h2 className="mb-2 text-2xl font-bold text-foreground">
            Stay close to your child&apos;s school life.
          </h2>
          <p className="mb-6 max-w-md text-sm text-muted-foreground">
            View fee balances, recent attendance, latest grades, school announcements and
            upcoming events — all in one secure dashboard. No staff account required.
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: Wallet,
                title: 'Fee Summary',
                desc: 'Billed, paid & outstanding balance',
              },
              {
                icon: CalendarDays,
                title: 'Attendance',
                desc: 'Last 10 school days at a glance',
              },
              {
                icon: BookOpen,
                title: 'Grades',
                desc: 'Latest exam results per subject',
              },
              {
                icon: CalendarClock,
                title: 'Timetable',
                desc: "Child's weekly class schedule",
              },
              {
                icon: GraduationCap,
                title: 'School Updates',
                desc: 'Announcements & upcoming events',
              },
            ].map(f => (
              <div
                key={f.title}
                className="rounded-xl border bg-card/60 p-3 backdrop-blur"
              >
                <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <f.icon className="h-4 w-4" />
                </div>
                <p className="text-sm font-semibold text-foreground">{f.title}</p>
                <p className="text-xs text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Login card */}
        <Card className="border-0 shadow-2xl">
          <CardHeader className="space-y-1 pb-4">
            <button
              type="button"
              onClick={() => setAuthView('login')}
              className="mb-2 inline-flex w-fit items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to login
            </button>
            <div className="mb-2 flex items-center gap-2 lg:hidden">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
                <School className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">Parent Portal</CardTitle>
                <CardDescription>View your child&apos;s record securely.</CardDescription>
              </div>
            </div>
            <CardTitle className="hidden text-xl lg:block">View your child&apos;s record</CardTitle>
            <CardDescription className="hidden lg:block">
              Enter the school code, admission number and the guardian phone on file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLookup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pp-schoolCode">School code</Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="pp-schoolCode"
                    value={schoolCode}
                    onChange={e => setSchoolCode(e.target.value)}
                    placeholder="SKH-2024-001"
                    className="pl-9 uppercase tracking-wider"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pp-admission">Admission number</Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="pp-admission"
                    value={admissionNo}
                    onChange={e => setAdmissionNo(e.target.value)}
                    placeholder="ADM/5000"
                    className="pl-9"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="pp-phone">Guardian phone</Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="pp-phone"
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="0712 345 678 or +254712345678"
                    className="pl-9"
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  We verify the phone against the guardian on record.
                </p>
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                disabled={loading}
              >
                {loading ? (
                  'Verifying...'
                ) : (
                  <>
                    View My Child&apos;s Record <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ParentHomeworkSection — shows homework assignments + comment diary
// ---------------------------------------------------------------------------
function ParentHomeworkSection({ admissionNo }: { admissionNo: string }) {
  const [data, setData] = useState<{ homework: any[]; grades: any[] } | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedHw, setExpandedHw] = useState<string | null>(null)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const raf = requestAnimationFrame(() => {
      if (!admissionNo) {
        setLoading(false)
        return
      }
      fetch(`/api/parent/homework?admissionNo=${encodeURIComponent(admissionNo)}`)
        .then(r => r.json())
        .then(d => { if (!cancelled) { setData(d); setLoading(false) } })
        .catch(() => { if (!cancelled) { setData({ homework: [], grades: [] }); setLoading(false) } })
    })
    return () => { cancelled = true; cancelAnimationFrame(raf) }
  }, [admissionNo])

  const handlePostComment = async (hwId: string) => {
    if (!commentText.trim()) return
    setPosting(true)
    try {
      const res = await fetch(`/api/homework/${hwId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ authorName: 'Guardian', authorRole: 'parent', message: commentText.trim() }),
      })
      if (res.ok) {
        setCommentText('')
        // Refresh data
        fetch(`/api/parent/homework?admissionNo=${encodeURIComponent(admissionNo)}`)
          .then(r => r.json())
          .then(d => setData(d))
      }
    } catch {}
    setPosting(false)
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-4 w-4 text-amber-600" /> Homework & Diary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  const homework = data?.homework || []

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="h-4 w-4 text-amber-600" /> Homework & Communication Diary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {homework.length === 0 ? (
          <p className="text-sm text-muted-foreground">No homework assigned currently.</p>
        ) : (
          <div className="space-y-3">
            {homework.map(hw => (
              <div key={hw.id} className="rounded-lg border p-3">
                {/* Homework header */}
                <button
                  onClick={() => setExpandedHw(expandedHw === hw.id ? null : hw.id)}
                  className="flex w-full items-start justify-between gap-2 text-left"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{hw.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {hw.subject?.name || 'General'} · Due {new Date(hw.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-[9px] ${hw.status === 'Active' ? 'border-emerald-300 text-emerald-700' : 'text-muted-foreground'}`}>
                    {hw.status}
                  </Badge>
                </button>

                {/* Expanded content */}
                {expandedHw === hw.id && (
                  <div className="mt-3 space-y-3 border-t pt-3">
                    {/* Description */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">Description</p>
                      <p className="text-sm">{hw.description}</p>
                    </div>

                    {/* Comments diary */}
                    <div>
                      <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                        Communication ({hw.comments?.length || 0})
                      </p>
                      {hw.comments && hw.comments.length > 0 ? (
                        <div className="mt-1 space-y-2">
                          {hw.comments.map((c: any) => (
                            <div key={c.id} className={`rounded-lg p-2 text-xs ${c.authorRole === 'teacher' ? 'bg-emerald-50 dark:bg-emerald-950/20' : 'bg-blue-50 dark:bg-blue-950/20'}`}>
                              <div className="flex items-center justify-between">
                                <span className="font-semibold">
                                  {c.authorRole === 'teacher' ? '👨‍🏫 ' : '👤 '}
                                  {c.authorName}
                                </span>
                                <span className="text-[9px] text-muted-foreground">
                                  {new Date(c.createdAt).toLocaleString()}
                                </span>
                              </div>
                              <p className="mt-1">{c.message}</p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">No messages yet.</p>
                      )}

                      {/* Add comment */}
                      <div className="mt-2 flex gap-2">
                        <Input
                          value={expandedHw === hw.id ? commentText : ''}
                          onChange={e => setCommentText(e.target.value)}
                          placeholder="Write a message to the teacher..."
                          className="h-8 text-xs"
                          onKeyDown={e => { if (e.key === 'Enter') handlePostComment(hw.id) }}
                        />
                        <Button size="sm" className="h-8 shrink-0 bg-emerald-600 hover:bg-emerald-700" onClick={() => handlePostComment(hw.id)} disabled={posting || !commentText.trim()}>
                          <Send className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Grades with teacher remarks */}
        {data?.grades && data.grades.length > 0 && (
          <div className="mt-4 border-t pt-3">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold">
              <GraduationCap className="h-4 w-4 text-emerald-600" /> Exam Marks & Teacher Remarks
            </p>
            <div className="space-y-2">
              {data.grades.map((g: any) => (
                <div key={g.id} className="rounded-lg border p-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{g.subject?.name || 'Subject'}</p>
                      <p className="truncate text-[10px] text-muted-foreground">{g.exam?.name || ''} · {g.exam?.examType || ''}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">{g.marks}</span>
                      <Badge variant="outline" className={`text-[9px] font-bold ${gradeColor(g.grade)}`}>{g.grade}</Badge>
                    </div>
                  </div>
                  {(g.remarks || g.teacherComment) && (
                    <div className="mt-2 rounded bg-muted/50 p-2">
                      {g.teacherComment && (
                        <p className="text-xs"><span className="font-semibold">Teacher Comment:</span> {g.teacherComment}</p>
                      )}
                      {g.remarks && !g.teacherComment && (
                        <p className="text-xs"><span className="font-semibold">Remark:</span> {g.remarks}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
