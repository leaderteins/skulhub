import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/cafeteria?mealType=&status=&from=&to=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const mealType = searchParams.get('mealType') || ''
  const status = searchParams.get('status') || ''
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const where: {
    mealType?: string
    status?: string
    date?: { gte?: Date; lte?: Date }
  } = {}
  if (mealType) where.mealType = mealType
  if (status) where.status = status
  if (from || to) {
    where.date = {}
    if (from) where.date.gte = new Date(from)
    if (to) where.date.lte = new Date(to)
  }

  const [menus, totalMenus, servedMenus, totalAttendance, byMealType, byStatus, todayMeals, totalServed] = await Promise.all([
    db.mealMenu.findMany({
      where,
      orderBy: { date: 'desc' },
      include: {
        attendances: { select: { id: true, personType: true, headcount: true, notes: true } },
      },
      take: 60,
    }),
    db.mealMenu.count({ where }),
    db.mealMenu.count({ where: { status: 'Served' } }),
    db.mealAttendance.aggregate({ _sum: { headcount: true } }),
    db.mealMenu.groupBy({ by: ['mealType'], _count: true }),
    db.mealMenu.groupBy({ by: ['status'], _count: true }),
    db.mealMenu.findMany({
      where: {
        date: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
          lte: new Date(new Date().setHours(23, 59, 59, 999)),
        },
      },
      orderBy: { date: 'asc' },
    }),
    db.mealMenu.aggregate({ where: { status: 'Served' }, _sum: { servingsServed: true } }),
  ])

  return NextResponse.json({
    stats: {
      totalMenus,
      servedMenus,
      plannedMenus: byStatus.find(s => s.status === 'Planned')?._count || 0,
      totalAttendance: totalAttendance._sum.headcount || 0,
      totalServed: totalServed._sum.servingsServed || 0,
      todayMeals: todayMeals.length,
    },
    menus: menus.map(m => ({
      ...m,
      totalAttendance: m.attendances.reduce((s, a) => s + a.headcount, 0),
      studentAttendance: m.attendances.filter(a => a.personType === 'Student').reduce((s, a) => s + a.headcount, 0),
      staffAttendance: m.attendances.filter(a => a.personType === 'Staff').reduce((s, a) => s + a.headcount, 0),
    })),
    byMealType: byMealType.map(m => ({ name: m.mealType, count: m._count })),
    byStatus: byStatus.map(s => ({ name: s.status, count: s._count })),
    todayMeals,
  })
}

// POST /api/cafeteria — create a new meal menu
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.item || !body.mealType || !body.date) {
    return NextResponse.json({ error: 'item, mealType and date are required' }, { status: 400 })
  }
  const menu = await db.mealMenu.create({
    data: {
      date: new Date(body.date),
      mealType: body.mealType,
      item: body.item,
      accompaniment: body.accompaniment || null,
      beverage: body.beverage || null,
      notes: body.notes || null,
      servingsPlanned: Number(body.servingsPlanned) || 0,
      servingsServed: 0,
      status: body.status || 'Planned',
      cook: body.cook || null,
    },
  })
  await db.activityLog.create({
    data: { action: 'CREATE', entity: 'MealMenu', entityId: menu.id, user: body.cook || 'Kitchen', details: `Added ${body.mealType} menu: ${body.item}` },
  })
  return NextResponse.json(menu, { status: 201 })
}
