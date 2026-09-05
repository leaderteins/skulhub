'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { FileText, Award, Receipt, Calendar, Banknote, ExternalLink, Loader2, Search } from 'lucide-react'

export function DocumentsModule() {
  const [students, setStudents] = useState<any[]>([])
  const [staff, setStaff] = useState<any[]>([])
  const [streams, setStreams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState<'transfer' | 'admission' | 'fee' | 'timetable' | 'payslip'>('transfer')

  useEffect(() => {
    Promise.all([
      fetch('/api/students').then(r => r.json()).catch(() => ({ students: [] })),
      fetch('/api/staff').then(r => r.json()).catch(() => ({ staff: [] })),
      fetch('/api/academics').then(r => r.json()).catch(() => ({})),
    ]).then(([stuRes, staffRes, acadRes]) => {
      setStudents(stuRes.students || []); setStaff(staffRes.staff || []); setStreams(acadRes.streams || []); setLoading(false)
    })
  }, [])

  const filtered = students.filter(s => `${s.firstName} ${s.lastName} ${s.admissionNo}`.toLowerCase().includes(search.toLowerCase()))

  function openDoc(endpoint: string, params: Record<string, string>) {
    window.open(`/api/documents/${endpoint}?${new URLSearchParams(params).toString()}`, '_blank')
    toast.success('Document opened', { description: 'Click Print to save as PDF' })
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>

  return (
    <div className="space-y-6">
      <div><h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight"><FileText className="h-6 w-6 text-emerald-600" /> Document Generation</h2><p className="text-sm text-muted-foreground">Generate printable documents with school letterhead &amp; signatures</p></div>
      <div className="flex flex-wrap gap-2">
        {[{k:'transfer',l:'Transfer Certificate',i:Award},{k:'admission',l:'Admission Letter',i:FileText},{k:'fee',l:'Fee Statement',i:Receipt},{k:'timetable',l:'Timetable',i:Calendar},{k:'payslip',l:'Payslip',i:Banknote}].map(t => (
          <Button key={t.k} variant={activeTab === t.k ? 'default' : 'outline'} size="sm" className={activeTab === t.k ? 'bg-emerald-600 hover:bg-emerald-700' : ''} onClick={() => setActiveTab(t.k as any)}><t.i className="mr-1.5 h-4 w-4" /> {t.l}</Button>
        ))}
      </div>
      {(activeTab === 'transfer' || activeTab === 'admission' || activeTab === 'fee') && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">{activeTab === 'transfer' ? 'Transfer Certificate' : activeTab === 'admission' ? 'Admission Letter' : 'Fee Statement'}</CardTitle><CardDescription className="text-xs">Select a student to generate</CardDescription></CardHeader>
          <CardContent>
            <div className="mb-4 relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search student..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" /></div>
            <ScrollArea className="h-[400px] pr-4"><div className="space-y-2">{filtered.slice(0, 50).map(s => (
              <div key={s.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50">
                <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-xs font-semibold text-white">{s.firstName?.[0]}{s.lastName?.[0]}</div><div><p className="text-sm font-medium">{s.firstName} {s.lastName}</p><p className="text-xs text-muted-foreground">{s.admissionNo}</p></div></div>
                <Button size="sm" variant="outline" onClick={() => openDoc(activeTab === 'transfer' ? 'transfer-certificate' : activeTab === 'admission' ? 'admission-letter' : 'fee-statement', { studentId: s.id })}><ExternalLink className="mr-1 h-3.5 w-3.5" /> Generate</Button>
              </div>))}</div></ScrollArea>
          </CardContent>
        </Card>
      )}
      {activeTab === 'timetable' && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Timetable PDF</CardTitle><CardDescription className="text-xs">Select a stream</CardDescription></CardHeader>
          <CardContent><ScrollArea className="h-[400px] pr-4"><div className="space-y-2">{streams.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No streams available.</p> : streams.map(s => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"><p className="text-sm font-medium">{s.name}</p><Button size="sm" variant="outline" onClick={() => openDoc('timetable-pdf', { streamId: s.id })}><ExternalLink className="mr-1 h-3.5 w-3.5" /> Generate</Button></div>
          ))}</div></ScrollArea></CardContent>
        </Card>
      )}
      {activeTab === 'payslip' && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Staff Payslip</CardTitle><CardDescription className="text-xs">Select a staff member</CardDescription></CardHeader>
          <CardContent><ScrollArea className="h-[400px] pr-4"><div className="space-y-2">{staff.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">No staff available.</p> : staff.slice(0, 50).map(s => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-xs font-semibold text-white">{s.firstName?.[0]}{s.lastName?.[0]}</div><div><p className="text-sm font-medium">{s.firstName} {s.lastName}</p><p className="text-xs text-muted-foreground">{s.role}</p></div></div><Button size="sm" variant="outline" onClick={() => openDoc('payslip', { staffId: s.id })}><ExternalLink className="mr-1 h-3.5 w-3.5" /> Generate</Button></div>
          ))}</div></ScrollArea></CardContent>
        </Card>
      )}
    </div>
  )
}
