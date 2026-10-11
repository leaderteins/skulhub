'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface RealtimeEvent {
  type: string
  title: string
  description: string
  timestamp: string
  variant: 'success' | 'warning' | 'info' | 'error'
}

interface UseRealtimeOptions {
  role?: string
  schoolId?: string
}

/**
 * WebSocket hook for real-time updates.
 *
 * Connects to the SkulHub Real-Time service (port 3003 via Caddy gateway).
 * Receives live events:
 * - biometric:tap → toast notification + live feed update
 * - bus:update → bus tracking dashboard update
 * - bus:gps → GPS trail update
 * - attendance:update → attendance dashboard refresh
 * - fee:update → parent portal fee refresh
 * - grade:update → parent portal grade refresh
 */
export function useRealtime(opts: UseRealtimeOptions = {}) {
  const socketRef = useRef<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const [events, setEvents] = useState<RealtimeEvent[]>([])

  useEffect(() => {
    // Connect via Caddy gateway — path is always "/", port via query param
    const socket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    })
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      socket.emit('identify', { role: opts.role || 'admin', schoolId: opts.schoolId })
    })

    socket.on('disconnect', () => setConnected(false))
    socket.on('reconnect', () => setConnected(true))

    // Listen for notification toasts
    socket.on('notification:toast', (event: RealtimeEvent) => {
      setEvents(prev => [event, ...prev].slice(0, 50))
    })

    // Listen for biometric updates
    socket.on('biometric:update', (data: any) => {
      setEvents(prev => [{
        type: 'biometric',
        title: 'Biometric Tap',
        description: `${data.studentName} — ${data.action} at ${data.location}`,
        timestamp: data.timestamp,
        variant: data.action === 'check_in' ? 'success' : 'info',
      }, ...prev].slice(0, 50))
    })

    // Listen for bus updates
    socket.on('bus:update', (data: any) => {
      setEvents(prev => [{
        type: 'bus',
        title: 'Bus Boarding',
        description: `${data.studentName} ${data.action === 'board' ? 'boarded' : 'alighted'} at ${data.stopName}`,
        timestamp: data.timestamp,
        variant: 'info',
      }, ...prev].slice(0, 50))
    })

    return () => {
      socket.disconnect()
    }
  }, [opts.role, opts.schoolId])

  const emitBiometricTap = useCallback((data: {
    studentName: string
    action: string
    location: string
    schoolId?: string
  }) => {
    socketRef.current?.emit('biometric:tap', {
      ...data,
      timestamp: new Date().toISOString(),
    })
  }, [])

  const emitBusBoarding = useCallback((data: {
    studentName: string
    action: string
    stopName: string
    tripId: string
  }) => {
    socketRef.current?.emit('bus:boarding', {
      ...data,
      timestamp: new Date().toISOString(),
    })
  }, [])

  const clearEvents = useCallback(() => setEvents([]), [])

  return { connected, events, emitBiometricTap, emitBusBoarding, clearEvents }
}
