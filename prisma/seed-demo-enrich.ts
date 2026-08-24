// Comprehensive demo data enrichment — adds invoices, payments, attendance,
// grades, more staff, more library books, announcements, etc.
// Run AFTER seed-demo.ts to make the system look fully populated for demos.

import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth-utils'

const db = new PrismaClient()

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min }

async function main() {
  console.log('🌱 Enriching demo data...')

  const school = await db.school.findUnique({ where: { slug: 'skulhub-academy' } })
  if (!school) { console.error('SkulHub Academy not found. Run seed-demo.ts first.'); return }

  // 1. Add more staff (we want 30+)
  const existingStaff = await db.staff.count()
  if (existingStaff < 30) {
    const FIRST_M = ['Brian', 'Kevin', 'Dennis', 'John', 'Peter', 'David', 'Joseph', 'Samuel', 'Daniel', 'Michael', 'Stephen', 'Paul', 'Mark', 'Isaac', 'Elijah']
    const FIRST_F = ['Grace', 'Mary', 'Janet', 'Lucy', 'Ruth', 'Esther', 'Naomi', 'Sarah', 'Hannah', 'Caroline', 'Diana', 'Lillian', 'Nancy', 'Patricia', 'Rose']
    const LAST = ['Mwangi', 'Kamau', 'Omondi', 'Otieno', 'Kiprop', 'Cheruiyot', 'Mutua', 'Wanjiku', 'Njoroge', 'Maina', 'Kibet', 'Rotich', 'Ochieng', 'Awuor', 'Wekesa']
    const roles = ['Teacher', 'Teacher', 'Teacher', 'Teacher', 'HOD', 'Librarian', 'Clerk', 'Driver', 'Security', 'Cleaner', 'Matron', 'Nurse', 'Cook']
    let empNo = 1000 + existingStaff
    const subjects = await db.subject.findMany()
    for (let i = existingStaff; i < 32; i++) {
      const isMale = Math.random() > 0.45
      const fn = isMale ? rand(FIRST_M) : rand(FIRST_F)
      const ln = rand(LAST)
      const role = rand(roles)
      await db.staff.upsert({
        where: { employeeNo: `EMP/${empNo}` },
        update: {},
        create: {
          employeeNo: `EMP/${empNo++}`,
          firstName: fn, lastName: ln,
          email: `${fn.toLowerCase()}.${ln.toLowerCase()}${randInt(1,99)}@skulhub.ac.ke`,
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
    }
    console.log('  ✓ Staff count: 32')
  }

  // 2. Add more user accounts for the demo school
  const demoUsers = [
    { name: 'Mary Wanjiru', email: 'principal@skulhub.ac.ke', role: 'principal', avatar: 'MW', pass: 'principal123' },
    { name: 'Peter Kamau', email: 'bursar@skulhub.ac.ke', role: 'bursar', avatar: 'PK', pass: 'bursar123' },
    { name: 'Grace Achieng', email: 'teacher@skulhub.ac.ke', role: 'teacher', avatar: 'GA', pass: 'teacher123' },
    { name: 'Dennis Kiprop', email: 'librarian@skulhub.ac.ke', role: 'librarian', avatar: 'DK', pass: 'librarian123' },
    { name: 'Faith Mutua', email: 'nurse@skulhub.ac.ke', role: 'nurse', avatar: 'FM', pass: 'nurse123' },
    { name: 'John Mwangi', email: 'admissions@skulhub.ac.ke', role: 'admissions', avatar: 'JM', pass: 'admissions123' },
    { name: 'Rose Chebet', email: 'matron@skulhub.ac.ke', role: 'matron', avatar: 'RC', pass: 'matron123' },
    { name: 'Samuel Otieno', email: 'secretary@skulhub.ac.ke', role: 'secretary', avatar: 'SO', pass: 'secretary123' },
    { name: 'David Kibet', email: 'driver@skulhub.ac.ke', role: 'bus_driver', avatar: 'DK', pass: 'driver123' },
    { name: 'Paul Wafula', email: 'gate@skulhub.ac.ke', role: 'gate_man', avatar: 'PW', pass: 'gate123' },
    { name: 'Esther Njeri', email: 'deputy@skulhub.ac.ke', role: 'deputy_principal', avatar: 'EN', pass: 'deputy123' },
    { name: 'Joseph Muthomi', email: 'cook@skulhub.ac.ke', role: 'cook', avatar: 'JM', pass: 'cook123' },
  ]
  for (const u of demoUsers) {
    const hash = await hashPassword(u.pass)
    await db.userAccount.upsert({
      where: { email: u.email },
      update: { schoolId: school.id, name: u.name, role: u.role, passwordHash: hash, avatar: u.avatar, status: 'Active' },
      create: { schoolId: school.id, name: u.name, email: u.email, role: u.role, passwordHash: hash, avatar: u.avatar, status: 'Active' },
    })
  }
  console.log(`  ✓ ${demoUsers.length} user accounts`)

  // 3. Generate invoices for students
  const students = await db.student.findMany({ where: { status: 'Active' }, take: 100 })
  const classLevels = await db.classLevel.findMany()
  const existingInvCount = await db.invoice.count()
  let invNo = 10000 + existingInvCount + 10 // start well past existing invoices
  const feeStructure: Record<string, number> = {
    'Form 1': 35000, 'Form 2': 38000, 'Form 3': 42000, 'Form 4': 45000,
    'Grade 1': 18000, 'Grade 2': 18000, 'Grade 3': 20000, 'Grade 4': 20000,
    'Grade 5': 22000, 'Grade 6': 22000, 'Grade 7': 25000, 'Grade 8': 28000,
  }
  let invoicesCreated = 0
  for (const s of students.slice(0, 50)) {
    const enr = await db.enrollment.findFirst({ where: { studentId: s.id }, include: { classLevel: true } })
    const levelName = enr?.classLevel?.name || 'Form 1'
    const amount = feeStructure[levelName] || 25000
    const paid = Math.random() > 0.3 ? amount : Math.random() > 0.5 ? Math.floor(amount * 0.5) : 0
    const balance = amount - paid
    const status = balance === 0 ? 'Paid' : paid > 0 ? 'Partially Paid' : 'Unpaid'
    const invoiceNo = `INV/${invNo++}`
    try {
      await db.invoice.create({
        data: {
          invoiceNo,
          studentId: s.id,
          schoolId: school.id,
          amount, amountPaid: paid, balance,
          status, academicYear: '2025', term: 'Term 1',
          issueDate: new Date(2025, 0, 15),
          dueDate: new Date(2025, 1, 28),
        },
      })
      invoicesCreated++
    } catch (e) { /* skip duplicates */ }
  }
  console.log(`  ✓ ${invoicesCreated} invoices generated`)

  // 4. Record payments for paid invoices
  const paidInvoices = await db.invoice.findMany({ where: { status: { in: ['Paid', 'Partially Paid'] } }, take: 30 })
  let payNo = 20000
  const methods = ['M-Pesa', 'Cash', 'Bank Transfer', 'Cheque']
  for (const inv of paidInvoices) {
    if (inv.amountPaid > 0) {
      const method = rand(methods)
      const ref = method === 'M-Pesa' ? `QG${randInt(100000,999999)}XZ` : method === 'Cash' ? `CSH-2025${randInt(1000,9999)}` : method === 'Cheque' ? `CHQ-${randInt(10000,99999)}` : `BT-2025${randInt(1000,9999)}`
      await db.payment.create({
        data: {
          invoiceId: inv.id,
          schoolId: school.id,
          amount: inv.amountPaid,
          method,
          reference: ref,
          payerName: 'Guardian',
          receivedBy: 'Peter Kamau',
          receivedAt: new Date(randInt(2025, 2025), randInt(0, 1), randInt(1, 28)),
        },
      }).catch(() => {})
    }
  }
  console.log(`  ✓ Payments recorded`)

  // 5. Create attendance records (last 14 days)
  const attStudents = await db.student.findMany({ where: { status: 'Active' }, take: 100, select: { id: true } })
  for (let day = 0; day < 14; day++) {
    const date = new Date()
    date.setDate(date.getDate() - day)
    if (date.getDay() === 0 || date.getDay() === 6) continue // skip weekends
    for (const s of attStudents.slice(0, 50)) {
      const r = Math.random()
      const status = r > 0.92 ? 'Absent' : r > 0.88 ? 'Late' : 'Present'
      await db.attendance.create({
        data: {
          studentId: s.id,
          schoolId: school.id,
          date,
          status,
          personType: 'Student',
          recordedBy: 'Grace Achieng',
        },
      }).catch(() => {})
    }
  }
  console.log(`  ✓ Attendance records (14 days)`)

  // 6. Create exams and grades
  const exams = [
    { name: 'Term 1 Opener', type: 'Opener', date: new Date(2025, 0, 8) },
    { name: 'Term 1 Mid-Term', type: 'Mid-Term', date: new Date(2025, 1, 18) },
    { name: 'Term 1 End Term', type: 'End Term', date: new Date(2025, 2, 28) },
  ]
  const subjects = await db.subject.findMany()
  for (const e of exams) {
    const exam = await db.exam.create({
      data: {
        name: e.name, academicYear: '2025', term: 'Term 1', examType: e.type,
        startDate: e.date, endDate: e.date,
      },
    }).catch(() => null)
    if (!exam) continue
    // Generate grades for 30 students x 5 subjects
    for (const s of attStudents.slice(0, 30)) {
      for (const sub of subjects.slice(0, 5)) {
        const marks = randInt(35, 95)
        const grade = marks >= 80 ? 'A' : marks >= 75 ? 'A-' : marks >= 70 ? 'B+' : marks >= 65 ? 'B' : marks >= 60 ? 'B-' : marks >= 55 ? 'C+' : marks >= 50 ? 'C' : marks >= 45 ? 'C-' : marks >= 40 ? 'D+' : marks >= 35 ? 'D' : 'E'
        const points = marks >= 80 ? 12 : marks >= 75 ? 11 : marks >= 70 ? 10 : marks >= 65 ? 9 : marks >= 60 ? 8 : marks >= 55 ? 7 : marks >= 50 ? 6 : marks >= 45 ? 5 : marks >= 40 ? 4 : marks >= 35 ? 3 : marks >= 30 ? 2 : 1
        await db.grade.create({
          data: { studentId: s.id, subjectId: sub.id, examId: exam.id, marks, grade, points }
        }).catch(() => {})
      }
    }
  }
  console.log(`  ✓ 3 exams + grades generated`)

  // 7. Add more library books
  const books = [
    { title: 'Mathematics for Secondary Schools', author: 'KLB', isbn: '9789966', category: 'Mathematics', copies: 5 },
    { title: 'English Language Skills', author: 'Oxford', isbn: '9780194', category: 'Languages', copies: 4 },
    { title: 'Biology Today', author: 'Pearson', isbn: '978144', category: 'Sciences', copies: 3 },
    { title: 'Chemistry Principles', author: 'Macmillan', isbn: '978023', category: 'Sciences', copies: 3 },
    { title: 'Physics Fundamentals', author: 'Heinemann', isbn: '978043', category: 'Sciences', copies: 3 },
    { title: 'History of East Africa', author: 'East African', isbn: '978996', category: 'Humanities', copies: 4 },
    { title: 'Geography Atlas', author: 'Philip\'s', isbn: '978054', category: 'Humanities', copies: 2 },
    { title: 'CRE for Secondary', author: 'Longhorn', isbn: '978996', category: 'Religious Education', copies: 4 },
    { title: 'Business Studies', author: 'KLB', isbn: '978996', category: 'Business', copies: 3 },
    { title: 'Computer Studies', author: 'Oxford', isbn: '978019', category: 'Technical', copies: 3 },
    { title: 'Kiswahili Mufti', author: 'Longhorn', isbn: '978996', category: 'Languages', copies: 4 },
    { title: 'Agriculture for KCSE', author: 'KLB', isbn: '978996', category: 'Applied Sciences', copies: 3 },
    { title: 'Home Science', author: 'Macmillan', isbn: '978023', category: 'Applied Sciences', copies: 2 },
    { title: 'Physical Education', author: 'Heinemann', isbn: '978043', category: 'Co-curricular', copies: 5 },
  ]
  for (const b of books) {
    const isbn = b.isbn + randInt(1000, 9999)
    try {
      await db.libraryBook.create({
        data: {
          title: b.title, author: b.author, isbn,
          category: b.category, copiesTotal: b.copies, copiesAvailable: b.copies,
          status: 'Available', schoolId: school.id,
        },
      })
    } catch (e) { /* skip duplicates */ }
  }
  console.log(`  ✓ ${books.length} library books`)

  // 8. Add more announcements
  const anns = [
    { title: 'Mid-Term Exams Start Monday', body: 'All Form 1-4 students will begin their mid-term exams on Monday at 8:00 AM. Please ensure you have your exam cards.', audience: 'Students', priority: 'High', author: 'Mary Wanjiru', pinned: true },
    { title: 'Staff Meeting Wednesday', body: 'All teaching staff are required to attend a staff meeting on Wednesday at 3:30 PM in the staff room.', audience: 'Staff', priority: 'Medium', author: 'Moses Kinyanjui', pinned: false },
    { title: 'Sports Day Next Friday', body: 'The annual sports day will be held next Friday. All students should bring their sports gear.', audience: 'All', priority: 'Medium', author: 'Mary Wanjiru', pinned: false },
    { title: 'Fee Balance Reminder', body: 'Parents are reminded that Term 1 fees should be cleared by 28th February. Contact the bursar for any queries.', audience: 'Parents', priority: 'High', author: 'Peter Kamau', pinned: false },
    { title: 'Library Books Overdue', body: 'Students with overdue library books should return them by Friday to avoid penalties.', audience: 'Students', priority: 'Low', author: 'Dennis Kiprop', pinned: false },
    { title: 'Parent-Teacher Conference', body: 'PTM scheduled for Saturday 9:00 AM - 1:00 PM. All parents are invited to discuss their children\'s progress.', audience: 'Parents', priority: 'Medium', author: 'Mary Wanjiru', pinned: false },
  ]
  for (const a of anns) {
    await db.announcement.create({
      data: { ...a, publishedAt: new Date(Date.now() - randInt(1, 72) * 3600000) },
    }).catch(() => {})
  }
  console.log(`  ✓ ${anns.length} announcements`)

  // 9. Add activity logs
  const activities = [
    { action: 'CREATE', entity: 'Student', user: 'John Mwangi', details: 'Admitted new student: ADM/5425 Emmanuel Njeri' },
    { action: 'PAYMENT', entity: 'Invoice', user: 'Peter Kamau', details: 'Recorded payment of KES 25,000 for INV/10001' },
    { action: 'MARK', entity: 'Attendance', user: 'Grace Achieng', details: 'Marked attendance for Form 2A (45 students)' },
    { action: 'GRADE', entity: 'Exam', user: 'Grace Achieng', details: 'Recorded grades for Term 1 Opener - Mathematics' },
    { action: 'CREATE', entity: 'Invoice', user: 'Peter Kamau', details: 'Generated 50 invoices for Term 1 fees' },
    { action: 'ISSUE', entity: 'BookLoan', user: 'Dennis Kiprop', details: 'Issued "Biology Today" to ADM/5430' },
    { action: 'CREATE', entity: 'Announcement', user: 'Mary Wanjiru', details: 'Published: Mid-Term Exams Start Monday' },
    { action: 'UPDATE', entity: 'Student', user: 'John Mwangi', details: 'Updated guardian contact for ADM/5420' },
  ]
  for (const act of activities) {
    await db.activityLog.create({
      data: { ...act, createdAt: new Date(Date.now() - randInt(1, 48) * 3600000) },
    }).catch(() => {})
  }
  console.log(`  ✓ ${activities.length} activity logs`)

  // 10. Seed more schools for the super admin dashboard
  const extraSchools = [
    { name: 'Bright Future Secondary', slug: 'bright-future-secondary', email: 'admin@brightfuture.sc.ke', phone: '+254723456789', address: 'Westlands, Nairobi', county: 'Nairobi', plan: 'Enterprise', status: 'Active', maxStudents: 1500 },
    { name: 'Rift Valley High School', slug: 'rift-valley-high', email: 'office@riftvalley.ac.ke', phone: '+254711222333', address: 'Eldoret', county: 'Uasin Gishu', plan: 'Standard', status: 'Active', maxStudents: 500 },
    { name: 'Coastal Academy Mombasa', slug: 'coastal-academy-mombasa', email: 'admin@coastal.ac.ke', phone: '+254720555666', address: 'Nyali, Mombasa', county: 'Mombasa', plan: 'Standard', status: 'Trial', maxStudents: 300, trialEndsAt: new Date(Date.now() + 12 * 86400000) },
    { name: 'Kisumu Lakeside School', slug: 'kisumu-lakeside-school', email: 'info@lakeside.ac.ke', phone: '+254733444555', address: 'Milimani, Kisumu', county: 'Kisumu', plan: 'Starter', status: 'Trial', maxStudents: 200, trialEndsAt: new Date(Date.now() + 5 * 86400000) },
    { name: 'Nyeri Hill Academy', slug: 'nyeri-hill-academy', email: 'admin@nyerihill.ac.ke', phone: '+254712888999', address: 'Nyeri Town', county: 'Nyeri', plan: 'Premium', status: 'Active', maxStudents: 700 },
    { name: 'Machakos Boys School', slug: 'machakos-boys-school', email: 'principal@machakosboys.ac.ke', phone: '+254715777888', address: 'Machakos Town', county: 'Machakos', plan: 'Standard', status: 'Suspended', maxStudents: 600 },
    { name: 'Garissa Premier School', slug: 'garissa-premier-school', email: 'admin@garissapremier.ac.ke', phone: '+254716666777', address: 'Garissa Town', county: 'Garissa', plan: 'Starter', status: 'Expired', maxStudents: 200, trialEndsAt: new Date(Date.now() - 30 * 86400000) },
  ]
  for (const s of extraSchools) {
    const existing = await db.school.findUnique({ where: { slug: s.slug } })
    if (existing) continue
    await db.school.create({
      data: {
        ...s,
        level: 'Secondary', schoolCode: `SKH-2024-${String(randInt(10, 99))}`,
        createdAt: new Date(Date.now() - randInt(10, 300) * 86400000),
      },
    })
    // Add 1 admin user per school
    const adminPass = await hashPassword('admin123')
    await db.userAccount.create({
      data: {
        schoolId: (await db.school.findUnique({ where: { slug: s.slug } }))!.id,
        name: s.name.split(' ')[0] + ' Admin',
        email: s.email,
        passwordHash: adminPass,
        role: 'admin',
        status: 'Active',
        avatar: 'AD',
      },
    }).catch(() => {})
  }
  console.log(`  ✓ ${extraSchools.length} additional schools for super admin dashboard`)

  console.log('')
  console.log('✅ Demo data enrichment complete!')
  console.log('   The system now has realistic data across all modules.')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
