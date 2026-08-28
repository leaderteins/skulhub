'use client'
import { useState } from 'react'
import { useFetch, apiPost, apiPut } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { formatDate, formatDateTime, statusColor } from '@/lib/format'
import { toast } from 'sonner'
import {
  ClipboardCheck, FileQuestion, ClipboardList, Plus, ChevronRight,
  BookOpen, Clock, CheckCircle2, Award, TrendingUp, X, ListChecks,
  ClipboardEdit, FilePlus, Edit3, Upload, Save, Loader2,
} from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'

interface ExamsData {
  stats: { totalQuestions: number; totalAssessments: number; published: number; completed: number; graded: number; drafts: number }
  questions: Array<{
    id: string; question: string; questionType: string; correctAnswer: string | null; marks: number
    difficulty: string; topic: string | null; bloomLevel: string | null; createdBy: string | null
    subjectName: string; subjectCode: string; optionsArray: string[] | null
  }>
  assessments: Array<{
    id: string; title: string; assessmentType: string; term: string; academicYear: string
    totalMarks: number; weight: number; duration: number | null; startDate: string; endDate: string | null
    status: string; rubric: string | null; instructions: string | null; createdBy: string | null
    subjectName: string; subjectCode: string; classLevelName: string
  }>
  bySubject: Array<{ name: string; count: number }>
  byDifficulty: Array<{ name: string; count: number }>
  byQuestionType: Array<{ name: string; count: number }>
  byAssessmentType: Array<{ name: string; count: number }>
  byStatus: Array<{ name: string; count: number }>
  subjects: Array<{ id: string; name: string; code: string }>
}

const DIFFICULTY_BADGE: Record<string, string> = {
  Easy: 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950 dark:text-emerald-400',
  Medium: 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-400',
  Hard: 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950 dark:text-rose-400',
}
const ASSESSMENT_TYPE_COLORS: Record<string, string> = { CAT: '#10b981', Quiz: '#06b6d4', Assignment: '#8b5cf6', Project: '#f59e0b', Mock: '#ef4444', Practical: '#14b8a6' }
const QTYPE_COLORS: Record<string, string> = { 'Multiple Choice': '#10b981', 'True/False': '#06b6d4', 'Short Answer': '#f59e0b', Essay: '#8b5cf6', 'Fill in the Blank': '#ef4444' }

export function ExamsModule() {
  const { data, loading } = useFetch<ExamsData>('/api/exams')
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null)
  const [selectedAssessment, setSelectedAssessment] = useState<string | null>(null)
  const [showQuestionDialog, setShowQuestionDialog] = useState(false)
  const [showAssessmentDialog, setShowAssessmentDialog] = useState(false)
  const [qSubject, setQSubject] = useState('all')
  const [qDifficulty, setQDifficulty] = useState('all')
  const [aSubject, setASubject] = useState('all')
  const [aStatus, setAStatus] = useState('all')

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

  const d = data!
  const filteredQuestions = d.questions.filter(q =>
    (qSubject === 'all' || q.subjectName === d.subjects.find(s => s.id === qSubject)?.name) &&
    (qDifficulty === 'all' || q.difficulty === qDifficulty)
  )
  const filteredAssessments = d.assessments.filter(a =>
    (aSubject === 'all' || d.subjects.find(s => s.name === a.subjectName)?.id === aSubject) &&
    (aStatus === 'all' || a.status === aStatus)
  )

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 text-white shadow-xl">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur">
              <ClipboardCheck className="h-3 w-3" /> {d.stats.totalQuestions} questions · {d.stats.totalAssessments} assessments
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Examinations & Assessments</h2>
            <p className="mt-1 max-w-xl text-sm text-white/80">
              Question banks, continuous assessment tests (CATs), and grading rubrics for all subjects.
            </p>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
              <FileQuestion className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Question Bank</p>
              <p className="text-2xl font-bold">{d.stats.totalQuestions}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Assessments</p>
              <p className="text-2xl font-bold">{d.stats.totalAssessments}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Published</p>
              <p className="text-2xl font-bold">{d.stats.published}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="stat-card">
          <CardContent className="flex items-center gap-3 p-5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Graded</p>
              <p className="text-2xl font-bold">{d.stats.graded}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="questions" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="questions" className="gap-1.5"><FileQuestion className="h-4 w-4" /> Question Bank</TabsTrigger>
          <TabsTrigger value="assessments" className="gap-1.5"><ClipboardList className="h-4 w-4" /> Assessments</TabsTrigger>
        </TabsList>

        {/* Questions Tab */}
        <TabsContent value="questions" className="space-y-4">
          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">By Difficulty</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={d.byDifficulty} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3}>
                      {d.byDifficulty.map(diff => <Cell key={diff.name} fill={diff.name === 'Easy' ? '#10b981' : diff.name === 'Medium' ? '#f59e0b' : '#ef4444'} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">By Question Type</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={d.byQuestionType} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 9 }} stroke="oklch(0.5 0.02 160)" width={100} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} cursor={{ fill: 'oklch(0.96 0.01 150)' }} />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]} maxBarSize={20}>
                      {d.byQuestionType.map(t => <Cell key={t.name} fill={QTYPE_COLORS[t.name] || '#94a3b8'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">By Subject</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={160}>
                  <BarChart data={d.bySubject} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 9 }} stroke="oklch(0.5 0.02 160)" angle={-20} textAnchor="end" height={60} />
                    <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} cursor={{ fill: 'oklch(0.96 0.01 150)' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={40} fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Filter + Add */}
          <Card>
            <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
              <Select value={qSubject} onValueChange={setQSubject}>
                <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {d.subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={qDifficulty} onValueChange={setQDifficulty}>
                <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Difficulty" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Difficulties</SelectItem>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1" />
              <Button size="sm" onClick={() => setShowQuestionDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
                <Plus className="mr-1.5 h-4 w-4" /> Add Question
              </Button>
            </CardContent>
          </Card>

          {/* Questions table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Question Bank ({filteredQuestions.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead className="text-xs">Question</TableHead>
                      <TableHead className="text-xs">Subject</TableHead>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Topic</TableHead>
                      <TableHead className="text-center text-xs">Marks</TableHead>
                      <TableHead className="text-center text-xs">Difficulty</TableHead>
                      <TableHead className="text-right text-xs">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQuestions.slice(0, 30).map(q => (
                      <TableRow key={q.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedQuestion(q.id)}>
                        <TableCell className="max-w-xs">
                          <p className="truncate text-xs font-medium">{q.question}</p>
                          {q.optionsArray && <p className="text-[10px] text-muted-foreground">Options: {q.optionsArray.join(', ')}</p>}
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px]">{q.subjectName}</Badge></TableCell>
                        <TableCell className="text-xs">{q.questionType}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{q.topic || '—'}</TableCell>
                        <TableCell className="text-center text-xs font-semibold">{q.marks}</TableCell>
                        <TableCell className="text-center"><Badge variant="outline" className={cn('text-[10px]', DIFFICULTY_BADGE[q.difficulty])}>{q.difficulty}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedQuestion(q.id) }}>
                            View <ChevronRight className="ml-0.5 h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-4">
          {/* Charts */}
          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Assessments by Type</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={d.byAssessmentType} dataKey="count" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3}>
                      {d.byAssessmentType.map(t => <Cell key={t.name} fill={ASSESSMENT_TYPE_COLORS[t.name] || '#94a3b8'} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-2 text-[10px]">
                  {d.byAssessmentType.map(t => (
                    <div key={t.name} className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full" style={{ background: ASSESSMENT_TYPE_COLORS[t.name] }} />
                      <span className="font-medium">{t.name}</span><span className="text-muted-foreground">{t.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Assessment Status</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={d.byStatus} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                    <YAxis tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} cursor={{ fill: 'oklch(0.96 0.01 150)' }} />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={50}>
                      {d.byStatus.map(s => <Cell key={s.name} fill={s.name === 'Graded' ? '#10b981' : s.name === 'Completed' ? '#14b8a6' : s.name === 'Published' ? '#f59e0b' : '#94a3b8'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Filter + Add */}
          <Card>
            <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
              <Select value={aSubject} onValueChange={setASubject}>
                <SelectTrigger className="w-full md:w-48"><SelectValue placeholder="Subject" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subjects</SelectItem>
                  {d.subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={aStatus} onValueChange={setAStatus}>
                <SelectTrigger className="w-full md:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Graded">Graded</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1" />
              <Button size="sm" onClick={() => setShowAssessmentDialog(true)} className="bg-teal-600 hover:bg-teal-700">
                <Plus className="mr-1.5 h-4 w-4" /> Create Assessment
              </Button>
            </CardContent>
          </Card>

          {/* Assessments grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredAssessments.map(a => (
              <Card key={a.id} className="stat-card cursor-pointer transition-all hover:shadow-lg" onClick={() => setSelectedAssessment(a.id)}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${ASSESSMENT_TYPE_COLORS[a.assessmentType]}15` }}>
                        <ClipboardList className="h-5 w-5" style={{ color: ASSESSMENT_TYPE_COLORS[a.assessmentType] }} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{a.title}</p>
                        <p className="truncate text-[10px] text-muted-foreground">{a.subjectName} · {a.classLevelName}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn('shrink-0 text-[10px]', statusColor(a.status))}>{a.status}</Badge>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-muted/40 p-1.5">
                      <p className="text-[9px] uppercase text-muted-foreground">Type</p>
                      <p className="text-xs font-bold">{a.assessmentType}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-1.5">
                      <p className="text-[9px] uppercase text-muted-foreground">Marks</p>
                      <p className="text-xs font-bold">{a.totalMarks}</p>
                    </div>
                    <div className="rounded-lg bg-muted/40 p-1.5">
                      <p className="text-[9px] uppercase text-muted-foreground">Weight</p>
                      <p className="text-xs font-bold">{a.weight}%</p>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" /><span>{a.duration ? `${a.duration} min` : 'No time limit'}</span>
                    <span>·</span><span>{formatDate(a.startDate)}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {selectedQuestion && <QuestionDetailDialog questionId={selectedQuestion} onClose={() => setSelectedQuestion(null)} />}
      {selectedAssessment && <AssessmentDetailDialog assessmentId={selectedAssessment} onClose={() => setSelectedAssessment(null)} />}
      {showQuestionDialog && <AddQuestionDialog onClose={() => setShowQuestionDialog(false)} subjects={d.subjects} />}
      {showAssessmentDialog && <AddAssessmentDialog onClose={() => setShowAssessmentDialog(false)} subjects={d.subjects} />}
    </div>
  )
}

function QuestionDetailDialog({ questionId, onClose }: { questionId: string; onClose: () => void }) {
  const { data: q, loading } = useFetch<any>(`/api/exams/${questionId}?type=question`)
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg">
        {loading || !q ? <Skeleton className="h-48 w-full" /> : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><FileQuestion className="h-5 w-5 text-emerald-500" /> Question Details</DialogTitle>
              <DialogDescription>{q.subject?.name} · {q.questionType}</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded-xl bg-emerald-50/50 p-4 dark:bg-emerald-950/20">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Question</p>
                <p className="mt-1 text-sm font-medium">{q.question}</p>
              </div>
              {q.optionsArray && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase text-muted-foreground">Options</p>
                  <div className="space-y-1">
                    {q.optionsArray.map((opt: string, i: number) => (
                      <div key={i} className={cn('flex items-center gap-2 rounded-lg border p-2 text-sm', opt === q.correctAnswer ? 'border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950' : '')}>
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-[10px] font-bold">{String.fromCharCode(65 + i)}</span>
                        <span>{opt}</span>
                        {opt === q.correctAnswer && <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-600" />}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {q.correctAnswer && !q.optionsArray && (
                <div className="rounded-lg border-l-4 border-emerald-400 bg-emerald-50/50 p-3 dark:bg-emerald-950/20">
                  <p className="text-[10px] font-semibold uppercase text-emerald-700 dark:text-emerald-400">Correct Answer</p>
                  <p className="mt-0.5 text-sm">{q.correctAnswer}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg border p-2"><p className="text-[10px] uppercase text-muted-foreground">Marks</p><p className="text-sm font-bold">{q.marks}</p></div>
                <div className="rounded-lg border p-2"><p className="text-[10px] uppercase text-muted-foreground">Difficulty</p><Badge variant="outline" className={cn('text-[10px]', DIFFICULTY_BADGE[q.difficulty])}>{q.difficulty}</Badge></div>
                <div className="rounded-lg border p-2"><p className="text-[10px] uppercase text-muted-foreground">Bloom</p><p className="text-[10px] font-bold">{q.bloomLevel || '—'}</p></div>
              </div>
              {q.topic && <p className="text-xs text-muted-foreground">Topic: {q.topic}</p>}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function AssessmentDetailDialog({ assessmentId, onClose }: { assessmentId: string; onClose: () => void }) {
  const { data: a, loading } = useFetch<any>(`/api/exams/${assessmentId}?type=assessment`)
  const [showGradeEntry, setShowGradeEntry] = useState(false)
  const [showExternalMarks, setShowExternalMarks] = useState(false)
  const [showChangeSubject, setShowChangeSubject] = useState(false)

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-xl max-h-[92vh] overflow-y-auto scrollbar-thin">
        {loading || !a ? <Skeleton className="h-48 w-full" /> : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-teal-500" /> Assessment Details</DialogTitle>
              <DialogDescription>
                {a.subject?.name} · {a.classLevel?.name} · {a.assessmentType}
                <button
                  onClick={() => setShowChangeSubject(true)}
                  className="ml-2 inline-flex items-center gap-1 text-[10px] text-teal-600 hover:underline"
                >
                  <Edit3 className="h-3 w-3" /> Change subject
                </button>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="rounded-xl bg-gradient-to-r from-teal-50 to-cyan-50 p-4 dark:from-teal-950/30 dark:to-cyan-950/30">
                <p className="text-base font-bold">{a.title}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  <Badge variant="outline" className="text-[10px]">{a.assessmentType}</Badge>
                  <Badge variant="outline" className={cn('text-[10px]', statusColor(a.status))}>{a.status}</Badge>
                  <Badge variant="outline" className="text-[10px]">{a.term} {a.academicYear}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="rounded-lg border p-2"><p className="text-[10px] uppercase text-muted-foreground">Marks</p><p className="text-sm font-bold">{a.totalMarks}</p></div>
                <div className="rounded-lg border p-2"><p className="text-[10px] uppercase text-muted-foreground">Weight</p><p className="text-sm font-bold">{a.weight}%</p></div>
                <div className="rounded-lg border p-2"><p className="text-[10px] uppercase text-muted-foreground">Duration</p><p className="text-sm font-bold">{a.duration || '—'}{a.duration ? 'm' : ''}</p></div>
                <div className="rounded-lg border p-2"><p className="text-[10px] uppercase text-muted-foreground">Date</p><p className="text-[10px] font-bold">{formatDate(a.startDate)}</p></div>
              </div>
              {a.instructions && (
                <div className="rounded-lg border-l-4 border-teal-400 bg-teal-50/50 p-3 dark:bg-teal-950/20">
                  <p className="text-[10px] font-semibold uppercase text-teal-700 dark:text-teal-400">Instructions</p>
                  <p className="mt-0.5 text-sm">{a.instructions}</p>
                </div>
              )}
              {a.rubric && (
                <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50/50 p-3 dark:bg-amber-950/20">
                  <p className="text-[10px] font-semibold uppercase text-amber-700 dark:text-amber-400">Grading Rubric</p>
                  <p className="mt-0.5 text-sm">{a.rubric}</p>
                </div>
              )}

              {/* Action buttons: Record Grades + Add External Marks */}
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  variant="outline"
                  onClick={() => setShowGradeEntry(true)}
                  className="gap-1.5 border-teal-300 text-teal-700 hover:bg-teal-50 dark:border-teal-800 dark:text-teal-400 dark:hover:bg-teal-950"
                >
                  <ClipboardEdit className="h-4 w-4" /> Record / Edit Grades
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowExternalMarks(true)}
                  className="gap-1.5 border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950"
                >
                  <FilePlus className="h-4 w-4" /> Add External Marks
                </Button>
              </div>
            </div>
          </>
        )}
      </DialogContent>

      {/* Grade entry dialog */}
      {a && showGradeEntry && (
        <GradeEntryDialog
          assessment={a}
          onClose={() => setShowGradeEntry(false)}
        />
      )}
      {/* External marks dialog */}
      {a && showExternalMarks && (
        <ExternalMarksDialog
          assessment={a}
          onClose={() => setShowExternalMarks(false)}
        />
      )}
      {/* Change subject dialog */}
      {a && showChangeSubject && (
        <ChangeSubjectDialog
          assessment={a}
          onClose={() => setShowChangeSubject(false)}
        />
      )}
    </Dialog>
  )
}

function AddQuestionDialog({ onClose, subjects }: { onClose: () => void; subjects: Array<{ id: string; name: string }> }) {
  const [form, setForm] = useState({
    subjectId: '', question: '', questionType: 'Multiple Choice', correctAnswer: '', marks: '1',
    difficulty: 'Medium', topic: '', bloomLevel: 'Knowledge', optA: '', optB: '', optC: '', optD: '',
  })
  const [saving, setSaving] = useState(false)
  const handleSubmit = async () => {
    if (!form.question) { toast.error('Question is required'); return }
    setSaving(true)
    try {
      const options = form.questionType === 'Multiple Choice' ? [form.optA, form.optB, form.optC, form.optD].filter(Boolean) : undefined
      await apiPost('/api/exams', { ...form, entityType: 'question', options, marks: Number(form.marks) })
      toast.success('Question added')
      onClose()
    } catch (e: any) { toast.error(e?.message || 'Failed') }
    finally { setSaving(false) }
  }
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-emerald-500" /> Add Question</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Subject</Label><Select value={form.subjectId} onValueChange={v => setForm({ ...form, subjectId: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select subject" /></SelectTrigger><SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
          <div><Label className="text-xs">Question *</Label><Textarea value={form.question} onChange={e => setForm({ ...form, question: e.target.value })} className="mt-1" rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Type</Label><Select value={form.questionType} onValueChange={v => setForm({ ...form, questionType: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Multiple Choice">Multiple Choice</SelectItem><SelectItem value="True/False">True/False</SelectItem><SelectItem value="Short Answer">Short Answer</SelectItem><SelectItem value="Essay">Essay</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Difficulty</Label><Select value={form.difficulty} onValueChange={v => setForm({ ...form, difficulty: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Easy">Easy</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="Hard">Hard</SelectItem></SelectContent></Select></div>
          </div>
          {form.questionType === 'Multiple Choice' && (
            <div className="grid grid-cols-2 gap-2">
              {['A', 'B', 'C', 'D'].map(l => (
                <div key={l}><Label className="text-xs">Option {l}</Label><Input value={(form as any)[`opt${l}`]} onChange={e => setForm({ ...form, [`opt${l}`]: e.target.value })} className="mt-1" /></div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs">Marks</Label><Input type="number" value={form.marks} onChange={e => setForm({ ...form, marks: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Topic</Label><Input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Bloom Level</Label><Select value={form.bloomLevel} onValueChange={v => setForm({ ...form, bloomLevel: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Knowledge">Knowledge</SelectItem><SelectItem value="Comprehension">Comprehension</SelectItem><SelectItem value="Application">Application</SelectItem><SelectItem value="Analysis">Analysis</SelectItem><SelectItem value="Synthesis">Synthesis</SelectItem></SelectContent></Select></div>
          </div>
          <div><Label className="text-xs">Correct Answer</Label><Input value={form.correctAnswer} onChange={e => setForm({ ...form, correctAnswer: e.target.value })} className="mt-1" /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving} className="bg-emerald-600 hover:bg-emerald-700">{saving ? 'Saving...' : 'Add Question'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function AddAssessmentDialog({ onClose, subjects }: { onClose: () => void; subjects: Array<{ id: string; name: string }> }) {
  const [form, setForm] = useState({
    title: '', subjectId: '', assessmentType: 'CAT', totalMarks: '40', weight: '15', duration: '60', startDate: '', status: 'Draft', instructions: '', rubric: '',
  })
  const [saving, setSaving] = useState(false)
  const handleSubmit = async () => {
    if (!form.title || !form.startDate) { toast.error('Title and start date are required'); return }
    setSaving(true)
    try {
      await apiPost('/api/exams', { ...form, entityType: 'assessment', totalMarks: Number(form.totalMarks), weight: Number(form.weight), duration: Number(form.duration) })
      toast.success('Assessment created')
      onClose()
    } catch (e: any) { toast.error(e?.message || 'Failed') }
    finally { setSaving(false) }
  }
  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-lg max-h-[92vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="h-5 w-5 text-teal-500" /> Create Assessment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Title *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="mt-1" /></div>
          <div><Label className="text-xs">Subject</Label><Select value={form.subjectId} onValueChange={v => setForm({ ...form, subjectId: v })}><SelectTrigger className="mt-1"><SelectValue placeholder="Select subject" /></SelectTrigger><SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs">Type</Label><Select value={form.assessmentType} onValueChange={v => setForm({ ...form, assessmentType: v })}><SelectTrigger className="mt-1"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="CAT">CAT</SelectItem><SelectItem value="Quiz">Quiz</SelectItem><SelectItem value="Assignment">Assignment</SelectItem><SelectItem value="Project">Project</SelectItem><SelectItem value="Mock">Mock</SelectItem><SelectItem value="Practical">Practical</SelectItem></SelectContent></Select></div>
            <div><Label className="text-xs">Marks</Label><Input type="number" value={form.totalMarks} onChange={e => setForm({ ...form, totalMarks: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Weight %</Label><Input type="number" value={form.weight} onChange={e => setForm({ ...form, weight: e.target.value })} className="mt-1" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Duration (min)</Label><Input type="number" value={form.duration} onChange={e => setForm({ ...form, duration: e.target.value })} className="mt-1" /></div>
            <div><Label className="text-xs">Start Date *</Label><Input type="datetime-local" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="mt-1" /></div>
          </div>
          <div><Label className="text-xs">Instructions</Label><Textarea value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} className="mt-1" rows={2} /></div>
          <div><Label className="text-xs">Grading Rubric</Label><Textarea value={form.rubric} onChange={e => setForm({ ...form, rubric: e.target.value })} className="mt-1" rows={2} /></div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} disabled={saving} className="bg-teal-600 hover:bg-teal-700">{saving ? 'Creating...' : 'Create'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// GradeEntryDialog — record/edit marks for each student in a class
// ---------------------------------------------------------------------------
function GradeEntryDialog({ assessment, onClose }: { assessment: any; onClose: () => void }) {
  // Fetch students enrolled in this assessment's class level
  const { data: studentsData, loading } = useFetch<any>(
    `/api/students?classLevel=${assessment.classLevelId || ''}&pageSize=200`
  )
  const [grades, setGrades] = useState<Record<string, string>>({})
  const [comments, setComments] = useState<Record<string, string>>({})
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const students = studentsData?.students || []

  const handleSave = async () => {
    const entries = Object.entries(grades).filter(([, m]) => m !== '' && m != null)
    if (entries.length === 0) {
      toast.error('Enter at least one mark')
      return
    }
    setSaving(true)
    try {
      let saved = 0
      for (const [studentId, marks] of entries) {
        const numMarks = Number(marks)
        if (!Number.isFinite(numMarks) || numMarks < 0 || numMarks > assessment.totalMarks) continue
        try {
          await apiPost('/api/grades', {
            studentId,
            subjectId: assessment.subjectId,
            examId: assessment.id,
            marks: numMarks,
            totalMarks: assessment.totalMarks,
            source: 'internal',
            teacherComment: comments[studentId]?.trim() || null,
            remarks: comments[studentId]?.trim() || null,
          })
          saved++
        } catch { /* skip individual errors */ }
      }
      toast.success(`${saved} grade${saved !== 1 ? 's' : ''} saved`, {
        description: `${assessment.title} · ${assessment.subject?.name}`,
      })
      onClose()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save grades')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ClipboardEdit className="h-5 w-5 text-teal-500" /> Record Grades & Remarks
          </DialogTitle>
          <DialogDescription>
            {assessment.title} · {assessment.subject?.name} · Max {assessment.totalMarks} marks
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <Skeleton className="h-48 w-full" />
        ) : students.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No students found in this class level.
          </div>
        ) : (
          <div className="space-y-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Adm No</TableHead>
                  <TableHead className="text-xs">Student Name</TableHead>
                  <TableHead className="text-xs text-right">Marks / {assessment.totalMarks}</TableHead>
                  <TableHead className="text-xs">CBE Level</TableHead>
                  <TableHead className="text-xs">Teacher Comment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s: any) => {
                  const marks = grades[s.id]
                  const pct = marks ? (Number(marks) / assessment.totalMarks) * 100 : 0
                  const cbcLevel = marks ? (pct >= 80 ? '4 (Exceeding)' : pct >= 50 ? '3 (Meeting)' : pct >= 30 ? '2 (Approaching)' : '1 (Below)') : '—'
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="text-xs font-mono">{s.admissionNo}</TableCell>
                      <TableCell className="text-xs">{s.firstName} {s.lastName}</TableCell>
                      <TableCell className="text-right">
                        <Input
                          type="number"
                          min="0"
                          max={assessment.totalMarks}
                          step="0.5"
                          value={grades[s.id] || ''}
                          onChange={(e) => setGrades({ ...grades, [s.id]: e.target.value })}
                          className="ml-auto h-8 w-24 text-xs"
                          placeholder="—"
                        />
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className={`text-[9px] ${pct >= 80 ? 'border-emerald-300 text-emerald-700' : pct >= 50 ? 'border-teal-300 text-teal-700' : pct >= 30 ? 'border-amber-300 text-amber-700' : 'border-rose-300 text-rose-700'}`}>
                          {cbcLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Input
                          value={comments[s.id] || ''}
                          onChange={(e) => setComments({ ...comments, [s.id]: e.target.value })}
                          placeholder="e.g. Good work, needs improvement in..."
                          className="h-8 text-xs"
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
            <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-3 dark:border-teal-800 dark:bg-teal-950/20">
              <p className="text-[10px] text-teal-700 dark:text-teal-400">
                <strong>CBE Levels:</strong> 4 = Exceeding Expectations (80%+) · 3 = Meeting Expectations (50%+) · 2 = Approaching Expectations (30%+) · 1 = Below Expectations (&lt;30%)
              </p>
              <p className="mt-1 text-[10px] text-teal-700 dark:text-teal-400">
                Teacher comments will appear on the student's report card and parent portal.
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Grades & Remarks
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// ExternalMarksDialog — add marks from external exams (KCPE, KCSE, mock, etc.)
// Allows choosing which subject the external marks belong to.
// ---------------------------------------------------------------------------
function ExternalMarksDialog({ assessment, onClose }: { assessment: any; onClose: () => void }) {
  const [externalSource, setExternalSource] = useState('KCSE Mock')
  const [subjectId, setSubjectId] = useState(assessment.subjectId || '')
  const [classLevelId, setClassLevelId] = useState(assessment.classLevelId || '')
  const [examName, setExamName] = useState('')
  const [totalMarks, setTotalMarks] = useState('100')
  const [marksText, setMarksText] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: studentsData, loading } = useFetch<any>(
    classLevelId ? `/api/students?classLevel=${classLevelId}&pageSize=200` : null
  )
  const { data: subjectsData } = useFetch<any>('/api/academics/subjects')
  const { data: classLevelsData } = useFetch<any>('/api/academics/class-levels')
  const students = studentsData?.students || []

  // Parse the pasted text (format: "admNo,marks" per line, or "name,marks")
  const parsedRows = marksText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(/[,\t]/).map(p => p.trim())
      return { admNoOrName: parts[0], marks: parts[1] || '' }
    })

  const handleSave = async () => {
    if (parsedRows.length === 0) {
      toast.error('Paste at least one row of marks (format: AdmissionNo,Marks)')
      return
    }
    if (!subjectId) {
      toast.error('Select the subject these marks belong to')
      return
    }
    setSaving(true)
    try {
      let saved = 0
      let skipped = 0
      for (const row of parsedRows) {
        // Match by admission number or name
        const student = students.find((s: any) =>
          s.admissionNo?.toLowerCase() === row.admNoOrName.toLowerCase() ||
          `${s.firstName} ${s.lastName}`.toLowerCase().includes(row.admNoOrName.toLowerCase())
        )
        if (!student) { skipped++; continue }
        const numMarks = Number(row.marks)
        if (!Number.isFinite(numMarks) || numMarks < 0) { skipped++; continue }
        try {
          await apiPost('/api/grades', {
            studentId: student.id,
            subjectId,
            examId: assessment.id,
            marks: numMarks,
            totalMarks: Number(totalMarks),
            source: 'external',
            externalSource,
            remarks: `External: ${externalSource}`,
          })
          saved++
        } catch { skipped++ }
      }
      toast.success(`${saved} external marks imported`, {
        description: skipped > 0 ? `${skipped} row(s) skipped (student not found or invalid marks)` : undefined,
      })
      if (saved > 0) onClose()
    } catch (e: any) {
      toast.error(e?.message || 'Failed to import external marks')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FilePlus className="h-5 w-5 text-amber-500" /> Add External Marks
          </DialogTitle>
          <DialogDescription>
            Import marks from external exams (KCPE, KCSE, Mock, etc.) not assessed in the system.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              <strong>How it works:</strong> Choose the subject and class level these marks belong to,
              then paste a list of <code className="rounded bg-amber-100 px-1">AdmissionNumber,Marks</code>
              (one per line). The system matches each row to a student and saves the grade.
            </p>
          </div>

          {/* Subject selector — lets you choose which subject to add marks to */}
          <div>
            <Label className="text-xs">Subject for these marks *</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select subject" /></SelectTrigger>
              <SelectContent>
                {(subjectsData?.subjects || subjectsData || []).map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-1 text-[10px] text-muted-foreground">
              You can choose a different subject than the assessment's default subject.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Class Level</Label>
              <Select value={classLevelId} onValueChange={setClassLevelId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {(classLevelsData?.classLevels || classLevelsData || []).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">External Source</Label>
              <Select value={externalSource} onValueChange={setExternalSource}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="KCSE Mock">KCSE Mock</SelectItem>
                  <SelectItem value="KCSE">KCSE (National)</SelectItem>
                  <SelectItem value="KCPE">KCPE (National)</SelectItem>
                  <SelectItem value="Joint Mock">Joint Mock (Multiple Schools)</SelectItem>
                  <SelectItem value="Opener Exam">Opener Exam (External)</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Exam Name (optional)</Label>
              <Input value={examName} onChange={e => setExamName(e.target.value)} placeholder="e.g. Term 2 Joint Mock" className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Total Marks</Label>
              <Input type="number" value={totalMarks} onChange={e => setTotalMarks(e.target.value)} className="mt-1" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Paste marks (one per line: AdmissionNo,Marks)</Label>
            <Textarea
              value={marksText}
              onChange={e => setMarksText(e.target.value)}
              placeholder={'ADM/001,85\nADM/002,72\nADM/003,91'}
              className="mt-1 font-mono text-xs"
              rows={6}
            />
            <p className="mt-1 text-[10px] text-muted-foreground">
              {parsedRows.length} row(s) detected · {students.length} students in class
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Import {parsedRows.length > 0 ? `(${parsedRows.length})` : ''}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ---------------------------------------------------------------------------
// ChangeSubjectDialog — change the subject assigned to an assessment
// (in case it was wrongly chosen when creating)
// ---------------------------------------------------------------------------
function ChangeSubjectDialog({ assessment, onClose }: { assessment: any; onClose: () => void }) {
  const [subjectId, setSubjectId] = useState(assessment.subjectId || '')
  const [saving, setSaving] = useState(false)
  const { data: subjectsData } = useFetch<any>('/api/academics/subjects')
  const subjects = subjectsData?.subjects || subjectsData || []

  const handleSave = async () => {
    if (!subjectId) { toast.error('Select a subject'); return }
    if (subjectId === assessment.subjectId) {
      toast.info('Subject unchanged')
      onClose()
      return
    }
    setSaving(true)
    try {
      await apiPut(`/api/exams/${assessment.id}`, { subjectId, entityType: 'assessment' })
      toast.success('Subject updated', {
        description: `Changed from ${assessment.subject?.name} to ${subjects.find((s: any) => s.id === subjectId)?.name}`,
      })
      onClose()
      // Trigger a refetch of the assessment
      setTimeout(() => window.location.reload(), 500)
    } catch (e: any) {
      toast.error(e?.message || 'Failed to change subject')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-teal-500" /> Change Subject
          </DialogTitle>
          <DialogDescription>
            Current: {assessment.subject?.name} — select a new subject for this assessment.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">New Subject</Label>
            <Select value={subjectId} onValueChange={setSubjectId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select new subject" /></SelectTrigger>
              <SelectContent>
                {subjects.map((s: any) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.code})
                    {s.id === assessment.subjectId && ' (current)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-800 dark:bg-amber-950/20">
            <p className="text-[10px] text-amber-800 dark:text-amber-300">
              <strong>Note:</strong> Changing the subject will move all grades recorded for this
              assessment to the new subject. This cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Change Subject
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
