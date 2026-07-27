// Seed discipline incidents
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const INCIDENTS = [
  { category: 'Truancy', desc: 'Student skipped Mathematics class on two consecutive days without permission.', severity: 'Moderate', location: 'Classroom', sanction: 'Detention', sanctionDays: 3 },
  { category: 'Bullying', desc: 'Involved in bullying a Form 1 student during lunch break. Name-calling and intimidation.', severity: 'Major', location: 'Playground', sanction: 'Suspension', sanctionDays: 5 },
  { category: 'Fighting', desc: 'Physical altercation with another student over a dispute during games period.', severity: 'Major', location: 'Playground', sanction: 'Suspension', sanctionDays: 7 },
  { category: 'Dress Code', desc: 'Reported with improper school uniform — dyed hair and unauthorized jewelry.', severity: 'Minor', location: 'Gate', sanction: 'Verbal Warning', sanctionDays: 0 },
  { category: 'Insubordination', desc: 'Refused to follow teacher instructions during Chemistry practical and was disrespectful.', severity: 'Moderate', location: 'Classroom', sanction: 'Written Warning', sanctionDays: 0 },
  { category: 'Theft', desc: 'Alleged theft of a classmate\'s mobile phone from the dormitory.', severity: 'Critical', location: 'Dormitory', sanction: 'Suspension', sanctionDays: 14 },
  { category: 'Vandalism', desc: 'Defaced classroom desk with graffiti during break time.', severity: 'Moderate', location: 'Classroom', sanction: 'Community Service', sanctionDays: 4 },
  { category: 'Misconduct', desc: 'Use of abusive language towards a prefect on duty.', severity: 'Moderate', location: 'Hall', sanction: 'Detention', sanctionDays: 2 },
  { category: 'Truancy', desc: 'Left school compound without permission during prep time.', severity: 'Major', location: 'Gate', sanction: 'Parent Meeting', sanctionDays: 0 },
  { category: 'Substance Abuse', desc: 'Found in possession of cigarettes in the dormitory washroom.', severity: 'Critical', location: 'Dormitory', sanction: 'Suspension', sanctionDays: 21 },
  { category: 'Bullying', desc: 'Cyberbullying — sending threatening messages to a classmate via WhatsApp.', severity: 'Major', location: 'Other', sanction: 'Counselling', sanctionDays: 0 },
  { category: 'Fighting', desc: 'Verbal altercation that escalated to pushing in the dining hall queue.', severity: 'Minor', location: 'Hall', sanction: 'Verbal Warning', sanctionDays: 0 },
  { category: 'Misconduct', desc: 'Persistent latecoming to morning assembly — third offense this term.', severity: 'Minor', location: 'Hall', sanction: 'Detention', sanctionDays: 1 },
  { category: 'Vandalism', desc: 'Broke laboratory equipment willfully during Biology practical.', severity: 'Moderate', location: 'Classroom', sanction: 'Community Service', sanctionDays: 3 },
  { category: 'Insubordination', desc: 'Refused to submit assignment and walked out of class when challenged.', severity: 'Moderate', location: 'Classroom', sanction: 'Written Warning', sanctionDays: 0 },
  { category: 'Theft', desc: 'Stole library book — attempted to leave without borrowing procedure.', severity: 'Minor', location: 'Other', sanction: 'Verbal Warning', sanctionDays: 0 },
  { category: 'Dress Code', desc: 'Repeatedly wearing non-regulation shoes despite prior warnings.', severity: 'Minor', location: 'Gate', sanction: 'Written Warning', sanctionDays: 0 },
  { category: 'Misconduct', desc: 'Using phone during examinations — suspected cheating attempt.', severity: 'Critical', location: 'Classroom', sanction: 'Suspension', sanctionDays: 10 },
  { category: 'Bullying', desc: 'Excluding and mocking a new student during group work.', severity: 'Moderate', location: 'Classroom', sanction: 'Counselling', sanctionDays: 0 },
  { category: 'Fighting', desc: 'Punched another student during football match disagreement.', severity: 'Major', location: 'Playground', sanction: 'Suspension', sanctionDays: 5 },
]

const STAFF_NAMES = ['Mary Ochieng', 'Peter Kamau', 'Grace Wanjiru', 'Dennis Kiprop', 'Faith Achieng', 'James Atito', 'Esther Achieng', 'John Mwangi']
const LOCATIONS = ['Classroom', 'Playground', 'Dormitory', 'Hall', 'Gate', 'Other']
const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a

async function main() {
  console.log('⚖️ Seeding discipline incidents...')
  await db.incident.deleteMany()

  const students = await db.student.findMany({ take: 100 })
  let incidentNo = 8000
  let count = 0

  for (let i = 0; i < 35; i++) {
    const tmpl = rand(INCIDENTS)
    const student = rand(students)
    const daysAgo = randInt(1, 80)
    const incidentDate = new Date()
    incidentDate.setDate(incidentDate.getDate() - daysAgo)

    // Determine status based on age
    let status = 'Open'
    let resolvedDate: Date | null = null
    let resolvedBy: string | null = null
    let resolutionNotes: string | null = null
    let sanctionStart: Date | null = null
    let sanctionEnd: Date | null = null

    if (daysAgo > 7) {
      status = rand(['Resolved', 'Resolved', 'Closed'])
      resolvedDate = new Date(incidentDate.getTime() + randInt(2, 10) * 86400000)
      resolvedBy = rand(STAFF_NAMES)
      resolutionNotes = 'Sanction served. Student counseled and parent notified. Matter closed.'
      sanctionStart = new Date(incidentDate.getTime() + 86400000)
      sanctionEnd = new Date(sanctionStart.getTime() + tmpl.sanctionDays * 86400000)
    } else if (daysAgo > 2) {
      status = rand(['Investigating', 'Investigating', 'Open'])
    }

    const parentNotified = daysAgo > 3 && Math.random() > 0.3

    await db.incident.create({
      data: {
        incidentNo: `INC/${incidentNo++}`,
        studentId: student.id,
        date: incidentDate,
        location: tmpl.location,
        category: tmpl.category,
        severity: tmpl.severity,
        description: tmpl.desc,
        reportedBy: rand(STAFF_NAMES),
        witnesses: Math.random() > 0.5 ? `${rand(STAFF_NAMES)}, ${rand(STAFF_NAMES)}` : null,
        status,
        sanction: status !== 'Open' && status !== 'Investigating' ? tmpl.sanction : null,
        sanctionDetails: tmpl.sanction !== 'Verbal Warning' ? `${tmpl.sanction} for ${tmpl.sanctionDays} day(s)` : 'Verbal warning issued',
        sanctionStartDate: sanctionStart,
        sanctionEndDate: sanctionEnd,
        resolvedDate,
        resolvedBy,
        resolutionNotes,
        parentNotified,
        parentNotificationDate: parentNotified ? new Date(incidentDate.getTime() + 86400000) : null,
      },
    })
    count++
  }

  console.log(`✓ Created ${count} incidents`)
  const bySeverity = await db.incident.groupBy({ by: ['severity'], _count: true })
  const byCategory = await db.incident.groupBy({ by: ['category'], _count: true })
  const byStatus = await db.incident.groupBy({ by: ['status'], _count: true })
  console.log('  By severity:', bySeverity.map(s => `${s.severity}:${s._count}`).join(', '))
  console.log('  By category:', byCategory.map(c => `${c.category}:${c._count}`).join(', '))
  console.log('  By status:', byStatus.map(s => `${s.status}:${s._count}`).join(', '))
}

main().catch(console.error).finally(() => db.$disconnect())
