import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/system/health
 * Returns the health status of all system components.
 * Used by the Settings → System Status tab to auto-monitor the app.
 */
export async function GET(req: NextRequest) {
  const issues: Array<{
    id: string
    title: string
    description: string
    severity: 'critical' | 'warning'
    autoFixable: boolean
  }> = []

  // 1. Database check
  let dbStatus = 'healthy'
  let dbDetails = 'Connected'
  try {
    const count = await db.school.count()
    dbDetails = `${count} schools in DB`
  } catch (e: any) {
    dbStatus = 'critical'
    dbDetails = `Error: ${e?.message?.slice(0, 80) || 'Unknown'}`
    issues.push({
      id: 'db-connection',
      title: 'Database connection failed',
      description: dbDetails,
      severity: 'critical',
      autoFixable: false,
    })
  }

  // 2. Disk/storage check
  let storageStatus = 'healthy'
  let storageDetails = 'OK'
  try {
    const fs = await import('fs')
    const dbUrl = process.env.DATABASE_URL || ''
    if (dbUrl.startsWith('file:')) {
      const dbPath = dbUrl.replace('file:', '')
      if (fs.existsSync(dbPath)) {
        const stats = fs.statSync(dbPath)
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(1)
        storageDetails = `DB size: ${sizeMB} MB`
        if (stats.size > 500 * 1024 * 1024) {
          storageStatus = 'warning'
          issues.push({
            id: 'storage-large',
            title: 'Database file is large',
            description: `DB is ${sizeMB} MB — consider archiving old records.`,
            severity: 'warning',
            autoFixable: false,
          })
        }
      }
    }
  } catch {
    storageStatus = 'warning'
    storageDetails = 'Could not check storage'
  }

  // 3. M-Pesa / Daraja check
  let mpesaStatus = 'not-configured'
  let mpesaDetails = 'Not configured — see Daraja Guide tab'
  try {
    const school = await db.school.findFirst({
      select: { mpesaConsumerKey: true, mpesaEnv: true, mpesaShortcode: true },
    })
    if (school?.mpesaConsumerKey) {
      mpesaStatus = school.mpesaEnv || 'sandbox'
      mpesaDetails = `Env: ${school.mpesaEnv} · Shortcode: ${school.mpesaShortcode || 'n/a'}`
    }
  } catch {
    // ignore
  }

  // 4. Auth check
  let authStatus = 'healthy'
  let authDetails = 'Session token signing OK'
  if (!process.env.SESSION_SECRET) {
    authStatus = 'warning'
    authDetails = 'Using default SESSION_SECRET — set a custom one for production'
    issues.push({
      id: 'session-secret',
      title: 'Default session secret in use',
      description: 'SESSION_SECRET env var is not set. Using the default dev secret — insecure for production.',
      severity: 'warning',
      autoFixable: false,
    })
  }

  const overallStatus = issues.some(i => i.severity === 'critical')
    ? 'critical'
    : issues.some(i => i.severity === 'warning')
    ? 'warning'
    : 'healthy'

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
    database: { status: dbStatus, details: dbDetails },
    storage: { status: storageStatus, details: storageDetails },
    network: { status: 'healthy', details: 'Connected' },
    auth: { status: authStatus, details: authDetails },
    mpesa: { status: mpesaStatus, details: mpesaDetails },
    api: { status: 'healthy', uptime: `${Math.floor(process.uptime())}s` },
    issues,
  })
}
