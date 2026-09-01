import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/biometric/migrate
 *
 * Creates the biometric + bus tracking tables on the production Postgres DB
 * using raw SQL (since we can't run `prisma db push` on Vercel directly).
 *
 * Safe to call multiple times — uses CREATE TABLE IF NOT EXISTS.
 */
export async function POST(req: NextRequest) {
  try {
    // Execute raw SQL to create tables if they don't exist
    // This is equivalent to `prisma db push` for just these tables

    const statements = [
      // BiometricDevice
      `CREATE TABLE IF NOT EXISTS "BiometricDevice" (
        id TEXT PRIMARY KEY,
        "schoolId" TEXT NOT NULL,
        name TEXT NOT NULL,
        "deviceType" TEXT NOT NULL DEFAULT 'fingerprint',
        location TEXT,
        "vehicleId" TEXT,
        status TEXT NOT NULL DEFAULT 'active',
        "lastSeen" TIMESTAMP(3),
        secret TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      )`,

      // BiometricTemplate
      `CREATE TABLE IF NOT EXISTS "BiometricTemplate" (
        id TEXT PRIMARY KEY,
        "schoolId" TEXT NOT NULL,
        "personId" TEXT NOT NULL,
        "personType" TEXT NOT NULL DEFAULT 'student',
        "templateHash" TEXT NOT NULL UNIQUE,
        "fingerIndex" INTEGER NOT NULL DEFAULT 0,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "enrolledBy" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,

      // BiometricLog
      `CREATE TABLE IF NOT EXISTS "BiometricLog" (
        id TEXT PRIMARY KEY,
        "schoolId" TEXT NOT NULL,
        "deviceId" TEXT,
        "personId" TEXT NOT NULL,
        "personType" TEXT NOT NULL DEFAULT 'student',
        action TEXT NOT NULL,
        location TEXT,
        gps TEXT,
        verified BOOLEAN NOT NULL DEFAULT true,
        timestamp TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,

      // BusTrip
      `CREATE TABLE IF NOT EXISTS "BusTrip" (
        id TEXT PRIMARY KEY,
        "schoolId" TEXT NOT NULL,
        "routeId" TEXT,
        "vehicleId" TEXT,
        "driverId" TEXT,
        direction TEXT NOT NULL DEFAULT 'to_school',
        status TEXT NOT NULL DEFAULT 'scheduled',
        "departureAt" TIMESTAMP(3),
        "arrivalAt" TIMESTAMP(3),
        "boardingCount" INTEGER NOT NULL DEFAULT 0,
        "gpsTrail" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      )`,

      // BusBoarding
      `CREATE TABLE IF NOT EXISTS "BusBoarding" (
        id TEXT PRIMARY KEY,
        "schoolId" TEXT NOT NULL,
        "tripId" TEXT NOT NULL,
        "studentId" TEXT NOT NULL,
        action TEXT NOT NULL,
        "stopName" TEXT,
        gps TEXT,
        timestamp TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )`,

      // WebAuthnCredential
      `CREATE TABLE IF NOT EXISTS "WebAuthnCredential" (
        id TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "credentialId" TEXT NOT NULL UNIQUE,
        "publicKey" TEXT NOT NULL,
        counter INTEGER NOT NULL DEFAULT 0,
        "deviceType" TEXT,
        transports TEXT,
        nickname TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "lastUsedAt" TIMESTAMP(3)
      )`,

      // Indexes for performance
      `CREATE INDEX IF NOT EXISTS "BiometricLog_schoolId_timestamp_idx" ON "BiometricLog"("schoolId", "timestamp")`,
      `CREATE INDEX IF NOT EXISTS "BiometricLog_personId_timestamp_idx" ON "BiometricLog"("personId", "timestamp")`,
      `CREATE INDEX IF NOT EXISTS "BusTrip_schoolId_status_idx" ON "BusTrip"("schoolId", "status")`,
      `CREATE INDEX IF NOT EXISTS "BusBoarding_tripId_action_idx" ON "BusBoarding"("tripId", "action")`,
      `CREATE INDEX IF NOT EXISTS "BusBoarding_studentId_timestamp_idx" ON "BusBoarding"("studentId", "timestamp")`,
      `CREATE INDEX IF NOT EXISTS "WebAuthnCredential_userId_idx" ON "WebAuthnCredential"("userId")`,

      // Foreign keys (optional — added separately to avoid issues if tables don't exist yet)
      `DO $$ BEGIN
        ALTER TABLE "BiometricLog" ADD CONSTRAINT "BiometricLog_deviceId_fkey"
        FOREIGN KEY ("deviceId") REFERENCES "BiometricDevice"("id") ON DELETE SET NULL;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`,

      `DO $$ BEGIN
        ALTER TABLE "BusBoarding" ADD CONSTRAINT "BusBoarding_tripId_fkey"
        FOREIGN KEY ("tripId") REFERENCES "BusTrip"("id") ON DELETE CASCADE;
      EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
    ]

    const results: string[] = []
    for (const sql of statements) {
      try {
        await db.$executeRawUnsafe(sql)
        results.push('✓ ' + sql.slice(0, 60) + '...')
      } catch (e: any) {
        // Ignore "already exists" errors
        if (!String(e?.message || '').includes('already exists')) {
          results.push('✗ ' + e?.message?.slice(0, 80))
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Biometric + bus tracking tables created',
      statements: results,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 })
  }
}
