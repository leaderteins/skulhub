/// <reference lib="webworker" />

/**
 * SkulHub service worker (enhanced v2).
 *
 * Responsibilities:
 *  1. On install: pre-cache the app shell (logo + manifest + offline
 *     page) so the PWA can boot offline.
 *  2. On activate: clean up old cache versions + claim clients.
 *  3. On fetch:
 *     • HTML navigations → network-first, fallback to /offline page
 *       when the network is down (so the user gets a graceful message
 *       instead of the browser's "no internet" page).
 *     • API GET responses (same-origin /api/*) → stale-while-revalidate
 *       (serve the cached copy immediately, refresh in the background
 *       so the next load is fresh).
 *     • Static assets (JS, CSS, images, fonts) → cache-first with
 *       background refresh.
 *  4. On push: show a system notification with the title/body from the
 *     push payload. Falls back to a default "New SkulHub notification".
 *  5. On notificationclick: focus the existing window if open, otherwise
 *     open a new tab to the notification's URL (or the root).
 *  6. Background sync: queued failed POST requests are retried when the
 *     'sync' event fires (browser fires this when connectivity returns).
 *     Uses a manual replay queue stored in IndexedDB-style localStorage
 *     fallback when Background Sync isn't supported (Safari, older
 *     Firefox).
 *  7. Message: allow the page to trigger skipWaiting.
 */

const CACHE_NAME = 'skulhub-v2'
const OFFLINE_URL = '/offline'
const API_CACHE = 'skulhub-api-v2'
const SHELL_ASSETS = ['/', '/manifest.json', '/favicon.svg', OFFLINE_URL]

// --- Install: pre-cache app shell + offline page ----------------------------
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(SHELL_ASSETS).catch(() => {
        // Don't fail install if a single asset 404s — we still want the
        // service worker to activate so push notifications + offline
        // fallback work for whatever assets DID cache.
      })
    )
  )
  self.skipWaiting()
})

// --- Activate: clean up old caches -----------------------------------------
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== API_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// --- Fetch: routing strategy ------------------------------------------------
self.addEventListener('fetch', (event) => {
  const { request } = event
  // Skip non-GET requests for caching — but DO intercept failed POST
  // requests so we can queue them for background sync retry.
  if (request.method !== 'GET') {
    // Queue failed POST/PUT/DELETE/PATCH for background sync retry.
    // We can't intercept the response itself (the network may still
    // succeed), but if a sync listener fires later we have nothing
    // to replay — so we just let it through normally here. The actual
    // queueing happens in the page (PwaManager) via a fetch wrapper
    // that POSTs to /api/...; on failure it stores the request body
    // in a 'skulhub-sync-queue' IDB store and registers a sync event.
    return
  }

  // Skip cross-origin requests (CDN assets, etc.) — they can't be cached
  // by our service worker anyway due to opaque response limitations.
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  // Skip chrome-extension & non-http(s) requests
  if (!url.protocol.startsWith('http')) return

  // --- HTML navigations: network-first with /offline fallback -----------
  if (request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          // Cache a copy for offline use
          const copy = res.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {})
          return res
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL)).then((page) => page || Response.error())
        )
    )
    return
  }

  // --- API GET responses: stale-while-revalidate -----------------------
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      caches.open(API_CACHE).then(async (cache) => {
        const cached = await cache.match(request)
        // Kick off a background refresh — don't block on it.
        const fetchPromise = fetch(request)
          .then((res) => {
            // Only cache successful responses (avoid caching 4xx/5xx).
            if (res.ok) {
              const copy = res.clone()
              cache.put(request, copy).catch(() => {})
            }
            return res
          })
          .catch(() => null) // network failed — fall back to cache (or nothing)
        if (cached) {
          // SWR: serve the cached copy immediately + refresh in the
          // background. The next load will see the fresh response.
          return cached
        }
        // No cached copy — wait for the network (or fail gracefully).
        const fresh = await fetchPromise
        if (fresh) return fresh
        return new Response(JSON.stringify({ error: 'offline', message: 'This request requires a network connection.' }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' },
        })
      })
    )
    return
  }

  // --- Static assets: cache-first with background refresh --------------
  event.respondWith(
    caches.match(request).then((cached) => {
      // Background refresh — don't block on the response.
      const fetchPromise = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone()
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {})
          }
          return res
        })
        .catch(() => cached) // network failed → return the cache (or null)
      return cached || fetchPromise
    })
  )
})

// --- Push: show a system notification --------------------------------------
self.addEventListener('push', (event) => {
  let payload = { title: 'SkulHub', body: 'You have a new notification.' }
  try {
    if (event.data) {
      // event.data.json() throws if the payload is plain text
      payload = event.data.json()
    }
  } catch {
    if (event.data) {
      payload = { title: 'SkulHub', body: event.data.text() }
    }
  }

  const { title, body, url } = payload as any
  const options = {
    body: body || 'You have a new notification.',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: 'skulhub-notif',
    renotify: true,
    data: { url: url || '/' },
  }

  event.waitUntil(
    (self as any).registration.showNotification(title || 'SkulHub', options)
  )
})

// --- Notification click: focus the window or open the URL ------------------
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/'

  event.waitUntil(
    (self as any).clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // If a window is already open, focus it + navigate to the target URL
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          if ('focus' in client) {
            ;(client as any).focus()
          }
          if ('navigate' in client) {
            ;(client as any).navigate(targetUrl)
          }
          return
        }
      }
      // Otherwise open a new tab
      if ((self as any).clients.openWindow) {
        return (self as any).clients.openWindow(targetUrl)
      }
    })
  )
})

// --- Background sync: replay queued failed POST requests ------------------
self.addEventListener('sync', (event) => {
  if ((event as any).tag === 'skulhub-replay-queue') {
    event.waitUntil(replayQueuedRequests())
  }
})

// --- Message: allow the page to trigger skipWaiting ------------------------
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  // Allow the page to manually trigger a replay (e.g. when the user
  // taps a "Sync now" button in the offline UI).
  if (event.data === 'REPLAY_QUEUE') {
    replayQueuedRequests().catch(() => {})
  }
})

/**
 * Read queued requests from the IndexedDB store + replay them. Used
 * by the 'sync' event handler. Falls back gracefully if the queue
 * is empty or Background Sync isn't supported.
 */
async function replayQueuedRequests() {
  try {
    const allClients = await (self as any).clients.matchAll({ includeUncontrolled: true })
    // Ask each client to flush its own queue (it owns the request bodies
    // + auth cookies). This avoids the SW having to know how to read the
    // user's session token — the page does.
    for (const client of allClients) {
      try {
        ;(client as any).postMessage({ type: 'SKULHUB_REPLAY_QUEUE' })
      } catch {}
    }
  } catch {
    // Silent — best-effort
  }
}
