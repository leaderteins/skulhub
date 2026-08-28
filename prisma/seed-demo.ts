// Quick demo seed — creates a demo school + primary school demo + secondary demo
import { PrismaClient } from '@prisma/client'
import { hashPassword, generateSlug } from '../src/lib/auth-utils'
const db = new PrismaClient()

const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a

async function main() {
  console.log('🌱 Seeding SkulHub demo data...')

  // Create demo school (upsert — idempotent, safe to run multiple times)
  const school = await db.school.upsert({
    where: { slug: 'skulhub-academy' },
    update: {
      name: 'SkulHub Academy',
      schoolCode: 'SKH-2024-001',
      email: 'info@skulhub.ac.ke',
      phone: '+254700123456',
      address: 'Karen, Nairobi',
      county: 'Nairobi',
      level: 'Mixed',
      plan: 'Premium',
      status: 'Active',
      maxStudents: 1000,
    },
    create: {
      name: 'SkulHub Academy',
      slug: 'skulhub-academy',
      schoolCode: 'SKH-2024-001',
      email: 'info@skulhub.ac.ke',
      phone: '+254700123456',
      address: 'Karen, Nairobi',
      county: 'Nairobi',
      level: 'Mixed',
      plan: 'Premium',
      status: 'Active',
      maxStudents: 1000,
    },
  })
  console.log(`  ✓ School: ${school.name} (${school.schoolCode})`)

  // Create admin user (upsert — idempotent)
  const adminPass = await hashPassword('admin123')
  await db.userAccount.upsert({
    where: { email: 'admin@skulhub.ac.ke' },
    update: { schoolId: school.id, name: 'Moses Kinyanjui', passwordHash: adminPass, role: 'admin', phone: '+254700123456', status: 'Active' },
    create: { schoolId: school.id, name: 'Moses Kinyanjui', email: 'admin@skulhub.ac.ke', passwordHash: adminPass, role: 'admin', phone: '+254700123456', status: 'Active' },
  })
  console.log('  ✓ Admin user: Moses Kinyanjui')

  // Create super admin (upsert — idempotent)
  const superPass = await hashPassword('superadmin123')
  await db.userAccount.upsert({
    where: { email: 'superadmin@skulhub.ac.ke' },
    update: { schoolId: school.id, name: 'Platform Super Admin', passwordHash: superPass, role: 'super_admin', status: 'Active' },
    create: { schoolId: school.id, name: 'Platform Super Admin', email: 'superadmin@skulhub.ac.ke', passwordHash: superPass, role: 'super_admin', status: 'Active' },
  })
  console.log('  ✓ Super admin user')

  // Seed Class Levels — CBE 2-6-3-3 structure (use upsert — idempotent)
  // Pre-Primary
  const prePrimaryLevels = ['PP1', 'PP2']
  for (const name of prePrimaryLevels) {
    await db.classLevel.upsert({ where: { name }, update: {}, create: { name, stage: 'Pre-Primary', order: prePrimaryLevels.indexOf(name) + 1, capacity: 30 } })
  }
  // Lower Primary (Grade 1-3)
  const lowerPrimary = ['Grade 1', 'Grade 2', 'Grade 3']
  for (const name of lowerPrimary) {
    await db.classLevel.upsert({ where: { name }, update: {}, create: { name, stage: 'Lower Primary', order: 3 + lowerPrimary.indexOf(name) + 1, capacity: 40 } })
  }
  // Upper Primary (Grade 4-6)
  const upperPrimary = ['Grade 4', 'Grade 5', 'Grade 6']
  for (const name of upperPrimary) {
    await db.classLevel.upsert({ where: { name }, update: {}, create: { name, stage: 'Upper Primary', order: 6 + upperPrimary.indexOf(name) + 1, capacity: 40 } })
  }
  // Junior School (Grade 7-9) — formerly Junior Secondary
  const juniorSchool = ['Grade 7', 'Grade 8', 'Grade 9']
  for (const name of juniorSchool) {
    await db.classLevel.upsert({ where: { name }, update: {}, create: { name, stage: 'Junior School', order: 9 + juniorSchool.indexOf(name) + 1, capacity: 60 } })
  }
  // Senior School (Grade 10-12) — formerly Senior Secondary / Form 1-4
  const seniorSchool = ['Grade 10', 'Grade 11', 'Grade 12']
  for (const name of seniorSchool) {
    await db.classLevel.upsert({ where: { name }, update: {}, create: { name, stage: 'Senior School', order: 12 + seniorSchool.indexOf(name) + 1, capacity: 80 } })
  }
  // Keep Form 1-4 for schools still on 8-4-4 (backwards compatibility)
  const formLevels = ['Form 1', 'Form 2', 'Form 3', 'Form 4']
  for (const name of formLevels) {
    await db.classLevel.upsert({ where: { name }, update: {}, create: { name, stage: 'Senior School (8-4-4)', order: 15 + formLevels.indexOf(name) + 1, capacity: 80 } })
  }
  console.log(`  ✓ ${prePrimaryLevels.length + lowerPrimary.length + upperPrimary.length + juniorSchool.length + seniorSchool.length + formLevels.length} class levels (CBE 2-6-3-3 + 8-4-4)`)

  // Seed Departments (upsert)
  const depts = ['Mathematics', 'Sciences', 'Languages', 'Humanities', 'Technical', 'Co-curricular']
  for (const name of depts) {
    await db.department.upsert({ where: { name }, update: {}, create: { name } })
  }
  console.log(`  ✓ ${depts.length} departments`)

  // Seed Subjects
  const subjects = [
    { name: 'Mathematics', code: 'MAT', category: 'Core' },
    { name: 'English', code: 'ENG', category: 'Core' },
    { name: 'Kiswahili', code: 'KIS', category: 'Core' },
    { name: 'Biology', code: 'BIO', category: 'Core' },
    { name: 'Chemistry', code: 'CHE', category: 'Core' },
    { name: 'Physics', code: 'PHY', category: 'Optional' },
    { name: 'History', code: 'HIS', category: 'Optional' },
    { name: 'Geography', code: 'GEO', category: 'Optional' },
    { name: 'CRE', code: 'CRE', category: 'Optional' },
    { name: 'Business Studies', code: 'BST', category: 'Optional' },
    { name: 'Computer Studies', code: 'CST', category: 'Optional' },
    { name: 'Agriculture', code: 'AGR', category: 'Optional' },
    { name: 'Physical Education', code: 'PED', category: 'Co-curricular' },
  ]
  const deptMap: Record<string, string> = {}
  const allDepts = await db.department.findMany()
  for (const d of allDepts) deptMap[d.name] = d.id
  for (const s of subjects) {
    let deptName = 'Co-curricular'
    if (s.category === 'Core') {
      if (s.name === 'Mathematics') deptName = 'Mathematics'
      else if (s.name.includes('Biology') || s.name.includes('Chemistry') || s.name.includes('Physics')) deptName = 'Sciences'
      else deptName = 'Languages'
    } else if (s.category === 'Optional') {
      if (s.name.includes('History') || s.name.includes('Geography') || s.name.includes('CRE')) deptName = 'Humanities'
      else if (s.name.includes('Computer') || s.name.includes('Agriculture')) deptName = 'Technical'
      else deptName = 'Business'
    }
    await db.subject.upsert({ where: { name: s.name }, update: {}, create: { name: s.name, code: s.code, category: s.category, departmentId: deptMap[deptName] || null } })
  }
  console.log(`  ✓ ${subjects.length} subjects`)

  // Seed Staff
  const FIRST_M = ['Brian', 'Kevin', 'Dennis', 'John', 'Peter', 'David', 'Joseph', 'Samuel', 'Daniel', 'Michael', 'Stephen', 'Paul', 'Mark', 'Isaac', 'Elijah']
  const FIRST_F = ['Grace', 'Mary', 'Janet', 'Lucy', 'Ruth', 'Esther', 'Naomi', 'Sarah', 'Hannah', 'Caroline', 'Diana', 'Lillian', 'Nancy', 'Patricia', 'Rose']
  const LAST = ['Mwangi', 'Kamau', 'Omondi', 'Otieno', 'Kiprop', 'Cheruiyot', 'Mutua', 'Wanjiku', 'Njoroge', 'Maina', 'Kibet', 'Rotich', 'Ochieng', 'Awuor', 'Wekesa']
  const roles = ['Teacher', 'Teacher', 'Teacher', 'Teacher', 'Teacher', 'HOD', 'Bursar', 'Librarian', 'Clerk', 'Driver', 'Security', 'Cleaner']
  let empNo = 1000
  const staffList: any[] = []
  for (let i = 0; i < 30; i++) {
    const isMale = Math.random() > 0.45
    const fn = isMale ? rand(FIRST_M) : rand(FIRST_F)
    const ln = rand(LAST)
    const role = rand(roles)
    const s = await db.staff.upsert({
      where: { employeeNo: `EMP/${empNo++}` },
      update: {},
      create: {
        employeeNo: `EMP/${empNo}`,
        firstName: fn, lastName: ln,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}@skulhub.ac.ke`,
        phone: `+2547${randInt(10,29)}${randInt(100000,999999)}`,
        gender: isMale ? 'Male' : 'Female',
        role,
        qualification: rand(['B.Ed', 'M.Ed', 'BSc', 'Diploma in Education']),
        specialization: rand(subjects).name,
        employmentType: rand(['Permanent', 'Permanent', 'Contract']),
        salary: role === 'Teacher' ? randInt(75000, 120000) : role === 'HOD' ? randInt(130000, 180000) : randInt(30000, 80000),
        status: 'Active',
        hireDate: new Date(randInt(2015, 2024), randInt(0, 11), randInt(1, 28)),
        schoolId: school.id,
      },
    })
    staffList.push(s)
  }
  console.log(`  ✓ ${staffList.length} staff`)

  // Seed Streams for secondary
  const cls = await db.classLevel.findMany({ where: { stage: 'Senior School' } })
  for (const c of cls) {
    for (const s of ['East', 'West']) {
      const teacher = rand(staffList.filter(st => st.role === 'Teacher' || st.role === 'HOD'))
      await db.stream.create({ data: { name: `${c.name} ${s}`, classLevelId: c.id, classTeacherId: teacher?.id, capacity: 40 } })
    }
  }
  // Streams for primary
  const pcls = await db.classLevel.findMany({ where: { stage: 'Primary' } })
  for (const c of pcls) {
    await db.stream.create({ data: { name: `${c.name} A`, classLevelId: c.id, capacity: 35 } })
  }
  const allStreams = await db.stream.findMany()
  console.log(`  ✓ ${allStreams.length} streams`)

  // Seed Students
  const FIRST_S_M = ['Brian', 'Kevin', 'Dennis', 'Victor', 'John', 'James', 'Peter', 'David', 'Joseph', 'Samuel', 'Daniel', 'Michael', 'Stephen', 'Paul', 'Mark', 'Isaac', 'Elijah', 'Nathan', 'Joshua', 'Andrew', 'Collins', 'Derrick', 'Emmanuel', 'Ruth', 'Esther', 'Naomi', 'Rebecca', 'Sarah', 'Hannah', 'Ann']
  const FIRST_S_F = ['Grace', 'Mary', 'Janet', 'Lucy', 'Ruth', 'Esther', 'Naomi', 'Rebecca', 'Sarah', 'Hannah', 'Caroline', 'Diana', 'Eunice', 'Gladys', 'Irene', 'Lillian', 'Maureen', 'Nancy', 'Patricia', 'Rose', 'Sheila', 'Tabitha', 'Veronica', 'Winfred']
  const LAST_S = ['Mwangi', 'Kamau', 'Omondi', 'Otieno', 'Kiprop', 'Cheruiyot', 'Mutua', 'Wanjiku', 'Njoroge', 'Maina', 'Kibet', 'Rotich', 'Ochieng', 'Awuor', 'Wekesa', 'Barasa', 'Njeri', 'Wafula', 'Chebet', 'Langat']
  let admNo = 5000
  let stuCount = 0
  for (const stream of allStreams) {
    const count = randInt(20, 35)
    for (let i = 0; i < count; i++) {
      const isMale = Math.random() > 0.5
      const fn = isMale ? rand(FIRST_S_M) : rand(FIRST_S_F)
      const ln = rand(LAST_S)
      const boarding = Math.random() > 0.55
      // Guardian
      const g = await db.guardian.create({ data: { firstName: rand([...FIRST_S_M, ...FIRST_S_F]), lastName: ln, phone: `+2547${randInt(10,29)}${randInt(100000,999999)}`, relation: 'Parent', occupation: rand(['Farmer', 'Business', 'Teacher', 'Nurse', 'Driver', 'Trader']) } })
      await db.student.create({
        data: {
          admissionNo: `ADM/${admNo++}`,
          firstName: fn, lastName: ln,
          phone: Math.random() > 0.6 ? `+2547${randInt(10,29)}${randInt(100000,999999)}` : null,
          gender: isMale ? 'Male' : 'Female',
          dateOfBirth: new Date(randInt(2006, 2015), randInt(0, 11), randInt(1, 28)),
          bloodGroup: rand(['A+', 'B+', 'O+', 'AB+', 'O-']),
          nationality: 'Kenyan',
          county: rand(['Nairobi', 'Kiambu', 'Nakuru', 'Kisumu', 'Machakos', 'Meru', 'Uasin Gishu']),
          boarding,
          guardianId: g.id,
          admissionDate: new Date(randInt(2022, 2024), randInt(0, 11), randInt(1, 28)),
          status: 'Active',
          schoolId: school.id,
        },
      })
      // Enrollment
      const cl = await db.classLevel.findFirst({ where: { streams: { some: { id: stream.id } } } })
      if (cl) await db.enrollment.create({ data: { studentId: (await db.student.findFirst({ orderBy: { createdAt: 'desc' } }))!.id, streamId: stream.id, classLevelId: cl.id, academicYear: '2025', term: 'Term 1' } })
      stuCount++
    }
  }
  console.log(`  ✓ ${stuCount} students`)

  // Seed announcements
  const anns = [
    { title: 'Term 1 Opening Day', body: 'All students report on 6th January 2025 by 8:00 AM.', audience: 'All', priority: 'High', pinned: true },
    { title: 'Parent-Teacher Conference', body: 'PTC on 15th February 2025 from 9 AM to 1 PM.', audience: 'Parents', priority: 'Normal' },
    { title: 'Mid-Term Break', body: 'Break begins 24th February, resumes 28th February.', audience: 'Students', priority: 'Normal' },
    { title: 'Fee Payment Deadline', body: 'All fees due by 28th February. M-Pesa Paybill 522522.', audience: 'Parents', priority: 'Urgent', pinned: true },
    { title: 'Science Congress', body: 'KSEF regional competitions on 8th March.', audience: 'Students', priority: 'Normal' },
    { title: 'Annual Sports Day', body: 'Inter-stream athletics on 14th March 2025.', audience: 'All', priority: 'Normal' },
  ]
  for (const a of anns) await db.announcement.create({ data: { ...a, authorName: 'Principal Office', publishedAt: new Date(Date.now() - randInt(1, 20) * 86400000) } })
  console.log(`  ✓ ${anns.length} announcements`)

  // Seed visitors
  const visitors = [
    { visitorName: 'John Mwangi', purpose: 'Parent Visit', personToSee: 'Grace (Form 2)', vehicleReg: 'KDA 123A', status: 'Checked Out' },
    { visitorName: 'Mary Achieng', purpose: 'Meeting', personToSee: 'Principal', status: 'Checked Out' },
    { visitorName: 'Peter Kamau', purpose: 'Delivery', personToSee: 'Stores', vehicleReg: 'KDB 456B', status: 'Checked In' },
    { visitorName: 'Sarah Mutua', purpose: 'Official', personToSee: 'Bursar', status: 'Checked In' },
  ]
  for (const v of visitors) await db.visitor.create({ data: { ...v, checkInTime: new Date(), recordedBy: 'Paul Wafula' } })
  console.log(`  ✓ ${visitors.length} visitors`)

  // Seed library books
  const books = [
    { title: 'Mathematics for Secondary', author: 'Mwangi P.', category: 'Mathematics', copiesTotal: 15 },
    { title: 'Biology Today', author: 'Ochieng D.', category: 'Science', copiesTotal: 12 },
    { title: 'Kiswahili Mufti', author: 'Achieng M.', category: 'Languages', copiesTotal: 10 },
    { title: 'Chemistry Practical Guide', author: 'Kiprop S.', category: 'Science', copiesTotal: 8 },
    { title: 'Geography of East Africa', author: 'Mutua B.', category: 'Humanities', copiesTotal: 6 },
    { title: 'CRE for Secondary', author: 'Njoroge P.', category: 'Humanities', copiesTotal: 5 },
    { title: 'Computer Studies', author: 'Cheruiyot R.', category: 'Technical', copiesTotal: 10 },
  ]
  for (const b of books) await db.libraryBook.create({ data: { ...b, copiesAvailable: b.copiesTotal, publisher: 'KLB', yearPublished: 2023, status: 'Available' } })
  console.log(`  ✓ ${books.length} library books`)

  // Seed facilities
  const facilities = [
    { name: 'Main Hall', type: 'Hall', capacity: 500, location: 'Block A' },
    { name: 'Football Field', type: 'Field', capacity: 200, location: 'Sports Complex' },
    { name: 'Computer Lab', type: 'Lab', capacity: 40, location: 'Block C' },
    { name: 'Science Lab', type: 'Lab', capacity: 40, location: 'Block B' },
    { name: 'Library', type: 'Classroom', capacity: 60, location: 'Block A' },
  ]
  for (const f of facilities) await db.facility.create({ data: { ...f, status: 'Available' } })
  console.log(`  ✓ ${facilities.length} facilities`)

  // Seed suppliers
  const suppliers = [
    { name: 'Nairobi Books Ltd', category: 'Stationery', phone: '+254720123456' },
    { name: 'Lab Equip KE', category: 'Equipment', phone: '+254721234567' },
    { name: 'Fresh Foods Co.', category: 'Food', phone: '+254722345678' },
  ]
  for (const s of suppliers) await db.supplier.create({ data: { ...s, status: 'Active' } })
  console.log(`  ✓ ${suppliers.length} suppliers`)

  // Seed meals
  const today = new Date()
  const meals = [
    { mealType: 'Breakfast', item: 'Uji & Bread', beverage: 'Tea', date: today },
    { mealType: 'Lunch', item: 'Rice & Beans', accompaniment: 'Cabbage', beverage: 'Water', date: today },
    { mealType: 'Tea Break', item: 'Mandazi', beverage: 'Tea', date: today },
    { mealType: 'Supper', item: 'Ugali & Beef', accompaniment: 'Sukuma Wiki', beverage: 'Tea', date: today },
  ]
  for (const m of meals) await db.mealMenu.create({ data: { ...m, servingsPlanned: 200, servingsServed: 0, status: 'Planned' } })
  console.log(`  ✓ ${meals.length} meals`)

  console.log('\n✅ Demo seed complete!')
  console.log(`   School: ${school.name} | Code: ${school.schoolCode}`)
  console.log('   Login: admin@skulhub.ac.ke / admin123')
  console.log('   Super: superadmin@skulhub.ac.ke / superadmin123')
}

main().catch(console.error).finally(() => db.$disconnect())
