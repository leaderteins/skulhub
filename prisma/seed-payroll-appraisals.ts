import { PrismaClient } from '@prisma/client'

const db = new PrismaClient()

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

const PERIODS = ['Term 1 2024', 'Term 2 2024', 'Term 3 2024', 'Term 1 2025']

// Strengths / improvements / goals banks
const STRENGTHS = [
  'Consistently delivers well-prepared lessons with clear learning objectives.',
  'Demonstrates strong classroom management and engages learners effectively.',
  'Mentors junior teachers and willingly shares teaching resources.',
  'Excellent punctuality — always arrives early and starts lessons on time.',
  'Strong subject mastery; learners perform above class average in assessments.',
  'Embraces ICT integration in teaching, using digital tools to enrich lessons.',
  'Builds positive relationships with students, parents, and colleagues.',
  'Shows initiative in co-curricular coordination and event planning.',
]
const IMPROVEMENTS = [
  'Could submit lesson plans and records of work on time.',
  'Needs to differentiate instruction for slow learners.',
  'Should provide more timely feedback on assignments and assessments.',
  'Could participate more actively in departmental meetings.',
  'Needs to maintain better consistency in maintaining the attendance register.',
  'Should integrate more continuous assessment (CATs) into the term plan.',
  'Could improve communication with parents regarding learner progress.',
  'Should embrace collaborative lesson planning with fellow subject teachers.',
]
const GOALS = [
  'Achieve a class mean of 60%+ in end-of-term assessments.',
  'Complete syllabus coverage at least two weeks before end of term.',
  'Attend at least one professional development workshop this term.',
  'Implement weekly CATs and provide written feedback within 3 days.',
  'Mentor at least one new teacher in the department.',
  'Initiate one co-curricular club or activity for students.',
  'Improve on-time submission of all statutory records to 100%.',
  'Integrate at least two digital tools into weekly lesson delivery.',
]
const REVIEWERS = ['Mary Wanjiru', 'Esther Njeri', 'Moses Kinyanjui']

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min }

function estimateStatutory(basic: number) {
  // NSSF — Tier II upper bound ~ 1080 (simplified, current Kenya rates)
  const nssf = 1080
  // NHIF / SHIF band approximation
  const nhif = basic <= 5999 ? 150 : basic <= 11999 ? 400 : basic <= 29999 ? 850 : basic <= 999999 ? 1700 : 1700
  // PAYE rough estimate using monthly bands (no reliefs applied)
  let tax = 0
  if (basic > 24000) tax += Math.min(basic - 24000, (32333 - 24000)) * 0.25
  if (basic > 32333) tax += (basic - 32333) * 0.30
  if (basic > 0) tax += Math.min(basic, 24000) * 0.10
  // Apply personal relief ~ 2400/month (approx)
  tax = Math.max(0, tax - 2400)
  return { nssf, nhif, tax: Math.round(tax) }
}

async function main() {
  console.log('🌱 Seeding Payroll & Appraisals...')

  const staff = await db.staff.findMany({ where: { status: 'Active' }, select: { id: true, firstName: true, lastName: true, role: true, salary: true } })
  console.log(`  Found ${staff.length} active staff`)

  // Clean previous data
  await db.payslip.deleteMany()
  await db.appraisal.deleteMany()

  let payslipCount = 0
  let appraisalCount = 0

  // PAYROLL: last 3 months of payslips for all staff
  const now = new Date()
  const periods: Array<{ month: string; year: number; status: string; payDate: Date | null }> = []
  for (let i = 2; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const isLatest = i === 0
    const isMid = i === 1
    periods.push({
      month: MONTHS[d.getMonth()],
      year: d.getFullYear(),
      status: isLatest ? (Math.random() > 0.5 ? 'Pending' : 'Approved') : 'Paid',
      payDate: isLatest ? null : new Date(d.getFullYear(), d.getMonth(), 28),
    })
    void isMid
  }

  // Limit to first 30 staff to keep payroll realistic
  const payrollStaff = staff.slice(0, 30)
  for (const period of periods) {
    let seq = 0
    const monthIdx = MONTHS.indexOf(period.month) + 1
    const ym = `${period.year}${String(monthIdx).padStart(2, '0')}`
    for (const s of payrollStaff) {
      seq++
      const basic = s.salary || randInt(35000, 120000)
      const allowances = randInt(2000, 18000)
      const deductions = randInt(500, 4000)
      const { nssf, nhif, tax } = estimateStatutory(basic)
      const netPay = basic + allowances - deductions - tax - nssf - nhif
      const payslipNo = `PSL-${ym}-${String(seq).padStart(4, '0')}`
      await db.payslip.create({
        data: {
          payslipNo,
          staffId: s.id,
          month: period.month,
          year: period.year,
          basicSalary: basic,
          allowances,
          deductions,
          taxPAYE: tax,
          nssf,
          nhif,
          netPay,
          status: period.status,
          payDate: period.payDate,
        },
      })
      payslipCount++
    }
  }
  console.log(`  ✓ Created ${payslipCount} payslips across ${periods.length} periods`)

  // APPRAISALS: 1 per staff per period (limit to 40 staff x 2 periods)
  const appraisalStaff = staff.slice(0, 40)
  const appraisalPeriods = PERIODS.slice(-2) // most recent two periods
  for (const period of appraisalPeriods) {
    for (const s of appraisalStaff) {
      // Generate scores that correlate loosely with role/salary (higher salary → slightly higher scores)
      const base = s.salary > 80000 ? 7 : 6
      const punctuality = Math.min(10, Math.max(3, base + randInt(-1, 3)))
      const teamwork = Math.min(10, Math.max(3, base + randInt(-1, 3)))
      const studentResults = Math.min(10, Math.max(3, base + randInt(-2, 3)))
      const professionalism = Math.min(10, Math.max(4, base + randInt(0, 3)))
      const innovation = Math.min(10, Math.max(3, base + randInt(-2, 3)))
      const overall = Math.round((punctuality + teamwork + studentResults + professionalism + innovation) / 5)

      // Status — most recent period mix of Completed/Reviewed, older all Reviewed
      const isLatest = period === appraisalPeriods[appraisalPeriods.length - 1]
      const status = isLatest
        ? (Math.random() > 0.3 ? 'Completed' : 'Reviewed')
        : 'Reviewed'

      const reviewDate = new Date(now.getFullYear(), now.getMonth() - (isLatest ? 1 : 4), randInt(5, 25))

      await db.appraisal.create({
        data: {
          staffId: s.id,
          period,
          reviewDate,
          punctuality,
          teamwork,
          studentResults,
          professionalism,
          innovation,
          overallScore: overall,
          strengths: rand(STRENGTHS),
          improvements: rand(IMPROVEMENTS),
          goals: rand(GOALS),
          reviewerName: rand(REVIEWERS),
          status,
        },
      })
      appraisalCount++
    }
  }
  console.log(`  ✓ Created ${appraisalCount} appraisals across ${appraisalPeriods.length} periods`)

  console.log('✅ Done')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => db.$disconnect())
