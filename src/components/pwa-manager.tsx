'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, X } from 'lucide-react'
export function PwaManager() {
  const [prompt, setPrompt] = useState<any>(null)
  const [show, setShow] = useState(false)
  useEffect(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => {})
    const h = (e: any) => { e.preventDefault(); setPrompt(e); setTimeout(() => setShow(true), 5000) }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])
  const install = async () => { if (!prompt) return; prompt.prompt(); await prompt.userChoice; setPrompt(null); setShow(false) }
  if (!show) return null
  return (<div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-sm"><div className="flex items-center gap-3 rounded-xl border bg-card p-4 shadow-2xl"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-950"><Download className="h-5 w-5 text-emerald-600" /></div><div className="flex-1"><p className="text-sm font-semibold">Install SkulHub</p><p className="text-xs text-muted-foreground">Add to home screen</p></div><Button size="sm" className="bg-emerald-600 hover:bg-emerald-700" onClick={install}>Install</Button><Button size="sm" variant="ghost" onClick={() => setShow(false)}><X className="h-4 w-4" /></Button></div></div>)
}
