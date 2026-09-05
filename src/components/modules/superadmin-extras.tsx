'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  TrendingDown, Activity, GitCompare, Layers, Shield, Loader2, AlertTriangle,
  CheckCircle2, Clock, DollarSign, Users, RefreshCw, Crown, Zap,
} from 'lucide-react'

export function SuperAdminExtras() {
  const [tab, setTab] = useState<'churn' | 'health' | 'compare' | 'bulk' | 'audit'>('churn')
  const [churn, setChurn] = useState<any>(null)
  const [health, setHealth] = useState<any>(null)
  const [compare, setCompare] = useState<any>(null)
  const [audit, setAudit] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedSchools, setSelectedSchools] = useState<string[]>([])
  const [bulkAction, setBulkAction] = useState('suspend')
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [busy, setBusy] = useState(false)

  const fetchChurn = async () => { const r = await fetch('/api/superadmin/churn'); setChurn(await r.json()) }
  const fetchHealth = async () => { const r = await fetch('/api/superadmin/health'); setHealth(await r.json()) }
  const fetchAudit = async () => { const r = await fetch('/api/superadmin/audit'); setAudit(await r.json()) }

  useEffect(() => {
    Promise.all([fetchChurn(), fetchHealth(), fetchAudit()]).then(() => setLoading(false)).catch(() => setLoading(false))
  }, [])

  async function fetchCompare() {
    if (compareIds.length < 2) { toast.error('Select at least 2 schools'); return }
    const r = await fetch(`/api/superadmin/compare?ids=${compareIds.join(',')}`)
    setCompare(await r.json())
  }

  async function handleBulk() {
    if (selectedSchools.length === 0) { toast.error('Select schools first'); return }
    setBusy(true)
    try {
      const r = await fetch('/api/superadmin/bulk', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: bulkAction, schoolIds: selectedSchools, plan: 'Standard' }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error)
      toast.success(d.message)
      setSelectedSchools([])
      fetchHealth()
    } catch (e: any) { toast.error(e.message) } finally { setBusy(false) }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>

  const healthColors: Record<string, string> = { healthy: 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20', warning: 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20', critical: 'border-rose-300 bg-rose-50/50 dark:bg-rose-950/20' }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="flex items-center gap-2 text-xl font-bold tracking-tight"><Shield className="h-5 w-5 text-emerald-600" /> Platform Management Tools</h3>
        <p className="text-sm text-muted-foreground">Churn analysis, health monitor, comparison, bulk ops & audit log</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {[{k:'churn',l:'Revenue Churn',i:TrendingDown},{k:'health',l:'Health Monitor',i:Activity},{k:'compare',l:'Compare Schools',i:GitCompare},{k:'bulk',l:'Bulk Operations',i:Layers},{k:'audit',l:'Audit Log',i:Shield}].map(t => (
          <Button key={t.k} variant={tab===t.k?'default':'outline'} size="sm" className={tab===t.k?'bg-emerald-600 hover:bg-emerald-700':''} onClick={() => setTab(t.k as any)}><t.i className="mr-1.5 h-4 w-4" /> {t.l}</Button>
        ))}
      </div>

      {/* CHURN */}
      {tab === 'churn' && churn && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="Churned Schools" value={churn.summary?.totalChurned || 0} icon={TrendingDown} accent="rose" sub="suspended + expired" />
            <Stat label="Lost MRR" value={`KES ${(churn.summary?.totalLostMRR || 0).toLocaleString()}`} icon={DollarSign} accent="rose" sub="monthly revenue lost" />
            <Stat label="Win-Back Opportunities" value={churn.summary?.winBackOpportunities || 0} icon={RefreshCw} accent="amber" sub="suspended schools" />
            <Stat label="Expired Schools" value={churn.summary?.expiredCount || 0} icon={AlertTriangle} accent="rose" sub="permanently lost" />
          </div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Monthly Churn Trend</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={churn.monthlyChurn || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} />
                  <XAxis dataKey="month" tick={{fontSize:11}} /><YAxis tick={{fontSize:11}} />
                  <Tooltip contentStyle={{borderRadius:12,fontSize:12}} />
                  <Legend wrapperStyle={{fontSize:11}} />
                  <Bar dataKey="churned" fill="#ef4444" radius={[4,4,0,0]} name="Schools Churned" />
                  <Bar dataKey="lostMRR" fill="#f59e0b" radius={[4,4,0,0]} name="Lost MRR (KES)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Churned Schools</CardTitle></CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4"><div className="space-y-2">
                {churn.churnedSchools?.map((s:any,i:number) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 text-rose-600 dark:bg-rose-950"><AlertTriangle className="h-4 w-4" /></div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.studentCount} students · {s.plan} · {s.status}</p></div>
                    <div className="text-right"><p className="text-sm font-bold text-rose-600">KES {s.lostMRR.toLocaleString()}/mo</p><p className="text-xs text-muted-foreground">KES {Number(s.lostRevenue).toLocaleString()} total</p></div>
                  </div>
                ))}
                {(!churn.churnedSchools || churn.churnedSchools.length === 0) && <p className="py-8 text-center text-sm text-muted-foreground">No churned schools 🎉</p>}
              </div></ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* HEALTH */}
      {tab === 'health' && health && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Healthy" value={health.summary?.healthy || 0} icon={CheckCircle2} accent="emerald" sub="active + recent login" />
            <Stat label="Warning" value={health.summary?.warning || 0} icon={Clock} accent="amber" sub="inactive >7 days" />
            <Stat label="Critical" value={health.summary?.critical || 0} icon={AlertTriangle} accent="rose" sub="suspended/expired" />
          </div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">School Health Status</CardTitle><CardDescription className="text-xs">Green = healthy, Amber = inactive, Red = critical</CardDescription></CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4"><div className="space-y-2">
                {health.schools?.map((s:any,i:number) => (
                  <div key={i} className={`flex items-center gap-3 rounded-lg border p-3 ${healthColors[s.health] || ''}`}>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${s.health==='healthy'?'bg-emerald-100 text-emerald-600 dark:bg-emerald-950':s.health==='warning'?'bg-amber-100 text-amber-600 dark:bg-amber-950':'bg-rose-100 text-rose-600 dark:bg-rose-950'}`}>
                      {s.health==='healthy'?<CheckCircle2 className="h-4 w-4" />:s.health==='warning'?<Clock className="h-4 w-4" />:<AlertTriangle className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.students} students · {s.users} users · KES {Number(s.revenue).toLocaleString()}</p></div>
                    <div className="text-right"><Badge variant="outline" className={`text-[10px] ${s.health==='healthy'?'border-emerald-400 text-emerald-700':s.health==='warning'?'border-amber-400 text-amber-700':'border-rose-400 text-rose-700'}`}>{s.status}</Badge>{s.daysSinceLogin !== null && <p className="mt-0.5 text-[10px] text-muted-foreground">{s.daysSinceLogin}d since login</p>}</div>
                  </div>
                ))}
              </div></ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* COMPARE */}
      {tab === 'compare' && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Select Schools to Compare</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <ScrollArea className="h-[200px] pr-4"><div className="space-y-1">
                {health?.schools?.map((s:any) => (
                  <label key={s.id} className="flex items-center gap-2 rounded border p-2 cursor-pointer hover:bg-muted/50">
                    <Checkbox checked={compareIds.includes(s.id)} onCheckedChange={(c) => { if (c) setCompareIds([...compareIds, s.id]); else setCompareIds(compareIds.filter(id => id !== s.id)) }} />
                    <span className="text-sm">{s.name}</span>
                    <Badge variant="outline" className="ml-auto text-[10px]">{s.plan}</Badge>
                  </label>
                ))}
              </div></ScrollArea>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={fetchCompare} disabled={compareIds.length < 2}><GitCompare className="mr-1.5 h-4 w-4" /> Compare ({compareIds.length})</Button>
            </CardContent>
          </Card>
          {compare?.schools && (
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Comparison Results</CardTitle></CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b"><th className="py-2 text-left text-xs text-muted-foreground">Metric</th>{compare.schools.map((s:any) => <th key={s.id} className="py-2 text-center text-xs font-semibold">{s.name}</th>)}</tr></thead>
                    <tbody>
                      {[['Status',s=>s.status],['Plan',s=>s.plan],['Students',s=>s.students],['Staff',s=>s.staff],['Users',s=>s.users],['Invoices',s=>s.invoices],['Payments',s=>s.payments],['Revenue',s=>`KES ${Number(s.revenue).toLocaleString()}`],['Outstanding',s=>`KES ${Number(s.outstanding).toLocaleString()}`],['Collection Rate',s=>`${s.collectionRate}%`],['Monthly Plan',s=>`KES ${s.monthlyPlan.toLocaleString()}`],['Biometric Taps',s=>s.biometricTaps],['Bus Trips',s=>s.busTrips]].map(([label,fn]:any,i) => (
                        <tr key={i} className="border-b"><td className="py-2 text-xs font-medium text-muted-foreground">{label}</td>{compare.schools.map((s:any) => <td key={s.id} className="py-2 text-center text-xs">{fn(s)}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* BULK */}
      {tab === 'bulk' && health && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Bulk Operations</CardTitle><CardDescription className="text-xs">Select schools and an action to apply to all at once</CardDescription></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Select value={bulkAction} onValueChange={setBulkAction}><SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger><SelectContent>
                  <SelectItem value="suspend">Suspend All Selected</SelectItem>
                  <SelectItem value="activate">Activate All Selected</SelectItem>
                  <SelectItem value="upgrade">Upgrade All to Standard</SelectItem>
                  <SelectItem value="extend_trial">Extend Trial 30 Days</SelectItem>
                </SelectContent></Select>
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleBulk} disabled={busy || selectedSchools.length === 0}>
                  {busy ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Zap className="mr-1.5 h-4 w-4" />}
                  Apply to {selectedSchools.length} schools
                </Button>
              </div>
              <ScrollArea className="h-[400px] pr-4"><div className="space-y-1">
                {health.schools?.map((s:any) => (
                  <label key={s.id} className="flex items-center gap-2 rounded border p-2 cursor-pointer hover:bg-muted/50">
                    <Checkbox checked={selectedSchools.includes(s.id)} onCheckedChange={(c) => { if (c) setSelectedSchools([...selectedSchools, s.id]); else setSelectedSchools(selectedSchools.filter(id => id !== s.id)) }} />
                    <span className="text-sm">{s.name}</span>
                    <Badge variant="outline" className={`ml-auto text-[10px] ${s.health==='healthy'?'border-emerald-400 text-emerald-700':s.health==='warning'?'border-amber-400 text-amber-700':'border-rose-400 text-rose-700'}`}>{s.status}</Badge>
                  </label>
                ))}
              </div></ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AUDIT */}
      {tab === 'audit' && audit && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4 text-emerald-600" /> Audit Log</CardTitle><CardDescription className="text-xs">All platform actions — payments, system events, super admin changes</CardDescription></CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4"><div className="space-y-2">
                {audit.logs?.map((l:any,i:number) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border p-2.5">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${l.type==='payment'?'bg-emerald-100 text-emerald-600 dark:bg-emerald-950':'bg-blue-100 text-blue-600 dark:bg-blue-950'}`}>
                      {l.type==='payment'?<DollarSign className="h-3.5 w-3.5" />:<Activity className="h-3.5 w-3.5" />}
                    </div>
                    <div className="min-w-0 flex-1"><p className="text-sm font-medium">{l.action || l.entity}</p><p className="truncate text-xs text-muted-foreground">{l.details || l.method} · {l.schoolName || '—'}</p></div>
                    <div className="text-right shrink-0"><p className="text-[10px] text-muted-foreground">{l.userName || '—'}</p><p className="text-[10px] text-muted-foreground tabular-nums">{l.createdAt ? new Date(l.createdAt).toLocaleString('en-KE',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',hour12:true}) : '—'}</p></div>
                  </div>
                ))}
                {(!audit.logs || audit.logs.length === 0) && <p className="py-8 text-center text-sm text-muted-foreground">No audit entries.</p>}
              </div></ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, icon: Icon, accent, sub }: { label: string; value: any; icon: any; accent: string; sub: string }) {
  const colors: Record<string, string> = { emerald:'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400', teal:'bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400', amber:'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400', rose:'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400', cyan:'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400', violet:'bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400' }
  return <Card><CardContent className="p-4"><div className="flex items-center justify-between"><div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold tabular-nums">{value}</p><p className="text-[10px] text-muted-foreground">{sub}</p></div><div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[accent]||colors.emerald}`}><Icon className="h-5 w-5" /></div></div></CardContent></Card>
}
