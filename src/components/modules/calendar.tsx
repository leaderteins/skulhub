'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight, Plus, Calendar } from 'lucide-react'

const EVENT_COLORS: Record<string, string> = {
  Academic: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  Sports: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  Holiday: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  Exam: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400',
  Meeting: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  General: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
}

export function SchoolCalendar() {
  const [events, setEvents] = useState<any[]>([])
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/calendar-events').then(r => r.json()).then(d => { setEvents((d?.events || []) || []); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: firstDay + daysInMonth }, (_, i) => i < firstDay ? null : new Date(year, month, i - firstDay + 1))

  const getEventsForDay = (day: Date) => events.filter(e => new Date(e.startDate).toDateString() === day.toDateString())

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-2"><Calendar className="h-6 w-6 text-emerald-600" /><h1 className="text-2xl font-bold">School Calendar</h1></div>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-lg">{currentMonth.toLocaleDateString('en-KE', { month: 'long', year: 'numeric' })}</CardTitle>
          <div className="flex gap-1"><Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}><ChevronLeft className="h-4 w-4" /></Button><Button variant="outline" size="icon" onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}><ChevronRight className="h-4 w-4" /></Button></div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground mb-2">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d}>{d}</div>)}</div>
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, i) => day ? (
              <div key={i} className="min-h-[60px] rounded-lg border p-1 text-xs hover:bg-muted/30">
                <p className="font-medium">{day.getDate()}</p>
                {getEventsForDay(day).map((e, j) => <Badge key={j} className={`mt-0.5 block text-[9px] ${EVENT_COLORS[e.category] || EVENT_COLORS.General}`} variant="secondary">{e.title}</Badge>)}
              </div>
            ) : <div key={i} />)}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
