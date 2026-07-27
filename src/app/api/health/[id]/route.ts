import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET /api/health/[id]?examId=  — student medical profile
// [id] is studentId
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const studentId = id

  const [student, medicalRecord, visits] = await Promise.all([
    db.student.findUnique({
      where: { id: studentId },
      select: {
        id: true, admissionNo: true, firstName: true, lastName: true, gender: true,
        dateOfBirth: true, bloodGroup: true, phone: true,
        enrollments: { take: 1, select: { stream: { select: { name: true, classLevel: { select: { name: true } } } } } },
        guardian: true,
      },
    }),
    db.medicalRecord.findFirst({ where: { studentId }, include: { visits: { orderBy: { visitDate: 'desc' } } } }),
    db.clinicVisit.findMany({ where: { studentId }, orderBy: { visitDate: 'desc' }, take: 20 }),
  ])

  if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 })

  return NextResponse.json({ student, medicalRecord, visits })
}

// PUT /api/health/[id] — update medical record (id = studentId)
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 })

  // Upsert medical record for this student
  const existing = await db.medicalRecord.findFirst({ where: { studentId: id } })
  const data = {
    studentId: id,
    bloodGroup: body.bloodGroup || null,
    heightCm: body.heightCm ? Number(body.heightCm) : null,
    weightKg: body.weightKg ? Number(body.weightKg) : null,
    allergies: body.allergies || null,
    conditions: body.conditions || null,
    medications: body.medications || null,
    immunization: body.immunization || null,
    emergencyContact: body.emergencyContact || null,
    emergencyPhone: body.emergencyPhone || null,
    notes: body.notes || null,
  }
  const record = existing
    ? await db.medicalRecord.update({ where: { id: existing.id }, data })
    : await db.medicalRecord.create({ data })

  return NextResponse.json(record)
}
