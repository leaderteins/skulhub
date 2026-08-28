import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const FIRST_NAMES_M = ['Brian', 'Kevin', 'Dennis', 'Victor', 'Mercy', 'Faith', 'Joyce', 'Winnie', 'Cynthia', 'Mercy', 'John', 'James', 'Peter', 'David', 'Joseph', 'Samuel', 'Daniel', 'Michael', 'Stephen', 'Paul', 'Mark', 'Isaac', 'Elijah', 'Nathan', 'Joshua', 'Andrew', 'Brian', 'Collins', 'Derrick', 'Emmanuel']
const FIRST_NAMES_F = ['Grace', 'Mary', 'Janet', 'Lucy', 'Ruth', 'Esther', 'Naomi', 'Rebecca', 'Sarah', 'Hannah', 'Ann', 'Caroline', 'Diana', 'Eunice', 'Fridah', 'Gladys', 'Irene', 'Janet', 'Lillian', 'Maureen', 'Nancy', 'Patricia', 'Queenter', 'Rose', 'Sheila', 'Tabitha', 'Veronica', 'Winfred', 'Yvonne', 'Zipporah']
const LAST_NAMES = ['Mwangi', 'Kamau', 'Omondi', 'Otieno', 'Kiprop', 'Cheruiyot', 'Mutua', 'Wanjiku', 'Njoroge', 'Maina', 'Kibet', 'Rotich', 'Ochieng', 'Awuor', 'Wekesa', 'Barasa', 'Njeri', 'Wafula', 'Chebet', 'Langat', 'Owino', 'Achieng', 'Korir', 'Koech', 'Mutiso', 'Muthoni', 'Karimi', 'Njoki', 'Auma', 'Owiti']
const COUNTIES = ['Nairobi', 'Kiambu', 'Nakuru', 'Kakamega', 'Bungoma', 'Kisumu', 'Machakos', 'Meru', 'Kilifi', 'Uasin Gishu', 'Nyeri', 'Murang\'a', 'Kericho', 'Bomet', 'Kisii', 'Trans Nzoia']
const SUBJECTS = [
  { name: 'Mathematics', code: 'MAT', dept: 'Mathematics', category: 'Core' },
  { name: 'English', code: 'ENG', dept: 'Languages', category: 'Core' },
  { name: 'Kiswahili', code: 'KIS', dept: 'Languages', category: 'Core' },
  { name: 'Biology', code: 'BIO', dept: 'Sciences', category: 'Core' },
  { name: 'Chemistry', code: 'CHE', dept: 'Sciences', category: 'Core' },
  { name: 'Physics', code: 'PHY', dept: 'Sciences', category: 'Optional' },
  { name: 'History & Government', code: 'HIS', dept: 'Humanities', category: 'Optional' },
  { name: 'Geography', code: 'GEO', dept: 'Humanities', category: 'Optional' },
  { name: 'Christian Religious Education', code: 'CRE', dept: 'Humanities', category: 'Optional' },
  { name: 'Business Studies', code: 'BST', dept: 'Business', category: 'Optional' },
  { name: 'Computer Studies', code: 'CST', dept: 'Technical', category: 'Optional' },
  { name: 'Agriculture', code: 'AGR', dept: 'Technical', category: 'Optional' },
  { name: 'Physical Education', code: 'PED', dept: 'Co-curricular', category: 'Co-curricular' },
]
const CLASS_LEVELS = [
  { name: 'Form 1', stage: 'Senior School', order: 1, capacity: 80 },
  { name: 'Form 2', stage: 'Senior School', order: 2, capacity: 80 },
  { name: 'Form 3', stage: 'Senior School', order: 3, capacity: 80 },
  { name: 'Form 4', stage: 'Senior School', order: 4, capacity: 80 },
]
const STREAMS = ['East', 'West']
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const PERIODS = [
  { start: '08:00', end: '08:40' },
  { start: '08:40', end: '09:20' },
  { start: '09:20', end: '10:00' },
  { start: '10:30', end: '11:10' },
  { start: '11:10', end: '11:50' },
  { start: '11:50', end: '12:30' },
  { start: '14:00', end: '14:40' },
  { start: '14:40', end: '15:20' },
  { start: '15:20', end: '16:00' },
]
const BOOKS = [
  { title: 'Integrated Science Learner\'s Book', author: 'KLB', category: 'Science', publisher: 'Kenya Literature Bureau', year: 2023, isbn: '9789966311234' },
  { title: 'Mathematics for Secondary Schools', author: 'Mwangi P.', category: 'Mathematics', publisher: 'Oxford University Press', year: 2022, isbn: '9780195741234' },
  { title: 'English textbook', author: 'Kamau J.', category: 'Languages', publisher: 'Longhorn', year: 2023, isbn: '9789966671234' },
  { title: 'Biology Today', author: 'Ochieng D.', category: 'Science', publisher: 'Moran Publishers', year: 2021, isbn: '9789966531234' },
  { title: 'Chemistry Practical Guide', author: 'Kiprop S.', category: 'Science', publisher: 'East African Educational', year: 2022, isbn: '9789966481234' },
  { title: 'Kiswahili Mufti', author: 'Achieng M.', category: 'Languages', publisher: 'Jomo Kenyatta Foundation', year: 2023, isbn: '9789966221234' },
  { title: 'Geography of East Africa', author: 'Mutua B.', category: 'Humanities', publisher: 'Heinemann', year: 2020, isbn: '9789966319876' },
  { title: 'History & Government', author: 'Owino K.', category: 'Humanities', publisher: 'Oxford University Press', year: 2022, isbn: '9780195745678' },
  { title: 'Business Studies', author: 'Wanjiru A.', category: 'Business', publisher: 'Moran Publishers', year: 2023, isbn: '9789966539876' },
  { title: 'Computer Studies', author: 'Cheruiyot R.', category: 'Technical', publisher: 'KLB', year: 2023, isbn: '9789966315678' },
  { title: 'Agriculture for Schools', author: 'Langat J.', category: 'Technical', publisher: 'Longhorn', year: 2021, isbn: '9789966679876' },
  { title: 'CRE for Secondary', author: 'Njoroge P.', category: 'Humanities', publisher: 'Jomo Kenyatta Foundation', year: 2022, isbn: '9789966229876' },
  { title: 'Set Book: Betrayal in the City', author: 'Imbuga F.', category: 'Literature', publisher: 'Heinemann', year: 2019, isbn: '9789966313456' },
  { title: 'Set Book: The River Between', author: 'Ngugi wa Thiong\'o', category: 'Literature', publisher: 'East African Educational', year: 2018, isbn: '9789966483456' },
  { title: 'Physics for Secondary', author: 'Koech D.', category: 'Science', publisher: 'Oxford University Press', year: 2022, isbn: '9780195743456' },
]

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }
function pick<T>(arr: T[], n: number): T[] { const c = [...arr]; const out: T[] = []; for (let i = 0; i < n && c.length; i++) out.push(c.splice(Math.floor(Math.random() * c.length), 1)[0]); return out }

function gradeFromMarks(m: number) {
  if (m >= 80) return { grade: 'A', points: 12 }
  if (m >= 75) return { grade: 'A-', points: 11 }
  if (m >= 70) return { grade: 'B+', points: 10 }
  if (m >= 65) return { grade: 'B', points: 9 }
  if (m >= 60) return { grade: 'B-', points: 8 }
  if (m >= 55) return { grade: 'C+', points: 7 }
  if (m >= 50) return { grade: 'C', points: 6 }
  if (m >= 45) return { grade: 'C-', points: 5 }
  if (m >= 40) return { grade: 'D+', points: 4 }
  if (m >= 35) return { grade: 'D', points: 3 }
  if (m >= 30) return { grade: 'D-', points: 2 }
  return { grade: 'E', points: 1 }
}

async function main() {
  console.log('🌱 Seeding EduManage Pro database...')

  // Clean
  await db.activityLog.deleteMany()
  await db.notification.deleteMany()
  await db.announcement.deleteMany()
  await db.bookLoan.deleteMany()
  await db.libraryBook.deleteMany()
  await db.transportRoute.deleteMany()
  await db.vehicle.deleteMany()
  await db.expense.deleteMany()
  await db.scholarship.deleteMany()
  await db.payment.deleteMany()
  await db.invoice.deleteMany()
  await db.feeStructure.deleteMany()
  await db.grade.deleteMany()
  await db.exam.deleteMany()
  await db.timetable.deleteMany()
  await db.attendance.deleteMany()
  await db.enrollment.deleteMany()
  await db.student.deleteMany()
  await db.guardian.deleteMany()
  await db.subjectAssignment.deleteMany()
  await db.subject.deleteMany()
  await db.stream.deleteMany()
  await db.classLevel.deleteMany()
  await db.staff.deleteMany()
  await db.department.deleteMany()

  // Departments
  const departments = await Promise.all([
    db.department.create({ data: { name: 'Mathematics', description: 'Mathematics & Statistics' } }),
    db.department.create({ data: { name: 'Sciences', description: 'Biology, Chemistry, Physics' } }),
    db.department.create({ data: { name: 'Languages', description: 'English, Kiswahili, French' } }),
    db.department.create({ data: { name: 'Humanities', description: 'History, Geography, CRE' } }),
    db.department.create({ data: { name: 'Business', description: 'Business Studies, Economics' } }),
    db.department.create({ data: { name: 'Technical', description: 'Computer, Agriculture' } }),
    db.department.create({ data: { name: 'Co-curricular', description: 'PE, Sports, Clubs' } }),
  ])
  const deptMap = Object.fromEntries(departments.map(d => [d.name, d.id]))

  // Subjects
  const subjects = await Promise.all(SUBJECTS.map(s => db.subject.create({
    data: { name: s.name, code: s.code, category: s.category, departmentId: deptMap[s.dept] }
  })))
  const subjectMap = Object.fromEntries(subjects.map(s => [s.name, s]))

  // Staff
  const staffRoles = [
    { role: 'Principal', n: 1, salary: 280000 },
    { role: 'Deputy Principal', n: 1, salary: 220000 },
    { role: 'HOD', n: 7, salary: 150000 },
    { role: 'Teacher', n: 28, salary: 95000 },
    { role: 'Bursar', n: 2, salary: 120000 },
    { role: 'Librarian', n: 1, salary: 80000 },
    { role: 'Clerk', n: 3, salary: 55000 },
    { role: 'Driver', n: 4, salary: 45000 },
    { role: 'Security', n: 5, salary: 35000 },
    { role: 'Cleaner', n: 6, salary: 30000 },
  ]
  const staff: any[] = []
  let empNo = 1000
  for (const sr of staffRoles) {
    for (let i = 0; i < sr.n; i++) {
      const isMale = sr.role === 'Driver' || sr.role === 'Security' ? Math.random() > 0.3 : Math.random() > 0.5
      const fn = isMale ? rand(FIRST_NAMES_M) : rand(FIRST_NAMES_F)
      const ln = rand(LAST_NAMES)
      const dept = sr.role === 'Teacher' || sr.role === 'HOD' ? rand(departments) : null
      const s = await db.staff.create({
        data: {
          employeeNo: `EMP/${empNo++}`,
          firstName: fn,
          lastName: ln,
          email: `${fn.toLowerCase()}.${ln.toLowerCase()}@edumanage.ac.ke`.replace(/'/g, ''),
          phone: `+2547${randInt(10, 29)}${randInt(100000, 999999)}`,
          gender: isMale ? 'Male' : 'Female',
          role: sr.role,
          departmentId: dept?.id,
          qualification: rand(['B.Ed', 'M.Ed', 'BSc', 'MSc', 'BA', 'Diploma in Education']),
          specialization: sr.role === 'Teacher' || sr.role === 'HOD' ? rand(SUBJECTS).name : null,
          employmentType: rand(['Permanent', 'Permanent', 'Permanent', 'Contract']),
          salary: sr.salary + randInt(-10000, 10000),
          status: Math.random() > 0.05 ? 'Active' : 'On Leave',
          hireDate: new Date(randInt(2015, 2024), randInt(0, 11), randInt(1, 28)),
          address: `${rand(['Mlolongo', 'Rongai', 'Ruaka', 'Kasarani', 'Embakasi', 'Westlands', 'Karen', 'Lang\'ata'])}, Nairobi`,
        }
      })
      staff.push(s)
    }
  }
  const teachers = staff.filter(s => s.role === 'Teacher' || s.role === 'HOD')
  console.log(`  ✓ ${staff.length} staff created`)

  // Class levels & streams
  const classLevels = await Promise.all(CLASS_LEVELS.map(cl => db.classLevel.create({
    data: { name: cl.name, stage: cl.stage, order: cl.order, capacity: cl.capacity }
  })))
  const streams: any[] = []
  for (const cl of classLevels) {
    for (const sn of STREAMS) {
      const teacher = rand(teachers)
      const st = await db.stream.create({
        data: { name: `${cl.name} ${sn}`, classLevelId: cl.id, classTeacherId: teacher.id, capacity: 40 }
      })
      streams.push(st)
    }
  }
  console.log(`  ✓ ${classLevels.length} class levels, ${streams.length} streams`)

  // Subject assignments
  for (const cl of classLevels) {
    const core = subjects.filter(s => s.category === 'Core')
    const optional = pick(subjects.filter(s => s.category === 'Optional'), 5)
    const all = [...core, ...optional, ...subjects.filter(s => s.category === 'Co-curricular')]
    for (const subj of all) {
      await db.subjectAssignment.create({
        data: {
          subjectId: subj.id,
          classLevelId: cl.id,
          teacherId: rand(teachers).id,
          weeklyPeriods: subj.category === 'Core' ? 6 : subj.category === 'Co-curricular' ? 2 : 4,
        }
      })
    }
  }

  // Guardians & Students
  const students: any[] = []
  let admNo = 5000
  for (const cl of classLevels) {
    for (const stream of streams.filter(s => s.classLevelId === cl.id)) {
      const count = randInt(28, 36)
      for (let i = 0; i < count; i++) {
        const isMale = Math.random() > 0.5
        const fn = isMale ? rand(FIRST_NAMES_M) : rand(FIRST_NAMES_F)
        const ln = rand(LAST_NAMES)
        const g = await db.guardian.create({
          data: {
            firstName: rand(FIRST_NAMES_M.concat(FIRST_NAMES_F)),
            lastName: ln,
            phone: `+2547${randInt(10, 29)}${randInt(100000, 999999)}`,
            relation: rand(['Parent', 'Parent', 'Parent', 'Guardian', 'Sponsor']),
            occupation: rand(['Farmer', 'Business', 'Teacher', 'Nurse', 'Civil Servant', 'Driver', 'Trader', 'Engineer']),
            address: `${rand(['Mlolongo', 'Rongai', 'Ruaka', 'Kasarani', 'Embakasi', 'Karen'])}, Nairobi`,
          }
        })
        const boarding = Math.random() > 0.55
        const dob = new Date(randInt(2007, 2011), randInt(0, 11), randInt(1, 28))
        const st = await db.student.create({
          data: {
            admissionNo: `ADM/${admNo++}`,
            firstName: fn,
            lastName: ln,
            phone: Math.random() > 0.6 ? `+2547${randInt(10, 29)}${randInt(100000, 999999)}` : null,
            gender: isMale ? 'Male' : 'Female',
            dateOfBirth: dob,
            bloodGroup: rand(['A+', 'B+', 'O+', 'AB+', 'A-', 'O-']),
            nationality: 'Kenyan',
            county: rand(COUNTIES),
            boarding,
            guardianId: g.id,
            admissionDate: new Date(randInt(2022, 2024), randInt(0, 11), randInt(1, 28)),
          }
        })
        students.push(st)
        await db.enrollment.create({
          data: {
            studentId: st.id,
            streamId: stream.id,
            classLevelId: cl.id,
            academicYear: '2025',
            term: 'Term 1',
          }
        })
      }
    }
  }
  console.log(`  ✓ ${students.length} students created`)

  // Timetable
  for (const stream of streams) {
    const cl = classLevels.find(c => c.id === stream.classLevelId)!
    const assignments = await db.subjectAssignment.findMany({ where: { classLevelId: cl.id }, include: { subject: true } })
    for (const day of DAYS) {
      for (const period of PERIODS) {
        const a = rand(assignments)
        await db.timetable.create({
          data: {
            streamId: stream.id,
            subjectId: a.subjectId,
            teacherId: a.teacherId,
            dayOfWeek: day,
            startTime: period.start,
            endTime: period.end,
            room: `${cl.name.replace(' ', '')}-${stream.name.split(' ')[1]}`,
          }
        })
      }
    }
  }
  console.log('  ✓ Timetables generated')

  // Exams & grades
  const exam = await db.exam.create({
    data: { name: 'End Term 1 Examination', academicYear: '2025', term: 'Term 1', examType: 'End Term', startDate: new Date(2025, 3, 7), endDate: new Date(2025, 3, 18) }
  })
  let gradeCount = 0
  for (const st of students) {
    const subs = subjects.filter(s => s.name !== 'Physical Education')
    for (const subj of subs) {
      const marks = randInt(28, 96)
      const g = gradeFromMarks(marks)
      await db.grade.create({
        data: {
          studentId: st.id,
          subjectId: subj.id,
          examId: exam.id,
          marks,
          grade: g.grade,
          points: g.points,
          remarks: marks >= 50 ? 'Good performance' : 'Needs improvement',
        }
      })
      gradeCount++
    }
  }
  console.log(`  ✓ ${gradeCount} grades recorded`)

  // Attendance for last 10 working days
  const today = new Date()
  for (let d = 0; d < 14; d++) {
    const date = new Date(today)
    date.setDate(date.getDate() - d)
    if (date.getDay() === 0 || date.getDay() === 6) continue
    for (const st of students) {
      const r = Math.random()
      const status = r > 0.88 ? 'Absent' : r > 0.84 ? 'Late' : r > 0.82 ? 'Excused' : 'Present'
      await db.attendance.create({
        data: { studentId: st.id, personType: 'Student', date, status }
      })
    }
  }
  console.log('  ✓ Attendance records generated')

  // Fee structures
  const feeStructures: any[] = []
  for (const cl of classLevels) {
    for (const boarding of [false, true]) {
      const tuition = 25000
      const boardingFee = boarding ? 18000 : 0
      const examFee = 3500
      const libraryFee = 1500
      const activityFee = 2000
      const otherFee = 1000
      const total = tuition + boardingFee + examFee + libraryFee + activityFee + otherFee
      const fs = await db.feeStructure.create({
        data: {
          name: `${cl.name} ${boarding ? 'Boarding' : 'Day'} 2025 T1`,
          classLevelId: cl.id,
          academicYear: '2025',
          term: 'Term 1',
          boarding,
          tuitionFee: tuition,
          boardingFee,
          examFee,
          libraryFee,
          activityFee,
          otherFee,
          totalAmount: total,
          dueDate: new Date(2025, 1, 28),
        }
      })
      feeStructures.push(fs)
    }
  }

  // Invoices & payments
  let invNo = 10000
  let payCount = 0
  for (const st of students) {
    const fs = feeStructures.find(f => f.boarding === st.boarding && f.classLevelId)!
    const r = Math.random()
    const amountPaid = r > 0.7 ? fs.totalAmount : r > 0.4 ? Math.floor(fs.totalAmount * 0.6) : r > 0.2 ? Math.floor(fs.totalAmount * 0.3) : 0
    const balance = fs.totalAmount - amountPaid
    const status = balance === 0 ? 'Paid' : amountPaid > 0 ? 'Partially Paid' : 'Unpaid'
    const inv = await db.invoice.create({
      data: {
        invoiceNo: `INV/${invNo++}`,
        studentId: st.id,
        feeStructureId: fs.id,
        academicYear: '2025',
        term: 'Term 1',
        amount: fs.totalAmount,
        amountPaid,
        balance,
        status,
        dueDate: new Date(2025, 1, 28),
      }
    })
    if (amountPaid > 0) {
      const methods = ['M-Pesa', 'M-Pesa', 'M-Pesa', 'Bank Transfer', 'Cash', 'Cheque']
      await db.payment.create({
        data: {
          invoiceId: inv.id,
          studentId: st.id,
          amount: amountPaid,
          method: rand(methods),
          reference: `Q${randInt(10000000000, 99999999999)}`,
          payerName: `${st.firstName} Guardian`,
          payerPhone: `+2547${randInt(10, 29)}${randInt(100000, 999999)}`,
          receivedBy: 'Bursar Office',
        }
      })
      payCount++
    }
  }
  console.log(`  ✓ ${students.length} invoices, ${payCount} payments`)

  // Scholarships
  const scholarshipNames = ['Mpesa Foundation Academy', 'Equity Wings to Fly', 'Government Bursary', 'County Bursary', 'JKF Scholarship']
  for (let i = 0; i < 15; i++) {
    await db.scholarship.create({
      data: {
        studentId: rand(students).id,
        name: rand(scholarshipNames),
        provider: rand(['Private', 'Government', 'NGO', 'Corporate']),
        amount: randInt(20000, 60000),
        coverage: rand(['Full', 'Partial', 'Half']),
        academicYear: '2025',
        status: 'Active',
        endDate: new Date(2025, 11, 31),
      }
    })
  }

  // Expenses
  const expenseCats = ['Salaries', 'Utilities', 'Maintenance', 'Supplies', 'Transport', 'Other']
  for (let i = 0; i < 30; i++) {
    const cat = rand(expenseCats)
    await db.expense.create({
      data: {
        category: cat,
        description: `${cat} - ${rand(['January', 'February', 'March'])} ${randInt(1, 28)}`,
        amount: cat === 'Salaries' ? randInt(2000000, 3500000) : randInt(5000, 80000),
        date: new Date(2025, randInt(0, 2), randInt(1, 28)),
        paymentMethod: rand(['Bank Transfer', 'M-Pesa', 'Cheque', 'Cash']),
        recipient: rand(['KPLC', 'Nairobi Water', 'Staff Payroll', 'Supplier Co.', 'Fuel Station', 'Contractor Ltd']),
      }
    })
  }

  // Library
  for (const b of BOOKS) {
    const copies = randInt(3, 15)
    await db.libraryBook.create({
      data: {
        isbn: b.isbn,
        title: b.title,
        author: b.author,
        category: b.category,
        publisher: b.publisher,
        yearPublished: b.year,
        copiesTotal: copies,
        copiesAvailable: copies,
        shelfLocation: `${String.fromCharCode(65 + randInt(0, 25))}-${randInt(1, 20)}`,
      }
    })
  }
  // Some loans
  const books = await db.libraryBook.findMany()
  for (let i = 0; i < 25; i++) {
    const st = rand(students)
    const bk = rand(books)
    const borrow = new Date()
    borrow.setDate(borrow.getDate() - randInt(1, 20))
    const due = new Date(borrow)
    due.setDate(due.getDate() + 14)
    const returned = Math.random() > 0.5
    const loanStatus = returned ? 'Returned' : new Date() > due ? 'Overdue' : 'Borrowed'
    await db.bookLoan.create({
      data: {
        bookId: bk.id,
        studentId: st.id,
        borrowerName: `${st.firstName} ${st.lastName}`,
        borrowDate: borrow,
        dueDate: due,
        returnDate: returned ? new Date() : null,
        status: loanStatus,
        fine: returned && new Date() > due ? randInt(20, 100) : 0,
      }
    })
    // Decrement copiesAvailable for active loans (Borrowed/Overdue)
    if (!returned) {
      await db.libraryBook.update({
        where: { id: bk.id },
        data: { copiesAvailable: { decrement: 1 } },
      })
    }
  }

  // Transport
  const vehicles = [
    { reg: 'KDA 123A', type: 'Bus', capacity: 51, make: 'Toyota', model: 'Coaster', year: 2022 },
    { reg: 'KDB 456B', type: 'Bus', capacity: 51, make: 'Nissan', model: 'Civilian', year: 2021 },
    { reg: 'KDC 789C', type: 'Van', capacity: 14, make: 'Toyota', model: 'Hiace', year: 2023 },
    { reg: 'KDD 012D', type: 'Van', capacity: 14, make: 'Nissan', model: 'Urvan', year: 2020 },
    { reg: 'KDE 345E', type: 'Bus', capacity: 33, make: 'Isuzu', model: 'NQR', year: 2022 },
  ]
  const routeNames = ['Rongai Route', 'Kasarani Route', 'Ruaka Route', 'Embakasi Route', 'Karen Route']
  for (let i = 0; i < vehicles.length; i++) {
    const v = vehicles[i]
    const driver = staff.find(s => s.role === 'Driver')!
    await db.vehicle.create({
      data: {
        registration: v.reg,
        type: v.type,
        capacity: v.capacity,
        make: v.make,
        model: v.model,
        year: v.year,
        status: 'Active',
        route: {
          create: {
            name: routeNames[i],
            startPoint: rand(['Rongai Town', 'Kasarani Stadium', 'Ruaka Junction', 'Embakasi', 'Karen Shopping Centre']),
            endPoint: 'EduManage Academy, Nairobi',
            stops: rand(['Stage 1, Stage 2, Stage 3', 'Junction, Mall, Estate', 'Gate A, Gate B, Terminus']),
            distanceKm: randInt(8, 28),
            fare: randInt(1500, 4500),
            driverId: driver.id,
          }
        }
      }
    })
  }

  // Announcements
  const anns = [
    { title: 'Term 1 Opening Day', body: 'All students are required to report on 6th January 2025 by 8:00 AM. Boarding students should arrive by 4:00 PM.', audience: 'All', priority: 'High', pinned: true },
    { title: 'Parent-Teacher Conference', body: 'PTC meeting scheduled for 15th February 2025 from 9:00 AM to 1:00 PM in the school hall.', audience: 'Parents', priority: 'Normal' },
    { title: 'Mid-Term Break', body: 'Mid-term break begins on 24th February and ends on 28th February 2025.', audience: 'Students', priority: 'Normal' },
    { title: 'Science Congress', body: 'The Kenya Science and Engineering Fair regional competitions will be held on 8th March 2025. Interested students should register with the Science HOD.', audience: 'Students', priority: 'Normal' },
    { title: 'Fee Payment Deadline', body: 'All school fees for Term 1 must be cleared by 28th February 2025. M-Pesa Paybill 522522, Account: Admission Number.', audience: 'Parents', priority: 'Urgent', pinned: true },
    { title: 'Staff Development Workshop', body: 'All teaching staff to attend CBE pedagogy workshop on Saturday 1st March 2025.', audience: 'Staff', priority: 'Normal' },
    { title: 'Annual Sports Day', body: 'Inter-stream athletics competition on 14th March 2025 at the school grounds.', audience: 'All', priority: 'Normal' },
    { title: 'End Term Examinations', body: 'Term 1 End Examinations begin 7th April 2025. Students should prepare adequately.', audience: 'Students', priority: 'High' },
  ]
  for (const a of anns) {
    await db.announcement.create({
      data: {
        title: a.title,
        body: a.body,
        audience: a.audience,
        priority: a.priority,
        pinned: a.pinned || false,
        authorName: rand(['Principal Office', 'Deputy Principal', 'Bursar', 'Academic Office']),
        publishedAt: new Date(Date.now() - randInt(1, 20) * 86400000),
      }
    })
  }

  // Activity log
  const logActions = [
    { action: 'CREATE', entity: 'Student', user: 'Admissions Clerk' },
    { action: 'UPDATE', entity: 'Invoice', user: 'Bursar' },
    { action: 'PAYMENT', entity: 'Payment', user: 'Bursar' },
    { action: 'CREATE', entity: 'Announcement', user: 'Principal' },
    { action: 'MARK', entity: 'Attendance', user: 'Class Teacher' },
    { action: 'GRADE', entity: 'Exam', user: 'Subject Teacher' },
    { action: 'ISSUE', entity: 'BookLoan', user: 'Librarian' },
  ]
  for (let i = 0; i < 40; i++) {
    const a = rand(logActions)
    await db.activityLog.create({
      data: {
        action: a.action,
        entity: a.entity,
        user: a.user,
        details: `${a.action} on ${a.entity}`,
        createdAt: new Date(Date.now() - randInt(1, 72) * 3600000),
      }
    })
  }

  console.log('✅ Seed complete!')
  const total = await db.student.count()
  const totalStaff = await db.staff.count()
  console.log(`   Students: ${total}, Staff: ${totalStaff}`)
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await db.$disconnect() })
