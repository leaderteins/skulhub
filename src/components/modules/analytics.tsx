'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, LineChart, Line } from 'recharts'
import { TrendingUp, DollarSign, GraduationCap, Users, AlertTriangle, Loader2, Activity, Award, Clock } from 'lucide-react'

interface Data {
  enrollment: { historical: Array<{year:number;count:number}>; projection: Array<{year:number;count:number;projected:boolean}> }
  revenue: { historical: Array<{month:string;revenue:number}>; projection: Array<{month:string;revenue:number;projected:boolean}> }
  progression: Array<{term:string;year:string;avgMarks:number;studentCount:number}>
  staffWorkload: Array<{name:string;role:string;subjects:number;classes:number;weeklySlots:number}>
  dropoutRisk: { summary: {critical:number;high:number;medium:number;low:number}; students: Array<{id:string;firstname:string;lastname:string;admissionno:string;attendance_rate:number;avg_marks:number;risk_level:string}> }
}

export function AnalyticsModule() {
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)
  useEffect(() => { fetch('/api/analytics/forecasting').then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false)) }, [])
  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
  if (!data) return <Card><CardContent className="py-16 text-center"><p className="text-sm text-muted-foreground">No analytics data available</p></CardContent></Card>

  const enrollmentData = [...data.enrollment.historical.map(e => ({ year: String(e.year), count: e.count })), ...data.enrollment.projection.map(e => ({ year: String(e.year), count: e.count }))]
  const revenueData = [...data.revenue.historical.map(r => ({ month: r.month, revenue: r.revenue })), ...data.revenue.projection.map(r => ({ month: r.month, revenue: r.revenue }))]
  const riskColors: Record<string, string> = { Critical: '#dc2626', High: '#f97316', Medium: '#f59e0b', Low: '#16a34a' }

  return (
    <div className="space-y-6">
      <div><h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><TrendingUp className="h-6 w-6 text-emerald-600" /> Analytics &amp; Forecasting</h2><p className="text-sm text-muted-foreground">Enrollment trends, revenue projections, student progression &amp; dropout risk</p></div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Total Enrollment</p><p className="mt-1 text-2xl font-bold">{data.enrollment.historical.reduce((s,e) => s + e.count, 0)}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"><Users className="h-5 w-5" /></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs text-muted-foreground">5-Year Projection</p><p className="mt-1 text-2xl font-bold">{data.enrollment.projection[0]?.count || 0}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50 text-teal-600 dark:bg-teal-950/30"><TrendingUp className="h-5 w-5" /></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs text-muted-foreground">At-Risk Students</p><p className="mt-1 text-2xl font-bold">{data.dropoutRisk.summary.critical + data.dropoutRisk.summary.high}</p></div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/30"><AlertTriangle className="h-5 w-5" /></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center justify-between"><div><p className="text-xs text-muted-foreground">Avg Attendance</p><p className="mt-1 text-2xl font-bold">{Math.round(data.dropoutRisk.students.reduce((s,st) => s + (st.attendance_rate || 0), 0) / Math.max(data.dropoutRisk.students.length, 1))}%</p></div><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30"><Activity className="h-5 w-5" /></div></CardContent></Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">Enrollment Trends (5-Year Projection)</CardTitle><CardDescription className="text-xs">Historical + linear regression</CardDescription></CardHeader><CardContent><ResponsiveContainer width="100%" height={280}><AreaChart data={enrollmentData}><defs><linearGradient id="enr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.3} /><stop offset="95%" stopColor="#10b981" stopOpacity={0} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" /><XAxis dataKey="year" tick={{fontSize:11}} /><YAxis tick={{fontSize:11}} /><Tooltip contentStyle={{borderRadius:12,fontSize:12}} /><Area type="monotone" dataKey="count" stroke="#10b981" strokeWidth={2} fill="url(#enr)" /></AreaChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">Revenue Forecasting</CardTitle><CardDescription className="text-xs">6-month projection</CardDescription></CardHeader><CardContent><ResponsiveContainer width="100%" height={280}><LineChart data={revenueData}><CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" /><XAxis dataKey="month" tick={{fontSize:10}} /><YAxis tick={{fontSize:10}} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} /><Tooltip contentStyle={{borderRadius:12,fontSize:12}} formatter={(v:any) => [`KES ${Number(v).toLocaleString()}`, 'Revenue']} /><Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} dot={{r:3}} /></LineChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">Student Progression</CardTitle><CardDescription className="text-xs">Term-over-term avg marks</CardDescription></CardHeader><CardContent><ResponsiveContainer width="100%" height={280}><BarChart data={data.progression.map(p => ({term:`${p.term} ${p.year}`,marks:p.avgMarks}))}><CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} /><XAxis dataKey="term" tick={{fontSize:10}} /><YAxis tick={{fontSize:11}} domain={[0,100]} /><Tooltip contentStyle={{borderRadius:12,fontSize:12}} /><Bar dataKey="marks" fill="#10b981" radius={[6,6,0,0]} /></BarChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">Dropout Risk Prediction</CardTitle><CardDescription className="text-xs">AI-powered risk assessment</CardDescription></CardHeader><CardContent>
          <div className="mb-4 grid grid-cols-4 gap-2">
            {[['Critical',data.dropoutRisk.summary.critical,'#dc2626'],['High',data.dropoutRisk.summary.high,'#f97316'],['Medium',data.dropoutRisk.summary.medium,'#f59e0b'],['Low',data.dropoutRisk.summary.low,'#16a34a']].map(([label,count,color]:any) => (
              <div key={label} className="rounded-lg border p-2 text-center" style={{borderColor:color+'40',background:color+'10'}}><p className="text-xl font-bold" style={{color}}>{count}</p><p className="text-[10px] text-muted-foreground">{label}</p></div>
            ))}
          </div>
          <ScrollArea className="h-[180px] pr-4"><div className="space-y-2">{data.dropoutRisk.students.filter((s:any) => s.risk_level === 'Critical' || s.risk_level === 'High').slice(0,10).map((s:any,i:number) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border p-2"><div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{background:riskColors[s.risk_level]+'20'}}><AlertTriangle className="h-4 w-4" style={{color:riskColors[s.risk_level]}} /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{s.firstname} {s.lastname}</p><p className="text-xs text-muted-foreground">{s.admissionno} · Att: {Math.round(s.attendance_rate)}% · Avg: {Math.round(s.avg_marks)}%</p></div><Badge variant="outline" className="text-[10px]" style={{borderColor:riskColors[s.risk_level],color:riskColors[s.risk_level]}}>{s.risk_level}</Badge></div>
          ))}{data.dropoutRisk.students.filter((s:any) => s.risk_level === 'Critical' || s.risk_level === 'High').length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">No critical or high-risk students 🎉</p>}</div></ScrollArea>
        </CardContent></Card>
      </div>
      <Card><CardHeader className="pb-3"><CardTitle className="text-base">Staff Workload Analytics</CardTitle><CardDescription className="text-xs">Teaching hours, subject distribution</CardDescription></CardHeader><CardContent><ScrollArea className="h-[300px] pr-4"><div className="space-y-2">{data.staffWorkload.map((s,i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3"><div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-semibold text-white">{i+1}</div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{s.name}</p><p className="text-xs text-muted-foreground">{s.role}</p></div><div className="flex gap-4 text-xs"><div className="text-center"><p className="font-bold text-emerald-600">{s.subjects}</p><p className="text-muted-foreground">subjects</p></div><div className="text-center"><p className="font-bold text-cyan-600">{s.classes}</p><p className="text-muted-foreground">classes</p></div><div className="text-center"><p className="font-bold text-amber-600">{s.weeklySlots}</p><p className="text-muted-foreground">slots/wk</p></div></div></div>
      ))}</div></ScrollArea></CardContent></Card>
    </div>
  )
}
