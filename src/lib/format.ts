import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency in Kenyan Shillings
export function formatKES(amount: number): string {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    maximumFractionDigits: 0,
  }).format(amount || 0)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-KE').format(n || 0)
}

export function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'K'
  return String(n)
}

export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-KE', opts || { year: 'numeric', month: 'short', day: 'numeric' })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleString('en-KE', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000)
  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(d)
}

export function initials(first: string, last?: string): string {
  return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase()
}

export function fullName(p: { firstName: string; lastName: string }): string {
  return `${p.firstName} ${p.lastName}`
}

const AVATAR_COLORS = [
  'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-green-600',
  'bg-amber-500', 'bg-orange-500', 'bg-rose-500', 'bg-pink-500',
  'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-lime-600',
]

export function avatarColor(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

export function gradeColor(grade: string): string {
  if (grade.startsWith('A')) return 'text-emerald-600 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-900'
  if (grade.startsWith('B')) return 'text-teal-600 bg-teal-50 border-teal-200 dark:text-teal-400 dark:bg-teal-950 dark:border-teal-900'
  if (grade.startsWith('C')) return 'text-amber-600 bg-amber-50 border-amber-200 dark:text-amber-400 dark:bg-amber-950 dark:border-amber-900'
  if (grade.startsWith('D')) return 'text-orange-600 bg-orange-50 border-orange-200 dark:text-orange-400 dark:bg-orange-950 dark:border-orange-900'
  return 'text-rose-600 bg-rose-50 border-rose-200 dark:text-rose-400 dark:bg-rose-950 dark:border-rose-900'
}

export function statusColor(status: string): string {
  const s = status.toLowerCase()
  if (s.includes('active') || s.includes('paid') || s.includes('present') || s.includes('available') || s.includes('returned') || s.includes('delivered') || s.includes('sent')) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
  if (s.includes('partial') || s.includes('late') || s.includes('borrowed') || s.includes('queued')) return 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
  if (s.includes('overdue') || s.includes('unpaid') || s.includes('absent') || s.includes('failed') || s.includes('suspended') || s.includes('dropped') || s.includes('urgent')) return 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
  if (s.includes('excused') || s.includes('on leave') || s.includes('maintenance') || s.includes('high') || s.includes('contract')) return 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400'
  return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
}

export function priorityColor(priority: string): string {
  const p = priority.toLowerCase()
  if (p === 'urgent') return 'bg-rose-500'
  if (p === 'high') return 'bg-orange-500'
  if (p === 'normal') return 'bg-emerald-500'
  return 'bg-slate-400'
}
