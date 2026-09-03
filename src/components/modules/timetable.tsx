'use client'
import { useState } from 'react'
import { useFetch, apiPost, apiDelete } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import {
  Calendar, Plus, Clock, MapPin, Trash2, Loader2, GraduationCap, BookOpen, X, ChevronRight,
} from 'lucide-react'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const PERIODS = [
  { start: '07:30', end: '08:10', label: 'P1' },
  { start: '08:10', end: '08:50', label: 'P2' },
  { start: '08:50', end: '09:30', label: 'P3' },
  { start: '09:30', end: '09:45', label: 'Break' },
  { start: '09:45', end: '10:25', label: 'P4' },
  { start: '10:25', end: '11:05', label: 'P5' },
  { start: '11:05', end: '11:45', label: 'P6' },
  { start: '11:45', end: '12:25', label: 'P7' },
  { start: '12:25', end: '13:40', label: 'Lunch' },
  { start: '13:40', end: '14:20', label: 'P8' },
  { start: '14:20', end: '15:00', label: 'P9' },
  { start: '15:00', end: '15:40', label: 'P10' },
]

interface TimetableEntry {
  id: string
  streamId: string
  subjectId: string
  teacherId: string | null
  dayOfWeek: string
  startTime: string
  endTime: string
  room: string | null
  subject: { id: string; name: string; code: string; category: string }
  teacher: { id: string; firstName: string; lastName: string } | null
  stream: { id: string; name: string }
}

const SUBJECT_COLORS = [
  'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800',
  'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800',
  'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800',
  'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
  'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-800',
  'bg-lime-100 text-lime-800 border-lime-300 dark:bg-lime-950 dark:text-lime-300 dark:border-lime-800',
]

function getSubjectColor(subjectName: string): string {
  let hash = 0
  for (let i = 0; i < subjectName.length; i++) {
    hash = subjectName.charCodeAt(i) + ((hash << 5) - hash)
  }
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length]
}

export function TimetableModule() {
  const [selectedStream, setSelectedStream] = useState<string>('all')
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addDay, setAddDay] = useState<string>('')
  const [addStart, setAddStart] = useState<string>('')

  const { data, loading, refetch } = useFetch<{ entries: TimetableEntry[]; streams: any[]; subjects: any[]; teachers: any[] }>(
    '/api/timetable'
  )

  const { data: streamData } = useFetch<{ streams: any[] }>('/api/academics/streams')
  const streams = streamData?.streams || data?.streams || []

  const entries = (data?.entries || []).filter(e => selectedStream === 'all' || e.streamId === selectedStream)

  const handleAdd = async (entryData: any) => {
    try {
      await apiPost('/api/timetable', entryData)
      toast.success('Lesson added to timetable')
      setAddDialogOpen(false)
      refetch()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add lesson')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await apiDelete(`/api/timetable/${id}`)
      toast.success('Lesson removed')
      refetch()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to remove lesson')
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  // Build a grid: [day][period] = entry
  const grid: Record<string, Record<string, TimetableEntry | null>> = {}
  for (const day of DAYS) {
    grid[day] = {}
    for (const p of PERIODS) {
      grid[day][p.start] = entries.find(e => e.dayOfWeek === day && e.startTime === p.start) || null
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Timetable</h2>
          <p className="text-sm text-muted-foreground">Weekly class schedule for all streams</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedStream} onValueChange={setSelectedStream}>
            <SelectTrigger className="w-[200px]"><SelectValue placeholder="All classes" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {streams.map((s: any) => (
                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setAddDialogOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="h-4 w-4" /> Add Lesson
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Total Lessons</div><div className="text-xl font-bold">{entries.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Classes</div><div className="text-xl font-bold">{streams.length}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Subjects</div><div className="text-xl font-bold">{data?.subjects?.length || 0}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Teachers</div><div className="text-xl font-bold">{data?.teachers?.length || 0}</div></CardContent></Card>
      </div>

      {/* Timetable Grid */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="sticky left-0 z-10 min-w-[100px] border-r bg-muted/50 p-2 text-left text-xs font-semibold">Time</th>
                  {DAYS.map(day => (
                    <th key={day} className="min-w-[140px] border-r p-2 text-center text-xs font-semibold">{day}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map(period => (
                  <tr key={period.label} className={cn('border-b', period.label === 'Break' || period.label === 'Lunch') && 'bg-muted/30'}>
                    <td className="sticky left-0 z-10 border-r bg-background p-2">
                      <div className="text-xs font-semibold">{period.label}</div>
                      <div className="text-[10px] text-muted-foreground">{period.start} - {period.end}</div>
                    </td>
                    {DAYS.map(day => {
                      const entry = grid[day]?.[period.start]
                      if (period.label === 'Break' || period.label === 'Lunch') {
                        return <td key={day} className="border-r p-2 text-center text-xs text-muted-foreground">{period.label}</td>
                      }
                      return (
                        <td key={day} className="border-r p-1.5 align-top">
                          {entry ? (
                            <div
                              className={cn('group relative rounded-lg border p-2 text-xs transition-all hover:shadow-md', getSubjectColor(entry.subject.name))}
                              title={`${entry.subject.name} - ${entry.teacher ? `${entry.teacher.firstName} ${entry.teacher.lastName}` : 'No teacher'}`}
                            >
                              <div className="font-semibold">{entry.subject.code}</div>
                              <div className="text-[10px] opacity-80">{entry.subject.name}</div>
                              {entry.teacher && (
                                <div className="mt-0.5 text-[10px] opacity-70">{entry.teacher.firstName.charAt(0)}. {entry.teacher.lastName}</div>
                              )}
                              {entry.room && (
                                <div className="mt-0.5 flex items-center gap-0.5 text-[9px] opacity-60"><MapPin className="h-2.5 w-2.5" />{entry.room}</div>
                              )}
                              <button
                                onClick={() => handleDelete(entry.id)}
                                className="absolute right-1 top-1 hidden h-4 w-4 items-center justify-center rounded bg-black/10 text-black/60 hover:bg-black/20 group-hover:flex"
                                title="Remove lesson"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setAddDay(day); setAddStart(period.start); setAddDialogOpen(true) }}
                              className="flex h-full min-h-[60px] w-full items-center justify-center rounded-lg border border-dashed border-border text-muted-foreground/50 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/10"
                            >
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Lesson Dialog */}
      {addDialogOpen && (
        <AddLessonDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          streams={streams}
          subjects={data?.subjects || []}
          teachers={data?.teachers || []}
          defaultDay={addDay}
          defaultStart={addStart}
          onAdd={handleAdd}
        />
      )}
    </div>
  )
}

function AddLessonDialog({ open, onOpenChange, streams, subjects, teachers, defaultDay, defaultStart, onAdd }: {
  open: boolean
  onOpenChange: (o: boolean) => void
  streams: any[]
  subjects: any[]
  teachers: any[]
  defaultDay: string
  defaultStart: string
  onAdd: (data: any) => void
}) {
  const [streamId, setStreamId] = useState<string>('')
  const [subjectId, setSubjectId] = useState<string>('')
  const [teacherId, setTeacherId] = useState<string>('')
  const [day, setDay] = useState<string>(defaultDay || 'Monday')
  const [startTime, setStartTime] = useState<string>(defaultStart || '07:30')
  const [endTime, setEndTime] = useState<string>('08:10')
  const [room, setRoom] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    if (!streamId || !subjectId) { toast.error('Please select a class and subject'); return }
    setSaving(true)
    await onAdd({
      streamId, subjectId, teacherId: teacherId || null,
      dayOfWeek: day, startTime, endTime, room: room || null,
    })
    setSaving(false)
  }

  // Find the end time for the selected start time
  const handleStartTimeChange = (time: string) => {
    setStartTime(time)
    const period = PERIODS.find(p => p.start === time)
    if (period) setEndTime(period.end)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-emerald-600" /> Add Lesson
          </DialogTitle>
          <DialogDescription>Schedule a lesson in the weekly timetable</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Class / Stream *</Label>
            <Select value={streamId} onValueChange={setStreamId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
              <SelectContent>
                {streams.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Subject *</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Teacher</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Assign teacher (optional)" /></SelectTrigger>
              <SelectContent>
                {teachers.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.firstName} {t.lastName} - {t.specialization || 'Teacher'}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label className="text-xs">Day</Label>
              <Select value={day} onValueChange={setDay}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DAYS.map(d => <SelectItem key={d} value={d}>{d.slice(0, 3)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Start</Label>
              <Select value={startTime} onValueChange={handleStartTimeChange}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PERIODS.filter(p => p.label !== 'Break' && p.label !== 'Lunch').map(p => (
                    <SelectItem key={p.start} value={p.start}>{p.start}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">End</Label>
              <Input value={endTime} onChange={e => setEndTime(e.target.value)} className="mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs">Room (optional)</Label>
            <Input value={room} onChange={e => setRoom(e.target.value)} placeholder="e.g. Room 12, Lab 1" className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Add Lesson
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
