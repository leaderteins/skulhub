'use client'

import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

/**
 * error.tsx — Next.js App Router error boundary.
 * Catches client-side exceptions and shows a friendly recovery page
 * instead of the generic "Application error" page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
      <div className="max-w-md space-y-4 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/40">
          <AlertCircle className="h-8 w-8 text-rose-500" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We encountered an unexpected error. This is usually a temporary
            issue — please try again. If the problem persists, try clearing
            your browser cache or using a different browser.
          </p>
        </div>
        {process.env.NODE_ENV === 'development' && error?.message && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-left dark:border-rose-900 dark:bg-rose-950/30">
            <p className="font-mono text-xs text-rose-700 dark:text-rose-400">
              {error.message.slice(0, 300)}
            </p>
            {error.digest && (
              <p className="mt-1 text-[10px] text-muted-foreground">Error ID: {error.digest}</p>
            )}
          </div>
        )}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={reset} className="bg-emerald-600 hover:bg-emerald-700">
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
          <Button variant="outline" onClick={() => { window.location.href = '/' }}>
            <Home className="mr-2 h-4 w-4" /> Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}
