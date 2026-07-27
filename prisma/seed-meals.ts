// Seed cafeteria & meals data
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

// Realistic Kenyan school cafeteria menu items
const BREAKFAST_ITEMS = [
  { item: 'Uji (Porridge)', acc: 'Bread & Margarine', bev: 'Tea' },
  { item: 'Githeri', acc: 'Bread', bev: 'Tea' },
  { item: 'Boiled Eggs', acc: 'Bread & Margarine', bev: 'Tea' },
  { item: 'Weetabix', acc: 'Banana', bev: 'Milk' },
  { item: 'Mandazi', acc: 'Beans', bev: 'Tea' },
]
const LUNCH_ITEMS = [
  { item: 'Rice & Beans', acc: 'Cabbage', bev: 'Water' },
  { item: 'Ugali & Sukuma Wiki', acc: 'Beef Stew', bev: 'Water' },
  { item: 'Chapati & Beans', acc: 'Kachumbari', bev: 'Water' },
  { item: 'Rice & Beef Stew', acc: 'Spinach', bev: 'Water' },
  { item: 'Githeri', acc: 'Cabbage', bev: 'Water' },
  { item: 'Pilau', acc: 'Banana', bev: 'Soda' },
  { item: 'Ugali & Fish', acc: 'Sukuma Wiki', bev: 'Water' },
  { item: 'Spaghetti & Mince', acc: 'Green Grams', bev: 'Water' },
]
const SUPPER_ITEMS = [
  { item: 'Ugali & Eggs', acc: 'Spinach', bev: 'Tea' },
  { item: 'Rice & Lentils', acc: 'Cabbage', bev: 'Tea' },
  { item: 'Chapati & Green Grams', acc: 'Kachumbari', bev: 'Tea' },
  { item: 'Ugali & Chicken', acc: 'Sukuma Wiki', bev: 'Tea' },
  { item: 'Matoke & Beans', acc: 'Spinach', bev: 'Tea' },
  { item: 'Rice & Beef Stew', acc: 'Cabbage', bev: 'Tea' },
]
const TEA_ITEMS = [
  { item: 'Bread & Margarine', acc: null, bev: 'Tea' },
  { item: 'Mandazi', acc: null, bev: 'Tea' },
  { item: 'Biscuits', acc: null, bev: 'Tea' },
  { item: 'Sweet Potato', acc: null, bev: 'Tea' },
]
const COOKS = ['Chef Wanjiru', 'Chef Kamau', 'Chef Achieng', 'Chef Kiprop']

const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a

async function main() {
  console.log('🍽️ Seeding cafeteria & meals data...')
  await db.mealAttendance.deleteMany()
  await db.mealMenu.deleteMany()

  let menuCount = 0
  let attCount = 0

  // Generate menu for last 14 days + next 7 days
  for (let offset = -14; offset <= 7; offset++) {
    const date = new Date()
    date.setDate(date.getDate() + offset)
    date.setHours(0, 0, 0, 0)
    const dayOfWeek = date.getDay()

    // Skip Sundays (school rest day in Kenya)
    if (dayOfWeek === 0) continue

    const meals = [
      { type: 'Breakfast', items: BREAKFAST_ITEMS, hour: 7 },
      { type: 'Lunch', items: LUNCH_ITEMS, hour: 12 },
      { type: 'Tea Break', items: TEA_ITEMS, hour: 16 },
      { type: 'Supper', items: SUPPER_ITEMS, hour: 19 },
    ]

    for (const meal of meals) {
      const tmpl = rand(meal.items)
      const mealDate = new Date(date)
      mealDate.setHours(meal.hour, 0, 0, 0)

      const isPast = offset < 0
      const isToday = offset === 0
      const status = isPast ? rand(['Served', 'Served', 'Served']) : isToday && mealDate < new Date() ? 'Served' : 'Planned'

      const menu = await db.mealMenu.create({
        data: {
          date: mealDate,
          mealType: meal.type,
          item: tmpl.item,
          accompaniment: tmpl.acc || null,
          beverage: tmpl.bev,
          notes: Math.random() > 0.85 ? 'Vegetarian option available' : null,
          servingsPlanned: randInt(180, 260),
          servingsServed: status === 'Served' ? randInt(170, 250) : 0,
          status,
          cook: rand(COOKS),
        },
      })
      menuCount++

      // Add attendance for served meals
      if (status === 'Served') {
        const personTypes = [
          { type: 'Student', min: 180, max: 230 },
          { type: 'Staff', min: 20, max: 35 },
        ]
        for (const pt of personTypes) {
          await db.mealAttendance.create({
            data: {
              menuId: menu.id,
              personType: pt.type,
              headcount: randInt(pt.min, pt.max),
              date: mealDate,
              notes: Math.random() > 0.9 ? 'Extra portions requested' : null,
            },
          })
          attCount++
        }
      }
    }
  }

  console.log(`✓ Created ${menuCount} meal menus, ${attCount} attendance records`)
  const byType = await db.mealMenu.groupBy({ by: ['mealType'], _count: true })
  byType.forEach(t => console.log(`  ${t.mealType}: ${t._count}`))
}

main().catch(console.error).finally(() => db.$disconnect())
