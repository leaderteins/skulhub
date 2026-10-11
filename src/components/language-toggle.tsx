'use client'
import { useState, useEffect } from 'react'
import { Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function LanguageToggle() {
  const [lang, setLang] = useState<'en' | 'sw'>('en')

  useEffect(() => { const saved = localStorage.getItem('lang') as 'en' | 'sw' | null; if (saved) setLang(saved) }, [])
  
  const toggle = () => { const next = lang === 'en' ? 'sw' : 'en'; setLang(next); localStorage.setItem('lang', next); window.location.reload() }

  return <Button variant="ghost" size="sm" onClick={toggle} className="gap-1.5"><Globe className="h-4 w-4" />{lang === 'en' ? 'EN' : 'SW'}</Button>
}
