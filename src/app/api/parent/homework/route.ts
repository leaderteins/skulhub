import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { isDemoMode, DEMO_DASHBOARD } from '@/lib/demo-data'

/**
 * GET /api/parent/homework?admissionNo=ADM/5425
 * Returns homework assigned to the student's class level
 * Also returns grades with teacher remarks for the parent portal
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const admissionNo = searchParams.get('admissionNo')

    if (!admissionNo) {
      return NextResponse.json({ error: 'Admission number is required' }, { status: 400 })
    }

    if (isDemoMode()) {
      return NextResponse.json({
        homework: [
          {
            id: 'demo-hw-1',
            title: 'Mathematics Practice Set 3',
            description: 'Complete exercises 1-15 on page 42. Show all working.',
            dueDate: new Date(Date.now() + 2 * 86400000).toISOString(),
            subject: { name: 'Mathematics', code: 'MAT' },
            classLevel: { name: 'Form 2' },
            status: 'Active',
            comments: [],
          },
          {
            id: 'demo-hw-2',
            title: 'English Essay: My Hero',
            description: 'Write a 500-word essay about your hero. Include an introduction, body, and conclusion.',
            dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
            subject: { name: 'English', code: 'ENG' },
            classLevel: { name: 'Form 2' },
            status: 'Active',
            comments: [
              { id: 'demo-c1', authorName: 'Grace Achieng', authorRole: 'teacher', message: 'Remember to use descriptive language!', createdAt: new Date(Date.now() - 3600000).toISOString() },
              { id: 'demo-c2', authorName: 'Guardian', authorRole: 'parent', message: 'Thank you teacher. He is working on it now.', createdAt: new Date(Date.now() - 1800000).toISOString() },
            ],
          },
        ],
        grades: [
          { id: 'demo-g1', subject: { name: 'Mathematics', code: 'MAT' }, exam: { name: 'Term 1 Opener', examType: 'Opener' }, marks: 78, grade: 'B+', points: 10, cbeAchievementLevel: 6, cbeDescriptor: 'ME1', cbeDescriptorName: 'Meeting Expectations', remarks: 'Good work on algebra. Needs improvement in geometry.', teacherComment: 'Shows good understanding of basic concepts. Practice more on problem-solving.' },
          { id: 'demo-g2', subject: { name: 'English', code: 'ENG' }, exam: { name: 'Term 1 Opener', examType: 'Opener' }, marks: 85, grade: 'A', points: 12, cbeAchievementLevel: 7, cbeDescriptor: 'EE2', cbeDescriptorName: 'Exceeding Expectations', remarks: 'Excellent essay writing skills. Very creative.', teacherComment: 'Outstanding performance. Keep up the good work!' },
          { id: 'demo-g3', subject: { name: 'Biology', code: 'BIO' }, exam: { name: 'Term 1 Opener', examType: 'Opener' }, marks: 72, grade: 'B', points: 9, cbeAchievementLevel: 6, cbeDescriptor: 'ME1', cbeDescriptorName: 'Meeting Expectations', remarks: 'Good understanding of cell biology.', teacherComment: 'Solid grasp of concepts. Focus on diagrams.' },
          { id: 'demo-g4', subject: { name: 'Kiswahili', code: 'KIS' }, exam: { name: 'Term 1 Opener', examType: 'Opener' }, marks: 68, grade: 'B-', points: 8, cbeAchievementLevel: 5, cbeDescriptor: 'ME2', cbeDescriptorName: 'Meeting Expectations', remarks: 'Good effort in grammar. Practice more on composition.', teacherComment: 'Making good progress. Read more Kiswahili literature.' },
        ],
      })
    }

    // Find student by admission number
    const student = await db.student.findFirst({
      where: { admissionNo },
      select: { id: true, firstName: true, lastName: true, classLevelId: true },
    })

    if (!student) {
      return NextResponse.json({ homework: [], grades: [] })
    }

    // Get homework for the student's class level
    const homework = await db.homework.findMany({
      where: {
        OR: [
          { classLevelId: student.classLevelId },
          { classLevelId: null }, // school-wide homework
        ],
        status: 'Active',
      },
      include: {
        subject: { select: { name: true, code: true } },
        classLevel: { select: { name: true } },
        comments: { orderBy: { createdAt: 'asc' } },
      },
      orderBy: { dueDate: 'asc' },
      take: 20,
    })

    // Get grades with teacher remarks
    const grades = await db.grade.findMany({
      where: { studentId: student.id },
      include: {
        subject: { select: { name: true, code: true } },
        exam: { select: { name: true, examType: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({
      homework: homework.map(h => ({
        ...h,
        dueDate: h.dueDate.toISOString(),
        comments: h.comments.map(c => ({ ...c, createdAt: c.createdAt.toISOString() })),
      })),
      grades: grades.map(g => ({
        id: g.id,
        subject: g.subject,
        exam: g.exam,
        marks: g.marks,
        grade: g.grade,
        points: g.points,
        remarks: g.remarks,
        cbeAchievementLevel: g.cbeAchievementLevel,
        cbeDescriptor: g.cbeDescriptor,
        cbeDescriptorName: g.cbeDescriptorName,
        cbeStrand: g.cbeStrand,
        cbeSubStrand: g.cbeSubStrand,
        teacherComment: g.teacherComment,
      })),
    })
  } catch (error) {
    console.error('[parent homework GET] error:', error)
    return NextResponse.json({ homework: [], grades: [] })
  }
}
