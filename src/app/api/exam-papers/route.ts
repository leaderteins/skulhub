import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/exam-papers?subject=&classLevel=&publisher=&paperType=
 * Returns a list of exam papers WITHOUT the heavy `fileData` field.
 * Each item includes file metadata so the UI can render a download button
 * (which then hits GET /api/exam-papers/[id] to fetch the actual file).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const subject = searchParams.get('subject') || undefined
    const classLevel = searchParams.get('classLevel') || undefined
    const publisher = searchParams.get('publisher') || undefined
    const paperType = searchParams.get('paperType') || undefined

    const where: {
      subject?: string
      classLevel?: string
      publisher?: string
      paperType?: string
    } = {}
    if (subject && subject !== 'all') where.subject = subject
    if (classLevel && classLevel !== 'all') where.classLevel = classLevel
    if (publisher && publisher !== 'all') where.publisher = publisher
    if (paperType && paperType !== 'all') where.paperType = paperType

    const papers = await db.examPaper.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        subject: true,
        classLevel: true,
        paperType: true,
        publisher: true,
        year: true,
        term: true,
        description: true,
        fileName: true,
        fileSize: true,
        fileType: true,
        uploadedBy: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      papers: papers.map(p => ({
        ...p,
        createdAt: p.createdAt?.toISOString?.() ?? p.createdAt,
      })),
    })
  } catch (e: any) {
    console.error('[exam-papers GET] error:', e)
    return NextResponse.json({ papers: [], error: e?.message }, { status: 500 })
  }
}

/**
 * POST /api/exam-papers — upload a new past/exam paper.
 * Body: { title, subject, classLevel, paperType, publisher, year, term,
 *         description, fileData (base64 data URL), fileName, fileSize, fileType,
 *         uploadedBy }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    if (!body) {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const {
      title,
      subject,
      classLevel,
      paperType,
      publisher,
      year,
      term,
      description,
      fileData,
      fileName,
      fileSize,
      fileType,
      uploadedBy,
    } = body

    // Required-field validation
    if (!title || !subject || !classLevel) {
      return NextResponse.json(
        { error: 'title, subject and classLevel are required' },
        { status: 400 },
      )
    }
    if (!fileData || typeof fileData !== 'string' || !fileData.startsWith('data:')) {
      return NextResponse.json(
        { error: 'fileData must be a base64 data URL' },
        { status: 400 },
      )
    }
    const MAX = 5 * 1024 * 1024 // 5 MB
    if (typeof fileSize === 'number' && fileSize > MAX) {
      return NextResponse.json(
        { error: 'File too large — maximum allowed size is 5MB' },
        { status: 400 },
      )
    }
    // Belt-and-braces: also check the encoded payload length as a fallback
    if (fileData.length > MAX * 1.37) {
      return NextResponse.json(
        { error: 'Encoded payload too large — maximum allowed size is 5MB' },
        { status: 400 },
      )
    }

    const created = await db.examPaper.create({
      data: {
        title,
        subject,
        classLevel,
        paperType: paperType || 'exam_paper',
        publisher: publisher || null,
        year: year || null,
        term: term || null,
        description: description || null,
        fileData,
        fileName: fileName || null,
        fileSize: typeof fileSize === 'number' ? fileSize : null,
        fileType: fileType || 'application/pdf',
        uploadedBy: uploadedBy || null,
      },
      select: {
        id: true,
        title: true,
        subject: true,
        classLevel: true,
        paperType: true,
        publisher: true,
        year: true,
        term: true,
        description: true,
        fileName: true,
        fileSize: true,
        fileType: true,
        uploadedBy: true,
        createdAt: true,
      },
    })

    return NextResponse.json({
      paper: {
        ...created,
        createdAt: created.createdAt?.toISOString?.() ?? created.createdAt,
      },
    }, { status: 201 })
  } catch (e: any) {
    console.error('[exam-papers POST] error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to upload paper' }, { status: 500 })
  }
}
