// Seed admissions applications
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const FIRST_NAMES_M = ['Brian', 'Kevin', 'Dennis', 'Victor', 'John', 'James', 'Peter', 'David', 'Joseph', 'Samuel', 'Daniel', 'Michael', 'Stephen', 'Paul', 'Mark', 'Isaac', 'Elijah', 'Nathan', 'Joshua', 'Andrew', 'Collins', 'Derrick', 'Emmanuel']
const FIRST_NAMES_F = ['Grace', 'Mary', 'Janet', 'Lucy', 'Ruth', 'Esther', 'Naomi', 'Rebecca', 'Sarah', 'Hannah', 'Ann', 'Caroline', 'Diana', 'Eunice', 'Gladys', 'Irene', 'Lillian', 'Maureen', 'Nancy', 'Patricia', 'Rose', 'Sheila', 'Tabitha']
const LAST_NAMES = ['Mwangi', 'Kamau', 'Omondi', 'Otieno', 'Kiprop', 'Cheruiyot', 'Mutua', 'Wanjiku', 'Njoroge', 'Maina', 'Kibet', 'Rotich', 'Ochieng', 'Awuor', 'Wekesa', 'Barasa', 'Njeri', 'Wafula', 'Chebet', 'Langat']
const PREV_SCHOOLS = ['Jomo Kenyatta Primary', 'Mwangaza Primary School', 'St. Ann Academy', 'Nairobi Primary School', 'Mwangi Memorial School', 'Greenwood Academy', 'Sunrise Junior School', 'County Junior School', 'Bethel Academy', 'Victory Preparatory']
const COUNTIES = ['Nairobi', 'Kiambu', 'Nakuru', 'Kakamega', 'Machakos', 'Meru', 'Kisumu', 'Uasin Gishu', 'Nyeri', 'Murang\'a']
const GUARDIAN_OCCS = ['Farmer', 'Business', 'Teacher', 'Nurse', 'Civil Servant', 'Driver', 'Trader', 'Engineer', 'Accountant', 'Doctor']
const SOURCES = ['Walk-in', 'Online', 'Referral', 'Transfer', 'Walk-in', 'Online']
const STATUSES = ['Pending', 'Pending', 'Reviewing', 'Interview Scheduled', 'Accepted', 'Accepted', 'Rejected', 'Waitlisted', 'Enrolled']
const PRIORITIES = ['Normal', 'Normal', 'Normal', 'High', 'Low']

const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a

async function main() {
  console.log('📋 Seeding admissions applications...')
  await db.application.deleteMany()

  const classLevels = await db.classLevel.findMany()
  let appNo = 7000
  let count = 0

  for (let i = 0; i < 48; i++) {
    const isMale = Math.random() > 0.45
    const fn = isMale ? rand(FIRST_NAMES_M) : rand(FIRST_NAMES_F)
    const ln = rand(LAST_NAMES)
    const status = rand(STATUSES)
    const submittedDaysAgo = randInt(1, 90)
    const submittedAt = new Date()
    submittedAt.setDate(submittedAt.getDate() - submittedDaysAgo)

    let interviewDate: Date | null = null
    let decisionDate: Date | null = null
    let rejectionReason: string | null = null

    if (status === 'Interview Scheduled') {
      interviewDate = new Date(Date.now() + randInt(1, 14) * 86400000)
    }
    if (['Accepted', 'Rejected', 'Enrolled', 'Waitlisted'].includes(status)) {
      decisionDate = new Date(submittedAt.getTime() + randInt(3, 20) * 86400000)
    }
    if (status === 'Rejected') {
      rejectionReason = rand(['No vacancies in requested class', 'Failed entrance assessment', 'Incomplete documentation', 'Age requirement not met', 'Academic performance below threshold'])
    }

    await db.application.create({
      data: {
        applicantName: `${fn} ${ln}`,
        email: `${fn.toLowerCase()}.${ln.toLowerCase()}${randInt(1,99)}@gmail.com`.replace(/'/g, ''),
        phone: `+2547${randInt(10, 29)}${randInt(100000, 999999)}`,
        gender: isMale ? 'Male' : 'Female',
        dateOfBirth: new Date(randInt(2008, 2014), randInt(0, 11), randInt(1, 28)),
        previousSchool: rand(PREV_SCHOOLS),
        appliedClassLevelId: rand(classLevels).id,
        appliedYear: '2025',
        appliedTerm: 'Term 1',
        boarding: Math.random() > 0.5,
        guardianName: `${rand([...FIRST_NAMES_M, ...FIRST_NAMES_F])} ${ln}`,
        guardianPhone: `+2547${randInt(10, 29)}${randInt(100000, 999999)}`,
        guardianEmail: `guardian.${ln.toLowerCase()}${randInt(1,99)}@gmail.com`,
        guardianOccupation: rand(GUARDIAN_OCCS),
        county: rand(COUNTIES),
        applicationNo: `APP/${appNo++}`,
        source: rand(SOURCES),
        status,
        priority: rand(PRIORITIES),
        interviewDate,
        interviewNotes: status === 'Interview Scheduled' ? 'Schedule entrance assessment in Maths and English' : null,
        decisionDate,
        decisionBy: ['Accepted', 'Rejected', 'Enrolled', 'Waitlisted'].includes(status) ? 'Principal Office' : null,
        rejectionReason,
        notes: Math.random() > 0.7 ? 'Sibling of current student' : null,
        submittedAt,
      }
    })
    count++
  }

  console.log(`✓ Created ${count} applications`)
  const byStatus = await db.application.groupBy({ by: ['status'], _count: true })
  byStatus.forEach(s => console.log(`  ${s.status}: ${s._count}`))
}

main().catch(console.error).finally(() => db.$disconnect())
