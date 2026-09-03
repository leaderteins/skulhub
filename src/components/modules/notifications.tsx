'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  MessageSquare, Send, Clock, Phone, CheckCircle2, Smartphone,
  Settings, Loader2, Bell, User, Zap
} from 'lucide-react'

interface Template {
  id: string
  event: string
  channel: string
  enabled: boolean
  template: string
}

interface SmsLog {
  id: string
  eventType: string
  channel: string
  recipientPhone: string
  message: string
  status: string
  createdAt: string
  firstName?: string
  lastName?: string
  admissionNo?: string
}

export function NotificationsModule() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [logs, setLogs] = useState<SmsLog[]>([])
  const [loading, setLoading] = useState(true)
  const [sendOpen, setSendOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [manualSms, setManualSms] = useState({ to: '', message: '', channel: 'sms' })

  const fetchData = useCallback(async () => {
    try {
      const [tmplRes, logRes] = await Promise.all([
        fetch('/api/notifications/templates').then(r => r.json()).catch(() => ({ templates: [] })),
        fetch('/api/notifications/sms').then(r => r.json()).catch(() => ({ logs: [] })),
      ])
      setTemplates(tmplRes.templates || [])
      setLogs(logRes.logs || [])
    } catch {}
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, 10000)
    return () => clearInterval(id)
  }, [fetchData])

  async function handleSendManual() {
    if (!manualSms.to || !manualSms.message) {
      toast.error('Phone number and message are required')
      return
    }
    setBusy(true)
    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(manualSms),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(data.sent ? 'SMS sent!' : 'SMS logged (demo mode)', {
        description: data.message,
      })
      setSendOpen(false)
      setManualSms({ to: '', message: '', channel: 'sms' })
      fetchData()
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  function toggleTemplate(id: string) {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, enabled: !t.enabled } : t))
    toast.success('Template updated', { description: 'Changes saved' })
  }

  const sentCount = logs.filter(l => l.status === 'sent').length
  const demoCount = logs.filter(l => l.status === 'demo').length

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <MessageSquare className="h-6 w-6 text-emerald-600" /> SMS &amp; WhatsApp Notifications
          </h2>
          <p className="text-sm text-muted-foreground">
            Automated parent alerts via Africa's Talking SMS gateway
          </p>
        </div>
        <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setSendOpen(true)}>
          <Send className="mr-1.5 h-4 w-4" /> Send SMS
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Sent" value={logs.length} icon={Send} accent="emerald" sub="all notifications" />
        <StatCard label="Delivered" value={sentCount} icon={CheckCircle2} accent="teal" sub="successfully sent" />
        <StatCard label="Demo Mode" value={demoCount} icon={Clock} accent="amber" sub="not yet sent to network" />
        <StatCard label="Active Templates" value={templates.filter(t => t.enabled).length} icon={Zap} accent="cyan" sub={`of ${templates.length} templates`} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Templates */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Zap className="h-4 w-4 text-emerald-600" /> Automation Templates
            </CardTitle>
            <CardDescription className="text-xs">Toggle which events trigger SMS</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[450px] pr-4">
              <div className="space-y-2">
                {templates.map((t) => (
                  <div key={t.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{t.event}</p>
                        <p className="mt-0.5 line-clamp-2 text-[11px] text-muted-foreground">{t.template}</p>
                      </div>
                      <Switch checked={t.enabled} onCheckedChange={() => toggleTemplate(t.id)} />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px]">
                        {t.channel === 'sms' ? <><MessageSquare className="mr-1 h-2.5 w-2.5" /> SMS</> : <><Smartphone className="mr-1 h-2.5 w-2.5" /> WhatsApp</>}
                      </Badge>
                      {t.enabled && <span className="text-[10px] text-emerald-600">● Active</span>}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* SMS Log */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="h-4 w-4 text-emerald-600" /> Notification History
              </CardTitle>
              <CardDescription className="text-xs">Recent SMS/WhatsApp sent (updates every 10s)</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={fetchData}>
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <MessageSquare className="mb-2 h-8 w-8 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">No notifications yet.</p>
                <p className="text-xs text-muted-foreground/70">Simulate a biometric tap to trigger an automatic SMS.</p>
              </div>
            ) : (
              <ScrollArea className="h-[450px] pr-4">
                <div className="space-y-2">
                  {logs.map((log) => (
                    <div key={log.id} className="flex items-start gap-3 rounded-lg border p-3">
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${log.status === 'sent' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950' : 'bg-amber-50 text-amber-600 dark:bg-amber-950'}`}>
                        {log.status === 'sent' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <p className="truncate text-sm font-medium">
                            {log.firstName ? `${log.firstName} ${log.lastName}` : log.recipientPhone}
                          </p>
                          <span className="text-[10px] text-muted-foreground tabular-nums">
                            {new Date(log.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </span>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">{log.message}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            <Phone className="mr-1 h-2.5 w-2.5" /> {log.recipientPhone}
                          </Badge>
                          <Badge variant="outline" className={`text-[10px] ${log.status === 'sent' ? 'border-emerald-300 text-emerald-700' : 'border-amber-300 text-amber-700'}`}>
                            {log.status === 'sent' ? '✓ Delivered' : '⏳ Demo'}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px]">{log.eventType}</Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Manual SMS Dialog */}
      <Dialog open={sendOpen} onOpenChange={setSendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-emerald-600" /> Send Manual SMS</DialogTitle>
            <DialogDescription>Send a custom SMS to any parent/guardian.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="sms-to">Recipient Phone</Label>
              <Input id="sms-to" placeholder="+254712345678" value={manualSms.to} onChange={(e) => setManualSms({ ...manualSms, to: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select value={manualSms.channel} onValueChange={(v) => setManualSms({ ...manualSms, channel: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sms-msg">Message</Label>
              <Textarea id="sms-msg" rows={3} placeholder="Type your message..." value={manualSms.message} onChange={(e) => setManualSms({ ...manualSms, message: e.target.value })} />
              <p className="text-[10px] text-muted-foreground">{manualSms.message.length} / 160 characters</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendOpen(false)}>Cancel</Button>
            <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={busy} onClick={handleSendManual}>
              {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Send className="mr-1.5 h-4 w-4" />} Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent, sub }: {
  label: string; value: number; icon: any;
  accent: 'emerald' | 'teal' | 'cyan' | 'amber'; sub: string
}) {
  const c = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400',
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
  }
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c[accent]}`}><Icon className="h-5 w-5" /></div>
        </div>
      </CardContent>
    </Card>
  )
}
