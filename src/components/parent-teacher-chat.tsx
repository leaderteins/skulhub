'use client'
import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Send, MessageCircle } from 'lucide-react'

export function ParentTeacherChat({ studentId, userRole }: { studentId: string; userRole: string }) {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(true)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`/api/parent-chat?studentId=${studentId}`).then(r => r.json()).then(d => { setMessages((d?.messages || []) || []); setLoading(false) }).catch(() => setLoading(false))
    const interval = setInterval(() => {
      fetch(`/api/parent-chat?studentId=${studentId}`).then(r => r.json()).then(d => setMessages((d?.messages || []) || [])).catch(() => {})
    }, 5000)
    return () => clearInterval(interval)
  }, [studentId])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!input.trim()) return
    const msg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { details: msg, user: 'You', action: userRole === 'parent' ? 'PARENT_CHAT' : 'TEACHER_CHAT', createdAt: new Date().toISOString() }])
    await fetch('/api/parent-chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, message: msg }) })
  }

  return (
    <div className="flex h-[400px] flex-col rounded-xl border bg-card">
      <div className="flex items-center gap-2 border-b p-3"><MessageCircle className="h-5 w-5 text-emerald-600" /><h3 className="font-semibold">Parent-Teacher Chat</h3></div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {loading ? <p className="text-center text-sm text-muted-foreground">Loading messages...</p> :
        messages.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Start the conversation!</p> :
        (messages || []).map((m, i) => {
          const isTeacher = m.action === 'TEACHER_CHAT'
          const isMine = (userRole === 'parent' && !isTeacher) || (userRole !== 'parent' && isTeacher)
          return (
            <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${isMine ? 'bg-emerald-600 text-white' : 'bg-muted'}`}>
                <p>{m.details}</p>
                <p className="mt-1 text-[10px] opacity-70">{m.user} · {new Date(m.createdAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>
      <div className="flex gap-2 border-t p-3">
        <Input placeholder="Type a message..." value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send() }} className="flex-1" />
        <Button size="icon" onClick={send} className="bg-emerald-600 hover:bg-emerald-700"><Send className="h-4 w-4" /></Button>
      </div>
    </div>
  )
}
