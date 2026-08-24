// Seed visitor records for the Visitors & Gate module.
// Creates a realistic mix of checked-in and checked-out visitors with varied
// purposes, vehicles and times.
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const PURPOSES = ['Meeting', 'Delivery', 'Parent Visit', 'Official', 'Contractor', 'Other'] as const

interface SeedVisitor {
  visitorName: string
  idNumber: string
  phone: string
  purpose: (typeof PURPOSES)[number]
  personToSee: string
  vehicleReg: string | null
  checkInHoursAgo: number // relative to now
  stayMinutes: number | null // null = still checked in
  notes: string | null
  recordedBy: string
}

const VISITORS: SeedVisitor[] = [
  {
    visitorName: 'Joseph Kamau',
    idNumber: '29384756',
    phone: '+254712345678',
    purpose: 'Parent Visit',
    personToSee: 'Brian Kamau (Form 2A)',
    vehicleReg: 'KDA 234F',
    checkInHoursAgo: 1,
    stayMinutes: null,
    notes: 'Brings lunchbox and school supplies',
    recordedBy: 'Paul Wafula',
  },
  {
    visitorName: 'Sarah Wanjiku',
    idNumber: '27483910',
    phone: '+254722889900',
    purpose: 'Meeting',
    personToSee: 'Mr. Peter Kamau (Bursar)',
    vehicleReg: null,
    checkInHoursAgo: 2,
    stayMinutes: 45,
    notes: 'Discussed fee payment plan for Term 2',
    recordedBy: 'Paul Wafula',
  },
  {
    visitorName: 'David Otieno',
    idNumber: '31827465',
    phone: '+254733445566',
    purpose: 'Delivery',
    personToSee: 'Stores Department',
    vehicleReg: 'KCE 889D',
    checkInHoursAgo: 3,
    stayMinutes: 25,
    notes: 'Delivered 20 cartons of exercise books (Brighter Publishers)',
    recordedBy: 'Paul Wafula',
  },
  {
    visitorName: 'Engineer Faith Mutua',
    idNumber: '22998877',
    phone: '+254700112233',
    purpose: 'Contractor',
    personToSee: 'Estates Office',
    vehicleReg: 'KCH 556E',
    checkInHoursAgo: 4,
    stayMinutes: null,
    notes: 'Inspecting computer lab electrical installation works',
    recordedBy: 'Paul Wafula',
  },
  {
    visitorName: 'Margaret Achieng',
    idNumber: '26654321',
    phone: '+254711223344',
    purpose: 'Parent Visit',
    personToSee: 'Cynthia Achieng (Form 3B)',
    vehicleReg: null,
    checkInHoursAgo: 0.5,
    stayMinutes: null,
    notes: null,
    recordedBy: 'Paul Wafula',
  },
  {
    visitorName: 'Hon. Samuel Toroitich',
    idNumber: '10778899',
    phone: '+254722334455',
    purpose: 'Official',
    personToSee: 'Principal Mary Wanjiru',
    vehicleReg: 'KDG 001A',
    checkInHoursAgo: 5,
    stayMinutes: 60,
    notes: 'County Education Office — routine inspection visit',
    recordedBy: 'Paul Wafula',
  },
  {
    visitorName: 'James Mwangi',
    idNumber: '33445566',
    phone: '+254733556677',
    purpose: 'Delivery',
    personToSee: 'Cafeteria',
    vehicleReg: 'KBF 220C',
    checkInHoursAgo: 6,
    stayMinutes: 30,
    notes: 'Fresh produce delivery — vegetables and fruits',
    recordedBy: 'Paul Wafula',
  },
  {
    visitorName: 'Dr. Esther Njeri',
    idNumber: '25564738',
    phone: '+254700998877',
    purpose: 'Meeting',
    personToSee: 'Deputy Principal',
    vehicleReg: 'KCY 010B',
    checkInHoursAgo: 7,
    stayMinutes: 90,
    notes: 'Curriculum review committee meeting',
    recordedBy: 'Paul Wafula',
  },
  {
    visitorName: 'Peter Njoroge',
    idNumber: '28765432',
    phone: '+254711445599',
    purpose: 'Contractor',
    personToSee: 'Estates Office',
    vehicleReg: 'KDA 901X',
    checkInHoursAgo: 8,
    stayMinutes: 120,
    notes: 'Plumbing repair works — boys dormitory block C',
    recordedBy: 'Paul Wafula',
  },
  {
    visitorName: 'Grace Wairimu',
    idNumber: '29876543',
    phone: '+254722778899',
    purpose: 'Other',
    personToSee: 'Ms. Grace Achieng (Teacher)',
    vehicleReg: null,
    checkInHoursAgo: 26,
    stayMinutes: 35,
    notes: 'Returned lost library book picked from bus stop',
    recordedBy: 'Paul Wafula',
  },
  {
    visitorName: 'Bishop Daniel Kiprop',
    idNumber: '12345678',
    phone: '+254733112233',
    purpose: 'Official',
    personToSee: 'Principal Mary Wanjiru',
    vehicleReg: 'KBY 777Z',
    checkInHoursAgo: 28,
    stayMinutes: 75,
    notes: 'Sunday chapel coordination meeting',
    recordedBy: 'Paul Wafula',
  },
  {
    visitorName: 'Lucy Wangari',
    idNumber: '30192837',
    phone: '+254700556677',
    purpose: 'Parent Visit',
    personToSee: 'Kevin Mwangi (Form 4A)',
    vehicleReg: 'KCC 415H',
    checkInHoursAgo: 49,
    stayMinutes: 40,
    notes: 'Discussed KCSE revision materials and exam fees',
    recordedBy: 'Paul Wafula',
  },
]

async function main() {
  console.log('🚪 Seeding visitor records...')
  await db.visitor.deleteMany()

  let checkedIn = 0
  let checkedOut = 0

  for (const v of VISITORS) {
    const checkInTime = new Date(Date.now() - v.checkInHoursAgo * 3600_000)
    const isCheckedIn = v.stayMinutes === null
    const checkOutTime = isCheckedIn
      ? null
      : new Date(checkInTime.getTime() + v.stayMinutes * 60_000)

    await db.visitor.create({
      data: {
        visitorName: v.visitorName,
        idNumber: v.idNumber,
        phone: v.phone,
        purpose: v.purpose,
        personToSee: v.personToSee,
        vehicleReg: v.vehicleReg,
        checkInTime,
        checkOutTime,
        status: isCheckedIn ? 'Checked In' : 'Checked Out',
        notes: v.notes,
        recordedBy: v.recordedBy,
      },
    })
    if (isCheckedIn) checkedIn++
    else checkedOut++
  }

  console.log(`✓ Created ${VISITORS.length} visitors (${checkedIn} checked-in, ${checkedOut} checked-out)`)
}

main().catch(console.error).finally(() => db.$disconnect())
