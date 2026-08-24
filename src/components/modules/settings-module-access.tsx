'use client'
import { useEffect, useMemo, useState } from 'react'
import { useFetch, apiPut } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Search,
  ShieldCheck,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  Save,
  RotateCcw,
  Users as UsersIcon,
  AlertCircle,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserListItem {
  id: string
  name: string
  email: string
  role: string
  avatar: string | null
  status: string
  phone: string | null
  schoolId: string
  schoolName: string | null
  schoolSlug: string | null
  lastLoginAt: string | null
  createdAt: string
  overrideCount: number
}

interface UsersListResponse {
  users: UserListItem[]
  total: number
}

interface ModuleEntry {
  module: string
  allowed: boolean
  grantedByRole: boolean
  overridden: boolean
  overrideAllowed: boolean | null
}

interface ModuleAccessResponse {
  userId: string
  userName: string
  userEmail: string
  userRole: string
  userStatus: string
  schoolId: string | null
  schoolName: string | null
  modules: ModuleEntry[]
  allowedModules: string[]
  hasOverrides: boolean
}

// ---------------------------------------------------------------------------
// Module display names (kept in sync with sidebar.tsx labels).
// ---------------------------------------------------------------------------
const MODULE_LABELS: Record<string, string> = {
  dashboard: 'Dashboard',
  admissions: 'Admissions',
  students: 'Students',
  staff: 'Staff & Teachers',
  staffapprovals: 'Staff Approvals',
  alumni: 'Alumni Network',
  academics: 'Academics',
  attendance: 'Attendance',
  exams: 'Examinations',
  reportcards: 'Report Cards',
  lessonplans: 'Lesson Plans',
  homework: 'Homework & Assignments',
  health: 'Health & Wellness',
  events: 'Events & Activities',
  discipline: 'Discipline',
  hostel: 'Hostel & Boarding',
  finance: 'Finance & Fees',
  payroll: 'Payroll',
  appraisals: 'Staff Appraisals',
  communications: 'Communications',
  library: 'Library',
  transport: 'Transport',
  inventory: 'Inventory & Assets',
  cafeteria: 'Cafeteria & Meals',
  procurement: 'Procurement',
  facilities: 'Facility Booking',
  feedback: 'Feedback & Surveys',
  idcards: 'ID Cards',
  dataimport: 'Data Import',
  invrequests: 'Inventory Requests',
  reports: 'Reports',
  superadmin: 'Super Admin (Platform)',
  settings: 'Settings',
}

// Modules grouped by their sidebar group for nicer presentation.
const MODULE_GROUPS: { group: string; modules: string[] }[] = [
  { group: 'Overview', modules: ['dashboard'] },
  {
    group: 'People',
    modules: ['admissions', 'students', 'staff', 'staffapprovals', 'alumni'],
  },
  {
    group: 'Academic',
    modules: ['academics', 'attendance', 'exams', 'reportcards', 'lessonplans', 'homework', 'timetable', 'health', 'events', 'discipline', 'hostel'],
  },
  {
    group: 'Administration',
    modules: ['finance', 'payroll', 'appraisals', 'communications', 'library', 'transport', 'inventory', 'cafeteria', 'procurement', 'facilities', 'invrequests'],
  },
  {
    group: 'Insights',
    modules: ['feedback', 'idcards', 'dataimport', 'reports', 'superadmin', 'settings'],
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ModuleAccessTab() {
  const [search, setSearch] = useState('')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const { data, loading, error, refetch } = useFetch<UsersListResponse>('/api/users')

  const filtered = useMemo(() => {
    if (!data?.users) return []
    const q = search.trim().toLowerCase()
    if (!q) return data.users
    return data.users.filter((u) =>
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    )
  }, [data, search])

  function openUser(userId: string) {
    setSelectedUserId(userId)
    setDialogOpen(true)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" /> Module Access Control
              </CardTitle>
              <CardDescription>
                Grant or deny specific modules to individual users. Overrides the default role-based permissions.
              </CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => refetch()}
              className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-900 dark:text-emerald-400"
            >
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email or role…"
              className="pl-9"
            />
          </div>

          <div className="rounded-lg border border-emerald-100 bg-emerald-50/40 p-3 text-xs text-emerald-800 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-400">
            <p className="flex items-start gap-2 font-medium">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>
                Click any user to open the module permission editor. Tick a module to grant access, untick to deny.
                Modules with a <span className="font-semibold">lock icon</span> are inherited from the user&rsquo;s role —
                overriding them will create a custom permission rule for this user.
              </span>
            </p>
          </div>

          {loading && (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          )}

          {error && !loading && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400">
              Failed to load users: {error}
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <UsersIcon className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm font-medium">No users found</p>
              <p className="text-xs text-muted-foreground">
                {data?.total === 0
                  ? 'No user accounts exist in your school yet.'
                  : 'Try a different search query.'}
              </p>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <ScrollArea className="max-h-[28rem] rounded-lg border">
              <ul className="divide-y">
                {filtered.map((u) => (
                  <li key={u.id}>
                    <button
                      onClick={() => openUser(u.id)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-emerald-50/60 dark:hover:bg-emerald-950/20"
                    >
                      <Avatar className="h-9 w-9 shrink-0">
                        <AvatarFallback className={cn('text-xs font-semibold text-white', roleAvatarColor(u.role))}>
                          {initialsOf(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{u.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] font-semibold capitalize', roleBadgeColor(u.role))}
                        >
                          {u.role.replace(/_/g, ' ')}
                        </Badge>
                        <div className="flex items-center gap-1.5">
                          {u.overrideCount > 0 ? (
                            <Badge className="h-5 px-1.5 text-[10px] bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400">
                              <ShieldCheck className="mr-1 h-2.5 w-2.5" /> {u.overrideCount} override{u.overrideCount > 1 ? 's' : ''}
                            </Badge>
                          ) : (
                            <Badge className="h-5 px-1.5 text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                              Role defaults
                            </Badge>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <ModuleAccessDialog
        userId={selectedUserId}
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v)
          if (!v) {
            // Refresh the user list so override counts stay in sync.
            refetch()
          }
        }}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Dialog showing all modules as checkboxes for a specific user
// ---------------------------------------------------------------------------

interface ModuleAccessDialogProps {
  userId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function ModuleAccessDialog({ userId, open, onOpenChange }: ModuleAccessDialogProps) {
  // Fetch the merged module access for the selected user.
  const url = userId ? `/api/users/${userId}/modules` : null
  const { data, loading, error, refetch } = useFetch<ModuleAccessResponse>(url, [userId])

  // Local state — the set of currently-ticked modules.
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)

  // Re-seed local selection whenever the server data changes.
  useEffect(() => {
    if (data) {
      const next = new Set<string>(data.allowedModules)
      setSelected(next)
      setDirty(false)
    }
  }, [data])

  function toggle(moduleKey: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(moduleKey)) next.delete(moduleKey)
      else next.add(moduleKey)
      setDirty(true)
      return next
    })
  }

  function selectAll() {
    if (!data) return
    setSelected(new Set(data.modules.map((m) => m.module)))
    setDirty(true)
  }

  function selectRoleDefaults() {
    if (!data) return
    setSelected(new Set(data.modules.filter((m) => m.grantedByRole).map((m) => m.module)))
    setDirty(true)
  }

  function clearAll() {
    setSelected(new Set())
    setDirty(true)
  }

  async function handleSave() {
    if (!userId || !data) return
    setSaving(true)
    try {
      const modules = Array.from(selected)
      const res = await apiPut<{ success: boolean; message?: string; error?: string }>(
        `/api/users/${userId}/modules`,
        { modules }
      )
      if (res.success) {
        toast.success('Module access updated', {
          description: res.message || 'Permissions saved successfully.',
        })
        await refetch()
        setDirty(false)
      } else {
        toast.error('Failed to update', { description: res.error || 'Please try again.' })
      }
    } catch (e: any) {
      toast.error('Failed to update', { description: e?.message || 'Network error' })
    } finally {
      setSaving(false)
    }
  }

  const allowedCount = selected.size
  const totalCount = data?.modules.length ?? 0
  const overrideCount = data?.modules.filter((m) => m.overridden).length ?? 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
            Module Access
            {data && (
              <span className="text-sm font-normal text-muted-foreground">
                — {data.userName}
              </span>
            )}
          </DialogTitle>
          <DialogDescription>
            {data
              ? `Tick the modules this user can access. Role: ${data.userRole.replace(/_/g, ' ')} · ${allowedCount}/${totalCount} modules allowed.`
              : 'Loading…'}
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full rounded" />
            ))}
          </div>
        )}

        {error && !loading && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-400">
            Failed to load module access: {error}
          </div>
        )}

        {data && !loading && (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg border bg-emerald-50/40 p-2 dark:bg-emerald-950/20">
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">{allowedCount}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Allowed</p>
              </div>
              <div className="rounded-lg border bg-amber-50/40 p-2 dark:bg-amber-950/20">
                <p className="text-lg font-bold text-amber-700 dark:text-amber-400">{overrideCount}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Overridden</p>
              </div>
              <div className="rounded-lg border bg-muted/40 p-2">
                <p className="text-lg font-bold">{totalCount - allowedCount}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Denied</p>
              </div>
            </div>

            {/* Bulk actions */}
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" onClick={selectAll} className="h-7 text-xs">
                <CheckCircle2 className="mr-1 h-3 w-3" /> Select all
              </Button>
              <Button size="sm" variant="outline" onClick={selectRoleDefaults} className="h-7 text-xs">
                <RotateCcw className="mr-1 h-3 w-3" /> Reset to role defaults
              </Button>
              <Button size="sm" variant="outline" onClick={clearAll} className="h-7 text-xs text-rose-600 hover:bg-rose-50">
                <XCircle className="mr-1 h-3 w-3" /> Deny all
              </Button>
              <Separator orientation="vertical" className="mx-1 h-5" />
              <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                <Lock className="mr-1 inline h-3 w-3" /> = granted by role · <Unlock className="mx-0.5 inline h-3 w-3" /> = overridden
              </Label>
            </div>

            <Separator />

            {/* Module groups */}
            <ScrollArea className="max-h-[55vh] pr-2">
              <div className="space-y-4">
                {MODULE_GROUPS.map((grp) => {
                  const groupModules = grp.modules.filter((m) =>
                    data.modules.some((dm) => dm.module === m)
                  )
                  if (groupModules.length === 0) return null
                  return (
                    <div key={grp.group}>
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {grp.group}
                      </p>
                      <div className="grid gap-1.5 sm:grid-cols-2">
                        {groupModules.map((moduleKey) => {
                          const entry = data.modules.find((m) => m.module === moduleKey)!
                          const isTicked = selected.has(moduleKey)
                          const label = MODULE_LABELS[moduleKey] ?? moduleKey
                          return (
                            <label
                              key={moduleKey}
                              className={cn(
                                'flex cursor-pointer items-center gap-2.5 rounded-lg border p-2.5 transition-colors',
                                isTicked
                                  ? 'border-emerald-300 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30'
                                  : 'border-border hover:bg-muted/40'
                              )}
                            >
                              <Checkbox
                                checked={isTicked}
                                onCheckedChange={() => toggle(moduleKey)}
                                className={cn(isTicked && 'border-emerald-600 bg-emerald-600 text-white')}
                              />
                              <span className="flex-1 text-sm font-medium">{label}</span>
                              {entry.overridden ? (
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
                                    entry.overrideAllowed
                                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                                  )}
                                  title={entry.overrideAllowed ? 'Granted via override' : 'Denied via override'}
                                >
                                  <Unlock className="h-2.5 w-2.5" /> Override
                                </span>
                              ) : (
                                <span
                                  className={cn(
                                    'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide',
                                    entry.grantedByRole
                                      ? 'bg-muted text-muted-foreground'
                                      : 'bg-transparent text-muted-foreground/50'
                                  )}
                                  title={entry.grantedByRole ? 'Granted by role' : 'Not in role'}
                                >
                                  <Lock className="h-2.5 w-2.5" /> Role
                                </span>
                              )}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>

            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={saving || !dirty}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Save className="mr-1.5 h-4 w-4" />
                {saving ? 'Saving…' : 'Save Permissions'}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/)
  return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase()
}

function roleAvatarColor(role: string): string {
  const r = role.toLowerCase()
  if (r.includes('super_admin')) return 'bg-emerald-600'
  if (r.includes('principal')) return 'bg-emerald-600'
  if (r.includes('admin')) return 'bg-emerald-700'
  if (r.includes('bursar')) return 'bg-teal-600'
  if (r.includes('teacher') || r.includes('hod')) return 'bg-cyan-600'
  if (r.includes('librar')) return 'bg-amber-600'
  if (r.includes('nurse')) return 'bg-pink-600'
  if (r.includes('matron')) return 'bg-orange-600'
  if (r.includes('secretary')) return 'bg-slate-500'
  if (r.includes('admissions')) return 'bg-amber-600'
  if (r.includes('bus') || r.includes('driver')) return 'bg-lime-600'
  if (r.includes('gate')) return 'bg-slate-600'
  if (r.includes('cook')) return 'bg-red-500'
  if (r.includes('deputy')) return 'bg-teal-700'
  return 'bg-slate-500'
}

function roleBadgeColor(role: string): string {
  const r = role.toLowerCase()
  if (r.includes('super_admin')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
  if (r.includes('principal')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
  if (r.includes('admin')) return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
  if (r.includes('bursar')) return 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400'
  if (r.includes('teacher') || r.includes('hod')) return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-400'
  if (r.includes('librar')) return 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
  if (r.includes('nurse')) return 'bg-pink-50 text-pink-700 dark:bg-pink-950 dark:text-pink-400'
  if (r.includes('matron')) return 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-400'
  if (r.includes('secretary')) return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
  if (r.includes('admissions')) return 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
  if (r.includes('bus') || r.includes('driver')) return 'bg-lime-50 text-lime-700 dark:bg-lime-950 dark:text-lime-400'
  if (r.includes('gate')) return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
  if (r.includes('cook')) return 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400'
  if (r.includes('deputy')) return 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-400'
  return 'bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
}
