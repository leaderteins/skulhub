// Super Admin seed — creates 8 schools with varied plans/statuses,
// distributes existing students/staff/invoices/payments across them,
// and creates user accounts per school.
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const SCHOOLS = [
  { name: 'EduManage Academy', slug: 'edumanage-academy', email: 'admin@edumanage.ac.ke', phone: '+254722100100', address: 'Karen, Nairobi', county: 'Nairobi', plan: 'Premium', status: 'Active', maxStudents: 800, trialEndsAt: null, ageDays: 220 },
  { name: 'Bright Future Secondary', slug: 'bright-future-secondary', email: 'info@brightfuture.sc.ke', phone: '+254723456789', address: 'Westlands, Nairobi', county: 'Nairobi', plan: 'Enterprise', status: 'Active', maxStudents: 1500, trialEndsAt: null, ageDays: 410 },
  { name: 'Rift Valley High School', slug: 'rift-valley-high', email: 'office@riftvalley.ac.ke', phone: '+254711222333', address: 'Eldoret', county: 'Uasin Gishu', plan: 'Standard', status: 'Active', maxStudents: 500, trialEndsAt: null, ageDays: 150 },
  { name: 'Coastal Academy Mombasa', slug: 'coastal-academy-mombasa', email: 'admin@coastal.ac.ke', phone: '+254720555666', address: 'Nyali, Mombasa', county: 'Mombasa', plan: 'Standard', status: 'Trial', maxStudents: 300, trialEndsAt: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000), ageDays: 18 },
  { name: 'Kisumu Lakeside School', slug: 'kisumu-lakeside-school', email: 'info@lakeside.ac.ke', phone: '+254733444555', address: 'Milimani, Kisumu', county: 'Kisumu', plan: 'Starter', status: 'Trial', maxStudents: 200, trialEndsAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), ageDays: 9 },
  { name: 'Nyeri Hill Academy', slug: 'nyeri-hill-academy', email: 'admin@nyerihill.ac.ke', phone: '+254712888999', address: 'Nyeri Town', county: 'Nyeri', plan: 'Premium', status: 'Active', maxStudents: 700, trialEndsAt: null, ageDays: 320 },
  { name: 'Machakos Boys School', slug: 'machakos-boys-school', email: 'principal@machakosboys.ac.ke', phone: '+254715777888', address: 'Machakos Town', county: 'Machakos', plan: 'Standard', status: 'Suspended', maxStudents: 600, trialEndsAt: null, ageDays: 280 },
  { name: 'Garissa Premier School', slug: 'garissa-premier-school', email: 'admin@garissapremier.ac.ke', phone: '+254716666777', address: 'Garissa Town', county: 'Garissa', plan: 'Starter', status: 'Expired', maxStudents: 200, trialEndsAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), ageDays: 380 },
]

const PLAN_MULTIPLIER: Record<string, number> = { Starter: 0.7, Standard: 1.0, Premium: 1.4, Enterprise: 1.8 }

const USERS_PER_SCHOOL: Record<string, Array<{ name: string; email: string; role: string; status: string; lastLoginDaysAgo: number | null }>> = {
  'edumanage-academy': [
    { name: 'Moses Kinyanjui', email: 'admin@edumanage.ac.ke', role: 'admin', status: 'Active', lastLoginDaysAgo: 0 },
    { name: 'Mary Wanjiru', email: 'principal@edumanage.ac.ke', role: 'principal', status: 'Active', lastLoginDaysAgo: 1 },
    { name: 'Peter Kamau', email: 'bursar@edumanage.ac.ke', role: 'bursar', status: 'Active', lastLoginDaysAgo: 2 },
  ],
  'bright-future-secondary': [
    { name: 'Janet Wairimu', email: 'admin@brightfuture.sc.ke', role: 'admin', status: 'Active', lastLoginDaysAgo: 0 },
    { name: 'Samuel Maina', email: 'principal@brightfuture.sc.ke', role: 'principal', status: 'Active', lastLoginDaysAgo: 3 },
  ],
  'rift-valley-high': [
    { name: 'Daniel Kiprop', email: 'admin@riftvalley.ac.ke', role: 'admin', status: 'Active', lastLoginDaysAgo: 1 },
    { name: 'Sarah Chebet', email: 'bursar@riftvalley.ac.ke', role: 'bursar', status: 'Active', lastLoginDaysAgo: 4 },
  ],
  'coastal-academy-mombasa': [
    { name: 'Ali Hassan', email: 'admin@coastal.ac.ke', role: 'admin', status: 'Active', lastLoginDaysAgo: 1 },
  ],
  'kisumu-lakeside-school': [
    { name: 'Joyce Akinyi', email: 'info@lakeside.ac.ke', role: 'admin', status: 'Active', lastLoginDaysAgo: 2 },
  ],
  'nyeri-hill-academy': [
    { name: 'Patrick Njoroge', email: 'admin@nyerihill.ac.ke', role: 'admin', status: 'Active', lastLoginDaysAgo: 0 },
    { name: 'Esther Wangari', email: 'principal@nyerihill.ac.ke', role: 'principal', status: 'Active', lastLoginDaysAgo: 5 },
  ],
  'machakos-boys-school': [
    { name: 'Francis Mutua', email: 'principal@machakosboys.ac.ke', role: 'admin', status: 'Suspended', lastLoginDaysAgo: 14 },
  ],
  'garissa-premier-school': [
    { name: 'Abdi Mohamed', email: 'admin@garissapremier.ac.ke', role: 'admin', status: 'Inactive', lastLoginDaysAgo: 45 },
  ],
}

function daysAgo(d: number): Date {
  const dt = new Date()
  dt.setDate(dt.getDate() - d)
  dt.setHours(9 + (d % 8), (d * 7) % 60, 0, 0)
  return dt
}

async function main() {
  console.log('🌱 Seeding Super Admin data…')

  // 1. Create schools (skip existing slugs)
  const schoolMap: Record<string, string> = {}
  for (const s of SCHOOLS) {
    const existing = await db.school.findUnique({ where: { slug: s.slug } })
    if (existing) {
      schoolMap[s.slug] = existing.id
      // Update plan/status to match seed spec
      await db.school.update({ where: { id: existing.id }, data: {
        plan: s.plan, status: s.status, trialEndsAt: s.trialEndsAt, maxStudents: s.maxStudents,
        email: s.email, phone: s.phone, address: s.address, county: s.county,
      }})
      console.log(`  ↻ updated ${s.slug}`)
      continue
    }
    const created = await db.school.create({ data: {
      name: s.name, slug: s.slug, email: s.email, phone: s.phone, address: s.address, county: s.county,
      plan: s.plan, status: s.status, trialEndsAt: s.trialEndsAt, maxStudents: s.maxStudents,
      createdAt: daysAgo(s.ageDays),
    }})
    schoolMap[s.slug] = created.id
    console.log(`  + ${s.slug}`)
  }

  // 2. Create user accounts per school (skip existing emails)
  for (const [slug, users] of Object.entries(USERS_PER_SCHOOL)) {
    const schoolId = schoolMap[slug]
    for (const u of users) {
      const exists = await db.userAccount.findUnique({ where: { email: u.email } })
      if (exists) {
        await db.userAccount.update({ where: { id: exists.id }, data: {
          schoolId, role: u.role, status: u.status, name: u.name,
          lastLoginAt: u.lastLoginDaysAgo === null ? null : daysAgo(u.lastLoginDaysAgo),
        }})
        continue
      }
      await db.userAccount.create({ data: {
        schoolId, name: u.name, email: u.email, passwordHash: 'demo-hash-' + u.email,
        role: u.role, status: u.status,
        lastLoginAt: u.lastLoginDaysAgo === null ? null : daysAgo(u.lastLoginDaysAgo),
      }})
    }
  }
  console.log(`  ✓ user accounts`)

  // 3. Distribute existing students, staff, invoices, payments across schools
  //    Strategy: round-robin by ID hash. If records already have schoolId, skip.
  const students = await db.student.findMany({ where: { schoolId: null }, select: { id: true } })
  const staff = await db.staff.findMany({ where: { schoolId: null }, select: { id: true } })
  const invoices = await db.invoice.findMany({ where: { schoolId: null }, select: { id: true, studentId: true } })
  const payments = await db.payment.findMany({ where: { schoolId: null }, select: { id: true, invoiceId: true } })

  const schoolIds = Object.values(schoolMap)

  // Helper: hash string → school index
  const hashIdx = (s: string) => {
    let h = 0
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
    return h % schoolIds.length
  }

  // Map: studentId → schoolId (so invoices/payments follow student)
  const studentSchool: Record<string, string> = {}
  for (const s of students) {
    const sid = schoolIds[hashIdx(s.id)]
    studentSchool[s.id] = sid
    await db.student.update({ where: { id: s.id }, data: { schoolId: sid } })
  }
  console.log(`  ✓ assigned ${students.length} students to schools`)

  for (const s of staff) {
    const sid = schoolIds[hashIdx(s.id + 'staff')]
    await db.staff.update({ where: { id: s.id }, data: { schoolId: sid } })
  }
  console.log(`  ✓ assigned ${staff.length} staff to schools`)

  // Build invoiceId → schoolId (from student if available, else hash)
  const invoiceSchool: Record<string, string> = {}
  for (const inv of invoices) {
    const sid = studentSchool[inv.studentId] || schoolIds[hashIdx(inv.id)]
    invoiceSchool[inv.id] = sid
    await db.invoice.update({ where: { id: inv.id }, data: { schoolId: sid } })
  }
  console.log(`  ✓ assigned ${invoices.length} invoices to schools`)

  for (const p of payments) {
    const sid = invoiceSchool[p.invoiceId] || schoolIds[hashIdx(p.id)]
    await db.payment.update({ where: { id: p.id }, data: { schoolId: sid } })
  }
  console.log(`  ✓ assigned ${payments.length} payments to schools`)

  // 4. Summary
  const counts = await Promise.all(schoolIds.map(id => Promise.all([
    db.student.count({ where: { schoolId: id } }),
    db.staff.count({ where: { schoolId: id } }),
    db.payment.aggregate({ where: { schoolId: id }, _sum: { amount: true } }),
  ])))
  console.log('\n📊 School distribution:')
  for (let i = 0; i < SCHOOLS.length; i++) {
    const [students, staff, paySum] = counts[i]
    console.log(`  ${SCHOOLS[i].slug.padEnd(28)} students=${String(students).padStart(3)} staff=${String(staff).padStart(3)} revenue=${paySum._sum.amount || 0}`)
  }

  console.log('\n✅ Super Admin seed complete')
}

main().catch(e => { console.error(e); process.exit(1) }).finally(() => db.$disconnect())
