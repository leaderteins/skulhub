'use client'
import { useState } from 'react'
import { useFetch } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { avatarColor, gradeColor, initials, fullName, formatNumber } from '@/lib/format'
import {
  FileText, Trophy, Medal, Award, Printer, Search, Users, TrendingUp,
  GraduationCap, ChevronRight, X, School,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts'

interface ReportCardsData {
  exam: { id: string; name: string; academicYear: string; term: string; examType: string; startDate: string; endDate: string | null }
  meritList: Array<{
    rank: number
    student: {
      id: string
      admissionNo: string
      firstName: string
      lastName: string
      gender: string
      boarding: boolean
      stream: { name: string; classLevel: { name: string } } | null
      guardian: { firstName: string; lastName: string; phone: string } | null
    }
    totalMarks: number
    totalPoints: number
    avgMarks: number
    meanPoints: number
    meanGrade: string
    subjectCount: number
    subjectGrades: Array<{ subjectName: string; subjectCode: string; marks: number; grade: string; points: number }>
  }>
  gradeDistribution: Array<{ grade: string; count: number }>
  subjectPerformance: Array<{ subjectName: string; subjectCode: string; avgMarks: number; entries: number; topGrade: string }>
  totalStudents: number
  streams: Array<{ id: string; name: string; classLevel: string }>
  exams: Array<{ id: string; name: string; academicYear: string; term: string; examType: string }>
}

const GRADE_BAR_COLORS: Record<string, string> = {
  A: '#059669', 'A-': '#10b981', 'B+': '#14b8a6', B: '#0d9488', 'B-': '#06b6d4',
  'C+': '#0ea5e9', C: '#f59e0b', 'C-': '#f97316',
  'D+': '#fb923c', D: '#ef4444', 'D-': '#dc2626', E: '#be185d',
}

export function ReportCardsModule() {
  const [examId, setExamId] = useState<string>('')
  const [streamId, setStreamId] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)

  // Always fetch — the API defaults to the latest exam when examId is empty.
  const { data, loading } = useFetch<ReportCardsData>(
    `/api/report-cards?examId=${examId}${streamId !== 'all' ? `&streamId=${streamId}` : ''}`,
    [examId, streamId]
  )

  // Derive filtered list directly during render (no memoization needed)
  const meritList = data?.meritList || []
  const q = search.toLowerCase().trim()
  const filtered = q
    ? meritList.filter(m =>
        `${m.student.firstName} ${m.student.lastName}`.toLowerCase().includes(q) ||
        m.student.admissionNo.toLowerCase().includes(q)
      )
    : meritList

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white shadow-xl">
          <FileText className="mb-3 h-12 w-12 opacity-80" />
          <h2 className="text-2xl font-bold">Report Cards & Merit Lists</h2>
          <p className="mt-1 max-w-xl text-sm text-white/80">
            Generate KCSE-style term report cards with mean grades, stream rankings, subject performance,
            teacher remarks and printable formats for parents.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground" />
            <p className="font-medium">Select an examination to begin</p>
            <p className="text-sm text-muted-foreground">Choose an exam from the selector above to view merit lists and generate report cards.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const top3 = filtered.slice(0, 3)
  const passCount = data.meritList.filter(m => m.avgMarks >= 50).length
  const passRate = data.totalStudents > 0 ? Math.round((passCount / data.totalStudents) * 100) : 0

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <Trophy className="h-3 w-3" /> {data?.exam?.name || ''} · {data?.exam?.term || ''}, {data?.exam?.academicYear || ''}
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Report Cards & Merit List</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              {data.totalStudents} students graded · {data.meritList.length} in selected view · {passRate}% pass rate (≥50%)
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="bg-white/15 text-white backdrop-blur hover:bg-white/25" onClick={() => window.print()}>
              <Printer className="mr-1.5 h-4 w-4" /> Print Merit List
            </Button>
          </div>
        </div>
      </div>

      {/* Selectors */}
      <Card>
        <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-end">
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Examination</label>
            <Select value={examId} onValueChange={setExamId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="Select exam" /></SelectTrigger>
              <SelectContent>
                {data.exams.map(e => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name} · {e.term} {e.academicYear}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Stream</label>
            <Select value={streamId} onValueChange={setStreamId}>
              <SelectTrigger className="w-full"><SelectValue placeholder="All streams" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Streams</SelectItem>
                <SelectGroup>
                  <SelectLabel>By Class</SelectLabel>
                  {data.streams.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.classLevel})</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Search Student</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Name or admission no..."
                className="h-9 w-full rounded-md border border-input bg-transparent pl-9 pr-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stat strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Students Graded</p>
              <p className="text-2xl font-bold">{formatNumber(data.totalStudents)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Pass Rate (≥50%)</p>
              <p className="text-2xl font-bold">{passRate}%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <Medal className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Top Mean Grade</p>
              <p className="text-2xl font-bold">
                {data.meritList[0]?.meanGrade || '-'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Subjects Examined</p>
              <p className="text-2xl font-bold">{data.subjectPerformance.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top 3 podium */}
      {top3.length === 3 && !search && streamId === 'all' && (
        <div className="grid gap-4 sm:grid-cols-3">
          {top3.map((m, i) => {
            const place = i + 1
            const config = place === 1
              ? { ring: 'ring-amber-400', bg: 'from-amber-400 to-yellow-500', label: '1st', icon: Trophy }
              : place === 2
              ? { ring: 'ring-slate-400', bg: 'from-slate-300 to-slate-400', label: '2nd', icon: Medal }
              : { ring: 'ring-orange-400', bg: 'from-orange-400 to-amber-600', label: '3rd', icon: Award }
            const Icon = config.icon
            return (
              <Card key={m.student.id} className={cn('relative overflow-hidden ring-2 transition-all hover:shadow-lg', config.ring)}>
                <div className={cn('absolute right-0 top-0 h-24 w-24 bg-gradient-to-bl opacity-10', config.bg)} />
                <CardContent className="p-5">
                  <div className="flex items-center gap-3">
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg', config.bg)}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{config.label} Place</span>
                        <Badge className={cn('border', gradeColor(m.meanGrade))}>{m.meanGrade}</Badge>
                      </div>
                      <p className="truncate text-sm font-semibold">{fullName(m.student)}</p>
                      <p className="truncate text-xs text-muted-foreground">{m.student.stream?.name} · {m.student.admissionNo}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-[10px] uppercase text-muted-foreground">Total</p>
                      <p className="text-sm font-bold">{m.totalMarks}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-[10px] uppercase text-muted-foreground">Points</p>
                      <p className="text-sm font-bold">{m.totalPoints}</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-2">
                      <p className="text-[10px] uppercase text-muted-foreground">Average</p>
                      <p className="text-sm font-bold">{m.avgMarks}%</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="mt-2 w-full text-xs" onClick={() => setSelectedStudent(m.student.id)}>
                    View Report Card <ChevronRight className="ml-1 h-3 w-3" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Grade distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Mean Grade Distribution</CardTitle>
            <CardDescription className="text-xs">KCSE 12-point grading — {data.totalStudents} students</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={data.gradeDistribution} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} />
                <XAxis dataKey="grade" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} cursor={{ fill: 'oklch(0.96 0.01 150)' }} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                  {data.gradeDistribution.map((g) => <Cell key={g.grade} fill={GRADE_BAR_COLORS[g.grade] || '#94a3b8'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Subject performance */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Subject Performance</CardTitle>
            <CardDescription className="text-xs">Average marks per subject</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-60 overflow-y-auto scrollbar-thin pr-1">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Subject</TableHead>
                    <TableHead className="text-right text-xs">Entries</TableHead>
                    <TableHead className="text-right text-xs">Average</TableHead>
                    <TableHead className="text-right text-xs">Top</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.subjectPerformance.map(s => (
                    <TableRow key={s.subjectId}>
                      <TableCell className="py-1.5 text-xs font-medium">{s.subjectName}</TableCell>
                      <TableCell className="py-1.5 text-right text-xs text-muted-foreground">{s.entries}</TableCell>
                      <TableCell className="py-1.5 text-right">
                        <span className={cn('text-xs font-semibold', s.avgMarks >= 60 ? 'text-emerald-600' : s.avgMarks >= 45 ? 'text-amber-600' : 'text-rose-600')}>
                          {s.avgMarks}%
                        </span>
                      </TableCell>
                      <TableCell className="py-1.5 text-right">
                        <Badge variant="outline" className={cn('text-[10px]', gradeColor(s.topGrade))}>{s.topGrade}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Merit list table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Merit List</CardTitle>
              <CardDescription className="text-xs">Ranked by total points · {filtered.length} students</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-12 text-center text-xs">#</TableHead>
                  <TableHead className="text-xs">Student</TableHead>
                  <TableHead className="text-xs">Stream</TableHead>
                  <TableHead className="text-right text-xs">Subjects</TableHead>
                  <TableHead className="text-right text-xs">Total Marks</TableHead>
                  <TableHead className="text-right text-xs">Points</TableHead>
                  <TableHead className="text-right text-xs">Average</TableHead>
                  <TableHead className="text-center text-xs">Mean Grade</TableHead>
                  <TableHead className="text-right text-xs">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(m => (
                  <TableRow key={m.student.id} className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => setSelectedStudent(m.student.id)}>
                    <TableCell className="text-center">
                      <span className={cn('inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                        m.rank === 1 ? 'bg-amber-100 text-amber-700' : m.rank === 2 ? 'bg-slate-100 text-slate-700' : m.rank === 3 ? 'bg-orange-100 text-orange-700' : 'bg-muted text-muted-foreground')}>
                        {m.rank}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className={cn('text-[10px] font-semibold text-white', avatarColor(fullName(m.student)))}>
                            {initials(m.student.firstName, m.student.lastName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{fullName(m.student)}</p>
                          <p className="truncate text-xs text-muted-foreground">{m.student.admissionNo}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">{m.student.stream?.name || '-'}</TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{m.subjectCount}</TableCell>
                    <TableCell className="text-right text-xs font-semibold tabular-nums">{m.totalMarks}</TableCell>
                    <TableCell className="text-right text-xs font-semibold tabular-nums">{m.totalPoints}</TableCell>
                    <TableCell className="text-right text-xs tabular-nums">{m.avgMarks}%</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline" className={cn('text-[10px] font-bold', gradeColor(m.meanGrade))}>{m.meanGrade}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedStudent(m.student.id) }}>
                        Report <ChevronRight className="ml-0.5 h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Report Card Detail Dialog */}
      {selectedStudent && (
        <ReportCardDialog
          studentId={selectedStudent}
          examId={examId}
          onClose={() => setSelectedStudent(null)}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Printable Report Card Dialog
// ---------------------------------------------------------------------------
function ReportCardDialog({ studentId, examId, onClose }: { studentId: string; examId: string; onClose: () => void }) {
  const { data, loading } = useFetch<any>(
    `/api/report-cards/${studentId}?examId=${examId}`
  )

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto scrollbar-thin p-0">
        {loading || !data ? (
          <div className="p-8">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="mt-4 h-64 w-full" />
            <Skeleton className="mt-4 h-40 w-full" />
          </div>
        ) : (
          <div className="print-container">
            {/* Report card header */}
            <div className="relative overflow-hidden border-b bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white">
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                    <School className="h-7 w-7" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold leading-tight">SkulHub Academy</h2>
                    <p className="text-xs text-white/80">P.O. Box 12345-00100, Nairobi, Kenya · +254 700 000 000</p>
                    <p className="text-xs text-white/80">info@skulhub.ac.ke · www.skulhub.ac.ke</p>
                  </div>
                </div>
                <div className="hidden text-right sm:block">
                  <p className="text-[10px] uppercase tracking-wider text-white/60">Term Report Card</p>
                  <p className="text-lg font-bold">{data?.exam?.term || ''}, {data?.exam?.academicYear || ''}</p>
                  <p className="text-xs text-white/80">{data?.exam?.name || ''}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Student info */}
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <Card className="border-emerald-200/50 bg-emerald-50/40 dark:bg-emerald-950/20">
                  <CardContent className="p-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Student Details</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Name:</span><span className="font-medium">{data?.student?.firstName || ''} {data?.student?.lastName || ''}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Admission No:</span><span className="font-medium">{data?.student?.admissionNo || ''}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Class:</span><span className="font-medium">{data?.student?.classLevel?.name || ''}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Stream:</span><span className="font-medium">{data?.student?.currentStream?.name || ''}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Gender:</span><span className="font-medium">{data?.student?.gender || ''}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Type:</span><span className="font-medium">{data?.student?.boarding || false ? 'Boarding' : 'Day Scholar'}</span></div>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-teal-200/50 bg-teal-50/40 dark:bg-teal-950/20">
                  <CardContent className="p-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">Guardian & Contact</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center justify-between"><span className="text-muted-foreground">Guardian:</span><span className="font-medium">{data?.student?.guardian?.firstName || ''} {data?.student?.guardian?.lastName || ''}</span></div>
                      <div className="flex items-center justify-between"><span className="text-muted-foreground">Phone:</span><span className="font-medium">{data?.student?.guardian?.phone || ''}</span></div>
                      <div className="flex items-center justify-between"><span className="text-muted-foreground">County:</span><span className="font-medium">{data?.student?.county || ''}</span></div>
                      <div className="flex items-center justify-between"><span className="text-muted-foreground">Nationality:</span><span className="font-medium">{data?.student?.nationality || ''}</span></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Subject grades table */}
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Subject Performance</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="text-xs">Subject</TableHead>
                        <TableHead className="text-xs">Category</TableHead>
                        <TableHead className="text-right text-xs">Marks</TableHead>
                        <TableHead className="text-center text-xs">Grade</TableHead>
                        <TableHead className="text-right text-xs">Points</TableHead>
                        <TableHead className="text-right text-xs">Remarks</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(data?.grades || []).map((g: any, i: number) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs font-medium">{g.subjectName} <span className="text-muted-foreground">({g.subjectCode})</span></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{g.category}</TableCell>
                          <TableCell className="text-right text-xs font-semibold tabular-nums">{g.marks}</TableCell>
                          <TableCell className="text-center"><Badge variant="outline" className={cn('text-[10px] font-bold', gradeColor(g.grade))}>{g.grade}</Badge></TableCell>
                          <TableCell className="text-right text-xs tabular-nums">{g.points}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">{g.remarks}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Summary grid */}
              <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl border bg-muted/30 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total Marks</p>
                  <p className="text-xl font-bold tabular-nums">{data?.summary?.totalMarks || 0}</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total Points</p>
                  <p className="text-xl font-bold tabular-nums">{data?.summary?.totalPoints || 0}</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-3 text-center">
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Average</p>
                  <p className="text-xl font-bold tabular-nums">{data?.summary?.avgMarks || 0}%</p>
                </div>
                <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/60 p-3 text-center dark:bg-emerald-950/30">
                  <p className="text-[10px] uppercase tracking-wide text-emerald-700 dark:text-emerald-400">Mean Grade</p>
                  <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">{data?.summary?.meanGrade || '—'}</p>
                </div>
              </div>

              {/* Rank & attendance */}
              <div className="mb-4 grid gap-3 sm:grid-cols-2">
                <Card>
                  <CardContent className="p-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Stream Ranking</p>
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                        <Trophy className="h-6 w-6" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{data?.summary?.streamRank ? `#${data?.summary?.streamRank}` : '-'}</p>
                        <p className="text-xs text-muted-foreground">out of {data?.summary?.streamSize} students</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Attendance Summary</p>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div><p className="font-bold text-emerald-600">{data.attendance.present}</p><p className="text-[10px] text-muted-foreground">Present</p></div>
                      <div><p className="font-bold text-rose-600">{data.attendance.absent}</p><p className="text-[10px] text-muted-foreground">Absent</p></div>
                      <div><p className="font-bold text-amber-600">{data.attendance.late}</p><p className="text-[10px] text-muted-foreground">Late</p></div>
                      <div><p className="font-bold text-violet-600">{data.attendance.excused}</p><p className="text-[10px] text-muted-foreground">Excused</p></div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Remarks */}
              <div className="mb-4 space-y-3">
                <div className="rounded-xl border-l-4 border-emerald-500 bg-emerald-50/40 p-4 dark:bg-emerald-950/20">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Class Teacher's Remarks</p>
                  <p className="text-sm">{data.classTeacherRemarks}</p>
                </div>
                <div className="rounded-xl border-l-4 border-teal-500 bg-teal-50/40 p-4 dark:bg-teal-950/20">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">Promotion Status</p>
                  <p className="text-sm">{data.promotionStatus}</p>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-6 pt-4 sm:grid-cols-3">
                <div className="text-center">
                  <div className="mb-1 border-b border-dashed border-muted-foreground/50 pb-6" />
                  <p className="text-xs font-medium">Class Teacher</p>
                </div>
                <div className="text-center">
                  <div className="mb-1 border-b border-dashed border-muted-foreground/50 pb-6" />
                  <p className="text-xs font-medium">Principal</p>
                </div>
                <div className="col-span-2 text-center sm:col-span-1">
                  <div className="mb-1 border-b border-dashed border-muted-foreground/50 pb-6" />
                  <p className="text-xs font-medium">Guardian Signature</p>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-4 flex flex-col items-center justify-between gap-2 border-t pt-3 text-[10px] text-muted-foreground sm:flex-row">
                <span>Generated on {new Date(data.generatedAt).toLocaleString('en-KE')}</span>
                <span>This is a computer-generated report card from SkulHub</span>
              </div>

              {/* Print button (sticky at bottom of dialog) */}
              <div className="mt-4 flex justify-end gap-2 print:hidden">
                <Button variant="outline" size="sm" onClick={onClose}>
                  <X className="mr-1.5 h-4 w-4" /> Close
                </Button>
                <Button size="sm" onClick={() => window.print()} className="bg-emerald-600 hover:bg-emerald-700">
                  <Printer className="mr-1.5 h-4 w-4" /> Print Report Card
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
