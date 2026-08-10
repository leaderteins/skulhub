'use client'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { useFetch, apiPut, apiDelete } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import {
  School as SchoolIcon,
  ShieldCheck,
  Users,
  GraduationCap,
  UserCog,
  Search,
  PlayCircle,
  PauseCircle,
  CircleSlash,
  Trash2,
  Pencil,
  Building2,
  Crown,
  LogOut,
} from 'lucide-react'

interface SchoolRow {
  id: string
  name: string
  slug: string
  email: string | null
  phone: string | null
  county: string | null
  plan: string
  status: string
  trialEndsAt: string | null
  maxStudents: number
  createdAt: string
  userCount: number
  studentCount: number
  staffCount: number
}

interface SuperAdminData {
  summary: {
    totalSchools: number
    activeSchools: number
    trialSchools: number
    suspendedSchools: number
    expiredSchools: number
    totalStudents: number
    totalStaff: number
    totalUsers: number
  }
  schools: SchoolRow[]
}

const STATUS_STYLES: Record<string, string> = {
  Active: 'bg-emerald-500/10 text-emerald-700 border-emerald-300 dark:text-emerald-400',
  Trial: 'bg-amber-500/10 text-amber-700 border-amber-300 dark:text-amber-400',
  Suspended: 'bg-rose-500/10 text-rose-700 border-rose-300 dark:text-rose-400',
  Expired: 'bg-slate-500/10 text-slate-600 border-slate-300 dark:text-slate-400',
}

const PLAN_STYLES: Record<string, string> = {
  Starter: 'bg-slate-500/10 text-slate-600 dark:text-slate-400',
  Standard: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
  Premium: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
  Enterprise: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
}

function daysLeft(iso: string | null): number | null {
  if (!iso) return null
  const ms = new Date(iso).getTime() - Date.now()
  return Math.ceil(ms / (1000 * 60 * 60 * 24))
}

export function SuperAdminDashboard() {
  const { user, logout } = useAuthStore()
  const { data, loading, error, refetch } = useFetch<SuperAdminData>('/api/superadmin', [])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [editSchool, setEditSchool] = useState<SchoolRow | null>(null)
  const [deleteSchool, setDeleteSchool] = useState<SchoolRow | null>(null)

  // Force re-fetch when user changes (defensive)
  useEffect(() => {
    if (user?.isSuperAdmin) refetch()
  }, [user?.id, user?.isSuperAdmin, refetch])

  const schools = (data?.schools ?? []).filter(s => {
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()) ||
      (s.email ?? '').toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || s.status === statusFilter
    return matchSearch && matchStatus
  })

  const summary = data?.summary

  const STAT_CARDS = [
    {
      label: 'Total Schools',
      value: summary?.totalSchools ?? 0,
      icon: Building2,
      color: 'text-emerald-600',
      bg: 'bg-emerald-500/10',
    },
    {
      label: 'Active Schools',
      value: summary?.activeSchools ?? 0,
      icon: ShieldCheck,
      color: 'text-teal-600',
      bg: 'bg-teal-500/10',
    },
    {
      label: 'On Trial',
      value: summary?.trialSchools ?? 0,
      icon: PlayCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-500/10',
    },
    {
      label: 'Suspended',
      value: summary?.suspendedSchools ?? 0,
      icon: PauseCircle,
      color: 'text-rose-600',
      bg: 'bg-rose-500/10',
    },
    {
      label: 'Total Students',
      value: summary?.totalStudents ?? 0,
      icon: GraduationCap,
      color: 'text-cyan-600',
      bg: 'bg-cyan-500/10',
    },
    {
      label: 'Total Staff',
      value: summary?.totalStaff ?? 0,
      icon: UserCog,
      color: 'text-violet-600',
      bg: 'bg-violet-500/10',
    },
    {
      label: 'Total Users',
      value: summary?.totalUsers ?? 0,
      icon: Users,
      color: 'text-indigo-600',
      bg: 'bg-indigo-500/10',
    },
    {
      label: 'Expired',
      value: summary?.expiredSchools ?? 0,
      icon: CircleSlash,
      color: 'text-slate-600',
      bg: 'bg-slate-500/10',
    },
  ]

  const quickStatus = async (school: SchoolRow, status: string) => {
    try {
      await apiPut(`/api/superadmin/${school.id}`, { status })
      toast.success(`${school.name} marked as ${status}`)
      refetch()
    } catch (e: any) {
      toast.error('Failed to update school', { description: e?.message })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/40 to-teal-50/40 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/30">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-bold leading-tight md:text-lg">
                EduManage Pro · Platform Console
              </h1>
              <p className="text-xs text-muted-foreground">
                Signed in as <span className="font-medium text-foreground">{user?.name}</span>
              </p>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => logout()}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
        {/* Stat cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {STAT_CARDS.map(s => (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="flex items-center gap-3 p-4">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', s.bg)}>
                  <s.icon className={cn('h-5 w-5', s.color)} />
                </div>
                <div>
                  <p className="text-xl font-bold leading-none">{s.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Schools table */}
        <Card className="mt-6 border-0 shadow-sm">
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-lg">
                <SchoolIcon className="h-5 w-5 text-emerald-600" />
                Registered Schools
              </CardTitle>
              <CardDescription>
                {loading
                  ? 'Loading schools…'
                  : `${schools.length} of ${data?.schools.length ?? 0} schools shown`}
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search schools…"
                  className="pl-9 sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="Trial">Trial</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {error ? (
              <div className="p-8 text-center text-sm text-rose-600">
                Failed to load schools: {error}
              </div>
            ) : loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 animate-pulse rounded-md bg-muted/50" />
                ))}
              </div>
            ) : schools.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No schools match your filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>School</TableHead>
                      <TableHead>County</TableHead>
                      <TableHead>Plan</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Users</TableHead>
                      <TableHead className="text-right">Students</TableHead>
                      <TableHead className="text-right">Staff</TableHead>
                      <TableHead>Trial ends</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {schools.map(s => {
                      const dl = daysLeft(s.trialEndsAt)
                      return (
                        <TableRow key={s.id}>
                          <TableCell>
                            <div className="font-medium">{s.name}</div>
                            <div className="text-xs text-muted-foreground">{s.slug}</div>
                          </TableCell>
                          <TableCell className="text-sm">{s.county ?? '—'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('font-medium', PLAN_STYLES[s.plan])}>
                              {s.plan}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={cn('font-medium', STATUS_STYLES[s.status])}>
                              {s.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{s.userCount}</TableCell>
                          <TableCell className="text-right tabular-nums">{s.studentCount}</TableCell>
                          <TableCell className="text-right tabular-nums">{s.staffCount}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {dl === null ? '—' : dl > 0 ? `${dl}d left` : 'Expired'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              {s.status !== 'Active' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2 text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                                  onClick={() => quickStatus(s, 'Active')}
                                >
                                  Activate
                                </Button>
                              )}
                              {s.status !== 'Suspended' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 px-2 text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30"
                                  onClick={() => quickStatus(s, 'Suspended')}
                                >
                                  Suspend
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0"
                                onClick={() => setEditSchool(s)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                                onClick={() => setDeleteSchool(s)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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
      </main>

      {/* Edit dialog */}
      {editSchool && (
        <EditSchoolDialog
          school={editSchool}
          onClose={() => setEditSchool(null)}
          onSaved={() => {
            setEditSchool(null)
            refetch()
          }}
        />
      )}

      {/* Delete confirmation */}
      <AlertDialog
        open={!!deleteSchool}
        onOpenChange={open => !open && setDeleteSchool(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteSchool?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the school and all its data — users, students, staff,
              invoices, and payments. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 hover:bg-rose-700"
              onClick={async () => {
                if (!deleteSchool) return
                try {
                  await apiDelete(`/api/superadmin/${deleteSchool.id}`)
                  toast.success(`${deleteSchool.name} deleted`)
                  setDeleteSchool(null)
                  refetch()
                } catch (e: any) {
                  toast.error('Failed to delete school', { description: e?.message })
                }
              }}
            >
              Delete permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Edit School dialog
// ---------------------------------------------------------------------------
function EditSchoolDialog({
  school,
  onClose,
  onSaved,
}: {
  school: SchoolRow
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(school.name)
  const [plan, setPlan] = useState(school.plan)
  const [status, setStatus] = useState(school.status)
  const [maxStudents, setMaxStudents] = useState(String(school.maxStudents))
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await apiPut(`/api/superadmin/${school.id}`, {
        name,
        plan,
        status,
        maxStudents: parseInt(maxStudents, 10) || school.maxStudents,
      })
      toast.success(`${school.name} updated`)
      onSaved()
    } catch (e: any) {
      toast.error('Failed to update school', { description: e?.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit school</DialogTitle>
          <DialogDescription>
            Update plan, status, and student cap for <strong>{school.name}</strong>.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name">School name</Label>
            <Input id="edit-name" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Plan</Label>
              <Select value={plan} onValueChange={setPlan}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Trial">Trial</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-max">Max students</Label>
            <Input
              id="edit-max"
              type="number"
              value={maxStudents}
              onChange={e => setMaxStudents(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
