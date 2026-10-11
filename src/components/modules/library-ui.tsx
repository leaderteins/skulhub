'use client'
import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, BookOpen, ScanLine, Check, X } from 'lucide-react'

export function LibraryManagement() {
  const [books, setBooks] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [checkoutBook, setCheckoutBook] = useState<string | null>(null)
  const [studentAdm, setStudentAdm] = useState('')

  useEffect(() => {
    fetch(`/api/library${search ? `?search=${encodeURIComponent(search)}` : ''}`).then(r => r.json()).then(d => { setBooks((d?.books || []) || []); setLoading(false) }).catch(() => setLoading(false))
  }, [search])

  const handleAction = async (bookId: string, action: 'checkout' | 'return') => {
    if (action === 'checkout' && !studentAdm) { setCheckoutBook(bookId); return }
    await fetch('/api/library', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookId, studentId: studentAdm, action }) })
    setCheckoutBook(null); setStudentAdm('')
    fetch(`/api/library${search ? `?search=${encodeURIComponent(search)}` : ''}`).then(r => r.json()).then(d => setBooks((d?.books || []) || []))
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      <div className="flex items-center gap-2"><BookOpen className="h-6 w-6 text-emerald-600" /><h1 className="text-2xl font-bold">Library Management</h1></div>
      <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input placeholder="Search by title, author, or ISBN..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" /></div>
      {checkoutBook && (
        <Card><CardContent className="flex items-center gap-2 p-4">
          <ScanLine className="h-5 w-5 text-emerald-600" /><Input placeholder="Enter student admission number..." value={studentAdm} onChange={e => setStudentAdm(e.target.value)} className="flex-1" />
          <Button onClick={() => handleAction(checkoutBook, 'checkout')} className="bg-emerald-600">Check Out</Button><Button variant="ghost" onClick={() => setCheckoutBook(null)}>Cancel</Button>
        </CardContent></Card>
      )}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(books || []).map(b => (
          <Card key={b.id}><CardContent className="p-4">
            <div className="flex items-start justify-between"><div><h3 className="font-semibold text-sm">{b.title}</h3><p className="text-xs text-muted-foreground">{b.author}</p></div><Badge variant={b.available ? 'default' : 'secondary'} className={b.available ? 'bg-emerald-600' : 'bg-rose-500'}>{b.available ? 'Available' : 'Out'}</Badge></div>
            <p className="mt-2 text-xs text-muted-foreground">ISBN: {b.isbn || 'N/A'}</p>
            <Button size="sm" variant="outline" className="mt-2 w-full" onClick={() => b.available ? setCheckoutBook(b.id) : handleAction(b.id, 'return')}>
              {b.available ? <><ScanLine className="mr-1 h-3 w-3" /> Check Out</> : <><Check className="mr-1 h-3 w-3" /> Return</>}
            </Button>
          </CardContent></Card>
        ))}
      </div>
    </div>
  )
}
