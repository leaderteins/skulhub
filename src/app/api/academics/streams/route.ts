import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/academics/streams
 * Returns all streams (class sections) with their class level info.
 */
export async function GET() {
  try {
    const streams = await db.stream.findMany({
      include: {
        classLevel: { select: { id: true, name: true, stage: true, order: true } },
        classTeacher: { select: { id: true, firstName: true, lastName: true, employeeNo: true } },
        _count: { select: { enrollments: { where: { status: 'Active' } } } },
      },
      orderBy: [{ classLevel: { order: 'asc' } }, { name: 'asc' }],
    }).catch(() => [])

    return NextResponse.json({
      streams: streams.map(s => ({
        id: s.id,
        name: s.name,
        classLevelId: s.classLevelId,
        classLevelName: s.classLevel?.name || '',
        classLevelStage: s.classLevel?.stage || '',
        capacity: s.capacity,
        classTeacher: s.classTeacher ? {
          id: s.classTeacher.id,
          name: `${s.classTeacher.firstName} ${s.classTeacher.lastName}`,
          employeeNo: s.classTeacher.employeeNo,
        } : null,
        enrolledCount: (s as any)._count?.enrollments || 0,
      })),
    })
  } catch (e: any) {
    return NextResponse.json({ streams: [], error: e?.message?.slice(0, 100) })
  }
}
