'use client'

/**
 * useRealtimeNotifications
 * ------------------------
 * React hook that wires up the SocketManager singleton to:
 *   - Subscribe to the signed-in user's rooms on mount.
 *   - Show a sonner toast for every incoming notification.
 *   - Update the global unread count in Zustand (useAppStore).
 *   - Trigger the bell pulse animation in the Header.
 *   - Refetch /api/notifications when a new notification arrives (debounced).
 *
 * Mount once per signed-in user (e.g. inside the Header or a global hook
 * in the app shell — see src/app/page.tsx where it's mounted for every
 * signed-in user).
 */

import { useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { SocketManager, type RealtimeNotification } from '@/lib/realtime'
import { useAppStore } from '@/lib/store'
import { useAuthStore } from '@/lib/auth-store'

// Map notification type → emoji for the toast
const TYPE_EMOJI: Record<string, string> = {
  fee: '💰',
  attendance: '📋',
  exam: '📝',
  discipline: '⚠️',
  system: '⚙️',
  message: '✉️',
}

const PRIORITY_TOAST: Record<string, 'default' | 'success' | 'info' | 'warning' | 'error'> = {
  low: 'info',
  normal: 'default',
  high: 'warning',
  urgent: 'error',
}

export function useRealtimeNotifications(): void {
  const user = useAuthStore((s) => s.user)
  const incrementUnread = useAppStore((s) => s.incrementUnreadNotifications)
  const triggerPulse = useAppStore((s) => s.triggerNotificationPulse)
  const setRealtimeConnected = useAppStore((s) => s.setRealtimeConnected)

  // Debounce the /api/notifications refetch so a burst of notifications
  // doesn't trigger 10 HTTP requests in a second.
  const refetchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!user) return
    const userId = user.id
    const schoolId = user.schoolId
    const role = user.role

    // Subscribe to socket.io rooms
    SocketManager.subscribe(userId, schoolId, role)

    // Listen for new notifications
    const offNotif = SocketManager.onNotification((n: RealtimeNotification) => {
      // Don't toast our own broadcasts back to ourselves if the server
      // echoes to multiple rooms. Filter by userId/role targeting.
      // (The server sends to user:{userId}, school:{schoolId}, AND role:{role}
      // when all three are specified — the same client may receive multiple
      // copies. Use a Set to dedupe by notification id within a 3s window.)
      const key = n.id
      const now = Date.now()
      if (!dedupe.has(key)) {
        dedupe.set(key, now)
        // increment unread + trigger pulse
        incrementUnread()
        triggerPulse()

        // Toast
        const emoji = TYPE_EMOJI[n.type] || '🔔'
        const toastType = PRIORITY_TOAST[n.priority] || 'default'
        toast[toastType === 'default' ? 'info' : toastType](
          `${emoji} ${n.title}`,
          {
            description: n.message,
            duration: n.priority === 'urgent' ? 8000 : 5000,
          },
        )

        // Debounced refetch
        scheduleRefetch()
      }
    })

    // Listen for cross-tab "read" events to decrement unread
    const offRead = SocketManager.onRead(({ id }) => {
      dedupe.delete(id)
      // Don't go below zero
      useAppStore.getState().setUnreadNotifications(Math.max(0, useAppStore.getState().unreadNotifications - 1))
    })

    // Listen for socket connect/disconnect to drive the status dot
    const onConn = () => setRealtimeConnected(true)
    const onDisc = () => setRealtimeConnected(false)
    const offPulse = SocketManager.onPulse(() => {
      // The pulse itself is triggered by incrementUnread, but we expose
      // onPulse for components that want to react directly (used by the
      // Header's notification bell to animate even on cross-tab events).
    })
    // Note: SocketManager doesn't expose connect/disconnect directly;
    // we piggyback on socket.io's internal state by polling periodically.
    // (We avoid exposing extra API to keep the manager small.)
    const pollId = setInterval(() => {
      setRealtimeConnected(SocketManager.connected)
    }, 3000)
    setRealtimeConnected(SocketManager.connected)

    function scheduleRefetch() {
      if (refetchTimer.current) clearTimeout(refetchTimer.current)
      refetchTimer.current = setTimeout(() => {
        // Best-effort refetch of /api/notifications
        try {
          fetch('/api/notifications?limit=50').catch(() => {})
          // Also nudge the Notifications module's useFetch hook via the
          // global "notifications:refetch" CustomEvent
          window.dispatchEvent(new CustomEvent('notifications:refetch'))
        } catch {}
      }, 800)
    }

    return () => {
      offNotif()
      offRead()
      offPulse()
      if (refetchTimer.current) clearTimeout(refetchTimer.current)
      clearInterval(pollId)
    }
  }, [user?.id, user?.schoolId, user?.role])
}

// Module-level dedupe Map (id -> ts), pruned every 30s
const dedupe = new Map<string, number>()
if (typeof window !== 'undefined') {
  setInterval(() => {
    const cutoff = Date.now() - 3000
    for (const [k, ts] of dedupe) {
      if (ts < cutoff) dedupe.delete(k)
    }
  }, 30_000)
}
