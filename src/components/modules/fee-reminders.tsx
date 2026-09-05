'use client'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Bell, AlertTriangle, Clock, CheckCircle2, Loader2, Send, TrendingDown, Users, DollarSign, Zap } from 'lucide-react'

interface Summary { total: number; totalBalance: number; critical: number; urgent: number; polite: number; grace: number }
interface Invoice { invoiceNo: string; studentName: string; admissionNo: string; balance: number; daysOverdue: number; tier: string; phone: string; dueDate: string }

const tierConfig: Record<string, { label: string; color: string; icon: any }> = {
  grace: { label: 'Grace Period', color: 'text-muted-foreground bg-muted', icon: Clock },
  polite: { label: 'Polite Reminder', color: 'text-blue-600 bg-blue-50 dark:bg-blue-950', icon: Bell },
  urgent: { label: 'Urgent', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950', icon: AlertTriangle },
  final: { label: 'Final Notice', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950', icon: AlertTriangle },
}

export function FeeRemindersModule() {
  const [summary, setSummary] = useState<Summary | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const fetchData = useCallback(async () => {
    try { const res = await fetch('/api/fees/reminders'); const d = await res.json(); setSummary(d.summary); setInvoices(d.invoices || []) } catch {}
    finally { setLoading(false) }
  }, [])
  useEffect(() => { fetchData() }, [fetchData])

  async function handleSend() {
    setSending(true)
    try { const res = await fetch('/api/fees/reminders', { method: 'POST' }); const d = await res.json(); if (!res.ok) throw new Error(d.error)
      toast.success(`Reminders sent!`, { description: `${d.sent} SMS sent`, duration: 6000 }); fetchData() } catch (e: any) { toast.error(e.message) } finally { setSending(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Bell className="h-6 w-6 text-emerald-600" /> Fee Reminders</h2><p className="text-sm text-muted-foreground">Automated SMS reminders for overdue fees</p></div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSend} disabled={sending}>{sending ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Sending...</> : <><Send className="mr-1.5 h-4 w-4" /> Send Reminders Now</>}</Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/30"><DollarSign className="h-5 w-5" /></div><div><p className="text-xs text-muted-foreground">Total Outstanding</p><p className="text-xl font-bold tabular-nums">KES {(summary?.totalBalance || 0).toLocaleString()}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"><Users className="h-5 w-5" /></div><div><p className="text-xs text-muted-foreground">Overdue Invoices</p><p className="text-xl font-bold">{summary?.total || 0}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/30"><Zap className="h-5 w-5" /></div><div><p className="text-xs text-muted-foreground">Action Needed</p><p className="text-xl font-bold">{(summary?.polite || 0) + (summary?.urgent || 0) + (summary?.critical || 0)}</p></div></CardContent></Card>
      </div>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><TrendingDown className="h-4 w-4 text-rose-600" /> Overdue Invoices</CardTitle><CardDescription className="text-xs">Sorted by days overdue</CardDescription></CardHeader>
        <CardContent>{invoices.length === 0 ? <div className="flex flex-col items-center justify-center py-10 text-center"><CheckCircle2 className="mb-2 h-10 w-10 text-emerald-500/40" /><p className="text-sm text-muted-foreground">No overdue invoices! 🎉</p></div> : (
          <ScrollArea className="h-[500px] pr-4"><div className="space-y-2">{invoices.map((inv, i) => { const tier = tierConfig[inv.tier] || tierConfig.grace; const Icon = tier.icon; return (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50">
              <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tier.color}`}><Icon className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{inv.studentName}</p><p className="text-xs text-muted-foreground">{inv.admissionNo} · {inv.invoiceNo}</p></div>
              <div className="text-right"><p className="text-sm font-bold tabular-nums text-rose-600">KES {inv.balance.toLocaleString()}</p><Badge variant="outline" className={`text-[10px] ${tier.color}`}>{inv.daysOverdue}d · {tier.label}</Badge></div>
            </div>)})}</div></ScrollArea>)}</CardContent>
      </Card>
    </div>
  )
}
