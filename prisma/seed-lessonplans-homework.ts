// Seed Lesson Plans & Homework for EduManage Pro
import { PrismaClient } from '@prisma/client'
const db = new PrismaClient()

// Subject IDs (from existing DB)
const SUBJ = {
  MATH: 'cms2m11m00008szdzkgnpz8f5',
  ENG:  'cms2m11m0000aszdz3qqqg7nb',
  BIO:  'cms2m11m1000cszdzakklhzpi',
  KIS:  'cms2m11m1000gszdz1acdmuvh',
  CHE:  'cms2m11m1000eszdzp9acq2gz',
  PHY:  'cms2m11m3000kszdzwpdlrc2k',
  CST:  'cms2m11m3000mszdzju0bo36q',
  HIS:  'cms2m11m3000oszdzto8c6tzx',
  BST:  'cms2m11m2000iszdzo38ice19',
  AGR:  'cms2m11m4000sszdzfrakrvsj',
  CRE:  'cms2m11m4000wszdzghk8c5uf',
  GEO:  'cms2m11m3000qszdzh9a1cwdk',
}

// Class IDs
const CLS = {
  F1: 'cms2m11nk003lszdzjb63tomc', // Form 1
  F2: 'cms2m11nk003kszdzyuqqcdqh', // Form 2
  F3: 'cms2m11nj003iszdzufcr7ccw', // Form 3
  F4: 'cms2m11nk003jszdzznkmn1wx', // Form 4
}

const TEACHERS = ['Grace Achieng', 'Dennis Kiprop', 'Mary Wanjiru', 'Peter Kamau', 'Samuel Otieno', 'Esther Njeri']

const LESSON_PLANS = [
  { subjectId: SUBJ.MATH, classLevelId: CLS.F1, week: 5, term: 'Term 1', topic: 'Algebra: Linear Equations & Word Problems',
    objectives: 'By the end of the lesson, the learner should be able to:\n1. Form linear equations from real-life situations\n2. Solve linear equations involving brackets and fractions\n3. Apply linear equations to solve word problems',
    activities: '• Recap previous lesson on simplifying expressions\n• Group discussion: forming equations from word problems\n• Guided practice on whiteboard (5 worked examples)\n• Pair work: KICD textbook Exercise 5.2 Q1-15\n• Class plenary: learners present solutions on board',
    resources: 'KICD Mathematics Book 1, Topical Revision Maths, chart of algebraic symbols, calculators (1 per pair), whiteboard markers',
    assessment: 'Oral questions during lesson, marked exercise books, short quiz at end of lesson (10 marks)',
    notes: 'Some learners struggle with negative coefficients — give extra examples. Use CBC learner-centred approach.',
    status: 'Published', createdBy: 'Grace Achieng' },
  { subjectId: SUBJ.MATH, classLevelId: CLS.F2, week: 5, term: 'Term 1', topic: 'Trigonometry: Sine, Cosine & Tangent Ratios',
    objectives: '1. Identify opposite, adjacent and hypotenuse in right-angled triangles\n2. Derive sine, cosine and tangent ratios\n3. Use trigonometric tables and calculators to find ratios',
    activities: '• Brainstorm: where do we use trigonometry in real life?\n• Discovery activity using ruler and protractor\n• Group work: measure triangles and tabulate ratios\n• Demonstration using math chart',
    resources: 'Maths chart, trig tables, rulers, protractors, calculators, KICD Book 2',
    assessment: 'Class exercise Q1-10, peer assessment, exit ticket',
    notes: 'Bring extra calculators — not all learners have one. Pair weaker learners with stronger ones.',
    status: 'Published', createdBy: 'Grace Achieng' },
  { subjectId: SUBJ.BIO, classLevelId: CLS.F3, week: 5, term: 'Term 1', topic: 'Excretion & Osmoregulation in Mammals',
    objectives: '1. Define excretion and osmoregulation\n2. Describe the structure of the human kidney (nephron)\n3. Explain the process of ultrafiltration and selective reabsorption',
    activities: '• Video clip: kidney dissection (10 min)\n• Label diagram of nephron\n• Group discussion: compare excretion in plants vs mammals\n• Practical demonstration: osmosis using potato cubes',
    resources: 'Biology textbook, kidney model, microscope slides, potato cubes, salt solutions, KLB Biology Book 3',
    assessment: 'Labelled nephron diagram, end-of-lesson short answer questions',
    notes: 'Set up potato osmosis practical 30 min before lesson. Use disposable gloves for any dissection.',
    status: 'Published', createdBy: 'Dennis Kiprop' },
  { subjectId: SUBJ.ENG, classLevelId: CLS.F1, week: 5, term: 'Term 1', topic: 'Comprehension: Reading for Meaning — "The River Between"',
    objectives: '1. Read a passage fluently with correct pronunciation\n2. Answer literal and inferential questions\n3. Identify figures of speech in the passage',
    activities: '• Silent reading (5 min)\n• Loud reading in turns\n• Vocabulary mining — new words and meanings\n• Discussion questions in groups',
    resources: 'KICD English Book 1, dictionary (1 per pair), comprehension passage handout',
    assessment: 'Oral reading fluency rubric, written answers to comprehension questions',
    notes: 'Pair struggling readers with confident ones. Use phonics prompts where necessary.',
    status: 'Published', createdBy: 'Mary Wanjiru' },
  { subjectId: SUBJ.CHE, classLevelId: CLS.F4, week: 5, term: 'Term 1', topic: 'Organic Chemistry II: Alkanols & Alkanoic Acids',
    objectives: '1. Name and draw structures of alkanols (C1-C5)\n2. Describe preparation of ethanol by fermentation\n3. Write equations for reactions of alkanoic acids',
    activities: '• Recap functional groups from previous lesson\n• Demonstration: esterification reaction (lab)\n• Group work: IUPAC naming practice\n• Past KCSE questions (5 selected)',
    resources: 'Chemistry lab, ethanol, ethanoic acid, concentrated sulphuric acid, KLB Chemistry Book 4, KCSE past papers booklet',
    assessment: 'Lab practical report, KCSE practice questions marked out of 20',
    notes: 'Strictly enforce lab safety — goggles and lab coats mandatory. KCSE candidates need extra practice.',
    status: 'Published', createdBy: 'Peter Kamau' },
  { subjectId: SUBJ.KIS, classLevelId: CLS.F2, week: 5, term: 'Term 1', topic: 'Sarufi: Viakati vya Maneno (Word Affixes)',
    objectives: '1. Kutambua viakati (kiwanzo, kiini, kiishio) katika maneno\n2. Kuunda maneno mapya kwa kutumia viakati\n3. Kutumia maneno yaliyoundwa katika sentensi',
    activities: '• Mazungumzo ya kuanzia\n• Wafunzwe kutenganisha kiini katika maneno yaliyotolewa\n• Kazi ya makundi: tengeneza maneno 10 na viakati tofauti\n• Wasilisho mbele ya darasa',
    resources: 'Kitabu cha Kiswahili KICD Kidato cha Pili, chati ya viakati, kibao cha kufundishia',
    assessment: 'Zoezi la kitabu kurasa 45-46, maswali ya mdomo',
    notes: 'Hakikisha wanafunzi hawachanganyi kiwanzo na kiishio. Tumia mifano ya kawaida ya Kiswahili sanifu.',
    status: 'Published', createdBy: 'Samuel Otieno' },
  { subjectId: SUBJ.HIS, classLevelId: CLS.F3, week: 5, term: 'Term 1', topic: 'Trade Between East African Coast & the Outside World (1000-1850 AD)',
    objectives: '1. Identify the commodities traded on the East African coast\n2. Describe the roles of Arabs, Indians and Portuguese traders\n3. Explain the effects of trade on coastal communities',
    activities: '• Map work: locate key trading ports (Mombasa, Kilwa, Sofala)\n• Timeline construction\n• Group debate: positive vs negative effects of trade\n• Source analysis: Ibn Battuta\'s account',
    resources: 'History map of East African coast, KLB History Book 3, printed source extracts, world map',
    assessment: 'Timeline activity marked, source analysis worksheet (10 marks)',
    notes: 'Use storytelling to bring historical figures to life. Connect to modern Mombasa port for relevance.',
    status: 'Published', createdBy: 'Esther Njeri' },
  { subjectId: SUBJ.GEO, classLevelId: CLS.F4, week: 5, term: 'Term 1', topic: 'Map Work: Contours & Relief Representation',
    objectives: '1. Define contour lines and contour intervals\n2. Calculate vertical exaggeration and gradient\n3. Draw a cross-section from a topographical map',
    activities: '• Recap of previous map work symbols\n• Demonstration on board: drawing contours\n• Individual practice: KESHE topographical map extract\n• Cross-section drawing exercise',
    resources: 'Topographical map (KESHE series), graph paper, coloured pencils, KLB Geography Book 4',
    assessment: 'Map extract exercise (30 marks — KCSE format)',
    notes: 'KCSE candidates — practice with past paper map extracts every Friday.',
    status: 'Completed', createdBy: 'Esther Njeri' },
  { subjectId: SUBJ.PHY, classLevelId: CLS.F3, week: 5, term: 'Term 1', topic: 'Electromagnetic Induction & Transformers',
    objectives: '1. State Faraday\'s and Lenz\'s laws\n2. Describe the construction of a transformer\n3. Solve numerical problems on transformer efficiency',
    activities: '• Demonstration: moving magnet through coil (galvanometer)\n• Build a simple transformer in groups\n• Numerical practice: step-up and step-down calculations\n• Video: real-world transformers at Juja substation',
    resources: 'Physics lab, galvanometer, magnets, copper wire, iron core, KLB Physics Book 3',
    assessment: 'Lab worksheet + 5 numerical problems',
    notes: 'Transformers are KCSE favourite — emphasise energy losses (eddy currents, hysteresis).',
    status: 'Draft', createdBy: 'Peter Kamau' },
  { subjectId: SUBJ.CST, classLevelId: CLS.F2, week: 5, term: 'Term 1', topic: 'Introduction to Spreadsheets: Formulas & Functions',
    objectives: '1. Identify parts of a spreadsheet (cell, row, column, range)\n2. Enter data and format cells\n3. Use basic functions: SUM, AVERAGE, MAX, MIN, COUNT',
    activities: '• Demo on projector using LibreOffice Calc\n• Hands-on: create class marks register\n• Pair challenge: build a simple budget spreadsheet\n• Print and submit work',
    resources: 'Computer lab (1 PC per learner), LibreOffice Calc, projector, printed handout',
    assessment: 'Practical project — class marks register with formulas (20 marks)',
    notes: 'Some PCs slow — pair learners if necessary. Save work to shared drive for assessment.',
    status: 'Published', createdBy: 'Dennis Kiprop' },
  { subjectId: SUBJ.AGR, classLevelId: CLS.F1, week: 5, term: 'Term 1', topic: 'Crop Production: Land Preparation & Planting',
    objectives: '1. Describe methods of land preparation\n2. State factors influencing planting time\n3. Demonstrate correct seed rate and spacing for maize',
    activities: '• Theory: land preparation methods\n• Practical at school shamba: prepare a 2m x 2m plot\n• Plant maize seeds (H614 variety)\n• Record observations in farm journal',
    resources: 'School farm, hoes, machetes, maize seed (H614), measuring tape, farm journal, KICD Agriculture Book 1',
    assessment: 'Practical participation, farm journal entry, oral quiz',
    notes: 'Bring drinking water for learners during farm practical. Sun hats recommended.',
    status: 'Published', createdBy: 'Peter Kamau' },
  { subjectId: SUBJ.CRE, classLevelId: CLS.F3, week: 5, term: 'Term 1', topic: 'Selected Old Testament Prophets: Elijah at Mount Carmel',
    objectives: '1. Narrate the contest at Mount Carmel (1 Kings 18)\n2. Identify characteristics of a true prophet\n3. Apply lessons of faithfulness to modern life',
    activities: '• Dramatised reading of 1 Kings 18:20-40\n• Discussion: why did the prophets of Baal fail?\n• Group reflection: applying Elijah\'s courage in school life\n• Memory verse: 1 Kings 18:21',
    resources: 'Bibles (Revised Standard Version), KICD CRE Book 3, drama props',
    assessment: 'Memory verse recitation, group discussion report',
    notes: 'Be sensitive to learners of other faiths. Frame as moral courage, not proselytising.',
    status: 'Draft', createdBy: 'Mary Wanjiru' },
  { subjectId: SUBJ.BST, classLevelId: CLS.F4, week: 5, term: 'Term 1', topic: 'Demand: Law of Demand & Elasticity',
    objectives: '1. Define demand and state the law of demand\n2. Plot and interpret a demand curve\n3. Calculate price elasticity of demand',
    activities: '• Recap of supply from previous lesson\n• Plot demand schedule on graph paper\n• Calculate PED for selected commodities (maize, sugar, airtime)\n• Case study: effect of fuel prices on matatu fares',
    resources: 'KLB Business Studies Book 4, graph paper, calculators, current newspaper cuttings',
    assessment: 'PED calculations (10 marks), demand curve drawing',
    notes: 'KCSE candidates — emphasise distinction between elastic and inelastic demand with examples.',
    status: 'Published', createdBy: 'Samuel Otieno' },
  { subjectId: SUBJ.MATH, classLevelId: CLS.F4, week: 6, term: 'Term 1', topic: 'Differentiation: Rules & Applications',
    objectives: '1. Differentiate functions using the power rule\n2. Find equations of tangents and normals\n3. Apply differentiation to find maxima and minima',
    activities: '• Recap of limits\n• Derive the power rule from first principles\n• Worked examples on tangent equations\n• KCSE past paper practice',
    resources: 'KLB Maths Book 4, KCSE past papers, graph paper',
    assessment: 'Mixed exercise (20 marks), KCSE-style question',
    notes: 'Calculus is a KCSE high-yield area. Schedule extra remedial on Wednesdays.',
    status: 'Draft', createdBy: 'Grace Achieng' },
  { subjectId: SUBJ.ENG, classLevelId: CLS.F4, week: 6, term: 'Term 1', topic: 'The Novel: "A Doll\'s House" by Henrik Ibsen — Character Analysis',
    objectives: '1. Analyse the character of Nora Helmer\n2. Discuss the theme of gender roles in 19th century Norway\n3. Compare Nora\'s transformation to modern Kenyan context',
    activities: '• Recap of Acts 1 & 2 reading\n• Character map on board\n• Hot seat activity: learner plays Nora and answers questions\n• Group essay plan',
    resources: '"A Doll\'s House" set book (Longhorn edition), character map handout, KICD English Book 4',
    assessment: 'Essay outline (500 words), character map',
    notes: 'Hot seating works best — pick confident learner. Connect theme to CBC value of equity.',
    status: 'Published', createdBy: 'Mary Wanjiru' },
  { subjectId: SUBJ.BIO, classLevelId: CLS.F1, week: 6, term: 'Term 1', topic: 'Cell Structure & Function: Plant vs Animal Cells',
    objectives: '1. Identify parts of plant and animal cells\n2. State functions of cell organelles\n3. Compare similarities and differences',
    activities: '• Microscope practical: onion epidermis & cheek cells\n• Drawing cells under microscope\n• Venn diagram: plant vs animal cell\n• Quiz game',
    resources: 'Microscopes (1 per group), onion, iodine stain, slides, KLB Biology Book 1',
    assessment: 'Labelled cell drawings, comparison table',
    notes: 'Brief safety talk before practical. Handle microscopes carefully.',
    status: 'Published', createdBy: 'Dennis Kiprop' },
]

// Homework assignments — due dates spread across past, today, this week, future
function daysFromNow(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + days)
  d.setHours(23, 59, 0, 0)
  return d
}

const HOMEWORK = [
  { title: 'Exercise 5.2 — Linear Equations Word Problems', subjectId: SUBJ.MATH, classLevelId: CLS.F1,
    description: 'Complete Exercise 5.2 Q1-15 in KICD Mathematics Book 1. Show all working clearly. Submit on Monday before 8:00 AM.',
    dueDate: daysFromNow(2), maxMarks: 20, status: 'Active', createdBy: 'Grace Achieng' },
  { title: 'Trigonometry Practice Set', subjectId: SUBJ.MATH, classLevelId: CLS.F2,
    description: 'Solve Q1-10 on page 87 of KICD Book 2. Use trig tables provided in class. Show diagrams for each question.',
    dueDate: daysFromNow(4), maxMarks: 30, status: 'Active', createdBy: 'Grace Achieng' },
  { title: 'KCSE Differentiation Past Papers', subjectId: SUBJ.MATH, classLevelId: CLS.F4,
    description: 'Attempt KCSE 2020 Q5, 2021 Q3, 2022 Q7 on differentiation. Mark scheme to be discussed Friday.',
    dueDate: daysFromNow(7), maxMarks: 60, status: 'Active', createdBy: 'Grace Achieng' },
  { title: 'Kidney Diagram & Nephron Labelling', subjectId: SUBJ.BIO, classLevelId: CLS.F3,
    description: 'Draw and label the structure of a nephron. Write a paragraph explaining ultrafiltrulation. Use Biology textbook pp 102-105.',
    dueDate: daysFromNow(1), maxMarks: 15, status: 'Active', createdBy: 'Dennis Kiprop' },
  { title: 'Potato Osmosis Lab Report', subjectId: SUBJ.BIO, classLevelId: CLS.F3,
    description: 'Write up the potato osmosis experiment. Include: aim, hypothesis, method, results table, graph, conclusion (minimum 400 words).',
    dueDate: daysFromNow(-1), maxMarks: 25, status: 'Active', createdBy: 'Dennis Kiprop' },
  { title: 'Comprehension Questions — "The River Between"', subjectId: SUBJ.ENG, classLevelId: CLS.F1,
    description: 'Answer comprehension questions 1-8 on page 24 of KICD English Book 1. Use complete sentences.',
    dueDate: daysFromNow(3), maxMarks: 16, status: 'Active', createdBy: 'Mary Wanjiru' },
  { title: 'Character Map: Nora Helmer', subjectId: SUBJ.ENG, classLevelId: CLS.F4,
    description: 'Complete a detailed character map for Nora from "A Doll\'s House" Acts 1-2. Use quotes from the text to support each trait.',
    dueDate: daysFromNow(5), maxMarks: 20, status: 'Active', createdBy: 'Mary Wanjiru' },
  { title: 'Alkanols: IUPAC Naming Practice', subjectId: SUBJ.CHE, classLevelId: CLS.F4,
    description: 'Name the 10 alkanol structures on the handout. Draw structural formulae for propan-2-ol, butan-1-ol and pentan-3-ol.',
    dueDate: daysFromNow(0), maxMarks: 20, status: 'Active', createdBy: 'Peter Kamau' },
  { title: 'Esterification Lab Report', subjectId: SUBJ.CHE, classLevelId: CLS.F4,
    description: 'Write the lab report for the esterification demonstration. Include balanced equation, observations and uses of esters.',
    dueDate: daysFromNow(6), maxMarks: 30, status: 'Active', createdBy: 'Peter Kamau' },
  { title: 'Zoezi la Viakati', subjectId: SUBJ.KIS, classLevelId: CLS.F2,
    description: 'Tengeneza maneno 10 kwa kutumia viakati (kiwanzo, kiini, kiishio) tofauti. Andika kwenye kifungu cha sentensi.',
    dueDate: daysFromNow(2), maxMarks: 20, status: 'Active', createdBy: 'Samuel Otieno' },
  { title: 'Timeline: East African Coastal Trade', subjectId: SUBJ.HIS, classLevelId: CLS.F3,
    description: 'Construct a timeline (1000-1850 AD) showing key events in East African coastal trade. Include at least 10 events with dates.',
    dueDate: daysFromNow(4), maxMarks: 25, status: 'Active', createdBy: 'Esther Njeri' },
  { title: 'Map Extract Exercise — KESHE Sheet', subjectId: SUBJ.GEO, classLevelId: CLS.F4,
    description: 'Complete the map extract exercise on KESHE topographical map. Draw cross-section along line AB and calculate gradient.',
    dueDate: daysFromNow(-2), maxMarks: 30, status: 'Closed', createdBy: 'Esther Njeri' },
  { title: 'Class Marks Register Spreadsheet', subjectId: SUBJ.CST, classLevelId: CLS.F2,
    description: 'Create a class marks register in LibreOffice Calc with SUM, AVERAGE, MAX, MIN formulas. Submit via shared drive.',
    dueDate: daysFromNow(5), maxMarks: 20, status: 'Active', createdBy: 'Dennis Kiprop' },
  { title: 'Farm Journal Entry — Maize Plot', subjectId: SUBJ.AGR, classLevelId: CLS.F1,
    description: 'Record today\'s maize planting activity in the farm journal. Note date, seed variety (H614), spacing, and observations.',
    dueDate: daysFromNow(1), maxMarks: 10, status: 'Active', createdBy: 'Peter Kamau' },
  { title: 'Demand Curve & PED Calculations', subjectId: SUBJ.BST, classLevelId: CLS.F4,
    description: 'Plot a demand curve from the schedule on page 56. Calculate PED for maize, sugar and airtime using given data.',
    dueDate: daysFromNow(3), maxMarks: 25, status: 'Active', createdBy: 'Samuel Otieno' },
  { title: 'Transformer Numerical Problems', subjectId: SUBJ.PHY, classLevelId: CLS.F3,
    description: 'Solve numerical problems 1-8 on transformers from KLB Physics Book 3 page 124. Show all working.',
    dueDate: daysFromNow(-3), maxMarks: 20, status: 'Graded', createdBy: 'Peter Kamau' },
  { title: 'Cell Drawings — Onion vs Cheek Cells', subjectId: SUBJ.BIO, classLevelId: CLS.F1,
    description: 'Submit labelled biological drawings of onion epidermis and cheek cells observed under the microscope. Use magnification.',
    dueDate: daysFromNow(2), maxMarks: 15, status: 'Active', createdBy: 'Dennis Kiprop' },
  { title: 'Elijah at Mount Carmel Reflection', subjectId: SUBJ.CRE, classLevelId: CLS.F3,
    description: 'Write a 300-word reflection on a time you had to stand up for what is right, drawing lessons from Elijah at Mount Carmel.',
    dueDate: daysFromNow(6), maxMarks: 20, status: 'Active', createdBy: 'Mary Wanjiru' },
]

async function main() {
  console.log('📒 Seeding Lesson Plans & Homework...')

  console.log('  → Clearing existing data...')
  await db.lessonPlan.deleteMany()
  await db.homework.deleteMany()

  console.log(`  → Creating ${LESSON_PLANS.length} lesson plans...`)
  for (const lp of LESSON_PLANS) {
    await db.lessonPlan.create({ data: lp })
  }

  console.log(`  → Creating ${HOMEWORK.length} homework assignments...`)
  for (const hw of HOMEWORK) {
    await db.homework.create({ data: hw })
  }

  // Stats summary
  const lpTotal = await db.lessonPlan.count()
  const lpPublished = await db.lessonPlan.count({ where: { status: 'Published' } })
  const lpDrafts = await db.lessonPlan.count({ where: { status: 'Draft' } })
  const lpCompleted = await db.lessonPlan.count({ where: { status: 'Completed' } })
  const hwTotal = await db.homework.count()
  const hwActive = await db.homework.count({ where: { status: 'Active' } })
  const hwOverdue = await db.homework.count({ where: { status: 'Active', dueDate: { lt: new Date() } } })
  console.log(`✓ Lesson Plans: ${lpTotal} total (${lpPublished} published, ${lpDrafts} drafts, ${lpCompleted} completed)`)
  console.log(`✓ Homework: ${hwTotal} total (${hwActive} active, ${hwOverdue} overdue)`)
  console.log('✅ Done.')
}

main().catch(console.error).finally(() => db.$disconnect())
