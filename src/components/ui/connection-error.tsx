'use client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { WifiOff, RefreshCw, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

interface ConnectionErrorProps {
  message?: string
  onRetry?: () => void
  title?: string
}

/**
 * ConnectionError — a friendly error state shown when an API call fails.
 * Includes a "Try Again" button that calls onRetry (or reloads the page).
 */
export function ConnectionError({
  message = 'We couldn\'t load this data. This is usually a temporary connection issue.',
  onRetry,
  title = 'Connection Error',
}: ConnectionErrorProps) {
  const [retrying, setRetrying] = useState(false)

  const handleRetry = () => {
    setRetrying(true)
    if (onRetry) {
      onRetry()
      setTimeout(() => setRetrying(false), 1000)
    } else {
      // Fallback: reload the page
      window.location.reload()
    }
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
      <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
          <WifiOff className="h-7 w-7" />
        </div>
        <div>
          <p className="text-lg font-semibold">{title}</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
        </div>
        <Button onClick={handleRetry} disabled={retrying} className="gap-1.5">
          <RefreshCw className={`h-4 w-4 ${retrying ? 'animate-spin' : ''}`} />
          {retrying ? 'Retrying...' : 'Try Again'}
        </Button>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <AlertTriangle className="h-3 w-3" />
          If this persists, contact your administrator
        </p>
      </CardContent>
    </Card>
  )
}
