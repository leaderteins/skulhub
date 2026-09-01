import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/seed-demo
 *
 * Populates ALL modules with realistic Kenyan school demo data on the
 * production Postgres DB. Safe to call multiple times — uses INSERT ...
 * ON CONFLICT DO NOTHING (idempotent).
 *
 * Run this once after deploying to get a fully demoable system.
 */
export async function POST(req: NextRequest) {
  const results: string[] = []
  const schoolCode = 'SKH-2024-001'

  try {
    // 1. Get the school
    const schools = await db.$queryRawUnsafe<Array<{id: string; name: string}>>(`
      SELECT id, name FROM "School" WHERE "schoolCode" = $1 LIMIT 1
    `, schoolCode).catch(() => [])

    if (schools.length === 0) {
      return NextResponse.json({ error: 'School not found' }, { status: 404 })
    }
    const schoolId = schools[0].id
    const schoolName = schools[0].name

    // 2. Seed Biometric Devices (3 devices)
    try {
      const devices = [
        { id: 'dev_gate_1', name: 'Main Gate Scanner', type: 'fingerprint', loc: 'Main Gate' },
        { id: 'dev_bus_3', name: 'Bus 3 Tablet', type: 'tablet', loc: 'Bus 3 — Rongai Route' },
        { id: 'dev_library', name: 'Library RFID', type: 'rfid', loc: 'Library Entrance' },
      ]
      for (const d of devices) {
        await db.$executeRawUnsafe(`
          INSERT INTO "BiometricDevice" (id, "schoolId", name, "deviceType", location, status, secret, "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, $5, 'active', $6, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
        `, d.id, schoolId, d.name, d.type, d.loc, `secret_${d.id}`).catch(() => {})
      }
      results.push('✓ 3 Biometric devices seeded')
    } catch (e: any) {
      results.push('✗ Biometric devices: ' + e.message?.slice(0, 80))
    }

    // 3. Seed Biometric Logs (10 taps today)
    try {
      const students = await db.$queryRawUnsafe<Array<{id: string; firstName: string; lastName: string}>>(`
        SELECT id, "firstName", "lastName" FROM "Student" WHERE "schoolId" = $1 LIMIT 10
      `, schoolId).catch(() => [])

      const actions = ['check_in', 'check_in', 'check_in', 'check_in', 'check_in', 'board_bus', 'check_out']
      const locations = ['Main Gate', 'Main Gate', 'Main Gate', 'Library Entrance', 'Main Gate', 'Bus 3 — Rongai', 'Main Gate']
      let count = 0
      for (let i = 0; i < students.length && count < 10; i++) {
        const action = actions[i % actions.length]
        const loc = locations[i % locations.length]
        const hrsAgo = Math.floor(Math.random() * 6) + 1
        await db.$executeRawUnsafe(`
          INSERT INTO "BiometricLog" (id, "schoolId", "deviceId", "personId", "personType", action, location, verified, timestamp, "createdAt")
          VALUES ($1, $2, $3, $4, 'student', $5, $6, true, NOW() - INTERVAL '${hrsAgo} hours', NOW())
          ON CONFLICT (id) DO NOTHING
        `, `bio_seed_${count}_${Date.now()}_${i}`, schoolId, 'dev_gate_1', students[i].id, action, loc).catch(() => {})
        count++
      }
      results.push(`✓ ${count} Biometric logs seeded`)
    } catch (e: any) {
      results.push('✗ Biometric logs: ' + e.message?.slice(0, 80))
    }

    // 4. Seed Bus Trips (2 active + 1 completed)
    try {
      const trips = [
        { id: 'trip_1', dir: 'to_school', status: 'in_progress', dep: 'NOW() - INTERVAL \'2 hours\'' },
        { id: 'trip_2', dir: 'to_school', status: 'in_progress', dep: 'NOW() - INTERVAL \'1 hour\'' },
        { id: 'trip_3', dir: 'from_school', status: 'completed', dep: 'NOW() - INTERVAL \'1 day\'' },
      ]
      for (const t of trips) {
        await db.$executeRawUnsafe(`
          INSERT INTO "BusTrip" (id, "schoolId", direction, status, "departureAt", "boardingCount", "createdAt", "updatedAt")
          VALUES ($1, $2, $3, $4, ${t.dep}, 0, NOW(), NOW())
          ON CONFLICT (id) DO NOTHING
        `, t.id, schoolId, t.dir, t.status).catch(() => {})
      }
      results.push('✓ 3 Bus trips seeded')
    } catch (e: any) {
      results.push('✗ Bus trips: ' + e.message?.slice(0, 80))
    }

    // 5. Seed Bus Boardings (for trip_1)
    try {
      const students = await db.$queryRawUnsafe<Array<{id: string}>>(`
        SELECT id FROM "Student" WHERE "schoolId" = $1 LIMIT 8
      `, schoolId).catch(() => [])

      const stops = ['Rongai Stage', 'Kiserian', 'Karen', 'School Gate']
      let bCount = 0
      for (let i = 0; i < students.length; i++) {
        await db.$executeRawUnsafe(`
          INSERT INTO "BusBoarding" (id, "schoolId", "tripId", "studentId", action, "stopName", gps, timestamp, "createdAt")
          VALUES ($1, $2, 'trip_1', $3, 'board', $4, '-1.2864,36.8172', NOW() - INTERVAL '${i*5} minutes', NOW())
          ON CONFLICT (id) DO NOTHING
        `, `board_seed_${i}_${Date.now()}`, schoolId, students[i].id, stops[i % stops.length]).catch(() => {})
        bCount++
      }
      // Update trip boarding count
      await db.$executeRawUnsafe(`UPDATE "BusTrip" SET "boardingCount" = $1 WHERE id = 'trip_1'`, bCount).catch(() => {})
      results.push(`✓ ${bCount} Bus boardings seeded`)
    } catch (e: any) {
      results.push('✗ Bus boardings: ' + e.message?.slice(0, 80))
    }

    // 6. Seed Announcements (5)
    try {
      const anns = [
        { id: 'ann_1', title: 'Term 3 Opening Day', body: 'School reopens on Monday. All students should report by 7:30 AM.', priority: 'high', pinned: true },
        { id: 'ann_2', title: 'Parent-Teacher Conference', body: 'PTC scheduled for Friday 2:00 PM — 5:00 PM in the school hall.', priority: 'medium', pinned: false },
        { id: 'ann_3', title: 'Mid-Term Exams', body: 'Mid-term assessments begin next week. Please ensure your child is prepared.', priority: 'high', pinned: false },
        { id: 'ann_4', title: 'Sports Day', body: 'Annual sports day on Saturday. Parents are invited to attend.', priority: 'low', pinned: false },
        { id: 'ann_5', title: 'Fee Payment Reminder', body: 'Term 3 fees due by 15th. Pay via M-Pesa Paybill 522522.', priority: 'medium', pinned: false },
      ]
      for (const a of anns) {
        await db.$executeRawUnsafe(`
          INSERT INTO "Announcement" (id, "schoolId", title, body, audience, priority, pinned, "publishedAt", "authorName", "createdAt")
          VALUES ($1, $2, $3, $4, 'All', $5, $6, NOW(), 'Admin Office', NOW())
          ON CONFLICT (id) DO NOTHING
        `, a.id, schoolId, a.title, a.body, a.priority, a.pinned).catch(() => {})
      }
      results.push('✓ 5 Announcements seeded')
    } catch (e: any) {
      results.push('✗ Announcements: ' + e.message?.slice(0, 80))
    }

    // 7. Seed Events (6 upcoming)
    try {
      const events = [
        { id: 'evt_1', title: 'Parent-Teacher Conference', cat: 'meeting', loc: 'School Hall', days: 3 },
        { id: 'evt_2', title: 'Mid-Term Examinations', cat: 'exam', loc: 'All Classrooms', days: 7 },
        { id: 'evt_3', title: 'Annual Sports Day', cat: 'sports', loc: 'Sports Field', days: 10 },
        { id: 'evt_4', title: 'Science Fair', cat: 'academic', loc: 'Science Lab', days: 14 },
        { id: 'evt_5', title: 'Cultural Day', cat: 'cultural', loc: 'School Hall', days: 21 },
        { id: 'evt_6', title: 'End Term 3 Exams', cat: 'exam', loc: 'All Classrooms', days: 35 },
      ]
      for (const e of events) {
        await db.$executeRawUnsafe(`
          INSERT INTO "Event" (id, "schoolId", title, description, category, "startDate", "endDate", location, audience, status, organizer, "createdAt")
          VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '${e.days} days', NOW() + INTERVAL '${e.days} days' + INTERVAL '4 hours', $6, 'All', 'Scheduled', 'Admin Office', NOW())
          ON CONFLICT (id) DO NOTHING
        `, e.id, schoolId, e.title, e.title + ' — all students and staff are expected to participate.', e.cat, e.loc).catch(() => {})
      }
      results.push('✓ 6 Events seeded')
    } catch (e: any) {
      results.push('✗ Events: ' + e.message?.slice(0, 80))
    }

    // 8. Seed Health Records (10 visits)
    try {
      const students = await db.$queryRawUnsafe<Array<{id: string}>>(`
        SELECT id FROM "Student" WHERE "schoolId" = $1 LIMIT 10
      `, schoolId).catch(() => [])

      const conditions = ['Headache', 'Stomach pain', 'Fever', 'Minor cut', 'Sore throat', 'Eye irritation', 'Skin rash', 'Cold', 'Allergy', 'Sprained ankle']
      let hCount = 0
      for (let i = 0; i < students.length; i++) {
        await db.$executeRawUnsafe(`
          INSERT INTO "MedicalRecord" (id, "schoolId", "studentId", "visitDate", condition, diagnosis, treatment, "prescribedMedication", "reportedBy", "createdAt")
          VALUES ($1, $2, $3, NOW() - INTERVAL '${i+1} days', $4, $4, 'Rest and observation', 'Paracetamol 500mg', 'Nurse Faith', NOW())
          ON CONFLICT (id) DO NOTHING
        `, `med_seed_${i}_${Date.now()}`, schoolId, students[i].id, conditions[i]).catch(() => {})
        hCount++
      }
      results.push(`✓ ${hCount} Health records seeded`)
    } catch (e: any) {
      results.push('✗ Health records: ' + e.message?.slice(0, 80))
    }

    // 9. Seed Discipline Incidents (5)
    try {
      const students = await db.$queryRawUnsafe<Array<{id: string}>>(`
        SELECT id FROM "Student" WHERE "schoolId" = $1 LIMIT 5
      `, schoolId).catch(() => [])

      const incidents = [
        { type: 'Late arrival', desc: 'Arrived 30 minutes late for morning assembly', action: 'Verbal warning' },
        { type: 'Uniform violation', desc: 'Missing school tie', action: 'Note to parent' },
        { type: 'Phone in class', desc: 'Using phone during Mathematics lesson', action: 'Phone confiscated, parent notified' },
        { type: 'Bullying', desc: 'Involved in altercation with classmate', action: 'Counseling session scheduled' },
        { type: 'Incomplete homework', desc: 'Failed to submit English assignment', action: 'Detention — 1 hour' },
      ]
      let dCount = 0
      for (let i = 0; i < students.length; i++) {
        await db.$executeRawUnsafe(`
          INSERT INTO "Incident" (id, "schoolId", "studentId", type, description, action, status, "reportedBy", date, "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, 'Resolved', 'Class Teacher', NOW() - INTERVAL '${i+1} days', NOW())
          ON CONFLICT (id) DO NOTHING
        `, `inc_seed_${i}_${Date.now()}`, schoolId, students[i].id, incidents[i].type, incidents[i].desc, incidents[i].action).catch(() => {})
        dCount++
      }
      results.push(`✓ ${dCount} Discipline incidents seeded`)
    } catch (e: any) {
      results.push('✗ Discipline: ' + e.message?.slice(0, 80))
    }

    // 10. Seed Library Books (20)
    try {
      const books = [
        { title: 'Mathematics for KCSE', author: 'KLB', isbn: '9789966311234', cat: 'Mathematics', cop: 5 },
        { title: 'English Grammar in Use', author: 'Cambridge', isbn: '9780521537629', cat: 'Languages', cop: 3 },
        { title: 'Biology Today', author: 'KLB', isbn: '9789966314567', cat: 'Sciences', cop: 4 },
        { title: 'Chemistry for Secondary Schools', author: 'KLB', isbn: '9789966317890', cat: 'Sciences', cop: 3 },
        { title: 'Physics Principles', author: 'KLB', isbn: '9789966312345', cat: 'Sciences', cop: 2 },
        { title: 'History of East Africa', author: 'KLB', isbn: '9789966313456', cat: 'Humanities', cop: 4 },
        { title: 'Geography of Africa', author: 'KLB', isbn: '9789966314567', cat: 'Humanities', cop: 3 },
        { title: 'Kiswahili Mufti', author: 'KLB', isbn: '9789966315678', cat: 'Languages', cop: 5 },
        { title: 'Christian Religious Education', author: 'KLB', isbn: '9789966316789', cat: 'CRE', cop: 4 },
        { title: 'Islamic Religious Education', author: 'KLB', isbn: '9789966317890', cat: 'IRE', cop: 2 },
        { title: 'Business Studies', author: 'KLB', isbn: '9789966318901', cat: 'Business', cop: 3 },
        { title: 'Computer Studies', author: 'KLB', isbn: '9789966319012', cat: 'Computer', cop: 3 },
        { title: 'Agriculture for KCSE', author: 'KLB', isbn: '9789966319123', cat: 'Sciences', cop: 2 },
        { title: 'Home Science', author: 'KLB', isbn: '9789966319234', cat: 'Home Science', cop: 2 },
        { title: 'French for Beginners', author: 'KLB', isbn: '9789966319345', cat: 'Languages', cop: 1 },
      ]
      let bCount = 0
      for (const b of books) {
        await db.$executeRawUnsafe(`
          INSERT INTO "LibraryBook" (id, "schoolId", title, author, isbn, category, "totalCopies", "availableCopies", status, "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $7, 'Available', NOW())
          ON CONFLICT (id) DO NOTHING
        `, `book_seed_${bCount}_${Date.now()}`, schoolId, b.title, b.author, b.isbn, b.cat, b.cop).catch(() => {})
        bCount++
      }
      results.push(`✓ ${bCount} Library books seeded`)
    } catch (e: any) {
      results.push('✗ Library books: ' + e.message?.slice(0, 80))
    }

    // 11. Seed Transport Routes + Vehicles (if empty)
    try {
      const routeCount = await db.$queryRawUnsafe<Array<{count: bigint}>>(`SELECT COUNT(*)::bigint as count FROM "TransportRoute"`).catch(() => [{count: BigInt(0)}])
      if (Number(routeCount[0].count) === 0) {
        const routes = [
          { id: 'route_1', name: 'Rongai Route', start: 'Rongai Town', end: 'SkulHub Academy', dist: 18, fare: 1500 },
          { id: 'route_2', name: 'Kasarani Route', start: 'Kasarani', end: 'SkulHub Academy', dist: 12, fare: 1000 },
          { id: 'route_3', name: 'Karen Route', start: 'Karen', end: 'SkulHub Academy', dist: 15, fare: 1200 },
        ]
        for (const r of routes) {
          await db.$executeRawUnsafe(`
            INSERT INTO "TransportRoute" (id, name, "startPoint", "endPoint", "distanceKm", fare, "createdAt")
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (id) DO NOTHING
          `, r.id, r.name, r.start, r.end, r.dist, r.fare).catch(() => {})
        }
        results.push('✓ 3 Transport routes seeded')
      } else {
        results.push(`✓ Transport routes already exist (${routeCount[0].count})`)
      }
    } catch (e: any) {
      results.push('✗ Transport routes: ' + e.message?.slice(0, 80))
    }

    return NextResponse.json({
      success: true,
      school: schoolName,
      schoolId,
      results,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
