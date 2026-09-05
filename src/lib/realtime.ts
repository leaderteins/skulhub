'use client'

/**
 * SocketManager — client-side singleton for socket.io
 * ---------------------------------------------------
 * Lazily connects to the SkulHub notifications mini-service (port 3003)
 * via the Caddy gateway. The XTransformPort query param tells Caddy which
 * backend port to target; the path used is /socket.io/ (the socket.io
 * default), which the mini-service serves alongside its /health and
 * /internal/send HTTP routes.
 *
 * API:
 *   SocketManager.subscribe(userId, schoolId, role)
 *   SocketManager.onNotification(cb)
 *   SocketManager.onRead(cb)
 *   SocketManager.markRead(id, userId?)
 *   SocketManager.disconnect()
 *
 * Notes:
 *   - Lazily connects on first subscribe() call.
 *   - Reconnects with exponential backoff (socket.io default).
 *   - One socket per browser tab (singleton on the module level).
 *   - Re-exposes 'subscribed' / 'presence' events for the React hook.
 */

import { io, type Socket } from 'socket.io-client'

export interface RealtimeNotification {
  id: string
  type: string
  priority: string
  title: string
  message: string
  metadata?: Record<string, unknown> | null
  createdAt: string
  userId?: string | null
  schoolId?: string | null
  role?: string | null
}

type NotificationCb = (n: RealtimeNotification) => void
type ReadCb = (payload: { id: string; userId?: string }) => void
type SubscribedCb = (payload: { userId?: string; schoolId?: string; role?: string }) => void
type PresenceCb = (payload: {
  userId: string
  schoolId?: string
  status: 'online' | 'offline'
  ts: number
}) => void

class SocketManagerClass {
  private socket: Socket | null = null
  private connecting = false
  private notificationCbs = new Set<NotificationCb>()
  private readCbs = new Set<ReadCb>()
  private subscribedCbs = new Set<SubscribedCb>()
  private presenceCbs = new Set<PresenceCb>()
  private currentIdentity: { userId?: string; schoolId?: string; role?: string } | null = null
  // Indicates that a new notification just arrived (used for the bell pulse)
  private pulseListeners = new Set<() => void>()

  /** Returns the socket.io client (creating it lazily on first call). */
  private ensureSocket(): Socket {
    if (this.socket) return this.socket
    if (typeof window === 'undefined') {
      throw new Error('SocketManager cannot be used during SSR')
    }
    // Connect through the Caddy gateway on the current host.
    // The path is /socket.io/ (socket.io default) and the XTransformPort
    // query tells Caddy which backend port to forward to.
    this.socket = io({
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 15000,
      timeout: 10000,
      query: { XTransformPort: '3003' },
      // Don't force a new connection — let socket.io multiplex.
      forceNew: false,
    })

    // Wire all events to the local listener sets
    this.socket.on('connect', () => {
      // Re-subscribe on reconnect (socket.io rooms are dropped on disconnect)
      if (this.currentIdentity) {
        this.socket?.emit('subscribe', this.currentIdentity)
      }
    })
    this.socket.on('notification:received', (n: RealtimeNotification) => {
      for (const cb of this.notificationCbs) {
        try { cb(n) } catch (e) { console.error('[realtime] notification cb error:', e) }
      }
      // Trigger the bell pulse
      for (const cb of this.pulseListeners) {
        try { cb() } catch {}
      }
    })
    this.socket.on('notification:read', (p: { id: string; userId?: string }) => {
      for (const cb of this.readCbs) {
        try { cb(p) } catch (e) { console.error('[realtime] read cb error:', e) }
      }
    })
    this.socket.on('subscribed', (p: SubscribedCb extends (x: infer T) => void ? T : never) => {
      for (const cb of this.subscribedCbs) {
        try { cb(p as { userId?: string; schoolId?: string; role?: string }) } catch {}
      }
    })
    this.socket.on('presence', (p: Parameters<PresenceCb>[0]) => {
      for (const cb of this.presenceCbs) {
        try { cb(p) } catch {}
      }
    })
    this.socket.on('connect_error', (err: Error) => {
      // Don't log loudly — the service may be down. The bell will just
      // not pulse until it's back up.
      if (process.env.NODE_ENV !== 'production') {
        console.error('[realtime] connect_error:', err.message)
      }
    })
    return this.socket
  }

  /**
   * Subscribe to user/school/role rooms. Called once on app mount when the
   * user is signed in.
   */
  subscribe(userId?: string, schoolId?: string, role?: string): void {
    if (typeof window === 'undefined') return
    this.currentIdentity = { userId, schoolId, role }
    const socket = this.ensureSocket()
    if (!socket.connected) {
      // The connect handler will re-emit subscribe once connected
      if (!this.connecting) {
        this.connecting = true
        socket.connect()
      }
    } else {
      socket.emit('subscribe', { userId, schoolId, role })
    }
  }

  /** Register a callback fired whenever a new notification arrives. */
  onNotification(cb: NotificationCb): () => void {
    this.notificationCbs.add(cb)
    return () => { this.notificationCbs.delete(cb) }
  }

  /** Register a callback fired when another tab marks a notification read. */
  onRead(cb: ReadCb): () => void {
    this.readCbs.add(cb)
    return () => { this.readCbs.delete(cb) }
  }

  /** Register a callback fired after the server confirms our subscription. */
  onSubscribed(cb: SubscribedCb): () => void {
    this.subscribedCbs.add(cb)
    return () => { this.subscribedCbs.delete(cb) }
  }

  /** Register a callback fired on presence (online/offline) events. */
  onPresence(cb: PresenceCb): () => void {
    this.presenceCbs.add(cb)
    return () => { this.presenceCbs.delete(cb) }
  }

  /** Register a callback fired when the bell should pulse (new notif). */
  onPulse(cb: () => void): () => void {
    this.pulseListeners.add(cb)
    return () => { this.pulseListeners.delete(cb) }
  }

  /** Mark a notification as read (broadcasts to other tabs of same user). */
  markRead(id: string, userId?: string): void {
    if (!this.socket || !this.socket.connected) return
    this.socket.emit('notification:read', { id, userId })
  }

  /** True when the underlying socket is connected. */
  get connected(): boolean {
    return !!this.socket?.connected
  }

  /** Tear down the socket (called on logout). */
  disconnect(): void {
    if (!this.socket) return
    try {
      this.socket.removeAllListeners()
      this.socket.disconnect()
    } catch {}
    this.socket = null
    this.currentIdentity = null
    this.connecting = false
    this.notificationCbs.clear()
    this.readCbs.clear()
    this.subscribedCbs.clear()
    this.presenceCbs.clear()
    this.pulseListeners.clear()
  }
}

// Module-level singleton (one socket per browser tab)
export const SocketManager = new SocketManagerClass()
