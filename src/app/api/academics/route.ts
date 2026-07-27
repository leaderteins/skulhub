import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(_req: NextRequest) {
  const [classLevels, subjects, exams, gradesAgg, gradeCount, totalStudents, totalStreams, totalExams, categoryAgg] =
    await Promise.all([
      db.classLevel.findMany({
        orderBy: { order: 'asc' },
        include: {
          streams: {
            include: {
              classTeacher: { select: { id: true, firstName: true, lastName: true, employeeNo: true } },
              _count: { select: { enrollments: { where: { status: 'Active' } } } },
            },
            orderBy: { name: 'asc' },
          },
          _count: { select: { enrollments: { where: { status: 'Active' } } } },
        },
      }),
      db.subject.findMany({
        orderBy: { name: 'asc' },
        include: {
          department: { select: { id: true, name: true } },
          _count: { select: { assignments: true, timetables: true, grades: true } },
        },
      }),
      db.exam.findMany({
        orderBy: { startDate: 'desc' },
        include: { _count: { select: { grades: true } } },
      }),
      db.grade.aggregate({ _avg: { marks: true }, _count: true }),
      db.grade.count(),
      db.student.count({ where: { status: 'Active' } }),
      db.stream.count(),
      db.exam.count(),
      db.subject.groupBy({ by: ['category'], _count: true }),
    ])

  // Subject category breakdown (for bar chart)
  const subjectCategories = categoryAgg.map((c) => ({ category: c.category, count: c._count }))

  // Build a per-stream student count lookup for convenience
  const classLevelsWithStats = classLevels.map((cl) => {
    const streamCount = cl.streams.length
    const studentCount = cl.streams.reduce((sum, s) => sum + s._count.enrollments, 0)
    return {
      id: cl.id,
      name: cl.name,
      stage: cl.stage,
      order: cl.order,
      capacity: cl.capacity,
      streamCount,
      studentCount,
      streams: cl.streams.map((s) => ({
        id: s.id,
        name: s.name,
        capacity: s.capacity,
        studentCount: s._count.enrollments,
        classTeacher: s.classTeacher
          ? {
              id: s.classTeacher.id,
              name: `${s.classTeacher.firstName} ${s.classTeacher.lastName}`,
              employeeNo: s.classTeacher.employeeNo,
            }
          : null,
      })),
    }
  })

  const subjectsWithStats = subjects.map((s) => ({
    id: s.id,
    name: s.name,
    code: s.code,
    category: s.category,
    department: s.department ? { id: s.department.id, name: s.department.name } : null,
    classesAssigned: s._count.assignments,
    timetableSlots: s._count.timetables,
    gradesRecorded: s._count.grades,
  }))

  const examList = exams.map((e) => ({
    id: e.id,
    name: e.name,
    academicYear: e.academicYear,
    term: e.term,
    examType: e.examType,
    startDate: e.startDate,
    endDate: e.endDate,
    gradesCount: e._count.grades,
  }))

  const avgPerformance = gradesAgg._avg.marks ? Math.round(gradesAgg._avg.marks * 10) / 10 : 0

  return NextResponse.json({
    stats: {
      totalClassLevels: classLevels.length,
      totalStreams,
      totalSubjects: subjects.length,
      totalExams,
      totalStudents,
      totalGrades: gradeCount,
      avgPerformance,
    },
    classLevels: classLevelsWithStats,
    subjects: subjectsWithStats,
    subjectCategories,
    exams: examList,
  })
}
