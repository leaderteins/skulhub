'use client'
import { useFetch } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn, formatNumber, timeAgo } from '@/lib/format'
import {
  School, Clock, CalendarDays, Users, CalendarCheck, Megaphone,
  UtensilsCrossed, Coffee, Sun, Moon, Cookie, BookOpen, Bell, TrendingUp,
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface StaffRoomData {
  stats: { totalStudents: number; totalStaff: number; presentToday: number; attendanceRate: number }
  announcements: Array<{ id: string; title: string; body: string; priority: string; pinned: boolean; publishedAt: string; authorName: string | null }>
  todayMeals: Array<{ id: string; mealType: string; item: string; accompaniment: string | null; beverage: string | null; date: string; status: string }>
  upcomingEvents: Array<{ id: string; title: string; startDate: string; category: string; location: string | null }>
}

const MEAL_ICONS: Record<string, any> = { Breakfast: Coffee, Lunch: Sun, 'Tea Break': Cookie, Supper: Moon }

export function StaffRoomModule() {
  const { user } = useAuthStore()
  const { data, loading } = useFetch<StaffRoomData>('/api/staffroom')
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-xl" />)}</div>
      </div>
    )
  }

  const d = data!
  const timeStr = now.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })
  const dateStr = now.toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-8 text-white shadow-2xl">
        <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 backdrop-blur"><School className="h-8 w-8" /></div>
            <div><h1 className="text-3xl font-bold tracking-tight">EduManage Academy</h1><p className="text-sm text-white/80">Staff Room Information Board</p></div>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-2"><Clock className="h-6 w-6 text-emerald-300" /><span className="font-mono text-4xl font-bold tabular-nums">{timeStr}</span></div>
            <p className="mt-1 text-sm text-white/80">{dateStr}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card"><CardContent className="flex items-center gap-3 p-5"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20"><Users className="h-6 w-6" /></div><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Total Students</p><p className="text-2xl font-bold">{formatNumber(d.stats.totalStudents)}</p></div></CardContent></Card>
        <Card className="stat-card"><CardContent className="flex items-center gap-3 p-5"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-500/10 text-teal-600 ring-1 ring-teal-500/20"><CalendarCheck className="h-6 w-6" /></div><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Present Today</p><p className="text-2xl font-bold">{d.stats.presentToday}</p><p className="text-[10px] text-muted-foreground">{d.stats.attendanceRate}% attendance</p></div></CardContent></Card>
        <Card className="stat-card"><CardContent className="flex items-center gap-3 p-5"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20"><BookOpen className="h-6 w-6" /></div><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Teaching Staff</p><p className="text-2xl font-bold">{formatNumber(d.stats.totalStaff)}</p></div></CardContent></Card>
        <Card className="stat-card"><CardContent className="flex items-center gap-3 p-5"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20"><TrendingUp className="h-6 w-6" /></div><div><p className="text-xs uppercase tracking-wide text-muted-foreground">Term Progress</p><p className="text-2xl font-bold">Week 8</p><p className="text-[10px] text-muted-foreground">of 13 weeks</p></div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600"><Megaphone className="h-5 w-5" /></div><CardTitle className="text-base">Announcements</CardTitle></div>
            <Badge variant="secondary" className="text-[10px]">{d.announcements.length} items</Badge>
          </CardHeader>
          <CardContent className="space-y-3">
            {d.announcements.slice(0, 6).map(a => (
              <div key={a.id} className={cn('rounded-lg border p-3', a.pinned && 'border-amber-300 bg-amber-50/40 dark:bg-amber-950/20')}>
                <div className="flex items-start gap-2">
                  {a.pinned && <span className="mt-0.5 text-xs">📌</span>}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{a.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{a.body}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">{a.authorName && <span>{a.authorName}</span>}<span>·</span><span>{timeAgo(a.publishedAt)}</span></div>
                  </div>
                </div>
              </div>
            ))}
            {d.announcements.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No announcements</p>}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-500/10 text-orange-600"><UtensilsCrossed className="h-5 w-5" /></div><CardTitle className="text-base">Today's Menu</CardTitle></div></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {d.todayMeals.length > 0 ? d.todayMeals.map(m => {
                  const Icon = MEAL_ICONS[m.mealType] || Coffee
                  return (<div key={m.id} className="rounded-lg border p-2.5"><div className="flex items-center gap-1.5"><Icon className="h-3.5 w-3.5 text-orange-500" /><span className="text-[10px] font-semibold uppercase">{m.mealType}</span></div><p className="mt-1 text-xs font-medium">{m.item}</p>{m.accompaniment && <p className="text-[10px] text-muted-foreground">+ {m.accompaniment}</p>}{m.beverage && <p className="text-[10px] text-muted-foreground">{m.beverage}</p>}</div>)
                }) : <p className="col-span-2 py-4 text-center text-xs text-muted-foreground">No meals scheduled</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3"><div className="flex items-center gap-2"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600"><CalendarDays className="h-5 w-5" /></div><CardTitle className="text-base">Upcoming Events</CardTitle></div></CardHeader>
            <CardContent className="space-y-2">
              {d.upcomingEvents.length > 0 ? d.upcomingEvents.slice(0, 4).map(e => (
                <div key={e.id} className="flex items-center gap-3 rounded-lg border p-2.5">
                  <div className="flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-lg border bg-violet-50 text-violet-600 dark:bg-violet-950/20"><span className="text-[8px] font-semibold uppercase">{new Date(e.startDate).toLocaleDateString('en-KE', { month: 'short' })}</span><span className="text-sm font-bold leading-none">{new Date(e.startDate).getDate()}</span></div>
                  <div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{e.title}</p><p className="truncate text-[10px] text-muted-foreground">{e.location || '—'}</p></div>
                  <Badge variant="outline" className="text-[9px]">{e.category}</Badge>
                </div>
              )) : <p className="py-4 text-center text-xs text-muted-foreground">No upcoming events</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 rounded-xl border bg-muted/30 py-3 text-xs text-muted-foreground"><Bell className="h-3.5 w-3.5" /><span>This board auto-updates. Logged in as <span className="font-semibold">{user?.name}</span></span></div>
    </div>
  )
}
