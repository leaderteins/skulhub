// Seed medical records & clinic visits for existing students.
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const COMPLAINTS = [
  { complaint: 'Headache and fever', diagnosis: 'Malaria (suspected)', treatment: 'Antimalarial (Coartem)', severity: 'Moderate' },
  { complaint: 'Stomach pain', diagnosis: 'Gastritis', treatment: 'Antacid, rest', severity: 'Mild' },
  { complaint: 'Cough and cold', diagnosis: 'Upper respiratory infection', treatment: 'Cough syrup, fluids', severity: 'Mild' },
  { complaint: 'Sprained ankle (sports)', diagnosis: 'Ankle sprain', treatment: 'Cold compress, bandage, rest', severity: 'Moderate' },
  { complaint: 'Eye irritation', diagnosis: 'Conjunctivitis', treatment: 'Eye drops, hygiene', severity: 'Mild' },
  { complaint: 'Skin rash', diagnosis: 'Allergic dermatitis', treatment: 'Antihistamine cream', severity: 'Mild' },
  { complaint: 'Sore throat', diagnosis: 'Pharyngitis', treatment: 'Throat lozenges, warm fluids', severity: 'Mild' },
  { complaint: 'Abdominal cramps', diagnosis: 'Dysmenorrhea', treatment: 'Painkillers (ibuprofen)', severity: 'Moderate' },
  { complaint: 'Cut on finger', diagnosis: 'Laceration', treatment: 'Cleaned and dressed wound', severity: 'Mild' },
  { complaint: 'High fever, weakness', diagnosis: 'Typhoid (suspected)', treatment: 'Referred to hospital for tests', severity: 'Severe', status: 'Referred', referredTo: 'Nairobi Hospital' },
]
const BLOOD_GROUPS = ['A+', 'B+', 'O+', 'AB+', 'A-', 'O-']
const CONDITIONS = [null, null, null, null, 'Asthma', 'Eczema', 'Short-sightedness']
const ALLERGIES = [null, null, null, 'Penicillin', 'Dust', 'Pollen', 'Peanuts']
const NURSES = ['Nurse Wanjiru', 'Nurse Achieng', 'Nurse Kiprop', 'Nurse Mutua']
const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a

async function main() {
  console.log('🏥 Seeding health records...')
  await db.clinicVisit.deleteMany()
  await db.medicalRecord.deleteMany()

  const students = await db.student.findMany({ take: 120 })
  let records = 0, visits = 0

  for (const st of students) {
    const mr = await db.medicalRecord.create({
      data: {
        studentId: st.id,
        bloodGroup: st.bloodGroup || rand(BLOOD_GROUPS),
        heightCm: randInt(150, 185),
        weightKg: randInt(42, 78),
        allergies: rand(ALLERGIES),
        conditions: rand(CONDITIONS),
        medications: rand(CONDITIONS) ? 'Inhaler' : null,
        immunization: 'Up to date',
        emergencyContact: 'Parent/Guardian',
        emergencyPhone: `+2547${randInt(10, 29)}${randInt(100000, 999999)}`,
        notes: Math.random() > 0.8 ? 'Monitor during physical activities' : null,
      }
    })
    records++

    // 0-3 clinic visits per student
    const visitCount = randInt(0, 3)
    for (let i = 0; i < visitCount; i++) {
      const c = rand(COMPLAINTS)
      const daysAgo = randInt(1, 90)
      const visitDate = new Date()
      visitDate.setDate(visitDate.getDate() - daysAgo)
      await db.clinicVisit.create({
        data: {
          studentId: st.id,
          medicalRecordId: mr.id,
          visitDate,
          complaint: c.complaint,
          diagnosis: c.diagnosis,
          treatment: c.treatment,
          prescription: c.treatment,
          temperature: 36 + Math.random() * 3,
          bloodPressure: `${randInt(100, 130)}/${randInt(60, 85)}`,
          severity: c.severity,
          attendedBy: rand(NURSES),
          referredTo: (c as any).referredTo || null,
          status: (c as any).status || 'Treated',
          followUpDate: c.severity === 'Severe' ? new Date(Date.now() + 7 * 86400000) : null,
        }
      })
      visits++
    }
  }

  console.log(`✓ Created ${records} medical records, ${visits} clinic visits`)
}

main().catch(console.error).finally(() => db.$disconnect())
