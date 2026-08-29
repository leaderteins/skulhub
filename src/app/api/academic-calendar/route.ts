import { NextResponse } from 'next/server'

/**
 * GET /api/academic-calendar
 *
 * Returns the current academic term, year, and term date boundaries —
 * derived from the SERVER's authoritative clock (not the client browser's
 * clock, which may be wrong on misconfigured devices).
 *
 * Uses the official Kenyan school calendar:
 *   Term 1: Jan 1  – Apr 21
 *   Term 2: Apr 22 – Aug 25
 *   Term 3: Aug 26 – Nov 30
 *   Holiday: Dec 1 – Dec 31 (long December break; next year's Term 1 prep)
 *
 * This endpoint is called once on app boot by the Zustand store, so every
 * user (logged-in staff, parents on the portal, even first-time visitors
 * with no localStorage) sees the correct term/year badge immediately.
 *
 * Response: {
 *   currentTerm: string,   // "Term 1" | "Term 2" | "Term 3" | "Holiday"
 *   academicYear: string, // e.g. "2026"
 *   termStart: string,     // ISO date "2026-08-26"
 *   termEnd: string,       // ISO date "2026-11-30"
 *   source: "server",     // always "server" (authoritative)
 *   timestamp: string     // ISO datetime — for debugging
 * }
 */
export async function GET() {
  const now = new Date()
  const month = now.getMonth() // 0-indexed (0 = Jan, 11 = Dec)
  const day = now.getDate()
  const year = now.getFullYear()

  // --- Kenya school calendar derivation --------------------------------
  // December → long holiday, but the academic year rolls over to NEXT year
  // (schools prepare for Term 1 of the upcoming year).
  if (month === 11) {
    const nextYear = year + 1
    return NextResponse.json({
      currentTerm: 'Holiday',
      academicYear: String(nextYear),
      termStart: `${year}-12-01`,
      termEnd: `${year}-12-31`,
      source: 'server',
      timestamp: now.toISOString(),
    })
  }

  // Term 2: Apr 22 – Aug 25
  const afterApr22 = month > 3 || (month === 3 && day >= 22)
  const beforeAug25 = month < 7 || (month === 7 && day <= 25)
  if (afterApr22 && beforeAug25) {
    return NextResponse.json({
      currentTerm: 'Term 2',
      academicYear: String(year),
      termStart: `${year}-04-22`,
      termEnd: `${year}-08-25`,
      source: 'server',
      timestamp: now.toISOString(),
    })
  }

  // Term 3: Aug 26 – Nov 30
  const afterAug26 = month > 7 || (month === 7 && day >= 26)
  const beforeNov30 = month < 10 || (month === 10 && day <= 30)
  if (afterAug26 && beforeNov30) {
    return NextResponse.json({
      currentTerm: 'Term 3',
      academicYear: String(year),
      termStart: `${year}-08-26`,
      termEnd: `${year}-11-30`,
      source: 'server',
      timestamp: now.toISOString(),
    })
  }

  // Term 1: Jan 1 – Apr 21 (default / fallback)
  return NextResponse.json({
    currentTerm: 'Term 1',
    academicYear: String(year),
    termStart: `${year}-01-01`,
    termEnd: `${year}-04-21`,
    source: 'server',
    timestamp: now.toISOString(),
  })
}
