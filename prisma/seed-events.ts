// Seed events & activities
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const EVENTS = [
  { title: 'Term 1 Opening Assembly', category: 'Academic', audience: 'All', location: 'Main Hall', organizer: 'Principal Office', priority: 'High', color: 'emerald', offsetDays: -5, duration: 2, allDay: false, startHour: 8, desc: 'Welcome assembly for Term 1, 2025. All students and staff required to attend.' },
  { title: 'Parent-Teacher Conference', category: 'Meeting', audience: 'Parents', location: 'School Hall', organizer: 'Deputy Principal', priority: 'High', color: 'violet', offsetDays: 12, duration: 4, allDay: false, startHour: 9, desc: 'Term 1 PTC meeting. Parents to collect report cards and discuss student progress.' },
  { title: 'Inter-House Athletics', category: 'Sports', audience: 'All', location: 'School Grounds', organizer: 'Games Department', priority: 'Normal', color: 'amber', offsetDays: 8, duration: 8, allDay: true, startHour: 8, desc: 'Annual inter-house athletics competition. Track and field events.' },
  { title: 'Kenya Science & Engineering Fair', category: 'Academic', audience: 'Students', location: 'Regional Grounds', organizer: 'Science HOD', priority: 'Normal', color: 'cyan', offsetDays: 20, duration: 8, allDay: true, startHour: 7, desc: 'Regional KSEF competitions. 12 students representing the school.' },
  { title: 'Drama Club Presentation', category: 'Cultural', audience: 'All', location: 'Auditorium', organizer: 'Drama Club', priority: 'Normal', color: 'rose', offsetDays: 15, duration: 3, allDay: false, startHour: 14, desc: 'Drama club presents "Betrayal in the City" set book adaptation.' },
  { title: 'Form 4 Geography Field Trip', category: 'Trip', audience: 'Students', location: 'Menengai Crater', organizer: 'Geography Department', priority: 'High', color: 'teal', offsetDays: 18, duration: 8, allDay: true, startHour: 6, desc: 'Geography field study trip to Menengai Crater. Permission slips required.' },
  { title: 'Staff Development Workshop', category: 'Meeting', audience: 'Staff', location: 'Staff Room', organizer: 'Principal Office', priority: 'Normal', color: 'violet', offsetDays: 5, duration: 6, allDay: false, startHour: 9, desc: 'CBE pedagogy workshop for all teaching staff.' },
  { title: 'End Term 1 Examinations', category: 'Exam', audience: 'Students', location: 'Exam Halls', organizer: 'Academic Office', priority: 'High', color: 'rose', offsetDays: 45, duration: 10, allDay: false, startHour: 8, desc: 'Term 1 end examinations begin. All forms. Exam timetable published.' },
  { title: 'Music Festival Auditions', category: 'Cultural', audience: 'Students', location: 'Music Room', organizer: 'Music Department', priority: 'Low', color: 'rose', offsetDays: 3, duration: 3, allDay: false, startHour: 15, desc: 'Auditions for the Kenya Music Festival. Solo and group categories.' },
  { title: 'Community Service Day', category: 'General', audience: 'Students', location: 'Local Community', organizer: 'Prefects Council', priority: 'Normal', color: 'emerald', offsetDays: 25, duration: 6, allDay: false, startHour: 9, desc: 'Form 3 & 4 students community service at the local children\'s home.' },
  { title: 'Boarding Section Inspection', category: 'General', audience: 'Staff', location: 'Dormitories', organizer: 'Boarding Master', priority: 'Normal', color: 'emerald', offsetDays: 2, duration: 2, allDay: false, startHour: 16, desc: 'Routine dormitory inspection and cleanliness check.' },
  { title: 'Maths Contest', category: 'Academic', audience: 'Students', location: 'Hall A', organizer: 'Maths Department', priority: 'Normal', color: 'cyan', offsetDays: 30, duration: 3, allAllDay: false, allDay: false, startHour: 14, desc: 'Inter-stream mathematics contest. Top 3 students win prizes.' },
  { title: 'Mid-Term Break', category: 'Holiday', audience: 'All', location: 'N/A', organizer: 'Administration', priority: 'High', color: 'amber', offsetDays: 22, duration: 5, allDay: true, startHour: 0, desc: 'Mid-term break. School resumes on Monday.' },
  { title: 'Careers Day', category: 'Academic', audience: 'Students', location: 'Main Hall', organizer: 'Guidance Counsellor', priority: 'Normal', color: 'cyan', offsetDays: 35, duration: 5, allDay: false, startHour: 9, desc: 'Career guidance day with guest speakers from various professions.' },
  { title: 'Swimming Gala', category: 'Sports', audience: 'All', location: 'School Pool', organizer: 'Games Department', priority: 'Normal', color: 'amber', offsetDays: 40, duration: 4, allDay: false, startHour: 10, desc: 'Inter-house swimming competition. Various stroke categories.' },
  { title: 'Debate Competition', category: 'Cultural', audience: 'Students', location: 'Debate Hall', organizer: 'Languages Department', priority: 'Low', color: 'rose', offsetDays: 28, duration: 3, allDay: false, startHour: 15, desc: 'Inter-stream debate competition. Motion: "Education is the great equalizer."' },
  { title: 'Health Awareness Week', category: 'General', audience: 'All', location: 'School Grounds', organizer: 'School Nurse', priority: 'Normal', color: 'emerald', offsetDays: 33, duration: 5, allDay: true, startHour: 8, desc: 'Health awareness week: hygiene, nutrition, mental health, and fitness.' },
  { title: 'Prize Giving Day', category: 'Academic', audience: 'All', location: 'Main Grounds', organizer: 'Principal Office', priority: 'High', color: 'violet', offsetDays: 55, duration: 5, allDay: false, startHour: 10, desc: 'Annual prize giving ceremony. Awards for academic, sports, and leadership excellence.' },
]

const PARTICIPANT_NAMES = ['James Atito', 'Mary Ochieng', 'Peter Kamau', 'Grace Wanjiru', 'Dennis Kiprop', 'Faith Achieng', 'Brian Mwangi', 'Cynthia Njeri', 'Victor Otieno', 'Ruth Chebet']
const PARTICIPANT_ROLES = ['Organizer', 'Attendee', 'Attendee', 'Volunteer', 'Facilitator']
const PARTICIPANT_STATUSES = ['Invited', 'Confirmed', 'Confirmed', 'Declined', 'Attended']

const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a

async function main() {
  console.log('📅 Seeding events & activities...')
  await db.eventParticipant.deleteMany()
  await db.event.deleteMany()

  let eventCount = 0
  let participantCount = 0

  for (const e of EVENTS) {
    const startDate = new Date()
    startDate.setDate(startDate.getDate() + (e as any).offsetDays || e.offsetDays)
    startDate.setHours(e.startHour, 0, 0, 0)
    const endDate = new Date(startDate)
    endDate.setHours(endDate.getHours() + (e as any).duration || e.duration)

    // Determine status based on offset
    const offset = (e as any).offsetDays || e.offsetDays
    const status = offset < 0 ? 'Completed' : offset === 0 ? 'Ongoing' : 'Scheduled'

    const event = await db.event.create({
      data: {
        title: e.title,
        description: e.desc,
        category: e.category,
        startDate,
        endDate,
        allDay: e.allDay,
        location: e.location,
        organizer: e.organizer,
        audience: e.audience,
        status,
        priority: e.priority,
        color: e.color,
      },
    })
    eventCount++

    // Add 3-8 participants per event
    const numParticipants = randInt(3, 8)
    for (let i = 0; i < numParticipants; i++) {
      await db.eventParticipant.create({
        data: {
          eventId: event.id,
          name: rand(PARTICIPANT_NAMES),
          role: rand(PARTICIPANT_ROLES),
          status: rand(PARTICIPANT_STATUSES),
        }
      })
      participantCount++
    }
  }

  console.log(`✓ Created ${eventCount} events, ${participantCount} participants`)
  const byCategory = await db.event.groupBy({ by: ['category'], _count: true })
  byCategory.forEach(c => console.log(`  ${c.category}: ${c._count}`))
}

main().catch(console.error).finally(() => db.$disconnect())
