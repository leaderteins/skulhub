// Seed examinations & assessments data
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

const QUESTIONS = [
  // Mathematics
  { subj: 'Mathematics', q: 'Solve for x: 2x + 5 = 17', type: 'Short Answer', ans: 'x = 6', marks: 2, diff: 'Easy', topic: 'Linear Equations', bloom: 'Application' },
  { subj: 'Mathematics', q: 'What is the derivative of x²?', type: 'Short Answer', ans: '2x', marks: 2, diff: 'Medium', topic: 'Calculus', bloom: 'Knowledge' },
  { subj: 'Mathematics', q: 'Find the area of a circle with radius 7cm (π = 22/7)', type: 'Short Answer', ans: '154 cm²', marks: 3, diff: 'Medium', topic: 'Geometry', bloom: 'Application' },
  { subj: 'Mathematics', q: 'The sum of angles in a triangle is:', type: 'Multiple Choice', ans: '180°', marks: 1, diff: 'Easy', topic: 'Geometry', bloom: 'Knowledge', opts: ['90°', '180°', '270°', '360°'] },
  { subj: 'Mathematics', q: 'Solve: 3(x - 4) = 15', type: 'Short Answer', ans: 'x = 9', marks: 3, diff: 'Medium', topic: 'Linear Equations', bloom: 'Application' },
  { subj: 'Mathematics', q: 'What is the value of log₁₀(1000)?', type: 'Short Answer', ans: '3', marks: 2, diff: 'Medium', topic: 'Logarithms', bloom: 'Application' },
  // Biology
  { subj: 'Biology', q: 'Define photosynthesis.', type: 'Essay', ans: 'Process by which green plants make their own food using sunlight, CO₂ and water', marks: 5, diff: 'Medium', topic: 'Plant Nutrition', bloom: 'Comprehension' },
  { subj: 'Biology', q: 'The powerhouse of the cell is the:', type: 'Multiple Choice', ans: 'Mitochondria', marks: 1, diff: 'Easy', topic: 'Cell Biology', bloom: 'Knowledge', opts: ['Nucleus', 'Mitochondria', 'Ribosome', 'Vacuole'] },
  { subj: 'Biology', q: 'Name the four chambers of the human heart.', type: 'Short Answer', ans: 'Right atrium, Left atrium, Right ventricle, Left ventricle', marks: 4, diff: 'Medium', topic: 'Transport in Animals', bloom: 'Knowledge' },
  { subj: 'Biology', q: 'Diffusion is the movement of particles from a region of high concentration to low concentration.', type: 'True/False', ans: 'True', marks: 1, diff: 'Easy', topic: 'Cell Physiology', bloom: 'Knowledge' },
  // Chemistry
  { subj: 'Chemistry', q: 'State the periodic law.', type: 'Essay', ans: 'Properties of elements are periodic functions of their atomic numbers', marks: 4, diff: 'Medium', topic: 'Periodic Table', bloom: 'Knowledge' },
  { subj: 'Chemistry', q: 'The chemical formula for water is:', type: 'Multiple Choice', ans: 'H₂O', marks: 1, diff: 'Easy', topic: 'Chemical Bonding', bloom: 'Knowledge', opts: ['CO₂', 'H₂O', 'O₂', 'NaCl'] },
  { subj: 'Chemistry', q: 'Balance the equation: H₂ + O₂ → H₂O', type: 'Short Answer', ans: '2H₂ + O₂ → 2H₂O', marks: 3, diff: 'Hard', topic: 'Chemical Reactions', bloom: 'Application' },
  { subj: 'Chemistry', q: 'Define an acid according to Arrhenius theory.', type: 'Essay', ans: 'A substance that dissociates in water to produce hydrogen ions (H⁺)', marks: 3, diff: 'Medium', topic: 'Acids and Bases', bloom: 'Comprehension' },
  // English
  { subj: 'English', q: 'Identify the noun in: "The teacher gave a book to the student."', type: 'Multiple Choice', ans: 'teacher, book, student', marks: 2, diff: 'Easy', topic: 'Parts of Speech', bloom: 'Knowledge', opts: ['gave', 'teacher, book, student', 'the', 'to'] },
  { subj: 'English', q: 'Write a paragraph describing your school.', type: 'Essay', ans: 'Open-ended — assess structure, grammar, vocabulary', marks: 10, diff: 'Medium', topic: 'Composition', bloom: 'Synthesis' },
  { subj: 'English', q: "What is the past tense of 'go'?", type: 'Short Answer', ans: 'went', marks: 1, diff: 'Easy', topic: 'Tenses', bloom: 'Knowledge' },
  // Kiswahili
  { subj: 'Kiswahili', q: 'Taja aina za tungo tatu.', type: 'Essay', ans: 'Nathari, mashairi, nahau', marks: 3, diff: 'Medium', topic: 'Fasihi', bloom: 'Knowledge' },
  { subj: 'Kiswahili', q: 'Kinyume cha "ndogo" ni:', type: 'Multiple Choice', ans: 'kubwa', marks: 1, diff: 'Easy', topic: 'Msamiati', bloom: 'Knowledge', opts: ['kubwa', 'fupi', 'refu', 'pana'] },
  // Physics
  { subj: 'Physics', q: 'State Newton\'s second law of motion.', type: 'Essay', ans: 'Force equals mass times acceleration (F = ma)', marks: 3, diff: 'Medium', topic: 'Mechanics', bloom: 'Knowledge' },
  { subj: 'Physics', q: 'The SI unit of force is:', type: 'Multiple Choice', ans: 'Newton (N)', marks: 1, diff: 'Easy', topic: 'Units', bloom: 'Knowledge', opts: ['Joule', 'Newton (N)', 'Watt', 'Pascal'] },
  { subj: 'Physics', q: 'Calculate the speed of a car that travels 120 km in 2 hours.', type: 'Short Answer', ans: '60 km/h', marks: 2, diff: 'Easy', topic: 'Motion', bloom: 'Application' },
  // History
  { subj: 'History & Government', q: 'Who was the first President of Kenya?', type: 'Multiple Choice', ans: 'Jomo Kenyatta', marks: 1, diff: 'Easy', topic: 'Independence', bloom: 'Knowledge', opts: ['Jomo Kenyatta', 'Daniel Moi', 'Mwai Kibaki', 'Uhuru Kenyatta'] },
  { subj: 'History & Government', q: 'In which year did Kenya gain independence?', type: 'Short Answer', ans: '1963', marks: 1, diff: 'Easy', topic: 'Independence', bloom: 'Knowledge' },
]

const ASSESSMENTS = [
  { title: 'Mathematics CAT 1 — Algebra', subj: 'Mathematics', cls: 'Form 1', type: 'CAT', marks: 40, weight: 15, duration: 60 },
  { title: 'Biology CAT 1 — Cell Biology', subj: 'Biology', cls: 'Form 2', type: 'CAT', marks: 30, weight: 10, duration: 45 },
  { title: 'Chemistry Quiz — Atomic Structure', subj: 'Chemistry', cls: 'Form 3', type: 'Quiz', marks: 20, weight: 5, duration: 30 },
  { title: 'English Composition Assignment', subj: 'English', cls: 'Form 4', type: 'Assignment', marks: 50, weight: 20, duration: null },
  { title: 'Physics CAT 2 — Mechanics', subj: 'Physics', cls: 'Form 3', type: 'CAT', marks: 40, weight: 15, duration: 60 },
  { title: 'Kiswahili Project — Uandishi wa Insha', subj: 'Kiswahili', cls: 'Form 2', type: 'Project', marks: 50, weight: 20, duration: null },
  { title: 'History Mock Exam — Independence', subj: 'History & Government', cls: 'Form 4', type: 'Mock', marks: 100, weight: 30, duration: 120 },
  { title: 'Mathematics CAT 2 — Geometry', subj: 'Mathematics', cls: 'Form 2', type: 'CAT', marks: 40, weight: 15, duration: 60 },
  { title: 'Biology Practical — Microscopy', subj: 'Biology', cls: 'Form 4', type: 'Practical', marks: 30, weight: 15, duration: 90 },
  { title: 'Chemistry CAT 1 — Periodic Table', subj: 'Chemistry', cls: 'Form 1', type: 'CAT', marks: 30, weight: 10, duration: 45 },
]

const rand = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)]
const randInt = (a: number, b: number) => Math.floor(Math.random() * (b - a + 1)) + a

async function main() {
  console.log('📝 Seeding examinations & assessments...')
  await db.assessment.deleteMany()
  await db.questionBank.deleteMany()

  const subjects = await db.subject.findMany()
  const subjectMap = Object.fromEntries(subjects.map(s => [s.name, s]))
  const classLevels = await db.classLevel.findMany()
  const classMap = Object.fromEntries(classLevels.map(c => [c.name, c]))

  let qCount = 0
  for (const q of QUESTIONS) {
    const subj = subjectMap[q.subj]
    if (!subj) continue
    await db.questionBank.create({
      data: {
        subjectId: subj.id,
        question: q.q,
        questionType: q.type,
        options: q.opts ? JSON.stringify(q.opts) : null,
        correctAnswer: q.ans || null,
        marks: q.marks,
        difficulty: q.diff,
        topic: q.topic,
        bloomLevel: q.bloom,
        createdBy: rand(['Mary Ochieng', 'Peter Kamau', 'James Atito']),
        status: 'Active',
      },
    })
    qCount++
  }
  console.log(`  ✓ ${qCount} questions created`)

  let aCount = 0
  for (const a of ASSESSMENTS) {
    const subj = subjectMap[a.subj]
    const cls = classMap[a.cls]
    if (!subj || !cls) continue
    const daysAgo = randInt(1, 60)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)
    const endDate = new Date(startDate)
    endDate.setHours(endDate.getHours() + (a.duration || 60) / 60)

    let status = 'Published'
    if (daysAgo > 14) status = rand(['Completed', 'Graded'])
    else if (daysAgo > 7) status = rand(['Published', 'Completed'])

    await db.assessment.create({
      data: {
        title: a.title,
        subjectId: subj.id,
        classLevelId: cls.id,
        assessmentType: a.type,
        term: 'Term 1',
        academicYear: '2025',
        totalMarks: a.marks,
        weight: a.weight,
        duration: a.duration,
        startDate,
        endDate,
        status,
        rubric: `Grading: ${a.marks} marks total. Award marks for correct steps, final answer, and working shown.`,
        instructions: `Attempt all questions. Time: ${a.duration || 'N/A'} minutes. No calculators unless specified.`,
        createdBy: 'Academic Office',
      },
    })
    aCount++
  }
  console.log(`  ✓ ${aCount} assessments created`)
}

main().catch(console.error).finally(() => db.$disconnect())
