// Seed hostel/boarding data
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const DORMITORIES = [
  { name: 'Mboya House', gender: 'Boys', capacity: 48, floors: 2, location: 'Block A' },
  { name: 'Kenyatta House', gender: 'Boys', capacity: 48, floors: 2, location: 'Block A' },
  { name: 'Moi House', gender: 'Girls', capacity: 48, floors: 2, location: 'Block B' },
  { name: 'Nyeri House', gender: 'Girls', capacity: 40, floors: 2, location: 'Block B' },
  { name: 'Kenyatta II', gender: 'Boys', capacity: 32, floors: 1, location: 'Block C' },
]

const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a
const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]

async function main() {
  console.log('🏠 Seeding hostel & boarding data...')
  await db.dormInspection.deleteMany()
  await db.bedAllocation.deleteMany()
  await db.room.deleteMany()
  await db.dormitory.deleteMany()

  const staff = await db.staff.findMany()
  const wardens = staff.filter(s => s.role === 'Teacher' || s.role === 'HOD')
  const boardingStudents = await db.student.findMany({ where: { boarding: true, status: 'Active' } })

  let dormCount = 0, roomCount = 0, allocCount = 0, inspCount = 0
  const boys = boardingStudents.filter(s => s.gender === 'Male')
  const girls = boardingStudents.filter(s => s.gender === 'Female')

  for (const d of DORMITORIES) {
    const warden = rand(wardens)
    const dorm = await db.dormitory.create({
      data: {
        name: d.name,
        gender: d.gender,
        capacity: d.capacity,
        wardenId: warden?.id,
        location: d.location,
        floors: d.floors,
        status: 'Active',
      },
    })
    dormCount++

    // Create rooms — capacity/4 rooms (4 beds each)
    const numRooms = Math.floor(d.capacity / 4)
    for (let r = 0; r < numRooms; r++) {
      const floor = Math.floor(r / (numRooms / d.floors)) + 1
      const roomNumber = `${d.name.slice(0, 2).toUpperCase()}-${floor}${String((r % (numRooms / d.floors)) + 1).padStart(2, '0')}`
      const room = await db.room.create({
        data: {
          dormitoryId: dorm.id,
          roomNumber,
          floor,
          capacity: 4,
          occupied: 0,
          status: 'Available',
        },
      })
      roomCount++
    }

    // Allocate students to rooms
    const pool = d.gender === 'Boys' ? boys : d.gender === 'Girls' ? girls : boardingStudents
    const rooms = await db.room.findMany({ where: { dormitoryId: dorm.id }, orderBy: { roomNumber: 'asc' } })
    const bedLabels = ['Bed A', 'Bed B', 'Bed C', 'Bed D']
    let stuIdx = randInt(0, Math.max(0, pool.length - 1))

    for (const room of rooms) {
      const bedsInRoom = randInt(2, 4) // 2-4 occupied
      for (let b = 0; b < bedsInRoom; b++) {
        if (stuIdx >= pool.length) break
        const student = pool[stuIdx]
        stuIdx++
        await db.bedAllocation.create({
          data: {
            studentId: student.id,
            dormitoryId: dorm.id,
            roomId: room.id,
            bedNumber: bedLabels[b],
            status: 'Active',
            notes: Math.random() > 0.85 ? 'Prefect room' : null,
          },
        })
        allocCount++
      }
      // Update room occupied count
      const active = await db.bedAllocation.count({ where: { roomId: room.id, status: 'Active' } })
      await db.room.update({ where: { id: room.id }, data: { occupied: active, status: active >= 4 ? 'Full' : 'Available' } })
    }

    // Inspections — 3-5 per dorm
    const numInspections = randInt(3, 5)
    for (let i = 0; i < numInspections; i++) {
      const daysAgo = randInt(5, 60)
      const date = new Date()
      date.setDate(date.getDate() - daysAgo)
      const cleanliness = randInt(5, 10)
      const organization = randInt(4, 10)
      const discipline = randInt(5, 10)
      const overall = Math.round((cleanliness + organization + discipline) / 3)
      await db.dormInspection.create({
        data: {
          dormitoryId: dorm.id,
          date,
          inspectedBy: rand(['Boarding Master', 'Principal', 'Deputy Principal', warden?.firstName + ' ' + warden?.lastName]),
          cleanliness,
          organization,
          discipline,
          overallScore: overall,
          findings: rand([
            'Rooms generally clean. Some students need to organize their lockers better.',
            'Excellent hygiene standards maintained. Discipline commendable.',
            'Few cases of untidiness noted. Warning issued to affected students.',
            'Good organization. Suggest replacing worn-out mattresses.',
            'Minor maintenance needed on bathroom facilities.',
          ]),
          actionTaken: rand([
            'Verbal warning to students with untidy rooms.',
            'Commended the dorm for excellent performance.',
            'Maintenance request submitted for repairs.',
            'Follow-up inspection scheduled next week.',
            'No action needed — standards met.',
          ]),
          status: 'Completed',
        }
      })
      inspCount++
    }
  }

  console.log(`✓ Created ${dormCount} dormitories, ${roomCount} rooms, ${allocCount} allocations, ${inspCount} inspections`)
}

main().catch(console.error).finally(() => db.$disconnect())
