import { db } from '@/lib/db'

/**
 * Track errors — logs to console and stores in ActivityLog.
 * In production, you can replace this with Sentry/Datadog.
 */
export async function trackError(error: Error | string, context?: { userId?: string; schoolId?: string; route?: string }) {
  const msg = typeof error === 'string' ? error : error.message
  const stack = typeof error === 'object' && error.stack ? error.stack.slice(0, 2000) : ''
  
  console.error('[ERROR-TRACKING]', { message: msg, ...context, stack })
  
  // Store in ActivityLog (non-blocking, swallow errors)
  const logId = `err_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
  db.$executeRawUnsafe(
    'INSERT INTO "ActivityLog" (id, "schoolId", action, entity, "entityId", details, "user", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP) ON CONFLICT (id) DO NOTHING',
    logId,
    context?.schoolId || null,
    'ERROR',
    'System',
    context?.route || 'unknown',
    `Error: ${msg.slice(0, 500)}${stack ? ' | Stack: ' + stack.slice(0, 500) : ''}`,
    context?.userId || 'System'
  ).catch(() => {})
}
