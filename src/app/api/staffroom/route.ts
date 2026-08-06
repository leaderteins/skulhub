import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/staffroom — aggregated data for staff room display board
export async function GET() {
  const [totalStudents, totalStaff, announcements, todayMeals, upcomingEvents, attendanceToday] = await Promise.all([
    db.student.count({ where: { status: 'Active' } }),
    db.staff.count({ where: { status: 'Active' } }),
    db.announcement.findMany({
      orderBy: [{ pinned: 'desc' }, { publishedAt: 'desc' }],
      take: 6,
      select: { id: true, title: true, body: true, priority: true, pinned: true, publishedAt: true, authorName: true },
    }),
    db.mealMenu.findMany({
      where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)), lte: new Date(new Date().setHours(23, 59, 59, 999)) } },
      orderBy: { date: 'asc' },
      select: { id: true, mealType: true, item: true, accompaniment: true, beverage: true, date: true, status: true },
    }),
    db.event.findMany({
      where: { startDate: { gte: new Date() }, status: { in: ['Scheduled', 'Ongoing'] } },
      orderBy: { startDate: 'asc' },
      take: 4,
      select: { id: true, title: true, startDate: true, category: true, location: true },
    }),
    db.attendance.findMany({
      where: { date: { gte: new Date(new Date().setHours(0, 0, 0, 0)) }, personType: 'Student', status: 'Present' },
    }),
  ])

  return NextResponse.json({
    stats: {
      totalStudents,
      totalStaff,
      presentToday: attendanceToday.length,
      attendanceRate: totalStudents > 0 ? Math.round((attendanceToday.length / totalStudents) * 100) : 0,
    },
    announcements,
    todayMeals,
    upcomingEvents,
  })
}
