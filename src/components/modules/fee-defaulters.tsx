'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { AlertTriangle, Search, Send, TrendingDown, Users, DollarSign } from 'lucide-react'

export function FeeDefaulterDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/fee-defaulters').then(r => r.json()).then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500/20 border-t-emerald-600" /></div>

  const defaulters = (data?.defaulters || []).filter((d: any) => !search || d.lastName?.toLowerCase().includes(search.toLowerCase()) || d.admissionNo?.includes(search))

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-6 w-6 text-rose-500" />
        <h1 className="text-2xl font-bold">Fee Defaulters</h1>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><Users className="h-5 w-5 text-rose-500" /><div><p className="text-2xl font-bold">{data?.count || 0}</p><p className="text-xs text-muted-foreground">Students with arrears</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-amber-500" /><div><p className="text-2xl font-bold">KES {(data?.totalOutstanding || 0).toLocaleString()}</p><p className="text-xs text-muted-foreground">Total outstanding</p></div></div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="flex items-center gap-2"><TrendingDown className="h-5 w-5 text-rose-500" /><div><p className="text-2xl font-bold">{defaulters.length > 0 ? Math.round((data?.totalOutstanding || 0) / defaulters.length).toLocaleString() : 0}</p><p className="text-xs text-muted-foreground">Average per student</p></div></div></CardContent></Card>
      </div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search by name or admission no..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
      </div>
      {defaulters.length === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center py-12 text-center"><CheckCircle className="h-12 w-12 text-emerald-500" /><p className="mt-2 font-semibold">No fee defaulters! 🎉</p><p className="text-sm text-muted-foreground">All students have cleared their fees.</p></CardContent></Card>
      ) : (
        <Card><CardContent className="p-0 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b bg-muted/40"><th className="p-3 text-left text-xs font-medium">Student</th><th className="p-3 text-left text-xs font-medium">Class</th><th className="p-3 text-right text-xs font-medium">Balance</th><th className="p-3 text-left text-xs font-medium">Guardian</th><th className="p-3 text-center text-xs font-medium">Action</th></tr></thead>
          <tbody>{defaulters.map((d: any, i: number) => (
            <tr key={i} className="border-b hover:bg-muted/20">
              <td className="p-3"><p className="font-medium">{d.firstName} {d.lastName}</p><p className="text-xs text-muted-foreground">{d.admissionNo}</p></td>
              <td className="p-3 text-xs">{d.className || '-'}</td>
              <td className="p-3 text-right"><span className="font-bold text-rose-600">KES {Number(d.totalBalance).toLocaleString()}</span></td>
              <td className="p-3 text-xs">{d.guardianFirstName} {d.guardianLastName}<br /><span className="text-muted-foreground">{d.guardianPhone || 'No phone'}</span></td>
              <td className="p-3 text-center"><Button size="sm" variant="outline" onClick={() => { fetch('/api/sms/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ to: d.guardianPhone, message: `Dear Parent, ${d.firstName} has an outstanding fee balance of KES ${Number(d.totalBalance).toLocaleString()}. Please clear before ${d.oldestDueDate ? new Date(d.oldestDueDate).toLocaleDateString() : 'end of term'}. Pay via M-Pesa Paybill 522522.` }) }).then(() => alert('Reminder sent!')) }}><Send className="mr-1 h-3 w-3" /> Remind</Button></td>
            </tr>
          ))}</tbody>
        </table></CardContent></Card>
      )}
    </div>
  )
}
import { CheckCircle } from 'lucide-react'
