// Seed procurement & facilities data
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const SUPPLIERS = [
  { name: 'Text Book Centre', category: 'Stationery', contact: 'James Mwangi', phone: '+254 722 200 100', email: 'sales@textbookcentre.com', address: 'Kijabe St, Nairobi', status: 'Active' },
  { name: 'Office Point Ltd', category: 'Stationery', contact: 'Sarah Wanjiru', phone: '+254 733 600 200', email: 'info@officepoint.co.ke', address: 'Moi Ave, Nairobi', status: 'Active' },
  { name: 'Bidco Africa', category: 'Food', contact: 'Peter Otieno', phone: '+254 720 111 222', email: 'procurement@bidcoafrica.com', address: 'Thika Town', status: 'Active' },
  { name: 'Java House Supplies', category: 'Food', contact: 'Mary Achieng', phone: '+254 711 333 444', email: 'orders@javahouse.co.ke', address: 'Industrial Area, Nairobi', status: 'Active' },
  { name: 'Lab World Kenya', category: 'Equipment', contact: 'Dennis Kiprop', phone: '+254 722 555 666', email: 'info@labworld.co.ke', address: 'Ngara Rd, Nairobi', status: 'Active' },
  { name: 'Nairobi Tech Supplies', category: 'Equipment', contact: 'Faith Mutua', phone: '+254 733 777 888', email: 'sales@nairobytech.co.ke', address: 'Luthuli Ave, Nairobi', status: 'Active' },
  { name: 'Sports House Ltd', category: 'Equipment', contact: 'Brian Omondi', phone: '+254 720 999 000', email: 'info@sportshouse.co.ke', address: 'River Rd, Nairobi', status: 'Active' },
  { name: 'Safe Guard Security', category: 'Services', contact: 'Grace Nyambura', phone: '+254 711 123 456', email: 'ops@safeguard.co.ke', address: 'Westlands, Nairobi', status: 'Active' },
  { name: 'Clean Pro Services', category: 'Services', contact: 'Joseph Kamau', phone: '+254 722 234 567', email: 'info@cleanpro.co.ke', address: 'Embakasi, Nairobi', status: 'Active' },
  { name: 'Naivas Wholesale', category: 'Food', contact: 'Esther Njeri', phone: '+254 733 345 678', email: 'b2b@naivas.co.ke', address: 'Mombasa Rd, Nairobi', status: 'Inactive' },
]

const PURCHASE_ORDERS = [
  { supplierName: 'Text Book Centre', item: 'A4 Exercise Books (200pg)', desc: 'Ruled, assorted covers for Term 1', qty: 2000, unitPrice: 85, status: 'Delivered', daysAgo: 14 },
  { supplierName: 'Office Point Ltd', item: 'Ream A4 Photocopy Paper', desc: '80gsm white, 500 sheets per ream', qty: 150, unitPrice: 650, status: 'Approved', daysAgo: 3 },
  { supplierName: 'Bidco Africa', item: 'Cooking Oil (20L)', desc: 'Gold n Corn cooking fat for kitchen', qty: 30, unitPrice: 3200, status: 'Pending', daysAgo: 1 },
  { supplierName: 'Java House Supplies', item: 'Tea Leaves (Bulk)', desc: 'Kericho Gold, 1kg packs', qty: 50, unitPrice: 850, status: 'Delivered', daysAgo: 21 },
  { supplierName: 'Lab World Kenya', item: 'Compound Microscopes', desc: 'x10 / x40 / x100 magnification', qty: 15, unitPrice: 18500, status: 'Approved', daysAgo: 5 },
  { supplierName: 'Nairobi Tech Supplies', item: 'Desktop Computers', desc: 'Core i5, 8GB RAM, 500GB SSD, with monitor', qty: 10, unitPrice: 65000, status: 'Pending', daysAgo: 2 },
  { supplierName: 'Sports House Ltd', item: 'Footballs (Size 5)', desc: 'FIFA standard match balls', qty: 24, unitPrice: 2800, status: 'Delivered', daysAgo: 30 },
  { supplierName: 'Safe Guard Security', item: 'CCTV Cameras (Bullet)', desc: '4MP outdoor with night vision', qty: 8, unitPrice: 9500, status: 'Cancelled', daysAgo: 10 },
  { supplierName: 'Clean Pro Services', item: 'Monthly Cleaning Contract', desc: 'Daily cleaning of classrooms & offices', qty: 1, unitPrice: 85000, status: 'Approved', daysAgo: 7 },
  { supplierName: 'Text Book Centre', item: 'KCSE Revision Books', desc: 'Set of 8 subjects, Form 4 class', qty: 60, unitPrice: 4200, status: 'Pending', daysAgo: 0 },
  { supplierName: 'Bidco Africa', item: 'Detergent (Bulk)', desc: '20kg drums of industrial detergent', qty: 12, unitPrice: 4500, status: 'Delivered', daysAgo: 18 },
  { supplierName: 'Office Point Ltd', item: 'Toner Cartridges (HP)', desc: 'HP 85A black toner for LaserJet', qty: 20, unitPrice: 4200, status: 'Approved', daysAgo: 4 },
]

const FACILITIES = [
  { name: 'Main Assembly Hall', type: 'Hall', capacity: 800, location: 'Admin Block, 1st Floor', status: 'Available' },
  { name: 'Multi-Purpose Hall', type: 'Hall', capacity: 300, location: 'Block B, Ground Floor', status: 'Available' },
  { name: 'Main Sports Ground', type: 'Ground', capacity: 1500, location: 'Behind Main Block', status: 'Available' },
  { name: 'Basketball Court', type: 'Ground', capacity: 200, location: 'Next to Sports Store', status: 'Available' },
  { name: 'Biology Lab', type: 'Lab', capacity: 40, location: 'Block C, Room 12', status: 'Available' },
  { name: 'Chemistry Lab', type: 'Lab', capacity: 40, location: 'Block C, Room 14', status: 'Maintenance' },
  { name: 'Physics Lab', type: 'Lab', capacity: 40, location: 'Block C, Room 16', status: 'Available' },
  { name: 'Computer Lab', type: 'Lab', capacity: 45, location: 'Block D, Room 1', status: 'Available' },
  { name: 'Form 1A Classroom', type: 'Classroom', capacity: 45, location: 'Block A, Room 101', status: 'Available' },
  { name: 'Form 4B Classroom', type: 'Classroom', capacity: 45, location: 'Block A, Room 204', status: 'Reserved' },
  { name: 'Staff Meeting Room', type: 'Classroom', capacity: 60, location: 'Admin Block, 2nd Floor', status: 'Available' },
  { name: 'Athletics Field', type: 'Field', capacity: 1000, location: 'North Wing', status: 'Available' },
  { name: 'Football Pitch', type: 'Field', capacity: 500, location: 'South Wing', status: 'Available' },
  { name: 'Music Room', type: 'Classroom', capacity: 30, location: 'Block E, Room 5', status: 'Available' },
]

const BOOKINGS = [
  { facilityName: 'Main Assembly Hall', bookedBy: 'Mary Wanjiru (Principal)', purpose: 'Weekly Monday assembly', startOffsetH: 24, durationH: 2, status: 'Approved' },
  { facilityName: 'Main Sports Ground', bookedBy: 'Brian Omondi (Games Dept)', purpose: 'Inter-house athletics trials', startOffsetH: 48, durationH: 6, status: 'Pending' },
  { facilityName: 'Biology Lab', bookedBy: 'Grace Achieng (Science Dept)', purpose: 'Form 3 KCSE practical practice', startOffsetH: 72, durationH: 3, status: 'Approved' },
  { facilityName: 'Computer Lab', bookedBy: 'Dennis Kiprop (ICT Dept)', purpose: 'KCSE Computer Studies practical exam', startOffsetH: 96, durationH: 4, status: 'Pending' },
  { facilityName: 'Multi-Purpose Hall', bookedBy: 'Esther Njeri (Secretary)', purpose: 'Parents Teachers Association meeting', startOffsetH: -2, durationH: 3, status: 'Completed' },
  { facilityName: 'Football Pitch', bookedBy: 'Brian Omondi (Games Dept)', purpose: 'Friendly match vs. Riverside School', startOffsetH: 120, durationH: 3, status: 'Approved' },
  { facilityName: 'Staff Meeting Room', bookedBy: 'Mary Wanjiru (Principal)', purpose: 'End of term staff briefing', startOffsetH: -24, durationH: 2, status: 'Completed' },
  { facilityName: 'Music Room', bookedBy: 'Faith Mutua (Music Teacher)', purpose: 'Choir rehearsal for music festival', startOffsetH: 12, durationH: 2, status: 'Pending' },
  { facilityName: 'Main Assembly Hall', bookedBy: 'Esther Njeri (Secretary)', purpose: 'Cultural Day rehearsal', startOffsetH: 168, durationH: 5, status: 'Rejected' },
  { facilityName: 'Athletics Field', bookedBy: 'Brian Omondi (Games Dept)', purpose: 'Sub-county athletics championship', startOffsetH: 240, durationH: 8, status: 'Approved' },
  { facilityName: 'Physics Lab', bookedBy: 'Grace Achieng (Science Dept)', purpose: 'Form 4 Physics practical', startOffsetH: 5, durationH: 2, status: 'Pending' },
  { facilityName: 'Form 1A Classroom', bookedBy: 'Joseph Kamau (Boarding)', purpose: 'Boarding students evening study', startOffsetH: 8, durationH: 2, status: 'Approved' },
]

const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const REQUESTERS = ['Mary Wanjiru', 'Peter Kamau', 'Grace Achieng', 'Dennis Kiprop', 'Esther Njeri', 'Brian Omondi']

async function main() {
  console.log('🛒 Seeding procurement & facilities...')

  // Clean slate
  await db.purchaseOrder.deleteMany()
  await db.supplier.deleteMany()
  await db.facilityBooking.deleteMany()
  await db.facility.deleteMany()

  // ---- Suppliers ----
  const supplierMap = new Map<string, string>()
  for (const s of SUPPLIERS) {
    const supplier = await db.supplier.create({ data: s })
    supplierMap.set(s.name, supplier.id)
  }
  console.log(`✓ Created ${SUPPLIERS.length} suppliers`)

  // ---- Purchase Orders ----
  const year = new Date().getFullYear()
  let poNum = 1
  for (const po of PURCHASE_ORDERS) {
    const supplierId = supplierMap.get(po.supplierName)
    if (!supplierId) continue
    const orderDate = new Date()
    orderDate.setDate(orderDate.getDate() - po.daysAgo)
    const totalAmount = po.qty * po.unitPrice
    let approvedBy: string | null = null
    let deliveryDate: Date | null = null
    if (po.status === 'Approved' || po.status === 'Delivered') {
      approvedBy = rand(['Mary Wanjiru', 'Peter Kamau (Bursar)', 'Esther Njeri (Admin)'])
    }
    if (po.status === 'Delivered') {
      deliveryDate = new Date(orderDate.getTime() + Math.floor(Math.random() * 5 + 2) * 86400000)
      if (deliveryDate > new Date()) deliveryDate = new Date(orderDate.getTime() + 2 * 86400000)
    }
    await db.purchaseOrder.create({
      data: {
        poNumber: `PO-${year}-${String(poNum++).padStart(4, '0')}`,
        supplierId,
        item: po.item,
        description: po.desc,
        quantity: po.qty,
        unitPrice: po.unitPrice,
        totalAmount,
        status: po.status,
        requestedBy: rand(REQUESTERS),
        approvedBy,
        orderDate,
        deliveryDate,
      },
    })
  }
  console.log(`✓ Created ${PURCHASE_ORDERS.length} purchase orders`)

  // ---- Facilities ----
  const facilityMap = new Map<string, string>()
  for (const f of FACILITIES) {
    const facility = await db.facility.create({ data: f })
    facilityMap.set(f.name, facility.id)
  }
  console.log(`✓ Created ${FACILITIES.length} facilities`)

  // ---- Bookings ----
  for (const b of BOOKINGS) {
    const facilityId = facilityMap.get(b.facilityName)
    if (!facilityId) continue
    const startDate = new Date(Date.now() + b.startOffsetH * 3600000)
    const endDate = new Date(startDate.getTime() + b.durationH * 3600000)
    await db.facilityBooking.create({
      data: {
        facilityId,
        bookedBy: b.bookedBy,
        purpose: b.purpose,
        startDate,
        endDate,
        status: b.status,
      },
    })
  }
  console.log(`✓ Created ${BOOKINGS.length} facility bookings`)

  // Summary
  const poByStatus = await db.purchaseOrder.groupBy({ by: ['status'], _count: true, _sum: { totalAmount: true } })
  console.log('\nProcurement summary:')
  poByStatus.forEach(s => console.log(`  ${s.status}: ${s._count} orders, KES ${(s._sum.totalAmount || 0).toLocaleString()}`))
  const fbByStatus = await db.facilityBooking.groupBy({ by: ['status'], _count: true })
  console.log('\nFacilities summary:')
  fbByStatus.forEach(s => console.log(`  ${s.status}: ${s._count} bookings`))
}

main().catch(console.error).finally(() => db.$disconnect())
