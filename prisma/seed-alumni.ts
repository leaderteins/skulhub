// Seed alumni records + donations
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const FIRST_NAMES = ['Brian', 'Kevin', 'Dennis', 'Mercy', 'Faith', 'Grace', 'Mary', 'John', 'Peter', 'David', 'Joseph', 'Samuel', 'Daniel', 'Michael', 'Stephen', 'Paul', 'Mark', 'Isaac', 'Elijah', 'Nathan', 'Joshua', 'Andrew', 'Collins', 'Emmanuel', 'Ruth', 'Esther', 'Naomi', 'Rebecca', 'Sarah', 'Hannah', 'Caroline', 'Diana', 'Lillian', 'Maureen', 'Nancy', 'Patricia', 'Rose', 'Sheila', 'Veronica', 'Winfred']
const LAST_NAMES = ['Mwangi', 'Kamau', 'Omondi', 'Otieno', 'Kiprop', 'Cheruiyot', 'Mutua', 'Wanjiku', 'Njoroge', 'Maina', 'Kibet', 'Rotich', 'Ochieng', 'Awuor', 'Wekesa', 'Barasa', 'Njeri', 'Wafula', 'Chebet', 'Langat']
const CAREERS = [
  { career: 'Software Engineer', employer: 'Safaricom PLC', industry: 'Technology' },
  { career: 'Medical Doctor', employer: 'Kenyatta National Hospital', industry: 'Healthcare' },
  { career: 'Advocate', employer: 'Mwangi & Associates Advocates', industry: 'Law' },
  { career: 'Accountant', employer: 'KRA', industry: 'Finance' },
  { career: 'Civil Engineer', employer: 'Ministry of Roads', industry: 'Engineering' },
  { career: 'Teacher', employer: 'Alliance High School', industry: 'Education' },
  { career: 'Banker', employer: 'Equity Bank', industry: 'Finance' },
  { career: 'Architect', employer: 'Triad Architects', industry: 'Architecture' },
  { career: 'Pharmacist', employer: 'NAIVAS Pharmacy', industry: 'Healthcare' },
  { career: 'Journalist', employer: 'Nation Media Group', industry: 'Media' },
  { career: 'Pilot', employer: 'Kenya Airways', industry: 'Aviation' },
  { career: 'Entrepreneur', employer: 'Self-employed', industry: 'Business' },
  { career: 'Lecturer', employer: 'University of Nairobi', industry: 'Education' },
  { career: 'Nurse', employer: 'Aga Khan Hospital', industry: 'Healthcare' },
  { career: 'Data Analyst', employer: 'Jumia Kenya', industry: 'Technology' },
]
const LOCATIONS = ['Nairobi, Kenya', 'Mombasa, Kenya', 'Kisumu, Kenya', 'Nakuru, Kenya', 'Eldoret, Kenya', 'London, UK', 'Toronto, Canada', 'Sydney, Australia', 'Dubai, UAE', 'Washington, USA', 'Berlin, Germany', 'Cape Town, SA']
const ACHIEVEMENTS = [null, null, null, null, 'Awarded Teacher of the Year 2023', 'Founded a tech startup', 'Published research paper', 'Marathon runner', 'Community health champion', 'Recipient of Presidential Award']
const DONATION_PURPOSES = ['General', 'Scholarship', 'Infrastructure', 'Sports', 'Library']
const DONATION_METHODS = ['M-Pesa', 'Bank Transfer', 'Cash', 'Cheque']

const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a

async function main() {
  console.log('🎓 Seeding alumni data...')
  await db.donation.deleteMany()
  await db.alumnus.deleteMany()

  const gradYears = [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022]
  let alumniCount = 0
  let donationCount = 0

  for (const year of gradYears) {
    const count = randInt(12, 22)
    for (let i = 0; i < count; i++) {
      const isMale = Math.random() > 0.45
      const fn = isMale ? rand(FIRST_NAMES) : rand(FIRST_NAMES)
      const ln = rand(LAST_NAMES)
      const c = rand(CAREERS)
      const admNo = `ADM/${randInt(3000, 4999)}`
      const a = await db.alumnus.create({
        data: {
          firstName: fn,
          lastName: ln,
          email: `${fn.toLowerCase()}.${ln.toLowerCase()}${randInt(1,99)}@gmail.com`.replace(/'/g, ''),
          phone: `+2547${randInt(10, 29)}${randInt(100000, 999999)}`,
          gender: isMale ? 'Male' : 'Female',
          admissionNo: admNo,
          graduationYear: year,
          classLevel: 'Form 4',
          career: c.career,
          employer: c.employer,
          industry: c.industry,
          location: rand(LOCATIONS),
          achievement: rand(ACHIEVEMENTS),
          status: Math.random() > 0.1 ? 'Active' : 'Lost Contact',
        }
      })
      alumniCount++

      // 40% chance of donations
      if (Math.random() > 0.6) {
        const numDonations = randInt(1, 4)
        for (let d = 0; d < numDonations; d++) {
          await db.donation.create({
            data: {
              alumnusId: a.id,
              amount: randInt(1000, 100000),
              method: rand(DONATION_METHODS),
              reference: `Q${randInt(10000000000, 99999999999)}`,
              purpose: rand(DONATION_PURPOSES),
              date: new Date(randInt(2020, 2025), randInt(0, 11), randInt(1, 28)),
              notes: Math.random() > 0.8 ? 'Annual giving' : null,
            }
          })
          donationCount++
        }
      }
    }
  }

  console.log(`✓ Created ${alumniCount} alumni, ${donationCount} donations`)

  // Stats
  const total = await db.alumnus.count()
  const totalDonations = await db.donation.aggregate({ _sum: { amount: true } })
  console.log(`  Total alumni: ${total}`)
  console.log(`  Total donations: KES ${totalDonations._sum.amount?.toLocaleString()}`)
}

main().catch(console.error).finally(() => db.$disconnect())
