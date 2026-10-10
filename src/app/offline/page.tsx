'use client'
import { WifiOff, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950">
      <div className="max-w-md space-y-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/40">
          <WifiOff className="h-8 w-8 text-emerald-600" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">You are Offline</h1>
        <p className="text-sm text-muted-foreground">SkulHub works in offline mode. Your data is safe. You will be reconnected automatically when your network returns.</p>
        <Button onClick={() => window.location.reload()} className="bg-emerald-600 hover:bg-emerald-700">
          <RefreshCw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    </div>
  )
}
