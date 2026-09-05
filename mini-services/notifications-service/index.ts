/**
 * SkulHub Real-Time Notifications Mini-Service
 * --------------------------------------------
 * Port: 3003 (hard-coded)
 *
 * Responsibilities:
 *  - Maintain socket.io server (engine.io path: /socket.io/)
 *  - Accept `subscribe` events from clients and place them in three rooms:
 *      user:{userId}, school:{schoolId}, role:{role}
 *  - Expose HTTP `POST /internal/send` for Next.js API routes to broadcast
 *    a notification to the appropriate rooms (server-to-server call).
 *  - Emit `notification:received` to all matching sockets.
 *  - Relay `notification:read` between tabs of the same user.
 *  - Emit `presence` events (online/offline) to admin role sockets.
 *
 * The Caddy gateway on :81 forwards requests like
 *   /socket.io/?XTransformPort=3003&...
 * to localhost:3003, and the XTransformPort query tells Caddy which port
 * to target. Engine.io uses the default path `/socket.io/` so that HTTP
 * routes (`/health`, `/internal/send`) can co-exist on the same port.
 */
import { createServer, IncomingMessage, ServerResponse } from 'http'
import { Server, Socket } from 'socket.io'

const PORT = 3003

interface SubscribePayload {
  userId?: string
  schoolId?: string
  role?: string
}

interface InternalSendPayload {
  userId?: string | null
  schoolId?: string | null
  role?: string | null
  type: string
  priority?: string
  title: string
  message: string
  metadata?: Record<string, unknown> | null
  id?: string
  createdAt?: string
}

interface NotificationReadPayload {
  id: string
  userId?: string
}

// Map socketId -> presence info for online/offline tracking
interface PresenceRecord {
  userId: string
  schoolId?: string
  role?: string
  socketId: string
  connectedAt: number
}
const presence = new Map<string, PresenceRecord>()

// ---------------------------------------------------------------------------
// HTTP server — /health and /internal/send live here. Engine.io (socket.io)
// uses the default path /socket.io/ so it never intercepts these routes.
// ---------------------------------------------------------------------------
const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // CORS for HTTP routes (engine.io has its own cors config)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = req.url || '/'

  // ----- GET /health -----
  if (req.method === 'GET' && url.startsWith('/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ ok: true, ts: Date.now() }))
    return
  }

  // ----- POST /internal/send -----
  if (req.method === 'POST' && url.startsWith('/internal/send')) {
    try {
      const body = (await readJson(req)) as InternalSendPayload
      if (!body || !body.type || !body.title) {
        res.writeHead(400, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ ok: false, error: 'type and title are required' }))
        return
      }

      const rooms: string[] = []
      if (body.userId) rooms.push(`user:${body.userId}`)
      if (body.schoolId) rooms.push(`school:${body.schoolId}`)
      if (body.role) rooms.push(`role:${body.role}`)

      const envelope = {
        id: body.id || `ntf_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        type: body.type,
        priority: body.priority || 'normal',
        title: body.title,
        message: body.message || '',
        metadata: body.metadata || null,
        createdAt: body.createdAt || new Date().toISOString(),
        userId: body.userId ?? null,
        schoolId: body.schoolId ?? null,
        role: body.role ?? null,
      }

      let delivered = 0
      if (rooms.length > 0) {
        for (const room of rooms) {
          const sockets = await io.in(room).fetchSockets()
          delivered += sockets.length
        }
        io.to(rooms).emit('notification:received', envelope)
      }

      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: true, delivered, rooms }))
      return
    } catch (e) {
      console.error('[internal/send] error:', e)
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ ok: false, error: 'invalid request body' }))
      return
    }
  }

  // ----- 404 for everything else (engine.io handles /socket.io/* itself) -----
  res.writeHead(404, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify({ ok: false, error: 'not found' }))
})

// Socket.io server — uses the default engine.io path /socket.io/
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
  pingTimeout: 60000,
  pingInterval: 25000,
})

io.on('connection', (socket: Socket) => {
  socket.on('subscribe', (payload: SubscribePayload) => {
    try {
      const { userId, schoolId, role } = payload || {}
      if (userId) {
        socket.join(`user:${userId}`)
        presence.set(socket.id, {
          userId,
          schoolId,
          role,
          socketId: socket.id,
          connectedAt: Date.now(),
        })
        // Broadcast presence to admins & principals in the same school
        if (schoolId) {
          io.to('role:admin').to('role:principal').emit('presence', {
            userId,
            schoolId,
            status: 'online',
            ts: Date.now(),
          })
        }
      }
      if (schoolId) socket.join(`school:${schoolId}`)
      if (role) socket.join(`role:${role}`)
      socket.emit('subscribed', { userId, schoolId, role })
    } catch (e) {
      console.error('[subscribe] error:', e)
    }
  })

  socket.on('notification:read', (payload: NotificationReadPayload) => {
    try {
      if (!payload?.id) return
      const record = presence.get(socket.id)
      const userId = payload.userId || record?.userId
      if (userId) {
        socket.to(`user:${userId}`).emit('notification:read', {
          id: payload.id,
          userId,
        })
      }
    } catch (e) {
      console.error('[notification:read] error:', e)
    }
  })

  socket.on('disconnect', () => {
    const record = presence.get(socket.id)
    if (record) {
      presence.delete(socket.id)
      if (record.schoolId) {
        io.to('role:admin').to('role:principal').emit('presence', {
          userId: record.userId,
          schoolId: record.schoolId,
          status: 'offline',
          ts: Date.now(),
        })
      }
    }
  })

  socket.on('error', (err: unknown) => {
    console.error('[socket error]', err)
  })
})

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = ''
    req.on('data', (chunk) => {
      raw += chunk.toString()
      if (raw.length > 1_000_000) {
        reject(new Error('payload too large'))
        req.destroy()
      }
    })
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {})
      } catch (e) {
        reject(e)
      }
    })
    req.on('error', reject)
  })
}

httpServer.listen(PORT, () => {
  console.log(`[notifications-service] listening on :${PORT} (engine.io path=/socket.io/)`)
})

process.on('SIGTERM', () => {
  console.log('[notifications-service] SIGTERM — shutting down')
  io.close()
  httpServer.close(() => process.exit(0))
})
process.on('SIGINT', () => {
  console.log('[notifications-service] SIGINT — shutting down')
  io.close()
  httpServer.close(() => process.exit(0))
})
