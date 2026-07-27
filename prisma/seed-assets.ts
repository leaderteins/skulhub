// Seed inventory & assets
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const ASSETS = [
  // Furniture
  { name: 'Student Desk', category: 'Furniture', cost: 4500, location: 'Classroom Block A', qty: 120, cond: 'Good' },
  { name: 'Student Chair', category: 'Furniture', cost: 1800, location: 'Classroom Block A', qty: 120, cond: 'Good' },
  { name: 'Teacher Desk', category: 'Furniture', cost: 8500, location: 'Staff Room', qty: 15, cond: 'Excellent' },
  { name: 'Whiteboard (Large)', category: 'Furniture', cost: 12000, location: 'Classrooms', qty: 12, cond: 'Good' },
  { name: 'Library Bookshelf', category: 'Furniture', cost: 28000, location: 'Library', qty: 8, cond: 'Good' },
  { name: 'Dining Table', category: 'Furniture', cost: 15000, location: 'Dining Hall', qty: 20, cond: 'Fair' },
  { name: 'Dormitory Bunk Bed', category: 'Furniture', cost: 12000, location: 'Dormitories', qty: 100, cond: 'Good' },
  // Electronics
  { name: 'Desktop Computer', category: 'Electronics', cost: 55000, location: 'Computer Lab', qty: 30, cond: 'Good' },
  { name: 'Projector (Epson)', category: 'Electronics', cost: 75000, location: 'Various', qty: 6, cond: 'Good' },
  { name: 'Printer (HP LaserJet)', category: 'Electronics', cost: 35000, location: 'Admin Office', qty: 4, cond: 'Fair' },
  { name: 'Sound System', category: 'Electronics', cost: 120000, location: 'Main Hall', qty: 1, cond: 'Excellent' },
  { name: 'Public Address System', category: 'Electronics', cost: 45000, location: 'Assembly Ground', qty: 1, cond: 'Good' },
  { name: 'CCTV Camera', category: 'Electronics', cost: 8000, location: 'Gate & Corridors', qty: 16, cond: 'Good' },
  { name: 'Intercom System', category: 'Electronics', cost: 25000, location: 'Admin Block', qty: 1, cond: 'Fair' },
  // Lab Equipment
  { name: 'Microscope (Compound)', category: 'Lab Equipment', cost: 18000, location: 'Biology Lab', qty: 20, cond: 'Good' },
  { name: 'Bunsen Burner', category: 'Lab Equipment', cost: 1200, location: 'Chemistry Lab', qty: 30, cond: 'Good' },
  { name: 'Chemistry Glassware Set', category: 'Lab Equipment', cost: 8500, location: 'Chemistry Lab', qty: 15, cond: 'Fair' },
  { name: 'Physics Balance', category: 'Lab Equipment', cost: 22000, location: 'Physics Lab', qty: 8, cond: 'Good' },
  { name: 'Human Anatomy Model', category: 'Lab Equipment', cost: 15000, location: 'Biology Lab', qty: 5, cond: 'Excellent' },
  // Sports
  { name: 'Football', category: 'Sports', cost: 3500, location: 'Sports Store', qty: 12, cond: 'Fair' },
  { name: 'Basketball', category: 'Sports', cost: 4000, location: 'Sports Store', qty: 8, cond: 'Good' },
  { name: 'Volleyball Net', category: 'Sports', cost: 8500, location: 'Sports Store', qty: 4, cond: 'Good' },
  { name: 'Athletics Track Equipment', category: 'Sports', cost: 45000, location: 'Sports Store', qty: 1, cond: 'Good' },
  { name: 'Table Tennis Table', category: 'Sports', cost: 35000, location: 'Games Room', qty: 2, cond: 'Good' },
  // Kitchen
  { name: 'Industrial Cooker', category: 'Kitchen', cost: 180000, location: 'Kitchen', qty: 2, cond: 'Good' },
  { name: 'Refrigerator (Large)', category: 'Kitchen', cost: 85000, location: 'Kitchen', qty: 3, cond: 'Good' },
  { name: 'Dining Plates (Bulk)', category: 'Kitchen', cost: 80, location: 'Kitchen Store', qty: 500, cond: 'Fair' },
  // Vehicles
  { name: 'School Bus (Coaster)', category: 'Vehicle', cost: 8500000, location: 'Parking', qty: 1, cond: 'Good' },
  { name: 'School Van (Hiace)', category: 'Vehicle', cost: 4200000, location: 'Parking', qty: 1, cond: 'Good' },
]

const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a
const DEPARTMENTS = ['Mathematics', 'Sciences', 'Languages', 'Humanities', 'Technical', 'Games Department', 'Library', 'Admin', 'Boarding']
const VENDORS = ['Nairobi Tech Supplies', 'Office Point Ltd', 'School Equip Co.', 'Lab World Kenya', 'Sports House']
const TECHNICIANS = ['John Mwangi', 'Peter Kamau', 'Esther Achieng', 'James Otieno']

async function main() {
  console.log('📦 Seeding inventory & assets...')
  await db.assetMaintenance.deleteMany()
  await db.asset.deleteMany()

  let assetCount = 0
  let maintCount = 0
  let tagNum = 1

  for (const a of ASSETS) {
    const purchaseDate = new Date(randInt(2018, 2024), randInt(0, 11), randInt(1, 28))
    const ageYears = (Date.now() - purchaseDate.getTime()) / (365.25 * 86400000)
    // Depreciate: 15% per year, min 10% of purchase cost
    const currentValue = Math.round(Math.max(a.cost * 0.1, a.cost * Math.pow(0.85, ageYears)))

    // Some assets have different statuses
    let status = 'In Use'
    const r = Math.random()
    if (r > 0.92) status = 'Under Repair'
    else if (r > 0.88) status = 'In Storage'
    else if (r > 0.96) status = 'Disposed'

    const asset = await db.asset.create({
      data: {
        assetTag: `AST-${String(tagNum++).padStart(3, '0')}`,
        name: a.name,
        category: a.category,
        description: `${a.name} — ${a.category} asset for school use`,
        serialNumber: Math.random() > 0.4 ? `SN${randInt(100000, 999999)}` : null,
        purchaseDate,
        purchaseCost: a.cost * a.qty,
        currentValue: currentValue * a.qty,
        condition: a.cond,
        status,
        location: a.location,
        assignedTo: rand(DEPARTMENTS),
        quantity: a.qty,
        notes: Math.random() > 0.8 ? 'Requires regular servicing' : null,
      },
    })
    assetCount++

    // 40% chance of maintenance records
    if (Math.random() > 0.6) {
      const numMaint = randInt(1, 4)
      for (let i = 0; i < numMaint; i++) {
        const daysAgo = randInt(1, 365)
        const maintDate = new Date()
        maintDate.setDate(maintDate.getDate() - daysAgo)
        const maintStatus = daysAgo < 7 ? rand(['Scheduled', 'In Progress']) : 'Completed'
        await db.assetMaintenance.create({
          data: {
            assetId: asset.id,
            date: maintDate,
            type: rand(['Repair', 'Service', 'Inspection', 'Upgrade']),
            description: rand([
              'Routine maintenance and cleaning',
              'Replaced worn-out parts',
              'Annual service check',
              'Electrical fault repair',
              'Software update and calibration',
              'General inspection — no issues found',
              'Component replacement',
            ]),
            cost: randInt(500, 25000),
            vendor: rand(VENDORS),
            technician: rand(TECHNICIANS),
            status: maintStatus,
            nextDueDate: maintStatus === 'Completed' ? new Date(Date.now() + randInt(30, 180) * 86400000) : null,
          }
        })
        maintCount++
      }
    }
  }

  console.log(`✓ Created ${assetCount} assets, ${maintCount} maintenance records`)
  const byCategory = await db.asset.groupBy({ by: ['category'], _count: true, _sum: { currentValue: true } })
  byCategory.forEach(c => console.log(`  ${c.category}: ${c._count} items, KES ${c._sum.currentValue?.toLocaleString()}`))
}

main().catch(console.error).finally(() => db.$disconnect())
