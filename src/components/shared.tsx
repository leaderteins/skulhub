'use client'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  icon: LucideIcon
  trend?: number
  trendLabel?: string
  accent?: 'emerald' | 'teal' | 'amber' | 'rose' | 'violet' | 'cyan'
  loading?: boolean
  footer?: React.ReactNode
}

const ACCENTS: Record<string, { bg: string; text: string; glow: string; ring: string }> = {
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', glow: 'oklch(0.6 0.13 160 / 0.15)', ring: 'ring-emerald-500/20' },
  teal: { bg: 'bg-teal-500/10', text: 'text-teal-600 dark:text-teal-400', glow: 'oklch(0.62 0.1 200 / 0.15)', ring: 'ring-teal-500/20' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', glow: 'oklch(0.7 0.15 70 / 0.15)', ring: 'ring-amber-500/20' },
  rose: { bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', glow: 'oklch(0.65 0.2 25 / 0.15)', ring: 'ring-rose-500/20' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-600 dark:text-violet-400', glow: 'oklch(0.55 0.18 300 / 0.15)', ring: 'ring-violet-500/20' },
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-600 dark:text-cyan-400', glow: 'oklch(0.7 0.13 200 / 0.15)', ring: 'ring-cyan-500/20' },
}

export function StatCard({ label, value, icon: Icon, trend, trendLabel, accent = 'emerald', loading, footer }: StatCardProps) {
  const a = ACCENTS[accent]
  if (loading) {
    return (
      <Card className="overflow-hidden">
        <CardContent className="p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-3 h-8 w-32" />
          <Skeleton className="mt-3 h-3 w-20" />
        </CardContent>
      </Card>
    )
  }
  const trendUp = (trend || 0) >= 0
  return (
    <Card className="stat-card relative overflow-hidden transition-all hover:shadow-md" style={{ ['--accent-glow' as any]: a.glow }}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
            <p className="mt-1.5 text-2xl font-bold tracking-tight text-foreground">{value}</p>
          </div>
          <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1', a.bg, a.text, a.ring)}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        {(trend !== undefined || footer) && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            {trend !== undefined && (
              <span className={cn('inline-flex items-center gap-0.5 font-semibold', trendUp ? 'text-emerald-600' : 'text-rose-600')}>
                {trendUp ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {Math.abs(trend)}%
              </span>
            )}
            {trendLabel && <span className="text-muted-foreground">{trendLabel}</span>}
            {footer}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface SectionHeaderProps {
  title: string
  description?: string
  icon?: LucideIcon
  action?: React.ReactNode
}

export function SectionHeader({ title, description, icon: Icon, action }: SectionHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Icon className="h-4.5 w-4.5" />
          </div>
        )}
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {action}
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, action }: { icon: LucideIcon; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-12 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="font-medium">{title}</p>
        {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  )
}
