'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarClock, Clock, CheckCircle } from 'lucide-react'

export function ReportScheduler() {
  const [exams, setExams] = useState<any[]>([])
  const [schedules, setSchedules] = useState<any[]>([])
  const [examId, setExamId] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    fetch('/api/exams').then(r => r.json()).then(d => setExams(d.exams || d || [])).catch(() => {})
    fetch('/api/report-schedule').then(r => r.json()).then(d => setSchedules(d.schedules || [])).catch(() => {})
  }, [])

  const schedule = async () => {
    if (!examId || !date) return
    await fetch('/api/report-schedule', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ examId, scheduledDate: date }) })
    setExamId(''); setDate('')
    fetch('/api/report-schedule').then(r => r.json()).then(d => setSchedules(d.schedules || []))
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-2"><CalendarClock className="h-6 w-6 text-emerald-600" /><h1 className="text-2xl font-bold">Report Card Scheduler</h1></div>
      <Card><CardHeader><CardTitle className="text-base">Schedule Report Card Generation</CardTitle></CardHeader><CardContent className="space-y-3">
        <Select value={examId} onValueChange={setExamId}><SelectTrigger><SelectValue placeholder="Select exam" /></SelectTrigger><SelectContent>{exams.map(e => <SelectItem key={e.id} value={e.id}>{e.name} — {e.term} {e.academicYear}</SelectItem>)}</SelectContent></Select>
        <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Button onClick={schedule} className="bg-emerald-600" disabled={!examId || !date}><CalendarClock className="mr-2 h-4 w-4" /> Schedule Generation</Button>
      </CardContent></Card>
      <div className="space-y-2">{schedules.map((s, i) => <Card key={i}><CardContent className="flex items-center gap-3 p-3"><CheckCircle className="h-5 w-5 text-emerald-600" /><div className="flex-1"><p className="text-sm font-medium">{s.details}</p><p className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleDateString('en-KE')}</p></div></CardContent></Card>)}</div>
    </div>
  )
}
