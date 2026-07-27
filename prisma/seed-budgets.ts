// Seed budget data for expense tracking
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const BUDGETS = [
  { category: 'Salaries', amount: 3200000, notes: 'Teaching & support staff salaries for the term' },
  { category: 'Utilities', amount: 180000, notes: 'Electricity, water, internet, gas' },
  { category: 'Maintenance', amount: 250000, notes: 'Building, equipment, vehicle repairs' },
  { category: 'Supplies', amount: 320000, notes: 'Stationery, lab supplies, cleaning materials' },
  { category: 'Transport', amount: 150000, notes: 'Fuel, vehicle servicing, route costs' },
  { category: 'Other', amount: 100000, notes: 'Miscellaneous and contingency' },
]

async function main() {
  console.log('💰 Seeding budget data...')
  await db.budget.deleteMany()
  let count = 0
  for (const b of BUDGETS) {
    await db.budget.create({
      data: {
        category: b.category,
        amount: b.amount,
        academicYear: '2025',
        term: 'Term 1',
        notes: b.notes,
      },
    })
    count++
  }
  console.log(`✓ Created ${count} budget records`)
  const total = await db.budget.aggregate({ _sum: { amount: true } })
  console.log(`  Total budget: KES ${total._sum.amount?.toLocaleString()}`)
}

main().catch(console.error).finally(() => db.$disconnect())
