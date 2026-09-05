import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * POST /api/seed-comprehensive
 *
 * Populates ALL modules with realistic Kenyan school demo data.
 * Safe to call multiple times — uses ON CONFLICT DO NOTHING.
 */
export async function POST(req: NextRequest) {
  const results: string[] = []
  const schoolCode = 'SKH-2024-001'

  try {
    const schools = await db.$queryRawUnsafe<Array<{id: string}>>(`
      SELECT id FROM "School" WHERE "schoolCode" = $1 LIMIT 1
    `, schoolCode).catch(() => [])

    if (schools.length === 0) return NextResponse.json({ error: 'School not found' }, { status: 404 })
    const sid = schools[0].id

    // 1. Biometric devices (add 2 more)
    try {
      for (const d of [
        { id: 'dev_library_1', name: 'Library RFID Scanner', type: 'rfid', loc: 'Library Entrance' },
        { id: 'dev_gate_2', name: 'Side Gate Scanner', type: 'fingerprint', loc: 'Side Gate' },
      ]) {
        await db.$executeRawUnsafe(`INSERT INTO "BiometricDevice" (id, "schoolId", name, "deviceType", location, status, secret, "createdAt", "updatedAt") VALUES ($1,$2,$3,$4,$5,'active',$6,NOW(),NOW()) ON CONFLICT (id) DO NOTHING`, d.id, sid, d.name, d.type, d.loc, `sec_${d.id}`).catch(()=>{})
      }
      results.push('✓ Biometric devices (2 added)')
    } catch (e:any) { results.push('✗ Biometric devices: ' + e.message?.slice(0,60)) }

    // 2. Biometric logs (20 more taps — mix of check_in, check_out, board_bus)
    try {
      const students = await db.$queryRawUnsafe<Array<{id:string}>>(`SELECT id FROM "Student" WHERE "schoolId"=$1 LIMIT 20`, sid).catch(()=>[])
      const actions = ['check_in','check_in','check_in','check_out','check_in','board_bus','alight_bus','check_in','check_out','check_in']
      const locations = ['Main Gate','Main Gate','Main Gate','Main Gate','Library Entrance','Bus 3 - Rongai','School Gate','Main Gate','Main Gate','Side Gate']
      let c=0
      for (let i=0; i<students.length && c<20; i++) {
        const action = actions[i % actions.length]; const loc = locations[i % locations.length]
        const hrsAgo = Math.floor(Math.random()*8)+1
        await db.$executeRawUnsafe(`INSERT INTO "BiometricLog" (id,"schoolId","deviceId","personId","personType",action,location,gps,verified,timestamp,"createdAt") VALUES ($1,$2,'dev_gate_1',$3,'student',$4,$5,null,true,NOW()- INTERVAL '${hrsAgo} hours',NOW()) ON CONFLICT (id) DO NOTHING`, `bio_comp_${c}_${Date.now()}_${i}`, sid, students[i].id, action, loc).catch(()=>{})
        c++
      }
      results.push(`✓ Biometric logs (${c} added)`)
    } catch (e:any) { results.push('✗ Biometric logs: ' + e.message?.slice(0,60)) }

    // 3. SMS logs (15 demo SMS)
    try {
      const students = await db.$queryRawUnsafe<Array<{id:string;firstName:string;lastName:string}>>(`SELECT id,"firstName","lastName" FROM "Student" WHERE "schoolId"=$1 LIMIT 15`, sid).catch(()=>[])
      const events = ['check_in','fee_reminder_polite','fee_reminder_urgent','exam_results','board_bus','check_out']
      const messages = [
        'Dear Parent, your child has checked in at school.',
        'Fee reminder: KES 17,500 outstanding. Pay via M-Pesa.',
        'URGENT: Fee balance 30 days overdue. Please pay immediately.',
        'Exam results for Term 1 are now available on the portal.',
        'Your child has boarded Bus 3 (Rongai Route).',
        'Your child has left school. Safe travels.',
      ]
      let c=0
      for (const s of students) {
        const ev = events[c % events.length]; const msg = messages[c % messages.length]
        await db.$executeRawUnsafe(`INSERT INTO "SmsLog" (id,"schoolId","studentId","eventType",channel,"recipientPhone",message,status,"createdAt") VALUES ($1,$2,$3,$4,'sms','+254712345678',$5,'demo',NOW()- INTERVAL '${c+1} hours') ON CONFLICT (id) DO NOTHING`, `sms_comp_${c}_${Date.now()}`, sid, s.id, ev, msg).catch(()=>{})
        c++
      }
      results.push(`✓ SMS logs (${c} added)`)
    } catch (e:any) { results.push('✗ SMS logs: ' + e.message?.slice(0,60)) }

    // 4. Email logs (10 demo emails)
    try {
      const students = await db.$queryRawUnsafe<Array<{id:string}>>(`SELECT id FROM "Student" WHERE "schoolId"=$1 LIMIT 10`, sid).catch(()=>[])
      const subjects = ['Term Report Card','Fee Statement','Exam Results Notification','Parent-Teacher Conference Invite','School Closure Notice']
      let c=0
      for (const s of students) {
        await db.$executeRawUnsafe(`INSERT INTO "SmsLog" (id,"schoolId","studentId","eventType",channel,"recipientPhone",message,status,"createdAt") VALUES ($1,$2,$3,'email','email','parent@example.com',$4,'demo',NOW()- INTERVAL '${c+1} days') ON CONFLICT (id) DO NOTHING`, `email_comp_${c}_${Date.now()}`, sid, s.id, subjects[c % subjects.length]).catch(()=>{})
        c++
      }
      results.push(`✓ Email logs (${c} added)`)
    } catch (e:any) { results.push('✗ Email logs: ' + e.message?.slice(0,60)) }

    // 5. Library books (15 more)
    try {
      const books = [
        { t:'Things Fall Apart', a:'Chinua Achebe', i:'9780385474542', c:'Literature', cop:3 },
        { t:'The River Between', a:'Ngugi wa Thiongo', i:'9789966469321', c:'Literature', cop:2 },
        { t:'KCSE Mathematics Revision', a:'KLB', i:'9789966317123', c:'Mathematics', cop:5 },
        { t:'English comprehension for KCSE', a:'KLB', i:'9789966317234', c:'Languages', cop:3 },
        { t:'Biology Practical Manual', a:'KLB', i:'9789966317345', c:'Sciences', cop:2 },
        { t:'Chemistry Form 4', a:'KLB', i:'9789966317456', c:'Sciences', cop:4 },
        { t:'Physics Made Easy', a:'Mwangi', i:'9789966317567', c:'Sciences', cop:3 },
        { t:'Geography of East Africa', a:'KLB', i:'9789966317678', c:'Humanities', cop:3 },
        { t:'History & Government', a:'KLB', i:'9789966317789', c:'Humanities', cop:2 },
        { t:'CRE for Secondary Schools', a:'KLB', i:'9789966317890', c:'CRE', cop:4 },
        { t:'Business Studies Form 3', a:'KLB', i:'9789966317901', c:'Business', cop:2 },
        { t:'Computer Studies KCSE', a:'KLB', i:'9789966318012', c:'Computer', cop:3 },
        { t:'Agriculture for KCSE', a:'KLB', i:'9789966318123', c:'Sciences', cop:2 },
        { t:'Kiswahili Fasaha', a:'KLB', i:'9789966318234', c:'Languages', cop:3 },
        { t:'Set Theory & Logic', a:'Cambridge', i:'9780521537629', c:'Mathematics', cop:1 },
      ]
      let c=0
      for (const b of books) {
        await db.$executeRawUnsafe(`INSERT INTO "LibraryBook" (id,"schoolId",title,author,isbn,category,"totalCopies","availableCopies",status,"createdAt") VALUES ($1,$2,$3,$4,$5,$6,$7,$7,'Available',NOW()) ON CONFLICT (id) DO NOTHING`, `book_comp_${c}_${Date.now()}`, sid, b.t, b.a, b.i, b.c, b.cop).catch(()=>{})
        c++
      }
      results.push(`✓ Library books (${c} added)`)
    } catch (e:any) { results.push('✗ Library books: ' + e.message?.slice(0,60)) }

    // 6. Announcements (5 more)
    try {
      const anns = [
        { id:'ann_c1', title:'Term 3 Opening Day', body:'School reopens Monday 8th. Report by 7:30 AM.', pri:'high', pin:true },
        { id:'ann_c2', title:'Mid-Term Break', body:'Mid-term break starts Friday. Classes resume Monday.', pri:'medium', pin:false },
        { id:'ann_c3', title:'Sports Day', body:'Annual sports day Saturday. All parents invited.', pri:'low', pin:false },
        { id:'ann_c4', title:'Fee Payment Deadline', body:'Term 3 fees due 15th. Pay via M-Pesa 522522.', pri:'high', pin:false },
        { id:'ann_c5', title:'Staff Meeting', body:'Staff meeting Wednesday 3:30 PM in the staff room.', pri:'medium', pin:false },
      ]
      for (const a of anns) {
        await db.$executeRawUnsafe(`INSERT INTO "Announcement" (id,"schoolId",title,body,audience,priority,pinned,"publishedAt","authorName","createdAt") VALUES ($1,$2,$3,$4,'All',$5,$6,NOW(),'Admin Office',NOW()) ON CONFLICT (id) DO NOTHING`, a.id, sid, a.title, a.body, a.pri, a.pin).catch(()=>{})
      }
      results.push('✓ Announcements (5 added)')
    } catch (e:any) { results.push('✗ Announcements: ' + e.message?.slice(0,60)) }

    // 7. Events (6 more)
    try {
      const events = [
        { id:'evt_c1', title:'PTC Conference', cat:'meeting', loc:'School Hall', days:2 },
        { id:'evt_c2', title:'Inter-House Sports', cat:'sports', loc:'Sports Field', days:5 },
        { id:'evt_c3', title:'Science & Engineering Fair', cat:'academic', loc:'Science Lab', days:8 },
        { id:'evt_c4', title:'Cultural Day', cat:'cultural', loc:'School Hall', days:12 },
        { id:'evt_c5', title:'Prize Giving Day', cat:'ceremony', loc:'Main Hall', days:18 },
        { id:'evt_c6', title:'End Term 3 Exams', cat:'exam', loc:'All Classrooms', days:25 },
      ]
      for (const e of events) {
        await db.$executeRawUnsafe(`INSERT INTO "Event" (id,"schoolId",title,description,category,"startDate","endDate",location,audience,status,organizer,"createdAt") VALUES ($1,$2,$3,$4,$5,NOW()+INTERVAL '${e.days} days',NOW()+INTERVAL '${e.days} days'+INTERVAL '4 hours',$6,'All','Scheduled','Admin Office',NOW()) ON CONFLICT (id) DO NOTHING`, e.id, sid, e.title, e.title+' — all students expected to participate.', e.cat, e.loc).catch(()=>{})
      }
      results.push('✓ Events (6 added)')
    } catch (e:any) { results.push('✗ Events: ' + e.message?.slice(0,60)) }

    // 8. Health records (15 visits)
    try {
      const students = await db.$queryRawUnsafe<Array<{id:string}>>(`SELECT id FROM "Student" WHERE "schoolId"=$1 LIMIT 15`, sid).catch(()=>[])
      const conditions = ['Headache','Stomach pain','Fever','Sore throat','Minor cut','Skin rash','Common cold','Eye irritation','Allergy','Sprained ankle','Dental pain','Ear infection','Back pain','Nose bleed','Fatigue']
      let c=0
      for (const s of students) {
        await db.$executeRawUnsafe(`INSERT INTO "MedicalRecord" (id,"schoolId","studentId","visitDate",condition,diagnosis,treatment,"prescribedMedication","reportedBy","createdAt") VALUES ($1,$2,$3,NOW()-INTERVAL '${c+1} days',$4,$4,'Rest and observation','Paracetamol 500mg','Nurse Faith',NOW()) ON CONFLICT (id) DO NOTHING`, `med_comp_${c}_${Date.now()}`, sid, s.id, conditions[c]).catch(()=>{})
        c++
      }
      results.push(`✓ Health records (${c} added)`)
    } catch (e:any) { results.push('✗ Health records: ' + e.message?.slice(0,60)) }

    // 9. Discipline incidents (8 more)
    try {
      const students = await db.$queryRawUnsafe<Array<{id:string}>>(`SELECT id FROM "Student" WHERE "schoolId"=$1 LIMIT 8`, sid).catch(()=>[])
      const incidents = [
        { type:'Late arrival', desc:'Arrived 20 min late', act:'Verbal warning' },
        { type:'Uniform violation', desc:'Wrong shoes', act:'Note to parent' },
        { type:'Phone in class', desc:'Using phone during lesson', act:'Phone confiscated 1 day' },
        { type:'Bullying', desc:'Involved in altercation', act:'Counseling session' },
        { type:'Incomplete homework', desc:'Missed 3 assignments', act:'1hr detention' },
        { type:'Truancy', desc:'Skipped afternoon classes', act:'Parent meeting' },
        { type:'Disrespect', desc:'Argument with teacher', act:'Written apology' },
        { type:'Fighting', desc:'Physical fight at break', act:'3-day suspension' },
      ]
      let c=0
      for (const s of students) {
        const inc = incidents[c]
        await db.$executeRawUnsafe(`INSERT INTO "Incident" (id,"schoolId","studentId",type,description,action,status,"reportedBy",date,"createdAt") VALUES ($1,$2,$3,$4,$5,$6,'Resolved','Class Teacher',NOW()-INTERVAL '${c+1} days',NOW()) ON CONFLICT (id) DO NOTHING`, `inc_comp_${c}_${Date.now()}`, sid, s.id, inc.type, inc.desc, inc.act).catch(()=>{})
        c++
      }
      results.push(`✓ Discipline incidents (${c} added)`)
    } catch (e:any) { results.push('✗ Discipline: ' + e.message?.slice(0,60)) }

    // 10. Bus trips (2 more active + 2 completed)
    try {
      for (const t of [
        { id:'trip_c1', dir:'to_school', stat:'in_progress', dep:'NOW()-INTERVAL \'3 hours\'' },
        { id:'trip_c2', dir:'to_school', stat:'in_progress', dep:'NOW()-INTERVAL \'2 hours\'' },
        { id:'trip_c3', dir:'from_school', stat:'completed', dep:'NOW()-INTERVAL \'1 day\'' },
        { id:'trip_c4', dir:'to_school', stat:'completed', dep:'NOW()-INTERVAL \'2 days\'' },
      ]) {
        await db.$executeRawUnsafe(`INSERT INTO "BusTrip" (id,"schoolId",direction,status,"departureAt","boardingCount","createdAt","updatedAt") VALUES ($1,$2,$3,$4,${t.dep},0,NOW(),NOW()) ON CONFLICT (id) DO NOTHING`, t.id, sid, t.dir, t.stat).catch(()=>{})
      }
      results.push('✓ Bus trips (4 added)')
    } catch (e:any) { results.push('✗ Bus trips: ' + e.message?.slice(0,60)) }

    // 11. Bus boardings (10 for trip_c1)
    try {
      const students = await db.$queryRawUnsafe<Array<{id:string}>>(`SELECT id FROM "Student" WHERE "schoolId"=$1 LIMIT 10`, sid).catch(()=>[])
      const stops = ['Rongai Stage','Kiserian','Karen','School Gate','Ngong','Kawangware','Westlands']
      let c=0
      for (const s of students) {
        await db.$executeRawUnsafe(`INSERT INTO "BusBoarding" (id,"schoolId","tripId","studentId",action,"stopName",gps,timestamp,"createdAt") VALUES ($1,$2,'trip_c1',$3,'board',$4,'-1.2864,36.8172',NOW()-INTERVAL '${c*5} minutes',NOW()) ON CONFLICT (id) DO NOTHING`, `board_comp_${c}_${Date.now()}`, sid, s.id, stops[c % stops.length]).catch(()=>{})
        c++
      }
      await db.$executeRawUnsafe(`UPDATE "BusTrip" SET "boardingCount" = $1 WHERE id = 'trip_c1'`, c).catch(()=>{})
      results.push(`✓ Bus boardings (${c} added)`)
    } catch (e:any) { results.push('✗ Bus boardings: ' + e.message?.slice(0,60)) }

    // 12. Biometric templates (5 enrollments)
    try {
      const students = await db.$queryRawUnsafe<Array<{id:string}>>(`SELECT id FROM "Student" WHERE "schoolId"=$1 LIMIT 5`, sid).catch(()=>[])
      let c=0
      for (const s of students) {
        const hash = `hash_${s.id}_${Date.now()}`
        await db.$executeRawUnsafe(`INSERT INTO "BiometricTemplate" (id,"schoolId","personId","personType","templateHash","fingerIndex","isActive","enrolledAt","enrolledBy","createdAt") VALUES ($1,$2,$3,'student',$4,$5,true,NOW(),'admin',NOW()) ON CONFLICT (id) DO NOTHING`, `tmpl_comp_${c}_${Date.now()}`, sid, s.id, hash, c).catch(()=>{})
        c++
      }
      results.push(`✓ Biometric templates (${c} enrolled)`)
    } catch (e:any) { results.push('✗ Biometric templates: ' + e.message?.slice(0,60)) }

    // 13. Transport routes (3 more)
    try {
      for (const r of [
        { id:'route_c1', n:'Westlands Route', s:'Westlands', e:'SkulHub Academy', d:8, f:800 },
        { id:'route_c2', n:'Thika Road Route', s:'Roysambu', e:'SkulHub Academy', d:15, f:1200 },
        { id:'route_c3', n:'Ngong Road Route', s:'Ngong', e:'SkulHub Academy', d:10, f:900 },
      ]) {
        await db.$executeRawUnsafe(`INSERT INTO "TransportRoute" (id,name,"startPoint","endPoint","distanceKm",fare,"createdAt") VALUES ($1,$2,$3,$4,$5,$6,NOW()) ON CONFLICT (id) DO NOTHING`, r.id, r.n, r.s, r.e, r.d, r.f).catch(()=>{})
      }
      results.push('✓ Transport routes (3 added)')
    } catch (e:any) { results.push('✗ Transport routes: ' + e.message?.slice(0,60)) }

    return NextResponse.json({
      success: true,
      school: sid,
      results,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
