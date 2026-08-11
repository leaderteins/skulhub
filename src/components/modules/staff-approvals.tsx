'use client'
import { useState, useCallback } from 'react'
import { useFetch, apiPut } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'
import { avatarColor, initials, timeAgo, formatDate } from '@/lib/format'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/auth-store'
import {
  UserCheck, Clock3, CheckCircle2, XCircle, Mail, Phone, GraduationCap,
  ShieldCheck, Award, Briefcase, Search, Inbox,
} from 'lucide-react'

interface StaffInfo {
  id: string
  employeeNo: string
  firstName: string
  lastName: string
  gender: string
  qualification: string | null
  specialization: string | null
  staffRole: string | null
}

interface PendingRow {
  id: string
  name: string
  email: string
  phone: string | null
  role: string
  avatar: string | null
  submittedAt: string
  staff: StaffInfo | null
}

interface RecentRow extends PendingRow {
  status: string
  rejectionReason: string | null
  decidedAt: string | null
}

interface ApprovalsData {
  pending: PendingRow[]
  recent: RecentRow[]
  summary: { pending: number; approved: number; rejected: number }
}

const ROLE_LABELS: Record<string, string> = {
  teacher: 'Teacher',
  hod: 'Head of Department',
  librarian: 'Librarian',
  nurse: 'School Nurse',
  matron: 'Matron',
  secretary: 'Secretary',
  admissions: 'Admissions Clerk',
  bursar: 'Bursar',
  bus_driver: 'Bus Driver',
  gate_man: 'Security',
  cook: 'Cook',
  deputy_principal: 'Deputy Principal',
}

export function StaffApprovalsModule() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [rejecting, setRejecting] = useState<PendingRow | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [approving, setApproving] = useState<PendingRow | null>(null)
  const [tick, setTick] = useState(0)

  const { data, loading, refetch } = useFetch<ApprovalsData>('/api/staff-approvals', [tick])

  const refresh = useCallback(() => {
    setTick(t => t + 1)
    refetch()
  }, [refetch])

  const handleApprove = async () => {
    if (!approving) return
    try {
      const res = await apiPut<{ success: boolean; message: string }>(
        '/api/staff-approvals',
        { userId: approving.id, action: 'approve' }
      )
      toast.success('Staff approved', { description: res.message })
      setApproving(null)
      refresh()
    } catch (e: any) {
      toast.error('Approval failed', { description: e?.message })
    }
  }

  const handleReject = async () => {
    if (!rejecting) return
    try {
      const res = await apiPut<{ success: boolean; message: string }>(
        '/api/staff-approvals',
        {
          userId: rejecting.id,
          action: 'reject',
          rejectionReason: rejectReason.trim() || undefined,
        }
      )
      toast.success('Request rejected', { description: res.message })
      setRejecting(null)
      setRejectReason('')
      refresh()
    } catch (e: any) {
      toast.error('Rejection failed', { description: e?.message })
    }
  }

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  const summary = data?.summary || { pending: 0, approved: 0, rejected: 0 }
  const pending = data?.pending || []
  const recent = data?.recent || []

  const filteredPending = search.trim()
    ? pending.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        (p.staff?.employeeNo || '').toLowerCase().includes(search.toLowerCase()) ||
        (p.staff?.specialization || '').toLowerCase().includes(search.toLowerCase()) ||
        (ROLE_LABELS[p.role] || p.role).toLowerCase().includes(search.toLowerCase())
      )
    : pending

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <ShieldCheck className="h-3 w-3" /> {summary.pending} pending approval
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Staff Approvals</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Review and approve staff self-registration requests. Approved staff can log in immediately.
            </p>
          </div>
          {user && (
            <div className="rounded-xl bg-white/10 px-4 py-3 text-sm backdrop-blur">
              <p className="text-xs text-white/70">Reviewer</p>
              <p className="font-semibold">{user.name}</p>
              <p className="text-[11px] text-white/70">{user.role}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <Clock3 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending Review</p>
              <p className="text-2xl font-bold">{summary.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Approved Staff</p>
              <p className="text-2xl font-bold">{summary.approved}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Rejected</p>
              <p className="text-2xl font-bold">{summary.rejected}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search bar */}
      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email, employee no, role…"
          className="pl-9"
        />
      </div>

      {/* Pending requests */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock3 className="h-4 w-4 text-amber-600" />
            Pending Registrations
            <Badge variant="secondary" className="ml-1 text-[10px]">{filteredPending.length}</Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Staff who have registered themselves and are waiting for your approval.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {filteredPending.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <Inbox className="h-7 w-7" />
              </div>
              <div>
                <p className="text-base font-semibold">
                  {search.trim() ? 'No matching requests' : 'No pending requests'}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {search.trim()
                    ? 'Try a different search term.'
                    : 'When staff register themselves, they will appear here for your review.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="max-h-[600px] divide-y overflow-y-auto">
              {filteredPending.map(p => (
                <PendingRowCard
                  key={p.id}
                  row={p}
                  onApprove={() => setApproving(p)}
                  onReject={() => {
                    setRejecting(p)
                    setRejectReason('')
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent decisions */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCheck className="h-4 w-4 text-emerald-600" />
            Recent Decisions
            <Badge variant="secondary" className="ml-1 text-[10px]">{recent.length}</Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Staff you have approved or rejected in the last 30 days.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <p className="text-sm text-muted-foreground">No recent decisions to show.</p>
            </div>
          ) : (
            <div className="max-h-96 divide-y overflow-y-auto">
              {recent.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-4">
                  <Avatar className="h-9 w-9 border">
                    <AvatarFallback className={cn('text-[10px] font-semibold text-white', avatarColor(r.name))}>
                      {r.avatar || initials(r.staff?.firstName || r.name, r.staff?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold">{r.name}</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px]',
                          r.status === 'Active'
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-400'
                            : 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-400'
                        )}
                      >
                        {r.status === 'Active' ? 'Approved' : 'Rejected'}
                      </Badge>
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {r.email} · {ROLE_LABELS[r.role] || r.role}
                      {r.staff?.employeeNo ? ` · ${r.staff.employeeNo}` : ''}
                      {r.decidedAt ? ` · ${timeAgo(r.decidedAt)}` : ''}
                    </p>
                    {r.status === 'Rejected' && r.rejectionReason && (
                      <p className="mt-1 text-xs text-rose-600 dark:text-rose-400">
                        Reason: {r.rejectionReason}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approve confirmation dialog */}
      <AlertDialog open={!!approving} onOpenChange={(o) => !o && setApproving(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve this staff member?</AlertDialogTitle>
            <AlertDialogDescription>
              {approving && (
                <>
                  <span className="font-semibold text-foreground">{approving.name}</span> will be
                  able to log in immediately with their email and password. Their linked staff record
                  will be marked as Active.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" /> Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject reason dialog */}
      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject registration</DialogTitle>
            <DialogDescription>
              {rejecting && (
                <>
                  Provide a reason for rejecting <span className="font-semibold text-foreground">{rejecting.name}</span>.
                  They will see this reason when they try to log in.
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="rejectReason">Rejection reason</Label>
            <Textarea
              id="rejectReason"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
              placeholder="e.g. Your role and qualifications do not match our current vacancies."
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Optional — if left blank, a default message will be shown.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleReject}>
              <XCircle className="mr-2 h-4 w-4" /> Reject request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// --- Pending row card -----------------------------------------------------

function PendingRowCard({
  row,
  onApprove,
  onReject,
}: {
  row: PendingRow
  onApprove: () => void
  onReject: () => void
}) {
  const roleLabel = ROLE_LABELS[row.role] || row.role
  const submittedDate = formatDate(row.submittedAt, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  return (
    <div className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted/40 md:flex-row md:items-center">
      <Avatar className="h-11 w-11 border">
        <AvatarFallback className={cn('text-xs font-semibold text-white', avatarColor(row.name))}>
          {row.avatar || initials(row.staff?.firstName || row.name, row.staff?.lastName)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">{row.name}</p>
          <Badge variant="outline" className="border-teal-200 bg-teal-50 text-[10px] text-teal-700 dark:border-teal-900 dark:bg-teal-950 dark:text-teal-400">
            <Briefcase className="mr-1 h-3 w-3" /> {roleLabel}
          </Badge>
          {row.staff?.employeeNo && (
            <Badge variant="secondary" className="text-[10px] font-mono">
              {row.staff.employeeNo}
            </Badge>
          )}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Mail className="h-3 w-3" /> {row.email}
          </span>
          {row.phone && (
            <span className="flex items-center gap-1">
              <Phone className="h-3 w-3" /> {row.phone}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Clock3 className="h-3 w-3" /> Submitted {submittedDate}
          </span>
        </div>
        {(row.staff?.qualification || row.staff?.specialization || row.staff?.gender) && (
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
            {row.staff?.gender && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5">
                <UserCheck className="h-3 w-3" /> {row.staff.gender}
              </span>
            )}
            {row.staff?.qualification && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5">
                <Award className="h-3 w-3" /> {row.staff.qualification}
              </span>
            )}
            {row.staff?.specialization && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5">
                <GraduationCap className="h-3 w-3" /> {row.staff.specialization}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={onReject}
          className="border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-900 dark:hover:bg-rose-950"
        >
          <XCircle className="mr-1.5 h-4 w-4" /> Reject
        </Button>
        <Button
          size="sm"
          onClick={onApprove}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          <CheckCircle2 className="mr-1.5 h-4 w-4" /> Approve
        </Button>
      </div>
    </div>
  )
}
