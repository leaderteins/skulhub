'use client'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useFetch, apiPost, apiPut, apiDelete } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import {
  cn, timeAgo, statusColor, priorityColor,
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
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  Megaphone, Pin, Trash2, Pencil, Plus, Mail, MessageSquare,
  Send, CheckCircle2, Radio, ShieldCheck, AlertCircle, Inbox,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RTooltip,
} from 'recharts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Announcement {
  id: string
  title: string
  body: string
  audience: string
  priority: string
  authorId: string | null
  authorName: string | null
  pinned: boolean
  publishedAt: string
  createdAt: string
}

interface Notification {
  id: string
  recipient: string
  channel: string
  subject: string | null
  message: string
  status: string
  createdAt: string
  sentAt: string | null
}

interface CommData {
  announcements: Announcement[]
  notifications: Notification[]
  stats: {
    totalAnnouncements: number
    pinned: number
    smsThisWeek: number
    emailThisWeek: number
    statusCounts: Record<string, number>
    totalNotifications: number
  }
}

const AUDIENCES = ['All', 'Students', 'Staff', 'Parents', 'Teachers'] as const
const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'] as const

const PIE_COLORS: Record<string, string> = {
  Queued: '#f59e0b',
  Sent: '#10b981',
  Delivered: '#14b8a6',
  Failed: '#f43f5e',
}

const SMS_COST_KES = 0.8

// ---------------------------------------------------------------------------
// Main module
// ---------------------------------------------------------------------------
export function CommunicationsModule() {
  const { data, loading, error, refetch } = useFetch<CommData>('/api/communications')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [smsOpen, setSmsOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  // Composer state
  const { user } = useAuthStore()
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [audience, setAudience] = useState<string>('All')
  const [priority, setPriority] = useState<string>('Normal')
  const [pinned, setPinned] = useState(false)
  const [authorName, setAuthorName] = useState(user?.name || '')
  const [publishing, setPublishing] = useState(false)

  const announcements = data?.announcements ?? []
  const notifications = data?.notifications ?? []
  const stats = data?.stats

  const pieData = useMemo(() => {
    if (!stats) return []
    return (['Queued', 'Sent', 'Delivered', 'Failed'] as const)
      .map((k) => ({ name: k, value: stats.statusCounts[k] || 0 }))
      .filter((d) => d.value > 0)
  }, [stats])

  async function handlePublish() {
    if (!title.trim() || !body.trim()) {
      toast.error('Title and body are required')
      return
    }
    setPublishing(true)
    try {
      if (editing) {
        await apiPut(`/api/communications/${editing.id}`, {
          title, body, audience, priority, pinned, authorName,
        })
        toast.success('Announcement updated')
        setEditing(null)
        setEditOpen(false)
      } else {
        await apiPost('/api/communications', {
          title, body, audience, priority, pinned, authorName,
        })
        toast.success('Announcement published')
      }
      setTitle(''); setBody(''); setAudience('All'); setPriority('Normal')
      setPinned(false); setAuthorName('')
      refetch()
    } catch (e: unknown) {
      toast.error('Failed to publish', { description: (e as Error).message })
    } finally {
      setPublishing(false)
    }
  }

  async function togglePin(a: Announcement) {
    try {
      await apiPut(`/api/communications/${a.id}`, { pinned: !a.pinned })
      toast.success(a.pinned ? 'Unpinned' : 'Pinned to top')
      refetch()
    } catch {
      toast.error('Failed to update')
    }
  }

  async function handleDelete(a: Announcement) {
    if (!confirm(`Delete announcement "${a.title}"?`)) return
    try {
      await apiDelete(`/api/communications/${a.id}`)
      toast.success('Announcement deleted')
      refetch()
    } catch {
      toast.error('Failed to delete')
    }
  }

  function openEdit(a: Announcement) {
    setEditing(a)
    setTitle(a.title); setBody(a.body); setAudience(a.audience)
    setPriority(a.priority); setPinned(a.pinned); setAuthorName(a.authorName || '')
    setEditOpen(true)
  }

  function resetComposer() {
    setTitle(''); setBody(''); setAudience('All'); setPriority('Normal')
    setPinned(false); setAuthorName(''); setEditing(null)
  }

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Communications"
        description="Announcements, SMS & email notifications for the school community."
        icon={Megaphone}
        action={
          <Button onClick={() => setSmsOpen(true)} variant="outline" className="gap-2">
            <MessageSquare className="h-4 w-4" /> Send Bulk SMS
          </Button>
        }
      />

      {/* Gateway status banner */}
      <div className="flex flex-col gap-3 rounded-xl border border-emerald-200/60 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 p-4 dark:border-emerald-900/50 dark:from-emerald-950/40 dark:via-teal-950/30 dark:to-cyan-950/30 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
            <Radio className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold">Safaricom SMS Gateway: Connected</p>
            <p className="text-xs text-muted-foreground">M-Pesa & SMS integration active · KES {SMS_COST_KES.toFixed(2)} per message</p>
          </div>
        </div>
        <Badge className="gap-1.5 self-start bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 sm:self-auto">
          <ShieldCheck className="h-3.5 w-3.5" /> All systems operational
        </Badge>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Total Announcements"
          value={stats?.totalAnnouncements ?? 0}
          icon={Megaphone}
          accent="emerald"
          loading={loading}
        />
        <StatCard
          label="Pinned"
          value={stats?.pinned ?? 0}
          icon={Pin}
          accent="amber"
          loading={loading}
        />
        <StatCard
          label="SMS Sent (7d)"
          value={stats?.smsThisWeek ?? 0}
          icon={MessageSquare}
          accent="teal"
          loading={loading}
        />
        <StatCard
          label="Email Sent (7d)"
          value={stats?.emailThisWeek ?? 0}
          icon={Mail}
          accent="cyan"
          loading={loading}
        />
      </div>

      {error && (
        <Card className="border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/30">
          <CardContent className="flex items-center gap-3 p-4 text-rose-700 dark:text-rose-300">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">Failed to load communications: {error}</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* LEFT — composer + feed */}
        <div className="space-y-6 lg:col-span-2">
          {/* Composer */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Plus className="h-4 w-4 text-emerald-600" />
                {editing ? 'Edit Announcement' : 'Create Announcement'}
              </CardTitle>
              <CardDescription className="text-xs">
                Publish to the selected audience instantly. Pinned items appear at the top of the feed.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ann-title" className="text-xs">Title</Label>
                <Input
                  id="ann-title"
                  placeholder="e.g. Mid-term exams begin Monday"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ann-body" className="text-xs">Message</Label>
                <Textarea
                  id="ann-body"
                  placeholder="Write your announcement..."
                  rows={4}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Audience</Label>
                  <Select value={audience} onValueChange={setAudience}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {AUDIENCES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Priority</Label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ann-author" className="text-xs">Author</Label>
                  <Input
                    id="ann-author"
                    placeholder="Author name"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="bg-muted/40"
                    readOnly={!!user}
                  />
                  {user && <p className="text-[10px] text-muted-foreground">Auto-filled from your account</p>}
                </div>
              </div>
              <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={pinned} onCheckedChange={setPinned} />
                  <span className="text-muted-foreground">Pin to top</span>
                </label>
                <div className="flex gap-2">
                  {editing && (
                    <Button variant="outline" onClick={resetComposer}>Cancel</Button>
                  )}
                  <Button onClick={handlePublish} disabled={publishing} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                    <Send className="h-4 w-4" />
                    {publishing ? 'Publishing...' : editing ? 'Save Changes' : 'Publish'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feed */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Announcement Feed
              </h3>
              <Badge variant="secondary" className="text-xs">{announcements.length} total</Badge>
            </div>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i}><CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                    <Skeleton className="h-12 w-full" />
                  </CardContent></Card>
                ))}
              </div>
            ) : announcements.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="No announcements yet"
                description="Publish your first announcement using the composer above."
              />
            ) : (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <Card
                    key={a.id}
                    className={cn(
                      'transition-all hover:shadow-md',
                      a.pinned && 'border-amber-300/70 bg-amber-50/40 dark:border-amber-800/50 dark:bg-amber-950/20',
                    )}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <span
                          className={cn('mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full', priorityColor(a.priority))}
                          title={`Priority: ${a.priority}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-semibold leading-tight">{a.title}</h4>
                            {a.pinned && (
                              <Badge className="gap-1 bg-amber-500/15 text-amber-700 dark:text-amber-300">
                                <Pin className="h-3 w-3" /> Pinned
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">{a.audience}</Badge>
                          </div>
                          <p className={cn(
                            'mt-1.5 text-sm text-muted-foreground',
                            expandedId === a.id ? '' : 'line-clamp-2',
                          )}>
                            {a.body}
                          </p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                            <span className="font-medium text-foreground/80">
                              {a.authorName || 'System'}
                            </span>
                            <span>·</span>
                            <span>{timeAgo(a.publishedAt)}</span>
                            {a.body.length > 120 && (
                              <button
                                onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                                className="ml-auto text-emerald-600 hover:underline dark:text-emerald-400"
                              >
                                {expandedId === a.id ? 'Show less' : 'Read more'}
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col gap-1">
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7"
                            onClick={() => togglePin(a)}
                            title={a.pinned ? 'Unpin' : 'Pin'}
                          >
                            <Pin className={cn('h-3.5 w-3.5', a.pinned && 'fill-amber-500 text-amber-500')} />
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7"
                            onClick={() => openEdit(a)} title="Edit"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon" variant="ghost" className="h-7 w-7 text-rose-600 hover:text-rose-700"
                            onClick={() => handleDelete(a)} title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — notification center */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Inbox className="h-4 w-4 text-teal-600" /> Notification Center
              </CardTitle>
              <CardDescription className="text-xs">
                Real-time SMS & email delivery status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading || !stats ? (
                <>
                  <Skeleton className="mx-auto h-40 w-40 rounded-full" />
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
                  </div>
                </>
              ) : (
                <>
                  {/* Donut */}
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%" cy="50%"
                          innerRadius={50} outerRadius={75}
                          paddingAngle={3} dataKey="value"
                        >
                          {pieData.map((entry) => (
                            <Cell key={entry.name} fill={PIE_COLORS[entry.name]} />
                          ))}
                        </Pie>
                        <RTooltip
                          contentStyle={{ borderRadius: 8, fontSize: 12, border: '1px solid #e2e8f0' }}
                          formatter={(v: number, n: string) => [`${v} msg`, n]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-bold">{stats.totalNotifications}</span>
                      <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Total</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Queued', 'Sent', 'Delivered', 'Failed'] as const).map((s) => (
                      <div key={s} className="flex items-center gap-2 rounded-lg border bg-card/50 px-2.5 py-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[s] }} />
                        <div className="min-w-0">
                          <p className="text-xs font-medium leading-tight">{s}</p>
                          <p className="text-sm font-bold">{stats.statusCounts[s] || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent notifications list */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Recent Notifications</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
              ) : notifications.length === 0 ? (
                <EmptyState
                  icon={MessageSquare}
                  title="No notifications"
                  description="Send a bulk SMS to see activity here."
                />
              ) : (
                <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div key={n.id} className="rounded-lg border bg-card/50 p-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {n.channel === 'SMS' ? (
                            <MessageSquare className="h-3.5 w-3.5 text-teal-600" />
                          ) : (
                            <Mail className="h-3.5 w-3.5 text-cyan-600" />
                          )}
                          <span className="truncate text-xs font-medium">{n.recipient}</span>
                        </div>
                        <span className={cn('rounded px-1.5 py-0.5 text-[10px] font-medium', statusColor(n.status))}>
                          {n.status}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bulk SMS dialog */}
      <BulkSmsDialog
        open={smsOpen}
        onOpenChange={setSmsOpen}
        onSent={() => refetch()}
      />

      {/* Edit dialog (for announcements already in feed — uses composer state) */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) resetComposer() }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>Update the announcement details below.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Message</Label>
              <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Audience</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AUDIENCES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Switch checked={pinned} onCheckedChange={setPinned} />
              <span className="text-muted-foreground">Pin to top</span>
            </label>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handlePublish} disabled={publishing} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle2 className="h-4 w-4" /> {publishing ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bulk SMS Dialog
// ---------------------------------------------------------------------------
function BulkSmsDialog({
  open, onOpenChange, onSent,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onSent: () => void
}) {
  const { data: studentData } = useFetch<{ students: Array<{ phone?: string | null }> }>('/api/students?pageSize=500')
  const { data: staffData } = useFetch<{ staff: Array<{ phone?: string | null }> }>('/api/staff?pageSize=500')

  const [audience, setAudience] = useState('Students')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const recipients = useMemo(() => {
    let list: Array<{ phone?: string | null }> = []
    if (audience === 'Students' || audience === 'All') list = list.concat(studentData?.students || [])
    if (audience === 'Staff' || audience === 'Teachers' || audience === 'All') list = list.concat(staffData?.staff || [])
    if (audience === 'Parents') list = list.concat(studentData?.students || []) // mock: parent phones = student phones
    const phones = list
      .map((p) => p.phone)
      .filter((p): p is string => !!p && p.length >= 10)
    return Array.from(new Set(phones))
  }, [audience, studentData, staffData])

  const charCount = message.length
  const cost = recipients.length * SMS_COST_KES

  async function handleSend() {
    if (!message.trim()) {
      toast.error('Message cannot be empty')
      return
    }
    if (recipients.length === 0) {
      toast.error('No recipients with valid phone numbers')
      return
    }
    setSending(true)
    try {
      const res = await apiPost<{ queued: number }>('/api/communications', {
        mode: 'bulk-sms',
        recipients,
        channel: 'SMS',
        message: message.slice(0, 160),
      })
      toast.success(`${res.queued} SMS queued for delivery`)
      onSent()
      onOpenChange(false)
      setMessage('')
    } catch (e: unknown) {
      toast.error('Failed to queue SMS', { description: (e as Error).message })
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-teal-600" /> Send Bulk SMS
          </DialogTitle>
          <DialogDescription>
            Broadcast an SMS to the selected audience via Safaricom gateway.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Audience</Label>
            <Select value={audience} onValueChange={setAudience}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {AUDIENCES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Message</Label>
            <Textarea
              rows={4}
              maxLength={160}
              placeholder="Type your SMS (max 160 characters)..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{charCount}/160 characters</span>
              <span className={cn(charCount > 160 && 'text-rose-600')}>
                {recipients.length} recipients
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border bg-emerald-50/50 px-3 py-2 dark:bg-emerald-950/20">
            <div>
              <p className="text-xs text-muted-foreground">Estimated cost</p>
              <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">
                KES {cost.toLocaleString('en-KE', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Rate</p>
              <p className="text-xs font-medium">KES {SMS_COST_KES.toFixed(2)}/msg</p>
            </div>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={handleSend}
            disabled={sending || !message.trim()}
            className="gap-2 bg-teal-600 hover:bg-teal-700"
          >
            <Send className="h-4 w-4" />
            {sending ? 'Queuing...' : `Queue ${recipients.length} SMS`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
