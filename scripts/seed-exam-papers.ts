/**
 * Seed script: inserts 25 publisher exam papers (JESMA, KNEC, Kaspnet,
 * Achievers, Mentor) into the database. Each paper's `fileData` is a minimal
 * but valid PDF encoded as a base64 data URL.
 *
 * Run with: `bun run scripts/seed-exam-papers.ts`
 *
 * This script is idempotent-ish — it deletes existing papers before inserting
 * so re-running it gives a clean state. (Use the in-app UI for normal adds.)
 */

import { db } from '../src/lib/db'

// --- Tiny valid PDF generator -------------------------------------------------
// Builds the smallest valid single-page PDF whose body text is `bodyText`.
// Returns a Uint8Array; we then base64-encode it into a data URL.
function buildMinimalPdf(bodyText: string): Uint8Array {
  const enc = (s: string) => new TextEncoder().encode(s)
  const header = enc('%PDF-1.4\n')
  // PDF objects are 1-indexed; the table below is fixed-shape so we can compute
  // byte offsets without parsing the result.
  //   1 = Catalog, 2 = Pages, 3 = Page, 4 = Font, 5 = Contents stream
  const objects: Uint8Array[] = []
  // Indirect-object wrapper
  const wrap = (n: number, body: Uint8Array): Uint8Array => {
    const head = enc(`${n} 0 obj\n`)
    const tail = enc('\nendobj\n')
    const out = new Uint8Array(head.length + body.length + tail.length)
    out.set(head, 0)
    out.set(body, head.length)
    out.set(tail, head.length + body.length)
    return out
  }
  // 1: Catalog
  objects.push(wrap(1, enc('<< /Type /Catalog /Pages 2 0 R >>')))
  // 2: Pages (single page)
  objects.push(wrap(2, enc('<< /Type /Pages /Count 1 /Kids [3 0 R] >>')))
  // 3: Page
  objects.push(wrap(
    3,
    enc('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>'),
  ))
  // 4: Font (Helvetica)
  objects.push(wrap(4, enc('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>')))
  // 5: Content stream — draw the body text at (50, 780), 14pt
  const escaped = bodyText.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
  const streamBody = `BT\n/F1 14 Tf\n50 780 Td\n(${escaped}) Tj\nET\n`
  const streamBytes = enc(streamBody)
  // Length is the byte length of the stream content (between stream / endstream)
  const streamObj = enc(`<< /Length ${streamBytes.length} >>\nstream\n`)
  const endStream = enc('endstream')
  const obj5 = new Uint8Array(streamObj.length + streamBytes.length + endStream.length)
  obj5.set(streamObj, 0)
  obj5.set(streamBytes, streamObj.length)
  obj5.set(endStream, streamObj.length + streamBytes.length)
  objects.push(wrap(5, obj5))

  // xref table: compute byte offsets as we go
  const offsets: number[] = []
  let cursor = header.length
  const body = new Uint8Array(
    header.length + objects.reduce((n, o) => n + o.length, 0) + 1024,
  )
  body.set(header, 0)
  for (const obj of objects) {
    offsets.push(cursor)
    body.set(obj, cursor)
    cursor += obj.length
  }
  const xrefStart = cursor
  const xref = enc(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`)
  let xrefBuf = xref
  for (const off of offsets) {
    const line = `${String(off).padStart(10, '0')} 00000 n \n`
    xrefBuf = new Uint8Array([...xrefBuf, ...enc(line)])
  }
  // Trailer
  const trailer = enc(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`)
  const out = new Uint8Array(cursor + xrefBuf.length + trailer.length)
  out.set(body.subarray(0, cursor), 0)
  out.set(xrefBuf, cursor)
  out.set(trailer, cursor + xrefBuf.length)
  return out
}

function bytesToBase64(bytes: Uint8Array): string {
  // Use Node's Buffer when available (faster), otherwise fall back to btoa.
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64')
  }
  let bin = ''
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i])
  // btoa is available in modern Bun/Node ≥ 16
  return (globalThis as any).btoa(bin)
}

function buildPdfDataUrl(bodyText: string): string {
  const pdf = buildMinimalPdf(bodyText)
  return `data:application/pdf;base64,${bytesToBase64(pdf)}`
}

// --- Paper catalogue ---------------------------------------------------------
interface SeedPaper {
  title: string
  subject: string
  classLevel: string
  paperType: string
  publisher: string
  year: string
  term: string
  description: string
  fileName: string
}

const SUBJECTS = [
  'Mathematics', 'English', 'Kiswahili', 'Chemistry', 'Biology', 'Physics',
  'History', 'Geography', 'CRE', 'Business Studies', 'Computer Studies', 'Science',
]
const CLASS_LEVELS = ['Form 1', 'Form 2', 'Form 3', 'Form 4', 'Grade 8']
const PAPER_TYPES = ['past_paper', 'exam_paper', 'marking_scheme', 'revision_notes']
const TERMS = ['Term 1', 'Term 2', 'Term 3']
const YEARS = ['2022', '2023', '2024', '2025']

// Deterministic pseudo-random shuffle so the script is reproducible.
function seededShuffle<T>(arr: T[], seed = 42): T[] {
  const a = [...arr]
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280
    const j = Math.floor((s / 233280) * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const pick = <T,>(arr: T[], i: number): T => arr[i % arr.length]

const PAPERS: SeedPaper[] = (() => {
  const out: SeedPaper[] = []
  // 8 JESMA, 7 KNEC, 4 Kaspnet, 3 Achievers, 3 Mentor = 25 total
  const plan: Array<[string, number]> = [
    ['JESMA', 8],
    ['KNEC', 7],
    ['Kaspnet', 4],
    ['Achievers', 3],
    ['Mentor', 3],
  ]
  let idx = 0
  for (const [publisher, count] of plan) {
    for (let n = 0; n < count; n++) {
      const subject = pick(SUBJECTS, idx)
      const classLevel = pick(CLASS_LEVELS, idx + 3)
      const paperType = pick(PAPER_TYPES, idx + 5)
      const term = pick(TERMS, idx + 7)
      const year = pick(YEARS, idx + 11)
      idx++
      const paperNo = (n + 1)
      const isMarking = paperType === 'marking_scheme'
      const isNotes = paperType === 'revision_notes'
      const subjectSlug = subject.toLowerCase().replace(/\s+/g, '-')
      const fileName = `${publisher}-${subjectSlug}-${classLevel.replace(/\s+/g, '').toLowerCase()}-${year}-${term.replace(/\s+/g, '').toLowerCase()}.${isMarking ? 'marking' : isNotes ? 'notes' : 'pdf'}`
      const title = isMarking
        ? `${publisher} ${subject} ${classLevel} ${term} ${year} — Marking Scheme`
        : isNotes
          ? `${publisher} ${subject} ${classLevel} ${term} ${year} — Revision Notes`
          : `${publisher} ${subject} Paper ${paperNo} — ${classLevel} ${term} ${year}`
      const description = isMarking
        ? `Official marking scheme for ${publisher} ${subject} ${classLevel} ${term} ${year}. Includes step-by-step mark allocation.`
        : isNotes
          ? `Concise revision notes for ${subject} (${classLevel}) — ${publisher} ${year}. Covers the entire syllabus for ${term}.`
          : `${publisher} ${subject} examination paper for ${classLevel}, ${term} ${year}. Set by experienced examiners and aligned with the KICD curriculum.`
      out.push({
        title,
        subject,
        classLevel,
        paperType,
        publisher,
        year,
        term,
        description,
        fileName,
      })
    }
  }
  return seededShuffle(out)
})()

async function main() {
  console.log(`[seed-exam-papers] Inserting ${PAPERS.length} publisher exam papers…`)

  // Wipe existing papers so the seed is idempotent and we can re-run freely.
  const deleted = await db.examPaper.deleteMany({})
  console.log(`[seed-exam-papers] Deleted ${deleted.count} existing papers.`)

  let inserted = 0
  for (const p of PAPERS) {
    const bodyText = `${p.title}\n\nPublisher: ${p.publisher}\nSubject: ${p.subject}\nClass: ${p.classLevel}\nTerm: ${p.term}\nYear: ${p.year}\n\nThis is a minimal valid PDF generated for demonstration purposes by the seed script. In production, this record would contain the actual publisher-issued PDF.`
    const fileData = buildPdfDataUrl(bodyText)
    // Use Buffer.byteLength to get the actual decoded byte size (not the base64 length)
    const fileSize = typeof Buffer !== 'undefined'
      ? Buffer.from(fileData.split(',')[1], 'base64').length
      : Math.floor((fileData.length - fileData.indexOf(',') - 1) * 0.75)
    await db.examPaper.create({
      data: {
        title: p.title,
        subject: p.subject,
        classLevel: p.classLevel,
        paperType: p.paperType,
        publisher: p.publisher,
        year: p.year,
        term: p.term,
        description: p.description,
        fileData,
        fileName: p.fileName,
        fileSize,
        fileType: 'application/pdf',
        uploadedBy: 'Seed Script',
      },
    })
    inserted++
    if (inserted % 5 === 0) console.log(`[seed-exam-papers] Inserted ${inserted}/${PAPERS.length}…`)
  }
  console.log(`[seed-exam-papers] Done. Inserted ${inserted} papers.`)

  // Print a quick distribution summary for sanity-checking
  const counts: Record<string, number> = {}
  for (const p of PAPERS) counts[p.publisher] = (counts[p.publisher] || 0) + 1
  console.log('[seed-exam-papers] Distribution by publisher:', counts)
}

main()
  .catch((e) => {
    console.error('[seed-exam-papers] Failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await db.$disconnect()
  })
