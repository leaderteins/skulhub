// Quick student-only seed so we can test bed assignment in the hostel module.
// Idempotent: safe to re-run; uses unique admission numbers per run.
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const FIRST_NAMES_M = ['Brian', 'Kevin', 'Dennis', 'Victor', 'John', 'James', 'Peter', 'David', 'Joseph', 'Samuel', 'Daniel', 'Michael', 'Stephen', 'Paul', 'Mark', 'Isaac', 'Elijah', 'Nathan', 'Joshua', 'Andrew', 'Collins', 'Derrick', 'Emmanuel']
const FIRST_NAMES_F = ['Grace', 'Mary', 'Janet', 'Lucy', 'Ruth', 'Esther', 'Naomi', 'Rebecca', 'Sarah', 'Hannah', 'Ann', 'Caroline', 'Diana', 'Eunice', 'Gladys', 'Irene', 'Lillian', 'Maureen', 'Nancy', 'Patricia', 'Rose', 'Sheila', 'Tabitha', 'Winfred']
const LAST_NAMES = ['Mwangi', 'Kamau', 'Omondi', 'Otieno', 'Kiprop', 'Cheruiyot', 'Mutua', 'Wanjiku', 'Njoroge', 'Maina', 'Kibet', 'Rotich', 'Ochieng', 'Awuor', 'Wekesa', 'Barasa', 'Njeri', 'Wafula', 'Chebet', 'Langat', 'Owino', 'Achieng', 'Korir', 'Koech']

const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a
const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

async function main() {
  const existing = await db.student.count()
  if (existing > 0) {
    console.log(`ℹ️  ${existing} students already exist — skipping seed`)
    return
  }
  console.log('👥 Seeding students for hostel testing...')

  // Find class levels (if any) to attach enrollments
  const classLevels = await db.classLevel.findMany({ orderBy: { order: 'asc' } })
  const streams = await db.stream.findMany()
  const year = String(new Date().getFullYear())

  for (let i = 0; i < 60; i++) {
    const isMale = Math.random() > 0.5
    const first = rand(isMale ? FIRST_NAMES_M : FIRST_NAMES_F)
    const last = rand(LAST_NAMES)
    const boarding = Math.random() > 0.4 // ~60% boarding
    const admissionNo = `ADM-${year}-${String(i + 1).padStart(4, '0')}`
    const student = await db.student.create({
      data: {
        admissionNo,
        firstName: first,
        lastName: last,
        gender: isMale ? 'Male' : 'Female',
        email: `${first.toLowerCase()}.${last.toLowerCase()}${i}@school.ac.ke`,
        phone: `+2547${randInt(10, 99)}${randInt(100000, 999999)}`,
        boarding,
        status: 'Active',
        nationality: 'Kenyan',
        county: rand(['Nairobi', 'Kiambu', 'Nakuru', 'Kisumu', 'Machakos', 'Nyeri']),
        admissionDate: new Date(Date.now() - randInt(1, 365) * 86400000),
      },
    })

    if (classLevels.length > 0 && streams.length > 0) {
      const cl = rand(classLevels)
      const stream = rand(streams)
      try {
        await db.enrollment.create({
          data: {
            studentId: student.id,
            streamId: stream.id,
            classLevelId: cl.id,
            academicYear: year,
            term: 'Term 1',
            status: 'Active',
          },
        })
      } catch {
        // skip if unique constraint violation
      }
    }
  }

  const total = await db.student.count()
  console.log(`✓ Created 60 students. Total now: ${total}`)
}

main().catch(console.error).finally(() => db.$disconnect())
