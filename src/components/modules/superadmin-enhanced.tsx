'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  TrendingUp, Clock, AlertTriangle, CheckCircle2, Loader2, Users,
  DollarSign, School, Zap, Crown, Activity, User, FileText, Fingerprint,
  Bell, Bus, Building2, Rocket,
} from 'lucide-react'

const PLAN_COLORS: Record<string, string> = {
  Starter: '#3b82f6', Standard: '#10b981', Premium: '#f59e0b', Enterprise: '#8b5cf6',
}

export function SuperAdminEnhanced() {
  const [tab, setTab] = useState<'trials' | 'platform' | 'activity'>('platform')
  const [trials, setTrials] = useState<any>(null)
  const [platform, setPlatform] = useState<any>(null)
  const [activity, setActivity] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/superadmin/trials').then(r => r.json()).catch(() => ({})),
      fetch('/api/superadmin/platform-stats').then(r => r.json()).catch(() => ({})),
      fetch('/api/superadmin/activity').then(r => r.json()).catch(() => ({})),
    ]).then(([t, p, a]) => {
      setTrials(t); setPlatform(p); setActivity(a); setLoading(false)
    })
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>

  return (
    <div className="space-y-6">
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Crown className="h-6 w-6 text-amber-600" /> Platform Insights
        </h2>
        <p className="text-sm text-muted-foreground">Trial conversions, platform-wide analytics & cross-school activity</p>
      </div>

      {/* Tab selector */}
      <div className="flex flex-wrap gap-2">
        {[
          { k: 'platform', l: 'Platform Analytics', i: TrendingUp },
          { k: 'trials', l: 'Trial Conversions', i: Clock },
          { k: 'activity', l: 'Activity Feed', i: Activity },
        ].map(t => (
          <Button key={t.k} variant={tab === t.k ? 'default' : 'outline'} size="sm"
            className={tab === t.k ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
            onClick={() => setTab(t.k as any)}>
            <t.i className="mr-1.5 h-4 w-4" /> {t.l}
          </Button>
        ))}
      </div>

      {/* Platform Analytics Tab */}
      {tab === 'platform' && platform && (
        <div className="space-y-6">
          {/* Totals */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard label="Total Schools" value={platform.totals?.schools || 0} icon={School} accent="emerald" sub={`${platform.totals?.activeSchools || 0} active`} />
            <StatCard label="Total Students" value={platform.totals?.students || 0} icon={Users} accent="teal" sub={`avg ${platform.averages?.avgStudentsPerSchool || 0}/school`} />
            <StatCard label="Total Revenue" value={`KES ${(platform.totals?.totalRevenue || 0).toLocaleString()}`} icon={DollarSign} accent="amber" sub={`avg KES ${(platform.averages?.avgRevenuePerSchool || 0).toLocaleString()}/school`} />
            <StatCard label="Collection Rate" value={`${platform.averages?.collectionRate || 0}%`} icon={Zap} accent="cyan" sub="of total billed" />
            <StatCard label="Total Users" value={platform.totals?.users || 0} icon={Building2} accent="violet" sub={`avg ${platform.averages?.avgUsersPerSchool || 0}/school`} />
          </div>

          {/* Revenue + Student Growth Chart */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Revenue Growth (12 months)</CardTitle><CardDescription className="text-xs">Total payments received per month</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={platform.monthlyData?.map((m: any) => ({ month: m.month, revenue: m.revenue })) || []}>
                    <defs><linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} formatter={(v: any) => [`KES ${Number(v).toLocaleString()}`, 'Revenue']} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Student Admissions (12 months)</CardTitle><CardDescription className="text-xs">New students enrolled per month</CardDescription></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={platform.monthlyData?.map((m: any) => ({ month: m.month, students: m.newStudents, schools: m.newSchools })) || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="students" fill="#10b981" radius={[4, 4, 0, 0]} name="New Students" />
                    <Bar dataKey="schools" fill="#3b82f6" radius={[4, 4, 0, 0]} name="New Schools" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Plan Distribution + Top Schools */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Plan Distribution & Revenue</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={platform.planDistribution?.map((p: any) => ({ name: p.plan, value: p.count, revenue: p.revenue })) || []} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(entry: any) => `${entry.name}: ${entry.value}`}>
                      {platform.planDistribution?.map((p: any, i: number) => <Cell key={i} fill={PLAN_COLORS[p.plan] || '#94a3b8'} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Top Performing Schools</CardTitle><CardDescription className="text-xs">By total revenue</CardDescription></CardHeader>
              <CardContent>
                <ScrollArea className="h-[250px] pr-4">
                  <div className="space-y-2">
                    {platform.topSchools?.map((s: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 rounded-lg border p-2">
                        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-muted text-muted-foreground'}`}>{i + 1}</div>
                        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.studentCount} students · {s.activeUsers7d} active users (7d)</p></div>
                        <div className="text-right"><p className="text-sm font-bold tabular-nums text-emerald-600">KES {s.revenue.toLocaleString()}</p><Badge variant="outline" className="text-[10px]">{s.plan}</Badge></div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Trial Conversions Tab */}
      {tab === 'trials' && trials && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Active Trials" value={trials.summary?.activeTrials || 0} icon={Clock} accent="teal" sub="currently in trial" />
            <StatCard label="Expiring ≤7 days" value={trials.summary?.expiringSoon || 0} icon={AlertTriangle} accent="amber" sub="need follow-up" />
            <StatCard label="Conversion Rate" value={`${trials.summary?.conversionRate || 0}%`} icon={TrendingUp} accent="emerald" sub={`${trials.summary?.converted || 0} of ${trials.summary?.totalSchools || 0} converted`} />
            <StatCard label="Revenue at Risk" value={`KES ${(trials.summary?.revenueAtRisk || 0).toLocaleString()}`} icon={DollarSign} accent="rose" sub="from expiring trials" />
          </div>

          {/* Conversion Trend */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Monthly Trial Conversions</CardTitle><CardDescription className="text-xs">Trials started vs converted per month</CardDescription></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={trials.monthlyConversions || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="trials" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Trials Started" />
                  <Bar dataKey="converted" fill="#10b981" radius={[4, 4, 0, 0]} name="Converted to Paid" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Trial Schools List */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Trial Schools</CardTitle><CardDescription className="text-xs">Sorted by days remaining (most urgent first)</CardDescription></CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {trials.trials?.map((t: any, i: number) => {
                    const urgencyColors: Record<string, string> = {
                      critical: 'border-rose-300 bg-rose-50/50 dark:bg-rose-950/20',
                      urgent: 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20',
                      ok: 'border-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/20',
                      expired: 'border-slate-300 bg-slate-50/50 dark:bg-slate-950/20',
                    }
                    const urgencyLabels: Record<string, string> = { critical: '🔴 ≤3 days', urgent: '🟡 ≤7 days', ok: '🟢 Active', expired: '⚫ Expired' }
                    return (
                      <div key={i} className={`flex items-center gap-3 rounded-lg border p-3 ${urgencyColors[t.urgency] || ''}`}>
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-semibold text-white">{t.name?.[0] || 'S'}</div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{t.name}</p>
                          <p className="text-xs text-muted-foreground">{t.studentCount} students · {t.userCount} users · {t.plan}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className={`text-[10px] ${t.urgency === 'critical' ? 'border-rose-400 text-rose-700' : t.urgency === 'urgent' ? 'border-amber-400 text-amber-700' : t.urgency === 'expired' ? 'border-slate-400 text-slate-600' : 'border-emerald-400 text-emerald-700'}`}>
                            {t.daysLeft > 0 ? `${t.daysLeft} days left` : 'Expired'}
                          </Badge>
                          <p className="mt-0.5 text-[10px] text-muted-foreground">{urgencyLabels[t.urgency]}</p>
                        </div>
                      </div>
                    )
                  })}
                  {(!trials.trials || trials.trials.length === 0) && <p className="py-8 text-center text-sm text-muted-foreground">No trial schools.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Activity Feed Tab */}
      {tab === 'activity' && activity && (
        <div className="space-y-6">
          {/* Breakdown */}
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: 'Payments', count: activity.breakdown?.payments || 0, icon: DollarSign, color: 'text-emerald-600' },
              { label: 'Admissions', count: activity.breakdown?.admissions || 0, icon: User, color: 'text-blue-600' },
              { label: 'Invoices', count: activity.breakdown?.invoices || 0, icon: FileText, color: 'text-amber-600' },
              { label: 'Biometric', count: activity.breakdown?.biometric || 0, icon: Fingerprint, color: 'text-violet-600' },
              { label: 'Notifications', count: activity.breakdown?.notifications || 0, icon: Bell, color: 'text-rose-600' },
              { label: 'Bus Trips', count: activity.breakdown?.trips || 0, icon: Bus, color: 'text-cyan-600' },
            ].map(b => (
              <Card key={b.label}><CardContent className="p-3 flex flex-col items-center gap-1">
                <b.icon className={`h-5 w-5 ${b.color}`} />
                <p className="text-lg font-bold tabular-nums">{b.count}</p>
                <p className="text-[10px] text-muted-foreground">{b.label}</p>
              </CardContent></Card>
            ))}
          </div>

          {/* Activity Timeline */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Activity className="h-4 w-4 text-emerald-600" /> Cross-School Activity Feed</CardTitle><CardDescription className="text-xs">Real-time events across all schools (newest first)</CardDescription></CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-2">
                  {activity.events?.map((e: any, i: number) => {
                    const iconMap: Record<string, any> = {
                      payment: DollarSign, admission: User, invoice: FileText,
                      biometric: Fingerprint, notification: Bell, bus: Bus,
                    }
                    const colorMap: Record<string, string> = {
                      payment: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950',
                      admission: 'bg-blue-50 text-blue-600 dark:bg-blue-950',
                      invoice: 'bg-amber-50 text-amber-600 dark:bg-amber-950',
                      biometric: 'bg-violet-50 text-violet-600 dark:bg-violet-950',
                      notification: 'bg-rose-50 text-rose-600 dark:bg-rose-950',
                      bus: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950',
                    }
                    const Icon = iconMap[e.type] || Activity
                    return (
                      <div key={i} className="flex items-center gap-3 rounded-lg border p-3 hover:bg-muted/50">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${colorMap[e.type] || 'bg-muted'}`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium">{e.title}</p>
                          <p className="truncate text-xs text-muted-foreground">{e.desc}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-muted-foreground">{e.schoolName}</p>
                          <p className="text-[10px] text-muted-foreground tabular-nums">
                            {e.timestamp ? new Date(e.timestamp).toLocaleString('en-KE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }) : '—'}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  {(!activity.events || activity.events.length === 0) && <p className="py-8 text-center text-sm text-muted-foreground">No recent activity.</p>}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent, sub }: { label: string; value: any; icon: any; accent: string; sub: string }) {
  const colors: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400',
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400',
  }
  return (
    <Card><CardContent className="p-4">
      <div className="flex items-center justify-between">
        <div><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold tabular-nums">{value}</p><p className="text-[10px] text-muted-foreground">{sub}</p></div>
        <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${colors[accent] || colors.emerald}`}><Icon className="h-5 w-5" /></div>
      </div>
    </CardContent></Card>
  )
}
