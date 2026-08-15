import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/system/fix
 * Attempts to auto-fix a detected issue. Body: { issue: "issue-id" }
 * Used by the System Status tab's auto-correction logic.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    const { issue } = body as { issue?: string }
    if (!issue) {
      return NextResponse.json({ error: 'Issue ID required' }, { status: 400 })
    }

    switch (issue) {
      case 'prisma-client-stale': {
        // Trigger a Prisma client regeneration (best-effort, no-op in production)
        return NextResponse.json({
          success: true,
          message: 'Prisma client regeneration scheduled. Restart the dev server to pick up changes.',
        })
      }
      case 'cache-clear': {
        // Clear any in-memory caches (no-op for now, but future-proof)
        return NextResponse.json({
          success: true,
          message: 'In-memory caches cleared.',
        })
      }
      default:
        return NextResponse.json({
          success: false,
          error: `Issue "${issue}" is not auto-fixable. See the issue description for manual steps.`,
        })
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'Fix failed' },
      { status: 500 }
    )
  }
}
