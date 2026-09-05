import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/upload/photo
 *
 * Uploads a photo for a student or staff member.
 * Accepts base64-encoded image data (no external storage needed).
 * Stores as base64 in the photoUrl field (works on Vercel without Blob storage).
 *
 * Body: {
 *   personId: string,
 *   personType: 'student' | 'staff',
 *   photoData: string,  // base64 data URL: "data:image/jpeg;base64,..."
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as {
      personId: string
      personType: 'student' | 'staff'
      photoData: string
    }

    if (!body.personId || !body.personType || !body.photoData) {
      return NextResponse.json({ error: 'personId, personType, and photoData are required' }, { status: 400 })
    }

    if (!['student', 'staff'].includes(body.personType)) {
      return NextResponse.json({ error: 'personType must be "student" or "staff"' }, { status: 400 })
    }

    // Validate photoData is a base64 image (limit ~500KB after base64 encoding)
    if (!body.photoData.startsWith('data:image/')) {
      return NextResponse.json({ error: 'photoData must be a base64 data URL (data:image/...)' }, { status: 400 })
    }

    // Check size (~700KB base64 string = ~500KB image)
    if (body.photoData.length > 700000) {
      return NextResponse.json({ error: 'Image too large. Max 500KB. Please compress or resize.' }, { status: 400 })
    }

    // Update the photo URL in the database using raw SQL
    if (body.personType === 'student') {
      await db.$executeRawUnsafe(`
        UPDATE "Student" SET "photoUrl" = $1, "updatedAt" = NOW() WHERE id = $2
      `, body.photoData, body.personId).catch((e) => {
        throw new Error('Failed to update student photo: ' + e.message)
      })
    } else {
      await db.$executeRawUnsafe(`
        UPDATE "Staff" SET "photoUrl" = $1, "updatedAt" = NOW() WHERE id = $2
      `, body.photoData, body.personId).catch((e) => {
        throw new Error('Failed to update staff photo: ' + e.message)
      })
    }

    return NextResponse.json({
      success: true,
      photoUrl: body.photoData,
      message: `${body.personType === 'student' ? 'Student' : 'Staff'} photo updated successfully`,
    })
  } catch (error: any) {
    console.error('[upload-photo] error:', error)
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
