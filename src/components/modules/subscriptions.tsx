'use client'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { Crown, CheckCircle2, Loader2, Users, DollarSign, Zap, Building2, Rocket } from 'lucide-react'

const PLANS = [
  { name: 'Starter', price: 2000, students: 200, features: ['Core modules', 'SMS (100/mo)', 'Basic reports'], icon: Rocket, color: 'text-blue-600' },
  { name: 'Standard', price: 5000, students: 500, features: ['All modules', 'SMS (500/mo)', 'Biometric', 'Bus tracking'], icon: Zap, color: 'text-emerald-600' },
  { name: 'Premium', price: 10000, students: 2000, features: ['Everything', 'Unlimited SMS', 'AI assistant', 'White-label'], icon: Crown, color: 'text-amber-600' },
  { name: 'Enterprise', price: 25000, students: 10000, features: ['Everything + custom', 'Dedicated support', 'API access'], icon: Building2, color: 'text-violet-600' },
]

export function SubscriptionsModule() {
  const [subs, setSubs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const fetchData = useCallback(async () => { try { const res = await fetch('/api/subscriptions/list'); const d = await res.json(); setSubs(d.subscriptions || []) } catch {} finally { setLoading(false) } }, [])
  useEffect(() => { fetchData() }, [fetchData])

  async function handleUpgrade(schoolId: string, plan: string) {
    setBusy(schoolId + plan)
    try { const res = await fetch('/api/subscriptions/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ schoolId, plan }) }); const d = await res.json(); if (!res.ok) throw new Error(d.error); toast.success(d.message || `Upgraded to ${plan}`); fetchData() } catch (e: any) { toast.error(e.message) } finally { setBusy(null) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>

  const totalMRR = subs.reduce((sum, s) => { const prices: Record<string, number> = { Starter: 2000, Standard: 5000, Premium: 10000, Enterprise: 25000 }; return sum + (prices[s.plan] || 0) }, 0)

  return (
    <div className="space-y-6">
      <div><h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><Crown className="h-6 w-6 text-amber-600" /> Subscription Billing</h2><p className="text-sm text-muted-foreground">Manage school subscriptions — M-Pesa payments for platform access</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><DollarSign className="h-5 w-5" /></div><div><p className="text-xs text-muted-foreground">Monthly Revenue (MRR)</p><p className="text-xl font-bold">KES {totalMRR.toLocaleString()}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600"><Building2 className="h-5 w-5" /></div><div><p className="text-xs text-muted-foreground">Active Schools</p><p className="text-xl font-bold">{subs.filter(s => s.status === 'Active').length}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600"><Users className="h-5 w-5" /></div><div><p className="text-xs text-muted-foreground">Total Students</p><p className="text-xl font-bold">{subs.reduce((sum, s) => sum + (s.maxStudents || 0), 0)}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><Zap className="h-5 w-5" /></div><div><p className="text-xs text-muted-foreground">Trial Schools</p><p className="text-xl font-bold">{subs.filter(s => s.status === 'Trial').length}</p></div></CardContent></Card>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map(plan => (<Card key={plan.name} className={plan.name === 'Premium' ? 'border-amber-300 ring-2 ring-amber-200' : ''}><CardContent className="p-5"><plan.icon className={`h-6 w-6 ${plan.color}`} /><h3 className="mt-2 text-lg font-bold">{plan.name}</h3><p className="text-2xl font-bold tabular-nums">KES {plan.price.toLocaleString()}<span className="text-sm font-normal text-muted-foreground">/mo</span></p><p className="text-xs text-muted-foreground">Up to {plan.students} students</p><ul className="mt-3 space-y-1">{plan.features.map(f => <li key={f} className="flex items-center gap-1.5 text-xs"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> {f}</li>)}</ul><p className="mt-3 text-[10px] text-muted-foreground">{subs.filter(s => s.plan === plan.name).length} schools on this plan</p></CardContent></Card>))}
      </div>
      <Card>
        <CardContent className="p-4">
          <ScrollArea className="h-[500px] pr-4"><div className="space-y-2">{subs.map(s => (
            <div key={s.id} className="flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3 flex-1"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-semibold text-white">{s.name?.[0] || 'S'}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.slug} · {s.maxStudents} students max</p></div></div>
              <div className="flex items-center gap-2"><Badge variant="outline" className="text-[10px]">{s.plan}</Badge><Badge variant="outline" className={`text-[10px] ${s.status === 'Active' ? 'border-emerald-300 text-emerald-700' : s.status === 'Trial' ? 'border-amber-300 text-amber-700' : 'border-rose-300 text-rose-700'}`}>{s.status}</Badge>
                <select className="rounded border px-2 py-1 text-xs" onChange={(e) => handleUpgrade(s.id, e.target.value)} value=""><option value="">Change plan...</option>{PLANS.filter(p => p.name !== s.plan).map(p => <option key={p.name} value={p.name}>{p.name} (KES {p.price.toLocaleString()}/mo)</option>)}</select>
              </div>{busy === s.id && <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />}
            </div>))}</div></ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}
