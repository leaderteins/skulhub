/**
 * Simple in-memory rate limiter.
 * Usage: const { limited, retryAfter } = rateLimit(req.ip, 10, 60000) // 10 req per 60s
 */
const store = new Map<string, { count: number; reset: number }>()

export function rateLimit(key: string, max: number, windowMs: number): { limited: boolean; retryAfter: number; remaining: number } {
  const now = Date.now()
  const entry = store.get(key)
  
  if (!entry || now > entry.reset) {
    store.set(key, { count: 1, reset: now + windowMs })
    return { limited: false, retryAfter: 0, remaining: max - 1 }
  }
  
  entry.count++
  if (entry.count > max) {
    return { limited: true, retryAfter: Math.ceil((entry.reset - now) / 1000), remaining: 0 }
  }
  
  return { limited: false, retryAfter: 0, remaining: max - entry.count }
}

/** Rate limit for auth endpoints — 10 attempts per 10 minutes per IP */
export function checkAuthRateLimit(ip: string) {
  return rateLimit(`auth:${ip}`, 10, 10 * 60 * 1000)
}

/** Rate limit for API endpoints — 100 requests per minute per IP */
export function checkApiRateLimit(ip: string) {
  return rateLimit(`api:${ip}`, 100, 60 * 1000)
}
