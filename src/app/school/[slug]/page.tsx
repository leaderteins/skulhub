import { NextRequest } from 'next/server'
import { School, MapPin, Phone, Mail, Users, GraduationCap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export default async function SchoolPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const res = await fetch(`https://www.skulhub.co.ke/api/school-portal?slug=${slug}`, { cache: 'no-store' }).catch(() => null)
  const school = res ? await res.json().catch(() => null) : null
  
  if (!school) return <div className="flex min-h-screen items-center justify-center"><div className="text-center"><h1 className="text-2xl font-bold">School Not Found</h1><Button asChild className="mt-4"><Link href="/">Back to Home</Link></Button></div></div>

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-2xl border bg-card p-8 shadow-xl">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold text-white" style={{ background: `linear-gradient(135deg, ${school.primaryColor}, #14b8a6)` }}>{school.name?.charAt(0) || 'S'}</div>
            <div><h1 className="text-3xl font-bold">{school.name}</h1><p className="text-sm text-muted-foreground">{school.motto}</p></div>
          </div>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 text-sm"><div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-emerald-600" /> {school.address || 'Nairobi, Kenya'}</div><div className="flex items-center gap-2"><Phone className="h-4 w-4 text-emerald-600" /> {school.phone || 'N/A'}</div><div className="flex items-center gap-2"><Mail className="h-4 w-4 text-emerald-600" /> {school.email}</div></div>
            <div className="space-y-2"><div className="flex items-center gap-2"><Users className="h-4 w-4 text-emerald-600" /> {school.studentCount} Students</div><div className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-emerald-600" /> {school.level}</div><Badge>{school.plan} Plan</Badge></div>
          </div>
        </div>
        <div className="mt-8 text-center"><p className="text-sm text-muted-foreground">Powered by</p><Link href="/" className="text-lg font-bold text-emerald-600">SkulHub — School Management System</Link></div>
      </div>
    </div>
  )
}
