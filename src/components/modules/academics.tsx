'use client'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useFetch, apiPost } from '@/lib/api'
import { cn, formatNumber, formatDate, gradeColor } from '@/lib/format'
import { StatCard, SectionHeader, EmptyState } from '@/components/shared'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel,
} from '@/components/ui/select'
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from '@/components/ui/table'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'
import {
  GraduationCap, BookOpen, Layers, CalendarRange, Search,
  Plus, MapPin, User, Trophy, Filter, School, BarChart3, Award, TrendingUp, ClipboardList,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface StreamInfo {
  id: string
  name: string
  capacity: number
  studentCount: number
  classTeacher: { id: string; name: string; employeeNo: string } | null
}
interface ClassLevelInfo {
  id: string
  name: string
  stage: string
  order: number
  capacity: number
  streamCount: number
  studentCount: number
  streams: StreamInfo[]
}
interface SubjectInfo {
  id: string
  name: string
  code: string
  category: string
  department: { id: string; name: string } | null
  classesAssigned: number
  timetableSlots: number
  gradesRecorded: number
}
interface ExamInfo {
  id: string
  name: string
  academicYear: string
  term: string
  examType: string
  startDate: string
  endDate: string | null
  gradesCount: number
}
interface AcademicsData {
  stats: {
    totalClassLevels: number
    totalStreams: number
    totalSubjects: number
    totalExams: number
    totalStudents: number
    totalGrades: number
    avgPerformance: number
  }
  classLevels: ClassLevelInfo[]
  subjects: SubjectInfo[]
  subjectCategories: { category: string; count: number }[]
  exams: ExamInfo[]
}

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
  teacher: { id: string; name: string; employeeNo: string } | null
}
interface TimetableData { entries: TimetableEntry[] }

interface GradeStats {
  examId: string
  streamId: string | null
  totalGrades: number
  averageMarks: number
  totalPoints: number
  gradeDistribution: { grade: string; count: number }[]
  subjectPerformance: {
    subjectId: string
    subjectName: string
    subjectCode: string
    avgMarks: number
    count: number
  }[]
  topPerformers: {
    rank: number
    studentId: string
    studentName: string
    admissionNo: string
    stream: string
    totalMarks: number
    meanMarks: number
    totalPoints: number
    subjectsCount: number
    meanGrade: string
  }[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const PERIODS = [
  { start: '08:00', end: '08:40', label: '08:00 — 08:40', note: 'Period 1' },
  { start: '08:40', end: '09:20', label: '08:40 — 09:20', note: 'Period 2' },
  { start: '09:20', end: '10:00', label: '09:20 — 10:00', note: 'Period 3' },
  { start: '10:30', end: '11:10', label: '10:30 — 11:10', note: 'Period 4' },
  { start: '11:10', end: '11:50', label: '11:10 — 11:50', note: 'Period 5' },
  { start: '11:50', end: '12:30', label: '11:50 — 12:30', note: 'Period 6' },
  { start: '14:00', end: '14:40', label: '14:00 — 14:40', note: 'Period 7' },
  { start: '14:40', end: '15:20', label: '14:40 — 15:20', note: 'Period 8' },
  { start: '15:20', end: '16:00', label: '15:20 — 16:00', note: 'Period 9' },
]

// Subject color palette (emerald/teal/amber/rose/cyan/violet tints)
const SUBJECT_PALETTE = [
  { tint: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-l-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', chip: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300', dot: '#10b981' },
  { tint: 'bg-teal-50 dark:bg-teal-950/40', border: 'border-l-teal-500', text: 'text-teal-700 dark:text-teal-400', chip: 'bg-teal-100 text-teal-700 dark:bg-teal-900/60 dark:text-teal-300', dot: '#14b8a6' },
  { tint: 'bg-amber-50 dark:bg-amber-950/40', border: 'border-l-amber-500', text: 'text-amber-700 dark:text-amber-400', chip: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-300', dot: '#f59e0b' },
  { tint: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-l-rose-500', text: 'text-rose-700 dark:text-rose-400', chip: 'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300', dot: '#f43f5e' },
  { tint: 'bg-cyan-50 dark:bg-cyan-950/40', border: 'border-l-cyan-500', text: 'text-cyan-700 dark:text-cyan-400', chip: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/60 dark:text-cyan-300', dot: '#06b6d4' },
  { tint: 'bg-violet-50 dark:bg-violet-950/40', border: 'border-l-violet-500', text: 'text-violet-700 dark:text-violet-400', chip: 'bg-violet-100 text-violet-700 dark:bg-violet-900/60 dark:text-violet-300', dot: '#8b5cf6' },
]

const CATEGORY_BADGE: Record<string, string> = {
  Core: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900',
  Optional: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-200 dark:border-amber-900',
  'Co-curricular': 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400 border-violet-200 dark:border-violet-900',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function useSubjectColorMap(subjects: SubjectInfo[] | undefined) {
  return useMemo(() => {
    const map = new Map<string, number>()
    if (!subjects) return map
    const sorted = [...subjects].sort((a, b) => a.name.localeCompare(b.name))
    sorted.forEach((s, idx) => map.set(s.id, idx % SUBJECT_PALETTE.length))
    return map
  }, [subjects])
}

function gradeShortLabel(grade: string): string {
  return grade
}

// ---------------------------------------------------------------------------
// Main module
// ---------------------------------------------------------------------------
export function AcademicsModule() {
  const { data, loading, error } = useFetch<AcademicsData>('/api/academics')

  if (loading) return <AcademicsSkeleton />
  if (error || !data) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Failed to load academics data"
        description={error || 'Please try again later.'}
      />
    )
  }

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 p-6 text-white shadow-lg">
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 right-24 h-32 w-32 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="relative flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Academics</h1>
              <p className="text-sm text-white/80">
                Manage class levels, subjects, timetables, exams & grades · {data.stats.totalSubjects} subjects across {data.stats.totalClassLevels} classes
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 backdrop-blur">
            <TrendingUp className="h-4 w-4" />
            <div>
              <p className="text-[10px] uppercase tracking-wide text-white/70">Avg Performance</p>
              <p className="text-lg font-bold">{data.stats.avgPerformance}%</p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="h-10 w-full justify-start overflow-x-auto sm:w-auto">
          <TabsTrigger value="overview" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Overview
          </TabsTrigger>
          <TabsTrigger value="subjects" className="gap-1.5">
            <BookOpen className="h-4 w-4" /> Subjects
          </TabsTrigger>
          <TabsTrigger value="timetable" className="gap-1.5">
            <CalendarRange className="h-4 w-4" /> Timetable
          </TabsTrigger>
          <TabsTrigger value="exams" className="gap-1.5">
            <Award className="h-4 w-4" /> Exams & Grades
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab data={data} />
        </TabsContent>
        <TabsContent value="subjects">
          <SubjectsTab data={data} />
        </TabsContent>
        <TabsContent value="timetable">
          <TimetableTab data={data} />
        </TabsContent>
        <TabsContent value="exams">
          <ExamsGradesTab data={data} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Skeleton
// ---------------------------------------------------------------------------
function AcademicsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-10 w-full max-w-md rounded-lg" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 rounded-xl lg:col-span-2" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 1: Overview
// ---------------------------------------------------------------------------
function OverviewTab({ data }: { data: AcademicsData }) {
  const { stats, classLevels, subjectCategories } = data
  const chartData = subjectCategories.map((c) => ({ name: c.category, count: c.count }))
  const totalCats = chartData.reduce((s, c) => s + c.count, 0) || 1

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Class Levels" value={formatNumber(stats.totalClassLevels)} icon={Layers} accent="emerald" footer={<span className="text-muted-foreground">{stats.totalStreams} streams</span>} />
        <StatCard label="Streams" value={formatNumber(stats.totalStreams)} icon={School} accent="teal" footer={<span className="text-muted-foreground">{formatNumber(stats.totalStudents)} students</span>} />
        <StatCard label="Subjects" value={formatNumber(stats.totalSubjects)} icon={BookOpen} accent="amber" footer={<span className="text-muted-foreground">{subjectCategories.length} categories</span>} />
        <StatCard label="Exams" value={formatNumber(stats.totalExams)} icon={Award} accent="violet" footer={<span className="text-muted-foreground">{formatNumber(stats.totalGrades)} grades</span>} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Subjects by category */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Subjects by Category</CardTitle>
            <CardDescription className="text-xs">Curriculum distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" width={92} />
                <Tooltip
                  contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }}
                  formatter={(v: number) => [`${v} subject${v === 1 ? '' : 's'}`, 'Count']}
                  cursor={{ fill: 'oklch(0.96 0.01 150)' }}
                />
                <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={36}>
                  {chartData.map((_, i) => (
                    <Cell key={i} fill={['#10b981', '#f59e0b', '#8b5cf6'][i % 3]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-3 grid grid-cols-3 gap-2 text-center">
              {chartData.map((c, i) => (
                <div key={c.name} className="rounded-lg border p-2">
                  <div className="mx-auto h-2 w-2 rounded-full" style={{ background: ['#10b981', '#f59e0b', '#8b5cf6'][i % 3] }} />
                  <p className="mt-1 text-sm font-bold">{c.count}</p>
                  <p className="text-[10px] text-muted-foreground">{Math.round((c.count / totalCats) * 100)}%</p>
                  <p className="text-[10px] text-muted-foreground">{c.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Class levels list */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Class Levels & Streams</CardTitle>
            <CardDescription className="text-xs">Enrollment breakdown by class</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {classLevels.map((cl) => {
                const fillPct = cl.capacity > 0 ? Math.min(100, Math.round((cl.studentCount / (cl.capacity * cl.streamCount || 1)) * 100)) : 0
                return (
                  <div key={cl.id} className="rounded-xl border bg-card p-4">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                          <Layers className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold">{cl.name}</p>
                          <p className="text-xs text-muted-foreground">{cl.stage} · {cl.streamCount} stream{cl.streamCount === 1 ? '' : 's'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{cl.studentCount} <span className="text-xs font-normal text-muted-foreground">students</span></p>
                        <p className="text-[10px] text-muted-foreground">Cap. {cl.capacity * cl.streamCount}</p>
                      </div>
                    </div>
                    {/* Capacity bar */}
                    <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div className={cn('h-full rounded-full', fillPct > 90 ? 'bg-rose-500' : fillPct > 70 ? 'bg-amber-500' : 'bg-emerald-500')} style={{ width: `${fillPct}%` }} />
                    </div>
                    {/* Streams */}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {cl.streams.map((s) => (
                        <div key={s.id} className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-1.5 text-xs">
                          <span className="font-medium">{s.name}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className="text-muted-foreground">{s.studentCount} std</span>
                          {s.classTeacher && (
                            <>
                              <span className="text-muted-foreground">·</span>
                              <span className="inline-flex items-center gap-1 text-muted-foreground">
                                <User className="h-3 w-3" />
                                {s.classTeacher.name}
                              </span>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
              {classLevels.length === 0 && (
                <EmptyState icon={Layers} title="No class levels" description="Class levels will appear here once configured." />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 2: Subjects
// ---------------------------------------------------------------------------
function SubjectsTab({ data }: { data: AcademicsData }) {
  const { subjects } = data
  const [category, setCategory] = useState<string>('all')
  const [query, setQuery] = useState('')

  const categories = useMemo(() => {
    const set = new Set(subjects.map((s) => s.category))
    return ['all', ...Array.from(set).sort()]
  }, [subjects])

  const filtered = useMemo(() => {
    return subjects.filter((s) => {
      const matchCat = category === 'all' || s.category === category
      const q = query.trim().toLowerCase()
      const matchQuery = !q || s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q) || (s.department?.name.toLowerCase().includes(q) ?? false)
      return matchCat && matchQuery
    })
  }, [subjects, category, query])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">All Subjects</CardTitle>
              <CardDescription className="text-xs">{filtered.length} of {subjects.length} subjects</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search subject…"
                  className="h-9 w-full rounded-md border border-input bg-transparent pl-8 pr-3 text-sm shadow-xs outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] sm:w-56"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger size="sm" className="w-[160px]">
                  <Filter className="mr-1 h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c === 'all' ? 'All categories' : c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-6">Code</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Classes</TableHead>
                  <TableHead className="text-right">Slots</TableHead>
                  <TableHead className="pr-6 text-right">Grades</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="pl-6">
                      <Badge variant="outline" className="font-mono text-[11px]">{s.code}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.department?.name || '—'}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('text-[11px]', CATEGORY_BADGE[s.category] || '')}>
                        {s.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{s.classesAssigned}</TableCell>
                    <TableCell className="text-right tabular-nums">{s.timetableSlots}</TableCell>
                    <TableCell className="pr-6 text-right tabular-nums">{s.gradesRecorded}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      No subjects match your filter.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 3: Timetable
// ---------------------------------------------------------------------------
function TimetableTab({ data }: { data: AcademicsData }) {
  const { classLevels } = data
  const allStreams = useMemo(() => classLevels.flatMap((cl) => cl.streams.map((s) => ({ ...s, classLevelName: cl.name }))), [classLevels])
  const [selectedStream, setSelectedStream] = useState<string>(allStreams[0]?.id || '')
  const streamId = selectedStream || null
  const { data: tt, loading } = useFetch<TimetableData>(streamId ? `/api/academics/timetable?streamId=${streamId}` : null)
  const subjectColorMap = useSubjectColorMap(data.subjects)
  const [adding, setAdding] = useState<string | null>(null)

  // Build a lookup: `${day}|${start}` -> entry
  const entryMap = useMemo(() => {
    const map = new Map<string, TimetableEntry>()
    tt?.entries?.forEach((e) => map.set(`${e.dayOfWeek}|${e.startTime}`, e))
    return map
  }, [tt])

  const handleAdd = async (day: string, period: { start: string; end: string }) => {
    if (!streamId) {
      toast.error('Select a stream first')
      return
    }
    setAdding(`${day}|${period.start}`)
    try {
      // Pick a random subject for demo purposes; in a real app this would open a dialog
      const subj = data.subjects[Math.floor(Math.random() * data.subjects.length)]
      if (!subj) {
        toast.error('No subjects available to assign')
        return
      }
      await apiPost('/api/academics/timetable', {
        streamId,
        subjectId: subj.id,
        dayOfWeek: day,
        startTime: period.start,
        endTime: period.end,
        room: allStreams.find((s) => s.id === streamId)?.name?.replace(/\s+/g, '') || 'Room',
      })
      toast.success(`Added ${subj.name} to ${day} ${period.start}`)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add entry')
    } finally {
      setAdding(null)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Weekly Timetable</CardTitle>
              <CardDescription className="text-xs">Color-coded by subject · {DAYS.length}-day cycle</CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <School className="h-4 w-4 text-muted-foreground" />
              <Select value={selectedStream} onValueChange={setSelectedStream}>
                <SelectTrigger size="sm" className="w-[200px]">
                  <SelectValue placeholder="Select stream" />
                </SelectTrigger>
                <SelectContent>
                  {classLevels.map((cl) => (
                    <SelectGroup key={cl.id}>
                      <SelectLabel>{cl.name}</SelectLabel>
                      {cl.streams.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name} · {s.studentCount} students
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-3 pb-3 sm:px-6 sm:pb-6">
          {!streamId ? (
            <EmptyState icon={CalendarRange} title="Select a stream" description="Choose a stream above to view its weekly timetable." />
          ) : loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : (
            <TimetableGrid
              entryMap={entryMap}
              subjectColorMap={subjectColorMap}
              onAdd={handleAdd}
              addingKey={adding}
            />
          )}
        </CardContent>
      </Card>

      {/* Subject legend */}
      {tt && tt.entries && tt.entries.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Subject Legend</CardTitle>
            <CardDescription className="text-xs">Subjects appearing in this stream&apos;s timetable</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from(new Set(tt.entries.map((e) => e.subjectId))).map((sid) => {
                const e = tt.entries.find((x) => x.subjectId === sid)!
                const colorIdx = subjectColorMap.get(sid) ?? 0
                const palette = SUBJECT_PALETTE[colorIdx]
                return (
                  <div key={sid} className="flex items-center gap-2 rounded-lg border border-l-4 bg-muted/30 px-3 py-2" >
                    <span className={cn('h-2 w-2 shrink-0 rounded-full')} style={{ background: palette.dot }} />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{e.subject.name}</p>
                      <p className="text-[10px] text-muted-foreground">{e.subject.code}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function TimetableGrid({
  entryMap,
  subjectColorMap,
  onAdd,
  addingKey,
}: {
  entryMap: Map<string, TimetableEntry>
  subjectColorMap: Map<string, number>
  onAdd: (day: string, period: { start: string; end: string }) => void
  addingKey: string | null
}) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[760px]">
        <div className="grid grid-cols-[110px_repeat(5,minmax(0,1fr))] gap-2">
          {/* Header row */}
          <div className="sticky left-0 z-10 bg-card" />
          {DAYS.map((d) => (
            <div key={d} className="rounded-lg bg-muted/60 px-3 py-2 text-center">
              <p className="text-sm font-semibold">{d}</p>
              <p className="text-[10px] text-muted-foreground">{PERIODS.length} periods</p>
            </div>
          ))}

          {/* Period rows */}
          {PERIODS.map((p) => {
            // Detect break rows for visual separation (after 10:00 and after 12:30)
            const isBreakAfter = p.start === '10:30' || p.start === '14:00'
            return (
              <RowFragment
                key={p.start}
                period={p}
                isBreakAfter={isBreakAfter}
                entryMap={entryMap}
                subjectColorMap={subjectColorMap}
                onAdd={onAdd}
                addingKey={addingKey}
              />
            )
          })}
        </div>
      </div>
    </div>
  )
}

function RowFragment({
  period,
  isBreakAfter,
  entryMap,
  subjectColorMap,
  onAdd,
  addingKey,
}: {
  period: { start: string; end: string; label: string; note: string }
  isBreakAfter: boolean
  entryMap: Map<string, TimetableEntry>
  subjectColorMap: Map<string, number>
  onAdd: (day: string, period: { start: string; end: string }) => void
  addingKey: string | null
}) {
  return (
    <>
      {/* Time label */}
      <div className={cn('sticky left-0 z-10 flex flex-col justify-center rounded-lg bg-muted/40 px-2.5 py-2', isBreakAfter && 'mt-2 border-t-2 border-dashed border-muted')}>
        <p className="text-[11px] font-semibold leading-tight">{period.start}</p>
        <p className="text-[10px] leading-tight text-muted-foreground">{period.end}</p>
        <p className="mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground/70">{period.note}</p>
      </div>
      {/* Day cells */}
      {DAYS.map((d) => {
        const key = `${d}|${period.start}`
        const entry = entryMap.get(key)
        if (entry) {
          const colorIdx = subjectColorMap.get(entry.subjectId) ?? 0
          const palette = SUBJECT_PALETTE[colorIdx]
          return (
            <div
              key={key}
              className={cn(
                'group relative flex flex-col gap-0.5 rounded-lg border border-l-4 px-3 py-2 transition-all hover:shadow-sm',
                palette.tint, palette.border,
                isBreakAfter && 'mt-2',
              )}
            >
              <div className="flex items-start justify-between gap-1">
                <p className={cn('truncate text-xs font-semibold', palette.text)}>{entry.subject.name}</p>
                <Badge variant="outline" className={cn('shrink-0 px-1.5 py-0 text-[9px] font-mono', palette.chip, 'border-transparent')}>
                  {entry.subject.code}
                </Badge>
              </div>
              {entry.teacher && (
                <p className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                  <User className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{entry.teacher.name}</span>
                </p>
              )}
              {entry.room && (
                <p className="flex items-center gap-1 truncate text-[10px] text-muted-foreground">
                  <MapPin className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{entry.room}</span>
                </p>
              )}
            </div>
          )
        }
        return (
          <button
            key={key}
            type="button"
            onClick={() => onAdd(d, { start: period.start, end: period.end })}
            disabled={addingKey === key}
            className={cn(
              'group flex min-h-[58px] items-center justify-center rounded-lg border border-dashed text-muted-foreground/60 transition-all hover:border-emerald-400 hover:bg-emerald-50/50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-emerald-950/30',
              isBreakAfter && 'mt-2',
            )}
            aria-label={`Add entry for ${d} ${period.label}`}
          >
            {addingKey === key ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
            ) : (
              <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
            )}
          </button>
        )
      })}
    </>
  )
}

// ---------------------------------------------------------------------------
// Tab 4: Exams & Grades
// ---------------------------------------------------------------------------
function ExamsGradesTab({ data }: { data: AcademicsData }) {
  const { exams } = data
  const [selectedExam, setSelectedExam] = useState<string>(exams[0]?.id || '')
  const [selectedStream, setSelectedStream] = useState<string>('all')

  const statsUrl = selectedExam
    ? `/api/academics/grades?stats=true&examId=${selectedExam}${selectedStream !== 'all' ? `&streamId=${selectedStream}` : ''}`
    : null
  const { data: stats, loading } = useFetch<GradeStats>(statsUrl)

  const allStreams = useMemo(() => data.classLevels.flatMap((cl) => cl.streams.map((s) => ({ id: s.id, name: s.name, classLevel: cl.name }))), [data.classLevels])

  const selectedExamObj = exams.find((e) => e.id === selectedExam)

  return (
    <div className="space-y-6">
      {/* Exam list */}
      <Card>
        <CardHeader className="pb-3">
          <SectionHeader
            title="Examinations"
            description="Select an exam to view grade distribution and top performers"
            icon={Award}
          />
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {exams.map((e) => {
              const isActive = e.id === selectedExam
              return (
                <button
                  key={e.id}
                  type="button"
                  onClick={() => setSelectedExam(e.id)}
                  className={cn(
                    'group flex flex-col gap-2 rounded-xl border p-4 text-left transition-all hover:shadow-md',
                    isActive
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 ring-1 ring-emerald-500/30'
                      : 'bg-card hover:border-emerald-300',
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg', isActive ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-600')}>
                        <ClipboardList className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold leading-tight">{e.name}</p>
                        <p className="text-[11px] text-muted-foreground">{e.academicYear} · {e.term}</p>
                      </div>
                    </div>
                    {isActive && <Badge className="bg-emerald-600 text-white">Selected</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <Badge variant="outline" className="text-[10px]">{e.examType}</Badge>
                    <span className="inline-flex items-center gap-1">
                      <CalendarRange className="h-3 w-3" />
                      {formatDate(e.startDate)}{e.endDate ? ` — ${formatDate(e.endDate)}` : ''}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <span className="text-[11px] text-muted-foreground">Grades recorded</span>
                    <span className="text-sm font-bold tabular-nums">{formatNumber(e.gradesCount)}</span>
                  </div>
                </button>
              )
            })}
            {exams.length === 0 && (
              <EmptyState icon={Award} title="No exams yet" description="Exams will appear here once scheduled." />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats for selected exam */}
      {selectedExamObj && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-base">{selectedExamObj.name} — Performance</CardTitle>
                <CardDescription className="text-xs">
                  {selectedExamObj.term}, {selectedExamObj.academicYear} · {selectedExamObj.examType}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedStream} onValueChange={setSelectedStream}>
                  <SelectTrigger size="sm" className="w-[200px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All streams</SelectItem>
                    {data.classLevels.map((cl) => (
                      <SelectGroup key={cl.id}>
                        <SelectLabel>{cl.name}</SelectLabel>
                        {cl.streams.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading || !stats ? (
              <div className="grid gap-4 lg:grid-cols-3">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-64 rounded-xl lg:col-span-2" />
              </div>
            ) : stats.totalGrades === 0 ? (
              <EmptyState
                icon={Award}
                title="No grades for this selection"
                description="Try selecting a different exam or stream."
              />
            ) : (
              <div className="space-y-6">
                {/* Quick stats */}
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border bg-emerald-50/40 p-4 dark:bg-emerald-950/30">
                    <p className="text-xs text-muted-foreground">Average Marks</p>
                    <p className="mt-1 text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.averageMarks}%</p>
                  </div>
                  <div className="rounded-xl border bg-teal-50/40 p-4 dark:bg-teal-950/30">
                    <p className="text-xs text-muted-foreground">Total Grades</p>
                    <p className="mt-1 text-2xl font-bold text-teal-600 dark:text-teal-400">{formatNumber(stats.totalGrades)}</p>
                  </div>
                  <div className="rounded-xl border bg-amber-50/40 p-4 dark:bg-amber-950/30">
                    <p className="text-xs text-muted-foreground">Total Points</p>
                    <p className="mt-1 text-2xl font-bold text-amber-600 dark:text-amber-400">{formatNumber(stats.totalPoints)}</p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-5">
                  {/* Grade distribution chart */}
                  <Card className="lg:col-span-3">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Grade Distribution</CardTitle>
                      <CardDescription className="text-xs">KCSE-style grades (A → E)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={stats.gradeDistribution} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} />
                          <XAxis dataKey="grade" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                          <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" allowDecimals={false} />
                          <Tooltip
                            contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }}
                            formatter={(v: number) => [`${v} grade${v === 1 ? '' : 's'}`, 'Count']}
                            cursor={{ fill: 'oklch(0.96 0.01 150)' }}
                          />
                          <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={48}>
                            {stats.gradeDistribution.map((g) => (
                              <Cell key={g.grade} fill={gradeDotColor(g.grade)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  {/* Top performers */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-2">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-amber-500" />
                        <div>
                          <CardTitle className="text-base">Top Performers</CardTitle>
                          <CardDescription className="text-xs">Best 10 by mean marks</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="px-3">
                      <div className="max-h-[260px] overflow-y-auto pr-1 academic-scroll">
                        <div className="space-y-1.5">
                          {stats.topPerformers.map((p) => (
                            <div key={p.studentId} className="flex items-center gap-3 rounded-lg border bg-card p-2.5">
                              <RankBadge rank={p.rank} />
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className={cn('text-[10px] font-semibold', avatarTintFor(p.studentName))}>
                                  {p.studentName.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold">{p.studentName}</p>
                                <p className="truncate text-[10px] text-muted-foreground">{p.stream} · {p.admissionNo}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xs font-bold tabular-nums">{p.meanMarks}</p>
                                <Badge variant="outline" className={cn('border px-1.5 py-0 text-[10px] font-semibold', gradeColor(p.meanGrade))}>
                                  {gradeShortLabel(p.meanGrade)}
                                </Badge>
                              </div>
                            </div>
                          ))}
                          {stats.topPerformers.length === 0 && (
                            <p className="py-6 text-center text-xs text-muted-foreground">No performers found.</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Subject performance */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Subject Performance</CardTitle>
                    <CardDescription className="text-xs">Average marks per subject in this exam</CardDescription>
                  </CardHeader>
                  <CardContent className="px-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="pl-6">Subject</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead className="text-right">Entries</TableHead>
                            <TableHead className="text-right">Avg Marks</TableHead>
                            <TableHead className="pr-6">Performance</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {stats.subjectPerformance.map((s) => (
                            <TableRow key={s.subjectId}>
                              <TableCell className="pl-6 font-medium">{s.subjectName}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className="font-mono text-[11px]">{s.subjectCode}</Badge>
                              </TableCell>
                              <TableCell className="text-right tabular-nums">{s.count}</TableCell>
                              <TableCell className="text-right font-semibold tabular-nums">{s.avgMarks}</TableCell>
                              <TableCell className="pr-6">
                                <div className="flex items-center gap-2">
                                  <div className="h-2 w-32 overflow-hidden rounded-full bg-muted">
                                    <div
                                      className={cn('h-full rounded-full', s.avgMarks >= 70 ? 'bg-emerald-500' : s.avgMarks >= 50 ? 'bg-amber-500' : 'bg-rose-500')}
                                      style={{ width: `${Math.min(100, s.avgMarks)}%` }}
                                    />
                                  </div>
                                  <span className="w-16 text-right text-[11px] tabular-nums text-muted-foreground">
                                    {s.avgMarks >= 70 ? 'Strong' : s.avgMarks >= 50 ? 'Average' : 'Below'}
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, string> = {
    1: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
    2: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    3: 'bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400',
  }
  const cls = styles[rank] || 'bg-muted text-muted-foreground'
  return (
    <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold', cls)}>
      {rank <= 3 ? <Trophy className="h-3.5 w-3.5" /> : `#${rank}`}
    </div>
  )
}

function avatarTintFor(seed: string): string {
  const colors = [
    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
    'bg-teal-500/15 text-teal-700 dark:text-teal-300',
    'bg-amber-500/15 text-amber-700 dark:text-amber-300',
    'bg-rose-500/15 text-rose-700 dark:text-rose-300',
    'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300',
    'bg-violet-500/15 text-violet-700 dark:text-violet-300',
  ]
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return colors[Math.abs(hash) % colors.length]
}

function gradeDotColor(grade: string): string {
  if (grade.startsWith('A')) return '#10b981'
  if (grade.startsWith('B')) return '#14b8a6'
  if (grade.startsWith('C')) return '#f59e0b'
  if (grade.startsWith('D')) return '#f97316'
  return '#f43f5e'
}
