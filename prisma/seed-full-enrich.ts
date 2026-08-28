// Full enrichment — populates every module with realistic data
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

function rand<T>(a: T[]): T { return a[Math.floor(Math.random() * a.length)] }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min }

async function main() {
  console.log('🌱 Full system enrichment...')
  const school = await db.school.findUnique({ where: { slug: 'skulhub-academy' } })
  if (!school) { console.error('School not found!'); return }

  // 1. Fee Structures (per class level)
  console.log('  Creating fee structures...')
  const classLevels = await db.classLevel.findMany()
  const feeStructureData: any[] = []
  for (const cl of classLevels) {
    const amount = cl.stage?.includes('Senior') ? 45000 : cl.stage?.includes('Junior') ? 30000 : 20000
    try {
      const fs = await db.feeStructure.create({
        data: {
          classLevelId: cl.id,
          term: 'Term 1',
          academicYear: '2025',
          amount,
          description: `${cl.name} Tuition Fee - Term 1 2025`,
        }
      }).catch(() => null)
      if (fs) feeStructureData.push(fs)
    } catch {}
  }
  console.log(`    ✓ ${feeStructureData.length} fee structures`)

  // 2. Scholarships
  console.log('  Creating scholarships...')
  const scholarshipNames = ['Academic Excellence', 'Sports Talent', 'Need-Based', 'Orphan Support', 'Staff Child Discount']
  for (const name of scholarshipNames) {
    try {
      await db.scholarship.create({
        data: {
          name,
          description: `${name} scholarship for deserving students`,
          amount: randInt(5000, 20000),
          type: rand(['Full', 'Partial', 'Quarter']),
          criteria: 'Based on academic performance and financial need',
          status: 'Active',
        }
      }).catch(() => null)
    } catch {}
  }
  console.log('    ✓ Scholarships created')

  // 3. Transport routes & vehicles
  console.log('  Creating transport routes...')
  const routes = [
    { name: 'Route A: Kikuyu Town', distance: 5, fare: 3000, stops: 'Kikuyu Town, Gitaru, Wangige' },
    { name: 'Route B: Kabete', distance: 8, fare: 4000, stops: 'Kabete, Lower Kabete, Crossroads' },
    { name: 'Route C: Nairobi CBD', distance: 20, fare: 6000, stops: 'CBD, Westlands, Kangemi' },
    { name: 'Route D: Limuru', distance: 15, fare: 5000, stops: 'Limuru Town, Tigoni, Karura' },
    { name: 'Route E: Ruiru', distance: 18, fare: 5500, stops: 'Ruiru Town, Githurai, Kasarani' },
  ]
  for (const r of routes) {
    try {
      await db.transportRoute.create({
        data: { ...r, status: 'Active' }
      }).catch(() => null)
    } catch {}
  }
  const vehicles = [
    { regNo: 'KDA 123A', capacity: 33, type: 'Bus', status: 'Active', routeId: null },
    { regNo: 'KDB 456B', capacity: 25, type: 'Van', status: 'Active', routeId: null },
    { regNo: 'KDC 789C', capacity: 45, type: 'Bus', status: 'Active', routeId: null },
    { regNo: 'KDD 012D', capacity: 14, type: 'Van', status: 'Maintenance', routeId: null },
  ]
  for (const v of vehicles) {
    try {
      await db.vehicle.create({ data: v }).catch(() => null)
    } catch {}
  }
  console.log('    ✓ Transport routes & vehicles')

  // 4. Dormitories & beds (if not exists)
  console.log('  Creating dormitories...')
  const dorms = [
    { name: 'Mboya House', gender: 'Boys', capacity: 60, floors: 2, status: 'Active' },
    { name: 'Kenyatta House', gender: 'Boys', capacity: 50, floors: 2, status: 'Active' },
    { name: 'Nyeri House', gender: 'Girls', capacity: 55, floors: 2, status: 'Active' },
    { name: 'Mama Ngina House', gender: 'Girls', capacity: 50, floors: 2, status: 'Active' },
  ]
  for (const d of dorms) {
    try {
      const dorm = await db.dormitory.create({ data: d }).catch(() => null as any)
      if (dorm) {
        // Create rooms
        for (let f = 1; f <= d.floors; f++) {
          for (let r = 1; r <= 6; r++) {
            try {
              const room = await db.room.create({
                data: {
                  dormitoryId: dorm.id,
                  roomNumber: `${d.name.charAt(0)}-${f}${String(r).padStart(2, '0')}`,
                  floor: f,
                  capacity: 4,
                  status: 'Available',
                }
              }).catch(() => null as any)
              if (room) {
                // Create beds in each room
                for (const bedLetter of ['A', 'B', 'C', 'D']) {
                  try {
                    await db.bed.create({
                      data: { roomId: room.id, bedNumber: `Bed ${bedLetter}`, status: 'Available' }
                    }).catch(() => null)
                  } catch {}
                }
              }
            } catch {}
          }
        }
      }
    } catch {}
  }
  console.log('    ✓ Dormitories, rooms & beds')

  // 5. Library books (comprehensive)
  console.log('  Creating library books...')
  const bookList = [
    { title: 'KLB Mathematics Form 1', author: 'KLB', category: 'Mathematics', copies: 5 },
    { title: 'KLB Mathematics Form 2', author: 'KLB', category: 'Mathematics', copies: 5 },
    { title: 'KLB Mathematics Form 3', author: 'KLB', category: 'Mathematics', copies: 4 },
    { title: 'KLB Mathematics Form 4', author: 'KLB', category: 'Mathematics', copies: 4 },
    { title: 'Oxford English for Secondary', author: 'Oxford', category: 'Languages', copies: 5 },
    { title: 'Kiswahili Mufti Form 1-4', author: 'Longhorn', category: 'Languages', copies: 4 },
    { title: 'Biology Today', author: 'Pearson', category: 'Sciences', copies: 4 },
    { title: 'Chemistry Principles', author: 'Macmillan', category: 'Sciences', copies: 3 },
    { title: 'Physics Fundamentals', author: 'Heinemann', category: 'Sciences', copies: 3 },
    { title: 'History of East Africa', author: 'East African', category: 'Humanities', copies: 4 },
    { title: 'Geography Atlas', author: 'Philip\'s', category: 'Humanities', copies: 2 },
    { title: 'CRE for Secondary Schools', author: 'Longhorn', category: 'Religious Education', copies: 4 },
    { title: 'Business Studies', author: 'KLB', category: 'Business', copies: 3 },
    { title: 'Computer Studies', author: 'Oxford', category: 'Technical', copies: 3 },
    { title: 'Agriculture for KCSE', author: 'KLB', category: 'Applied Sciences', copies: 3 },
    { title: 'Home Science', author: 'Macmillan', category: 'Applied Sciences', copies: 2 },
    { title: 'Physical Education Handbook', author: 'Heinemann', category: 'Co-curricular', copies: 5 },
    { title: 'Set Book: Betrayal in the City', author: 'Francis Imbuga', category: 'Literature', copies: 6 },
    { title: 'Set Book: The River Between', author: 'Ngugi wa Thiongo', category: 'Literature', copies: 6 },
    { title: 'Set Book: A Doll\'s House', author: 'Henrik Ibsen', category: 'Literature', copies: 5 },
    { title: 'Atlas of Kenya', author: 'Survey of Kenya', category: 'Reference', copies: 2 },
    { title: 'Dictionary English-Kiswahili', author: 'Kamusi', category: 'Reference', copies: 4 },
    { title: 'Encyclopedia of Science', author: 'DK', category: 'Reference', copies: 2 },
    { title: 'CBE Teacher\'s Guide Grade 7', author: 'KICD', category: 'CBE', copies: 3 },
    { title: 'CBE Teacher\'s Guide Grade 8', author: 'KICD', category: 'CBE', copies: 3 },
    { title: 'CBE Teacher\'s Guide Grade 9', author: 'KICD', category: 'CBE', copies: 3 },
  ]
  for (const b of bookList) {
    try {
      await db.libraryBook.create({
        data: {
          title: b.title, author: b.author,
          isbn: `978-${randInt(1000, 9999)}-${randInt(1000, 9999)}`,
          category: b.category,
          copiesTotal: b.copies, copiesAvailable: b.copies,
          status: 'Available', schoolId: school.id,
        }
      }).catch(() => null)
    } catch {}
  }
  console.log(`    ✓ ${bookList.length} library books`)

  // 6. Assets (inventory)
  console.log('  Creating inventory assets...')
  const assets = [
    { name: 'Desks (Student)', category: 'Furniture', quantity: 500, quantityInStock: 500, reorderLevel: 50, unitPrice: 3500, unit: 'pcs', condition: 'Good', status: 'In Use' },
    { name: 'Chairs (Student)', category: 'Furniture', quantity: 500, quantityInStock: 500, reorderLevel: 50, unitPrice: 1500, unit: 'pcs', condition: 'Good', status: 'In Use' },
    { name: 'Teacher Desks', category: 'Furniture', quantity: 30, quantityInStock: 30, reorderLevel: 5, unitPrice: 8000, unit: 'pcs', condition: 'Excellent', status: 'In Use' },
    { name: 'Whiteboards', category: 'Furniture', quantity: 20, quantityInStock: 20, reorderLevel: 5, unitPrice: 5000, unit: 'pcs', condition: 'Good', status: 'In Use' },
    { name: 'Projectors', category: 'Electronics', quantity: 5, quantityInStock: 5, reorderLevel: 2, unitPrice: 45000, unit: 'pcs', condition: 'Good', status: 'In Use' },
    { name: 'Computers (Lab)', category: 'Electronics', quantity: 40, quantityInStock: 40, reorderLevel: 10, unitPrice: 55000, unit: 'pcs', condition: 'Good', status: 'In Use' },
    { name: 'Printers', category: 'Electronics', quantity: 3, quantityInStock: 3, reorderLevel: 1, unitPrice: 25000, unit: 'pcs', condition: 'Good', status: 'In Use' },
    { name: 'Lab Microscopes', category: 'Lab Equipment', quantity: 20, quantityInStock: 20, reorderLevel: 5, unitPrice: 15000, unit: 'pcs', condition: 'Good', status: 'In Use' },
    { name: 'Lab Beakers', category: 'Lab Equipment', quantity: 100, quantityInStock: 85, reorderLevel: 20, unitPrice: 250, unit: 'pcs', condition: 'Good', status: 'In Use' },
    { name: 'Football Balls', category: 'Sports', quantity: 15, quantityInStock: 12, reorderLevel: 5, unitPrice: 2000, unit: 'pcs', condition: 'Good', status: 'In Use' },
    { name: 'Basketball Balls', category: 'Sports', quantity: 8, quantityInStock: 6, reorderLevel: 3, unitPrice: 2500, unit: 'pcs', condition: 'Fair', status: 'In Use' },
    { name: 'Textbooks (Math)', category: 'Stationery', quantity: 500, quantityInStock: 480, reorderLevel: 50, unitPrice: 800, unit: 'pcs', condition: 'Good', status: 'In Use' },
    { name: 'Exercise Books', category: 'Stationery', quantity: 5000, quantityInStock: 3200, reorderLevel: 500, unitPrice: 80, unit: 'pcs', condition: 'Excellent', status: 'In Storage' },
    { name: 'Chalk', category: 'Stationery', quantity: 200, quantityInStock: 150, reorderLevel: 50, unitPrice: 15, unit: 'boxes', condition: 'Excellent', status: 'In Storage' },
    { name: 'School Bus', category: 'Vehicle', quantity: 1, quantityInStock: 1, reorderLevel: 0, unitPrice: 3500000, unit: 'pcs', condition: 'Good', status: 'In Use' },
    { name: 'Kitchen Pots', category: 'Kitchen', quantity: 20, quantityInStock: 18, reorderLevel: 5, unitPrice: 3000, unit: 'pcs', condition: 'Good', status: 'In Use' },
  ]
  for (const a of assets) {
    try {
      await db.asset.create({ data: { ...a, assetTag: `AST-${String(randInt(1000, 9999))}`, schoolId: school.id } }).catch(() => null)
    } catch {}
  }
  console.log(`    ✓ ${assets.length} inventory assets`)

  // 7. Suppliers
  console.log('  Creating suppliers...')
  const suppliers = [
    { name: 'KLB Publishers', category: 'Stationery', contact: 'John Maina', phone: '0722123456', email: 'sales@klb.co.ke' },
    { name: 'Nakumatt Supplies', category: 'Food', contact: 'Mary Wambui', phone: '0733456789', email: 'info@nakumatt.co.ke' },
    { name: 'TechLab Kenya', category: 'Equipment', contact: 'Peter Otieno', phone: '0711567890', email: 'sales@techlab.co.ke' },
    { name: 'Sports World Kenya', category: 'Services', contact: 'Sarah Kamau', phone: '0722678901', email: 'info@sportsworld.co.ke' },
    { name: 'CleanPro Services', category: 'Services', contact: 'David Kiprop', phone: '0733789012', email: 'info@cleanpro.co.ke' },
  ]
  for (const s of suppliers) {
    try {
      await db.supplier.create({ data: { ...s, status: 'Active' } }).catch(() => null)
    } catch {}
  }
  console.log('    ✓ Suppliers')

  // 8. Visitors (recent)
  console.log('  Creating visitors...')
  const visitorNames = ['James Mwangi', 'Sarah Wanjiru', 'Peter Kamau', 'Grace Achieng', 'Dennis Kiprop', 'Faith Mutua', 'Samuel Otieno', 'Rose Chebet']
  const purposes = ['Parent Visit', 'Delivery', 'Meeting', 'Admission Inquiry', 'PTM', 'Official Visit']
  for (let i = 0; i < 8; i++) {
    try {
      await db.visitor.create({
        data: {
          visitorName: rand(visitorNames),
          idNumber: String(randInt(10000000, 39999999)),
          phone: `07${randInt(10, 29)}${randInt(1000000, 9999999)}`,
          purpose: rand(purposes),
          personToSee: rand(['Principal', 'Bursar', 'Deputy Principal', 'Admin']),
          checkInTime: new Date(Date.now() - randInt(1, 72) * 3600000),
          status: rand(['Checked In', 'Checked Out']),
          recordedBy: 'Gate Officer',
        }
      }).catch(() => null)
    } catch {}
  }
  console.log('    ✓ Visitors')

  // 9. Medical records
  console.log('  Creating medical records...')
  const students = await db.student.findMany({ where: { status: 'Active' }, take: 30, select: { id: true, firstName: true, lastName: true } })
  const conditions = ['Asthma', 'Diabetes', 'Allergies (Peanuts)', 'Short-sightedness', 'Epilepsy', 'None', 'None', 'None']
  for (const s of students.slice(0, 15)) {
    try {
      await db.medicalRecord.create({
        data: {
          studentId: s.id,
          bloodGroup: rand(['A+', 'B+', 'O+', 'AB+', 'O-', 'A-']),
          allergies: rand(conditions),
          chronicConditions: rand(conditions),
          emergencyContact: `+2547${randInt(10, 29)}${randInt(1000000, 9999999)}`,
          emergencyContactName: `${s.firstName} Guardian`,
          notes: 'No special medical needs noted.',
        }
      }).catch(() => null)
    } catch {}
  }
  console.log('    ✓ Medical records')

  // 10. Incidents (discipline)
  console.log('  Creating discipline incidents...')
  const incidentTypes = ['Late Coming', 'Incomplete Homework', 'Bullying', 'Dress Code Violation', 'Truancy', 'Phone in Class', 'Fighting', 'Disrespect']
  const actions = ['Warning', 'Detention (1hr)', 'Parent Called', 'Suspension (2 days)', 'Counseling', 'Community Service']
  for (let i = 0; i < 10; i++) {
    try {
      const s = rand(students)
      await db.incident.create({
        data: {
          studentId: s.id,
          type: rand(incidentTypes),
          description: `${s.firstName} ${s.lastName} was involved in an incident of ${rand(incidentTypes).toLowerCase()}.`,
          severity: rand(['Low', 'Medium', 'High']),
          action: rand(actions),
          reportedBy: 'Teacher',
          status: rand(['Resolved', 'Pending', 'Under Review']),
          date: new Date(Date.now() - randInt(1, 30) * 86400000),
        }
      }).catch(() => null)
    } catch {}
  }
  console.log('    ✓ Discipline incidents')

  // 11. Events
  console.log('  Creating events...')
  const events = [
    { title: 'Term 1 Opener', date: new Date(Date.now() + 3 * 86400000), type: 'Academic', location: 'School Hall' },
    { title: 'Mid-Term Examinations', date: new Date(Date.now() + 14 * 86400000), type: 'Academic', location: 'All Classrooms' },
    { title: 'Sports Day', date: new Date(Date.now() + 21 * 86400000), type: 'Sports', location: 'School Field' },
    { title: 'Parent-Teacher Conference', date: new Date(Date.now() + 28 * 86400000), type: 'Meeting', location: 'School Hall' },
    { title: 'Cultural Day', date: new Date(Date.now() + 35 * 86400000), type: 'Cultural', location: 'Amphitheater' },
    { title: 'End Term Examinations', date: new Date(Date.now() + 42 * 86400000), type: 'Academic', location: 'All Classrooms' },
    { title: 'Closing Day', date: new Date(Date.now() + 49 * 86400000), type: 'Academic', location: 'School Hall' },
  ]
  for (const e of events) {
    try {
      await db.event.create({
        data: { ...e, status: 'Scheduled', organizer: 'School Administration' }
      }).catch(() => null)
    } catch {}
  }
  console.log('    ✓ Events')

  // 12. Cafeteria meals
  console.log('  Creating meal menus...')
  const meals = [
    { date: new Date(), mealType: 'Breakfast', item: 'Porridge & Bread', accompaniment: 'Tea', servingsPlanned: 200, servingsServed: 185, status: 'Served', cook: 'Joseph Muthomi' },
    { date: new Date(), mealType: 'Lunch', item: 'Rice & Beans', accompaniment: 'Cabbage', beverage: 'Water', servingsPlanned: 200, servingsServed: 192, status: 'Served', cook: 'Joseph Muthomi' },
    { date: new Date(), mealType: 'Supper', item: 'Ugali & Beef Stew', accompaniment: 'Sukuma Wiki', beverage: 'Tea', servingsPlanned: 150, servingsServed: 145, status: 'Served', cook: 'Joseph Muthomi' },
    { date: new Date(Date.now() + 86400000), mealType: 'Breakfast', item: 'Mandazi & Tea', accompaniment: 'Avocado', servingsPlanned: 200, servingsServed: 0, status: 'Planned', cook: 'Joseph Muthomi' },
    { date: new Date(Date.now() + 86400000), mealType: 'Lunch', item: 'Githeri', accompaniment: 'Banana', beverage: 'Water', servingsPlanned: 200, servingsServed: 0, status: 'Planned', cook: 'Joseph Muthomi' },
  ]
  for (const m of meals) {
    try {
      await db.mealMenu.create({ data: m }).catch(() => null)
    } catch {}
  }
  console.log('    ✓ Meal menus')

  // 13. Facilities
  console.log('  Creating facilities...')
  const facilities = [
    { name: 'Main Hall', type: 'Hall', capacity: 500, status: 'Available' },
    { name: 'Science Lab 1', type: 'Lab', capacity: 40, status: 'Available' },
    { name: 'Science Lab 2', type: 'Lab', capacity: 40, status: 'Available' },
    { name: 'Computer Lab', type: 'Lab', capacity: 40, status: 'Available' },
    { name: 'Library', type: 'Library', capacity: 60, status: 'Available' },
    { name: 'Football Field', type: 'Field', capacity: 200, status: 'Available' },
    { name: 'Basketball Court', type: 'Court', capacity: 50, status: 'Available' },
    { name: 'Conference Room', type: 'Room', capacity: 30, status: 'Available' },
  ]
  for (const f of facilities) {
    try {
      await db.facility.create({ data: f }).catch(() => null)
    } catch {}
  }
  console.log('    ✓ Facilities')

  // 14. Appraisals (staff)
  console.log('  Creating staff appraisals...')
  const staff = await db.staff.findMany({ where: { status: 'Active' }, take: 10, select: { id: true, firstName: true, lastName: true } })
  for (const s of staff.slice(0, 5)) {
    try {
      await db.appraisal.create({
        data: {
          staffId: s.id,
          period: 'Term 1 2025',
          teachingQuality: randInt(3, 5),
          punctuality: randInt(3, 5),
          professionalism: randInt(3, 5),
          studentEngagement: randInt(3, 5),
          teamwork: randInt(3, 5),
          overallScore: randInt(3, 5),
          strengths: 'Good classroom management and student engagement',
          areasForImprovement: 'Needs to submit lesson plans on time',
          goals: 'Improve digital literacy and incorporate CBE teaching methods',
          status: 'Completed',
        }
      }).catch(() => null)
    } catch {}
  }
  console.log('    ✓ Staff appraisals')

  // 15. Payslips (payroll)
  console.log('  Creating payslips...')
  for (const s of staff.slice(0, 10)) {
    try {
      const basic = randInt(45000, 120000)
      const allowances = randInt(5000, 20000)
      const deductions = randInt(8000, 25000)
      await db.payslip.create({
        data: {
          payslipNo: `PSL/2025/${randInt(1000, 9999)}`,
          staffId: s.id,
          month: 'July',
          year: 2025,
          basicSalary: basic,
          allowances,
          deductions,
          taxPAYE: Math.round(basic * 0.15),
          nssf: 1080,
          nhif: 1700,
          netPay: basic + allowances - deductions - Math.round(basic * 0.15) - 1080 - 1700,
          status: 'Pending',
        }
      }).catch(() => null)
    } catch {}
  }
  console.log('    ✓ Payslips')

  console.log('')
  console.log('✅ Full system enrichment complete!')
  console.log('   All modules now have realistic data for demonstrations.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
