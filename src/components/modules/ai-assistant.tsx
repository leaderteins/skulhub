'use client'
import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Bot, Send, Sparkles, BookOpen, FileText, Loader2, MessageSquare,
  User, Copy, Download, RefreshCw,
} from 'lucide-react'

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
}

interface Student {
  id: string
  firstName: string
  lastName: string
  admissionNo: string
}

export function AIAssistantModule() {
  const [activeTab, setActiveTab] = useState<'chat' | 'exam' | 'remarks'>('chat')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Sparkles className="h-6 w-6 text-emerald-600" /> AI Assistant
        </h2>
        <p className="text-sm text-muted-foreground">
          AI-powered tools for parents, teachers, and administrators
        </p>
      </div>

      {/* Tab selector */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeTab === 'chat' ? 'default' : 'outline'}
          size="sm"
          className={activeTab === 'chat' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          onClick={() => setActiveTab('chat')}
        >
          <MessageSquare className="mr-1.5 h-4 w-4" /> Parent Chatbot
        </Button>
        <Button
          variant={activeTab === 'exam' ? 'default' : 'outline'}
          size="sm"
          className={activeTab === 'exam' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          onClick={() => setActiveTab('exam')}
        >
          <BookOpen className="mr-1.5 h-4 w-4" /> Exam Questions
        </Button>
        <Button
          variant={activeTab === 'remarks' ? 'default' : 'outline'}
          size="sm"
          className={activeTab === 'remarks' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
          onClick={() => setActiveTab('remarks')}
        >
          <FileText className="mr-1.5 h-4 w-4" /> Report Comments
        </Button>
      </div>

      {activeTab === 'chat' && <ChatTab />}
      {activeTab === 'exam' && <ExamQuestionsTab />}
      {activeTab === 'remarks' && <ReportCommentsTab />}
    </div>
  )
}

// ---------------------------------------------------------------------------
// 1. PARENT CHATBOT
// ---------------------------------------------------------------------------
function ChatTab() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can answer questions about your child\'s attendance, fees, grades, and more. How can I help you today?',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/students').then(r => r.json()).then(d => {
      setStudents((d.students || []).slice(0, 50))
    }).catch(() => {})
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight)
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg.content,
          studentId: selectedStudent || undefined,
          history: messages.slice(-6).map(m => ({ role: m.role, content: m.content })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, timestamp: data.timestamp }])
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `Sorry, I couldn't process that. ${e.message}` }])
    } finally {
      setLoading(false)
    }
  }

  const suggestions = [
    "What's my child's attendance rate?",
    'How much is the fee balance?',
    'What were the latest exam results?',
    'Is my child boarding or day scholar?',
  ]

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {/* Chat panel */}
      <Card className="lg:col-span-3">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-5 w-5 text-emerald-600" /> AI Parent Assistant
            </CardTitle>
            {selectedStudent && (
              <Badge variant="outline" className="border-emerald-300 bg-emerald-50/50 text-emerald-700">
                {students.find(s => s.id === selectedStudent)?.firstName} {students.find(s => s.id === selectedStudent)?.lastName}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div ref={scrollRef} className="h-[400px] space-y-3 overflow-y-auto rounded-lg border bg-muted/20 p-4">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === 'assistant' ? 'bg-emerald-100 dark:bg-emerald-950' : 'bg-blue-100 dark:bg-blue-950'}`}>
                  {msg.role === 'assistant' ? <Bot className="h-4 w-4 text-emerald-600" /> : <User className="h-4 w-4 text-blue-600" />}
                </div>
                <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'assistant' ? 'bg-background border' : 'bg-emerald-600 text-white'}`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950">
                  <Bot className="h-4 w-4 text-emerald-600" />
                </div>
                <div className="flex items-center gap-1 rounded-2xl border bg-background px-4 py-3">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-400 [animation-delay:300ms]" />
                </div>
              </div>
            )}
          </div>

          {/* Suggestions */}
          <div className="mt-3 flex flex-wrap gap-2">
            {suggestions.map(s => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                {s}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="mt-3 flex gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your child..."
              disabled={loading}
            />
            <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSend} disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Student selector */}
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Context</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Select Student (for context)</label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="None — generic mode" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.firstName} {s.lastName} · {s.admissionNo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg bg-emerald-50 p-3 dark:bg-emerald-950/20">
            <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
              <Sparkles className="mb-1 inline h-3 w-3" />
              The AI uses the selected student's real data (attendance, fees, grades) to answer questions accurately.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 2. EXAM QUESTION GENERATOR
// ---------------------------------------------------------------------------
function ExamQuestionsTab() {
  const [form, setForm] = useState({
    subject: 'Mathematics',
    topic: '',
    level: 'KCSE',
    questionType: 'mixed',
    count: 5,
  })
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (!form.topic.trim()) { toast.error('Please enter a topic'); return }
    setLoading(true)
    setResult('')
    try {
      const res = await fetch('/api/ai/exam-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data.questions)
      toast.success('Questions generated!', { description: `${form.count} ${form.level} ${form.subject} questions` })
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><BookOpen className="h-4 w-4 text-emerald-600" /> Question Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">Subject</label>
            <Select value={form.subject} onValueChange={v => setForm({ ...form, subject: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {['Mathematics', 'English', 'Kiswahili', 'Biology', 'Chemistry', 'Physics', 'History', 'Geography', 'CRE', 'IRE', 'Business Studies', 'Computer Studies', 'Agriculture', 'Home Science', 'French'].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Topic</label>
            <Input value={form.topic} onChange={e => setForm({ ...form, topic: e.target.value })} placeholder="e.g. Quadratic Equations" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="mb-1 block text-xs font-medium">Level</label>
              <Select value={form.level} onValueChange={v => setForm({ ...form, level: v })}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['KCSE', 'KCPE', 'CBE', 'Form 1', 'Form 2', 'Form 3', 'Form 4'].map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium">Count</label>
              <Input type="number" min={1} max={20} value={form.count} onChange={e => setForm({ ...form, count: parseInt(e.target.value) || 5 })} />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium">Question Type</label>
            <Select value={form.questionType} onValueChange={v => setForm({ ...form, questionType: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="short_answer">Short Answer</SelectItem>
                <SelectItem value="essay">Essay</SelectItem>
                <SelectItem value="mixed">Mixed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleGenerate} disabled={loading}>
            {loading ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-1.5 h-4 w-4" /> Generate Questions</>}
          </Button>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">Generated Questions</CardTitle>
          {result && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(result); toast.success('Copied to clipboard') }}>
                <Copy className="mr-1 h-3.5 w-3.5" /> Copy
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm text-muted-foreground">AI is generating {form.count} {form.subject} questions...</p>
            </div>
          ) : result ? (
            <ScrollArea className="h-[500px]">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{result}</pre>
            </ScrollArea>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <BookOpen className="mb-2 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Enter a topic and click "Generate Questions"</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// 3. REPORT CARD COMMENTS
// ---------------------------------------------------------------------------
function ReportCommentsTab() {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ teacherComment: string; principalComment: string; summary: any } | null>(null)

  useEffect(() => {
    fetch('/api/students').then(r => r.json()).then(d => {
      setStudents((d.students || []).slice(0, 100))
    }).catch(() => {})
  }, [])

  async function handleGenerate() {
    if (!selectedStudent) { toast.error('Select a student'); return }
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/ai/report-comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: selectedStudent }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setResult(data)
      toast.success('Comments generated!')
    } catch (e: any) {
      toast.error(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-1">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4 text-emerald-600" /> Comment Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium">Student</label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent className="max-h-60">
                {students.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} · {s.admissionNo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700" onClick={handleGenerate} disabled={loading || !selectedStudent}>
            {loading ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-1.5 h-4 w-4" /> Generate Comments</>}
          </Button>
          {result?.summary && (
            <div className="rounded-lg border p-3 text-xs">
              <p className="font-medium">Summary</p>
              <p>Mean Score: {result.summary.meanScore}%</p>
              <p>Attendance: {result.summary.attendanceRate}%</p>
              <p>Subjects: {result.summary.totalSubjects}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">AI-Generated Comments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="mb-3 h-8 w-8 animate-spin text-emerald-600" />
              <p className="text-sm text-muted-foreground">AI is writing personalized comments...</p>
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400"><User className="h-3.5 w-3.5" /> Class Teacher's Comment</p>
                <p className="text-sm">{result.teacherComment}</p>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-900 dark:bg-blue-950/20">
                <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-blue-700 dark:text-blue-400"><Sparkles className="h-3.5 w-3.5" /> Principal's Comment</p>
                <p className="text-sm">{result.principalComment}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
                navigator.clipboard.writeText(`Teacher: ${result.teacherComment}\n\nPrincipal: ${result.principalComment}`)
                toast.success('Copied to clipboard')
              }}>
                <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy Both
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FileText className="mb-2 h-10 w-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Select a student and generate AI-powered report card comments</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
