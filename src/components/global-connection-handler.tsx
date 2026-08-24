'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * GlobalConnectionHandler — shows a toast/banner when:
 * - The user's browser goes offline
 * - The API server is unreachable (connection refused, timeout, etc.)
 *
 * Also auto-retries when the connection comes back, and shows a
 * "Back online!" toast. Mounted once in layout.tsx.
 */
export function GlobalConnectionHandler() {
  const [isOnline, setIsOnline] = useState(true)
  const [serverDown, setServerDown] = useState(false)
  const [showReconnected, setShowReconnected] = useState(false)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const checkServerHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health', { cache: 'no-store' })
      if (res.ok) {
        if (serverDown) {
          // Server just came back online
          setShowReconnected(true)
          setTimeout(() => setShowReconnected(false), 3000)
        }
        setServerDown(false)
        setIsOnline(true)
        return true
      }
      return false
    } catch {
      // Server is down
      setServerDown(true)
      return false
    }
  }, [serverDown])

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      // When browser comes back online, also check if server is up
      checkServerHealth()
    }
    const handleOffline = () => {
      setIsOnline(false)
      setShowReconnected(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Poll server health every 10 seconds if the server was down
    // (this detects when the server comes back up after a crash/restart)
    pollRef.current = setInterval(() => {
      if (!navigator.onLine) {
        setServerDown(true)
        return
      }
      // Light health check
      fetch('/api/health', { cache: 'no-store' })
        .then(res => {
          if (res.ok) {
            if (serverDown) {
              setShowReconnected(true)
              setTimeout(() => setShowReconnected(false), 3000)
            }
            setServerDown(false)
            setIsOnline(true)
          } else {
            setServerDown(true)
          }
        })
        .catch(() => {
          // Only show serverDown if we were previously up
          // (avoids spamming during initial load)
          setServerDown(prev => prev)
        })
    }, 10000)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [serverDown, checkServerHealth])

  const handleReload = useCallback(() => {
    window.location.reload()
  }, [])

  // Offline banner (browser is offline)
  if (!isOnline) {
    return (
      <div className="fixed inset-x-0 top-0 z-[200] flex items-center justify-center gap-3 bg-rose-600 px-4 py-2 text-white shadow-lg">
        <WifiOff className="h-4 w-4 shrink-0" />
        <p className="text-sm font-medium">
          You're offline. Check your internet connection.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="ml-2 h-7 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
          onClick={handleReload}
        >
          <RefreshCw className="mr-1 h-3 w-3" /> Reload
        </Button>
      </div>
    )
  }

  // Server down banner (server crashed or restarting)
  if (serverDown) {
    return (
      <div className="fixed inset-x-0 top-0 z-[200] flex items-center justify-center gap-3 bg-amber-600 px-4 py-2 text-white shadow-lg">
        <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
        <p className="text-sm font-medium">
          Server is restarting... Will auto-reconnect in a moment.
        </p>
        <Button
          size="sm"
          variant="outline"
          className="ml-2 h-7 border-white/30 bg-transparent text-white hover:bg-white/10 hover:text-white"
          onClick={handleReload}
        >
          <RefreshCw className="mr-1 h-3 w-3" /> Reload Now
        </Button>
      </div>
    )
  }

  // "Back online" toast (auto-dismisses after 3s)
  if (showReconnected) {
    return (
      <div className="fixed inset-x-0 top-0 z-[200] flex items-center justify-center gap-3 bg-emerald-600 px-4 py-2 text-white shadow-lg animate-fade-in-up">
        <Wifi className="h-4 w-4 shrink-0" />
        <p className="text-sm font-medium">Back online!</p>
      </div>
    )
  }

  return null
}
