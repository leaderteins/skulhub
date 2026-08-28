'use client'
import { School, Heart, Calendar } from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'

export function Footer() {
  const { user } = useAuthStore()
  const schoolName = user?.schoolName || 'SkulHub'

  return (
    <footer className="mt-auto border-t border-border bg-background/60 px-4 py-3 backdrop-blur md:px-6">
      <div className="flex flex-col items-center justify-between gap-2 text-xs text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <School className="h-3.5 w-3.5 text-emerald-600" />
          <span className="font-medium">{schoolName}</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">Empowering Kenyan education, scalable worldwide</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <Calendar className="h-3 w-3 text-emerald-600" />
            <span>Term 1, 2025</span>
          </span>
          <span className="hidden sm:inline">·</span>
          <span className="flex items-center gap-1.5">
            <span>© {new Date().getFullYear()} · Built with</span>
            <Heart className="h-3 w-3 fill-rose-500 text-rose-500" />
            <span>for learners</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
