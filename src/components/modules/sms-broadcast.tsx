'use client'
import { useState, useMemo, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from '@/components/ui/dialog'
import {
  MessageSquare, Send, Loader2, Users, CheckCircle2, AlertCircle,
  Clock, RefreshCw, Filter,
} from 'lucide-react'
import { useFetch } from '@/lib/api'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface SmsLogRow {
  id: string
  recipientPhone: string | null
  message: string
  status: string
  channel: string
  eventType: string | null
  studentName: string | null
  admissionNo: string | null
  createdAt: string
}

interface SmsData {
  logs: SmsLogRow[]
  count: number
  demo?: boolean
}

// Recipient audiences (must match backend behaviour)
const AUDIENCES = [
  { key: 'all', label: 'All Parents', hint: 'Every parent with a phone number' },
  { key: 'class', label: 'By Class', hint: 'Filter by class level (e.g. Form 1)' },
  { key: 'stream', label: 'By Stream', hint: 'Filter by class + stream' },
  { key: 'overdue', label: 'Overdue Fees', hint: 'Only parents with unpaid invoices' },
] as const

type AudienceKey = typeof AUDIENCES[number]['key']

// Kenya SMS cost estimate (KES / SMS — Africa's Talking rate)
const SMS_COST_KES = 0.8

export function SmsBroadcastModule() {
  const { data, loading, refetch } = useFetch<SmsData>('/api/notifications/sms')
  const [open, setOpen] = useState(false)
  const [audience, setAudience] = useState<AudienceKey>('all')
  const [classFilter, setClassFilter] = useState<string>('all')
  const [streamFilter, setStreamFilter] = useState<string>('all')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [previewing, setPreviewing] = useState(false)
  const [classes, setClasses] = useState<Array<{ id: string; name: string }>>([])
  const [streams, setStreams] = useState<Array<{ id: string; name: string }>>([])

  // Load class levels for filters (uses the existing academics endpoint)
  useEffect(() => {
    fetch('/api/academics')
      .then(r => r.json().catch(() => ({})))
      .then(d => {
        const list = Array.isArray(d?.classLevels) ? d.classLevels : Array.isArray(d) ? d : []
        setClasses(list.map((c: any) => ({
          id: c.id || c.value || c.slug || c.name,
          name: c.name || c.label,
        })))
      })
      .catch(() => setClasses([]))
  }, [])

  // Load streams when a class is selected (filter client-side from the
  // full streams list returned by /api/academics/streams)
  useEffect(() => {
    if (classFilter === 'all') {
      setStreams([])
      return
    }
    fetch('/api/academics/streams')
      .then(r => r.json().catch(() => ({})))
      .then(d => {
        const list = Array.isArray(d?.streams) ? d.streams : Array.isArray(d) ? d : []
        const filtered = list
          .filter((s: any) => s?.classLevel?.id === classFilter || s?.classLevelId === classFilter)
          .map((s: any) => ({ id: s.id || s.value, name: s.name || s.label }))
        setStreams(filtered)
      })
      .catch(() => setStreams([]))
  }, [classFilter])

  // Estimate recipients
  const estimateRecipients = useCallback(async () => {
    if (!message.trim()) {
      toast.error('Message is required')
      return
    }
    setPreviewing(true)
    try {
      const params = new URLSearchParams({
        audience,
        class: classFilter,
        stream: streamFilter,
      })
      const res = await fetch(`/api/sms-broadcast/preview?${params.toString()}`)
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        toast.error('Estimate failed', { description: d?.error || 'Please try again' })
        setPreviewCount(null)
      } else {
        setPreviewCount(Number(d?.count) || 0)
      }
    } catch {
      setPreviewCount(null)
      toast.error('Estimate failed')
    } finally {
      setPreviewing(false)
    }
  }, [message, audience, classFilter, streamFilter])

  const sendBroadcast = async () => {
    if (!message.trim()) {
      toast.error('Message cannot be empty')
      return
    }
    if (previewCount === 0) {
      toast.error('No recipients match the selected filters')
      return
    }
    setSending(true)
    try {
      const res = await fetch('/api/sms-broadcast/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience,
          classLevelId: classFilter !== 'all' ? classFilter : undefined,
          streamId: streamFilter !== 'all' ? streamFilter : undefined,
          message: message.trim(),
        }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (d?.demo) {
          toast.success('Broadcast saved (demo mode)', {
            description: d?.message || 'Africa\'s Talking not configured. SMS logged locally.',
            duration: 6000,
          })
        } else {
          toast.error('Broadcast failed', { description: d?.error || 'Please try again' })
        }
      } else {
        toast.success('SMS broadcast queued', {
          description: d?.message || `${d?.sent || 0} of ${d?.total || previewCount || 0} SMS dispatched.`,
        })
        setMessage('')
        setPreviewCount(null)
        setOpen(false)
        refetch()
      }
    } catch {
      toast.error('Network error — please try again')
    } finally {
      setSending(false)
    }
  }

  // Derived stats
  const stats = useMemo(() => {
    const logs = data?.logs || []
    return {
      total: data?.count || logs.length,
      sent: logs.filter(l => l.status === 'Sent' || l.status === 'Delivered').length,
      failed: logs.filter(l => l.status === 'Failed').length,
      pending: logs.filter(l => l.status === 'Pending' || l.status === 'Queued' || l.status === 'demo').length,
    }
  }, [data])

  const estimatedCost = previewCount != null ? previewCount * SMS_COST_KES : null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <MessageSquare className="h-6 w-6 text-emerald-600" />
            SMS Broadcast
          </h2>
          <p className="text-sm text-muted-foreground">
            Send bulk SMS to parents — Kenya CBE schools use this for fee reminders,
            exam alerts, and urgent announcements.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`mr-2 h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setOpen(true)}>
            <Send className="mr-2 h-3.5 w-3.5" /> New Broadcast
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Sent</p>
              <p className="text-xl font-bold tabular-nums">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Delivered</p>
              <p className="text-xl font-bold tabular-nums">{stats.sent}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Pending</p>
              <p className="text-xl font-bold tabular-nums">{stats.pending}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Failed</p>
              <p className="text-xl font-bold tabular-nums">{stats.failed}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Broadcasts</CardTitle>
          <CardDescription>
            Last 50 SMS messages sent from this school
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading && !data ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : (data?.logs?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <MessageSquare className="h-8 w-8 text-muted-foreground/60" />
              <p className="text-sm font-medium">No broadcasts yet</p>
              <p className="text-xs text-muted-foreground">
                Click “New Broadcast” to send your first SMS.
              </p>
            </div>
          ) : (
            <div className="max-h-96 space-y-2 overflow-y-auto pr-2">
              {(data?.logs || []).map(log => (
                <div
                  key={log.id}
                  className="flex flex-col gap-2 rounded-lg border p-3 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {log.eventType || 'Broadcast'}
                      </Badge>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          log.status === 'Delivered' || log.status === 'Sent'
                            ? 'border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400'
                            : log.status === 'Failed'
                              ? 'border-rose-300 text-rose-700 dark:border-rose-700 dark:text-rose-400'
                              : 'border-amber-300 text-amber-700 dark:border-amber-700 dark:text-amber-400'
                        }`}
                      >
                        {log.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-foreground">{log.message}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      To: {log.recipientPhone || '—'}
                      {log.studentName ? ` · ${log.studentName}` : ''}
                      {log.admissionNo ? ` (${log.admissionNo})` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New Broadcast Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-4 w-4 text-emerald-600" />
              New SMS Broadcast
            </DialogTitle>
            <DialogDescription>
              Compose a bulk SMS to parents. Cost estimate: KES {SMS_COST_KES.toFixed(2)} per SMS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Audience selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">
                Recipient Audience
              </Label>
              <Select value={audience} onValueChange={(v) => setAudience(v as AudienceKey)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select audience" />
                </SelectTrigger>
                <SelectContent>
                  {AUDIENCES.map(a => (
                    <SelectItem key={a.key} value={a.key}>
                      {a.label} — <span className="text-muted-foreground">{a.hint}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Class filter (only for class/stream audiences) */}
            {(audience === 'class' || audience === 'stream') && (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground">
                    Class Level
                  </Label>
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All classes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All classes</SelectItem>
                      {classes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {audience === 'stream' && (
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground">
                      Stream
                    </Label>
                    <Select value={streamFilter} onValueChange={setStreamFilter} disabled={classFilter === 'all'}>
                      <SelectTrigger>
                        <SelectValue placeholder="All streams" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All streams</SelectItem>
                        {streams.map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            )}

            {/* Message */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="sms-message" className="text-xs font-semibold uppercase text-muted-foreground">
                  Message
                </Label>
                <span className={`text-[10px] ${message.length > 160 ? 'text-rose-600' : 'text-muted-foreground'}`}>
                  {message.length} / 160 chars
                </span>
              </div>
              <Textarea
                id="sms-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Dear parent, this is a reminder that school fees for Term 2 are due on 5th August..."
                rows={4}
                maxLength={480}
              />
              <p className="text-[10px] text-muted-foreground">
                {message.length > 160 ? `This will be split into ${Math.ceil(message.length / 160)} SMS per recipient.` : 'Single SMS per recipient.'}
              </p>
            </div>

            {/* Preview count */}
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/30 p-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={estimateRecipients}
                disabled={previewing}
              >
                {previewing ? (
                  <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Estimating...</>
                ) : (
                  <><Filter className="mr-2 h-3 w-3" /> Estimate Recipients</>
                )}
              </Button>
              {previewCount != null && (
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3 text-emerald-600" />
                    <span className="font-semibold">{previewCount}</span>
                    <span className="text-muted-foreground">recipients</span>
                  </span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">
                    Est. cost: <span className="font-semibold text-foreground">KES {estimatedCost?.toFixed(2)}</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={sendBroadcast}
              disabled={sending || !message.trim()}
            >
              {sending ? (
                <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> Sending...</>
              ) : (
                <><Send className="mr-2 h-3.5 w-3.5" /> Send Broadcast</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
