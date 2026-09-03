'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend,
} from 'recharts'
import {
  Trophy, BarChart3, PieChart as PieIcon, TrendingUp, TrendingDown,
  Users, BookOpen, Target, Award, Loader2, GraduationCap, Percent,
} from 'lucide-react'

interface Exam { id: string; name: string; term: string; academicYear: string; examType: string }

interface Analytics {
  totalStudents: number
  totalSubjects: number
  totalGrades: number
  overallMean: number
  passRate: number
  qualityGrades: number
  transitionRate: number
  failureRate: number
  subjectMeans: Array<{ subject: string; code: string; mean: number; highest: number; lowest: number; count: number }>
  gradeDistribution: Array<{ grade: string; count: number; color: string }>
  topStudents: Array<{ id: string; name: string; admissionNo: string; totalMarks: number; meanScore: number; meanGrade: string; subjectCount: number }>
}

export function ExamAnalyticsModule() {
  const [exams, setExams] = useState<Exam[]>([])
  const [selectedExam, setSelectedExam] = useState<string>('')
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/exams/analytics').then(r => r.json()).then(d => {
      setExams(d.exams || [])
      if (d.exams?.length > 0 && !selectedExam) {
        setSelectedExam(d.exams[0].id)
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedExam) return
    fetch(`/api/exams/analytics?examId=${selectedExam}`).then(r => r.json()).then(d => {
      setAnalytics(d.analytics)
    }).catch(() => {})
  }, [selectedExam])

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-emerald-600" /></div>
  }

  const examInfo = exams.find(e => e.id === selectedExam)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <BarChart3 className="h-6 w-6 text-emerald-600" /> KCSE Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Performance insights, grade distribution &amp; rankings
          </p>
        </div>
        <Select value={selectedExam} onValueChange={setSelectedExam}>
          <SelectTrigger className="w-full sm:w-72"><SelectValue placeholder="Select exam" /></SelectTrigger>
          <SelectContent className="max-h-60">
            {exams.map(e => (
              <SelectItem key={e.id} value={e.id}>
                {e.name} · {e.term} {e.academicYear}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!analytics || analytics.totalStudents === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <BarChart3 className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-sm font-medium text-muted-foreground">No analytics data available</p>
            <p className="text-xs text-muted-foreground/70">Select an exam with recorded grades to see analytics.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Overall Mean" value={analytics.overallMean.toFixed(2)} icon={Target} accent="emerald" sub="across all subjects" />
            <StatCard label="Pass Rate" value={`${analytics.passRate}%`} icon={Percent} accent="teal" sub="scored ≥ 50%" />
            <StatCard label="University Entry" value={`${analytics.transitionRate}%`} icon={GraduationCap} accent="cyan" sub="C+ and above" />
            <StatCard label="Quality Grades" value={`${analytics.qualityGrades}%`} icon={Award} accent="amber" sub="A and A-" />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Subject Mean Scores */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <BarChart3 className="h-4 w-4 text-emerald-600" /> Subject Performance
                </CardTitle>
                <CardDescription className="text-xs">Mean score per subject (highest scoring at top)</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.subjectMeans.slice(0, 10)} layout="vertical" margin={{ left: 0, right: 20, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.91 0.01 150)" horizontal={false} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="oklch(0.5 0.02 160)" />
                    <YAxis type="category" dataKey="subject" tick={{ fontSize: 10 }} width={100} stroke="oklch(0.5 0.02 160)" />
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} formatter={(v: any) => [`${v}%`, 'Mean Score']} />
                    <Bar dataKey="mean" fill="#10b981" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Grade Distribution */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <PieIcon className="h-4 w-4 text-emerald-600" /> Grade Distribution
                </CardTitle>
                <CardDescription className="text-xs">KCSE 12-point grading scale</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={analytics.gradeDistribution} dataKey="count" nameKey="grade" cx="50%" cy="50%" outerRadius={100} innerRadius={50} paddingAngle={2}>
                      {analytics.gradeDistribution.map((g, i) => <Cell key={i} fill={g.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid oklch(0.91 0.01 150)', fontSize: 12 }} formatter={(v: any, n: any) => [`${v} students`, `Grade ${n}`]} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Top Students Leaderboard */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-4 w-4 text-amber-500" /> Top 10 Students
              </CardTitle>
              <CardDescription className="text-xs">Ranked by total marks across all subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {analytics.topStudents.map((stu, i) => (
                    <div key={stu.id} className={`flex items-center gap-3 rounded-lg border p-3 ${i < 3 ? 'border-amber-300 bg-amber-50/50 dark:bg-amber-950/20' : ''}`}>
                      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${i === 0 ? 'bg-amber-400 text-white' : i === 1 ? 'bg-slate-400 text-white' : i === 2 ? 'bg-orange-400 text-white' : 'bg-muted text-muted-foreground'}`}>
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{stu.name}</p>
                        <p className="text-xs text-muted-foreground">{stu.admissionNo} · {stu.subjectCount} subjects</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold tabular-nums">{stu.totalMarks}</p>
                        <Badge variant="outline" className="text-[10px] border-emerald-300 text-emerald-700">
                          {stu.meanGrade} · {stu.meanScore.toFixed(1)}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Additional Stats */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/30"><TrendingDown className="h-5 w-5" /></div>
                <div><p className="text-xs text-muted-foreground">Failure Rate</p><p className="text-lg font-bold">{analytics.failureRate}%</p><p className="text-[10px] text-muted-foreground">D and below</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30"><Users className="h-5 w-5" /></div>
                <div><p className="text-xs text-muted-foreground">Students Examined</p><p className="text-lg font-bold">{analytics.totalStudents}</p><p className="text-[10px] text-muted-foreground">{analytics.totalGrades} grades recorded</p></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30"><BookOpen className="h-5 w-5" /></div>
                <div><p className="text-xs text-muted-foreground">Subjects Examined</p><p className="text-lg font-bold">{analytics.totalSubjects}</p><p className="text-[10px] text-muted-foreground">across all classes</p></div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}

function StatCard({ label, value, icon: Icon, accent, sub }: {
  label: string; value: string | number; icon: any;
  accent: 'emerald' | 'teal' | 'cyan' | 'amber'; sub: string
}) {
  const c = {
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
    teal: 'bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400',
    cyan: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-950/30 dark:text-cyan-400',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
  }
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
            <p className="mt-0.5 text-[10px] text-muted-foreground">{sub}</p>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${c[accent]}`}><Icon className="h-5 w-5" /></div>
        </div>
      </CardContent>
    </Card>
  )
}
