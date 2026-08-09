import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// POST /api/import — bulk import data for any entity type
// Body: { type: 'students'|'staff'|'books'|'subjects'|'suppliers'|'facilities', data: [...] }
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body || !body.type || !Array.isArray(body.data)) {
    return NextResponse.json({ error: 'type (string) and data (array) are required' }, { status: 400 })
  }

  const { type, data } = body as { type: string; data: any[] }
  let created = 0
  let errors: string[] = []
  const now = new Date()

  try {
    switch (type) {
      // -----------------------------------------------------------------------
      // STUDENTS — bulk import
      // -----------------------------------------------------------------------
      case 'students': {
        let admNo = 9000
        const existing = await db.student.count()
        admNo = 9000 + existing
        for (let i = 0; i < data.length; i++) {
          const r = data[i]
          try {
            if (!r.firstName || !r.lastName) { errors.push(`Row ${i+1}: firstName and lastName required`); continue }
            // Create guardian if guardian name provided
            let guardianId: string | null = null
            if (r.guardianName) {
              const [gFirst, ...gRest] = r.guardianName.split(' ')
              const g = await db.guardian.create({ data: { firstName: gFirst || 'Unknown', lastName: gRest.join(' ') || '', phone: r.guardianPhone || 'N/A', relation: 'Parent' } })
              guardianId = g.id
            }
            await db.student.create({
              data: {
                admissionNo: r.admissionNo || `ADM/${admNo++}`,
                firstName: r.firstName,
                lastName: r.lastName,
                email: r.email || null,
                phone: r.phone || null,
                gender: r.gender || 'Male',
                dateOfBirth: r.dateOfBirth ? new Date(r.dateOfBirth) : null,
                bloodGroup: r.bloodGroup || null,
                nationality: r.nationality || 'Kenyan',
                county: r.county || null,
                boarding: r.boarding === true || r.boarding === 'true' || r.boarding === 'Boarding',
                status: 'Active',
                admissionDate: r.admissionDate ? new Date(r.admissionDate) : now,
                guardianId,
              },
            })
            created++
          } catch (e: any) { errors.push(`Row ${i+1}: ${e.message?.slice(0, 80) || 'error'}`) }
        }
        break
      }

      // -----------------------------------------------------------------------
      // STAFF — bulk import
      // -----------------------------------------------------------------------
      case 'staff': {
        let empNo = 2000
        const existing = await db.staff.count()
        empNo = 2000 + existing
        for (let i = 0; i < data.length; i++) {
          const r = data[i]
          try {
            if (!r.firstName || !r.lastName) { errors.push(`Row ${i+1}: firstName and lastName required`); continue }
            await db.staff.create({
              data: {
                employeeNo: r.employeeNo || `EMP/${empNo++}`,
                firstName: r.firstName,
                lastName: r.lastName,
                email: r.email || null,
                phone: r.phone || null,
                gender: r.gender || 'Male',
                role: r.role || 'Teacher',
                qualification: r.qualification || null,
                specialization: r.specialization || null,
                employmentType: r.employmentType || 'Permanent',
                salary: parseFloat(r.salary) || 0,
                status: 'Active',
                hireDate: r.hireDate ? new Date(r.hireDate) : now,
                address: r.address || null,
              },
            })
            created++
          } catch (e: any) { errors.push(`Row ${i+1}: ${e.message?.slice(0, 80) || 'error'}`) }
        }
        break
      }

      // -----------------------------------------------------------------------
      // BOOKS — bulk import
      // -----------------------------------------------------------------------
      case 'books': {
        for (let i = 0; i < data.length; i++) {
          const r = data[i]
          try {
            if (!r.title || !r.author) { errors.push(`Row ${i+1}: title and author required`); continue }
            await db.libraryBook.create({
              data: {
                isbn: r.isbn || null,
                title: r.title,
                author: r.author,
                category: r.category || 'General',
                publisher: r.publisher || null,
                yearPublished: r.yearPublished ? parseInt(r.yearPublished) : null,
                copiesTotal: parseInt(r.copiesTotal) || 1,
                copiesAvailable: parseInt(r.copiesTotal) || 1,
                shelfLocation: r.shelfLocation || null,
                status: 'Available',
              },
            })
            created++
          } catch (e: any) { errors.push(`Row ${i+1}: ${e.message?.slice(0, 80) || 'error'}`) }
        }
        break
      }

      // -----------------------------------------------------------------------
      // SUBJECTS — bulk import
      // -----------------------------------------------------------------------
      case 'subjects': {
        for (let i = 0; i < data.length; i++) {
          const r = data[i]
          try {
            if (!r.name) { errors.push(`Row ${i+1}: name required`); continue }
            await db.subject.create({
              data: {
                name: r.name,
                code: r.code || r.name.slice(0, 3).toUpperCase(),
                category: r.category || 'Core',
              },
            })
            created++
          } catch (e: any) { errors.push(`Row ${i+1}: ${e.message?.slice(0, 80) || 'error'}`) }
        }
        break
      }

      // -----------------------------------------------------------------------
      // SUPPLIERS — bulk import
      // -----------------------------------------------------------------------
      case 'suppliers': {
        for (let i = 0; i < data.length; i++) {
          const r = data[i]
          try {
            if (!r.name) { errors.push(`Row ${i+1}: name required`); continue }
            await db.supplier.create({
              data: {
                name: r.name,
                category: r.category || 'General',
                contact: r.contact || null,
                phone: r.phone || null,
                email: r.email || null,
                address: r.address || null,
                status: 'Active',
              },
            })
            created++
          } catch (e: any) { errors.push(`Row ${i+1}: ${e.message?.slice(0, 80) || 'error'}`) }
        }
        break
      }

      // -----------------------------------------------------------------------
      // FACILITIES — bulk import
      // -----------------------------------------------------------------------
      case 'facilities': {
        for (let i = 0; i < data.length; i++) {
          const r = data[i]
          try {
            if (!r.name) { errors.push(`Row ${i+1}: name required`); continue }
            await db.facility.create({
              data: {
                name: r.name,
                type: r.type || 'Hall',
                capacity: parseInt(r.capacity) || 50,
                location: r.location || null,
                status: 'Available',
              },
            })
            created++
          } catch (e: any) { errors.push(`Row ${i+1}: ${e.message?.slice(0, 80) || 'error'}`) }
        }
        break
      }

      // -----------------------------------------------------------------------
      // ALUMNI — bulk import
      // -----------------------------------------------------------------------
      case 'alumni': {
        for (let i = 0; i < data.length; i++) {
          const r = data[i]
          try {
            if (!r.firstName || !r.lastName) { errors.push(`Row ${i+1}: firstName and lastName required`); continue }
            await db.alumnus.create({
              data: {
                firstName: r.firstName,
                lastName: r.lastName,
                email: r.email || null,
                phone: r.phone || null,
                gender: r.gender || 'Male',
                admissionNo: r.admissionNo || null,
                graduationYear: parseInt(r.graduationYear) || new Date().getFullYear() - 1,
                classLevel: r.classLevel || 'Form 4',
                career: r.career || null,
                employer: r.employer || null,
                industry: r.industry || null,
                location: r.location || null,
                status: 'Active',
              },
            })
            created++
          } catch (e: any) { errors.push(`Row ${i+1}: ${e.message?.slice(0, 80) || 'error'}`) }
        }
        break
      }

      // -----------------------------------------------------------------------
      // VISITORS — bulk import (historical)
      // -----------------------------------------------------------------------
      case 'visitors': {
        for (let i = 0; i < data.length; i++) {
          const r = data[i]
          try {
            if (!r.visitorName) { errors.push(`Row ${i+1}: visitorName required`); continue }
            await db.visitor.create({
              data: {
                visitorName: r.visitorName,
                idNumber: r.idNumber || null,
                phone: r.phone || null,
                purpose: r.purpose || 'Other',
                personToSee: r.personToSee || null,
                vehicleReg: r.vehicleReg || null,
                status: r.status || 'Checked Out',
                checkInTime: r.checkInTime ? new Date(r.checkInTime) : now,
                checkOutTime: r.checkOutTime ? new Date(r.checkOutTime) : null,
                recordedBy: r.recordedBy || 'Imported',
              },
            })
            created++
          } catch (e: any) { errors.push(`Row ${i+1}: ${e.message?.slice(0, 80) || 'error'}`) }
        }
        break
      }

      default:
        return NextResponse.json({ error: `Unknown type: ${type}. Supported: students, staff, books, subjects, suppliers, facilities, alumni, visitors` }, { status: 400 })
    }

    await db.activityLog.create({
      data: { action: 'IMPORT', entity: type, user: 'Staff', details: `Bulk imported ${created} ${type} records` },
    }).catch(() => {})

    return NextResponse.json({ success: true, type, created, total: data.length, errors: errors.slice(0, 20), errorCount: errors.length })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Import failed' }, { status: 500 })
  }
}

// GET /api/import — return supported types and their field schemas
export async function GET() {
  return NextResponse.json({
    types: [
      {
        type: 'students',
        label: 'Students',
        fields: ['firstName*', 'lastName*', 'gender', 'email', 'phone', 'dateOfBirth (YYYY-MM-DD)', 'bloodGroup', 'county', 'boarding (true/false)', 'admissionNo', 'guardianName', 'guardianPhone'],
      },
      {
        type: 'staff',
        label: 'Staff & Teachers',
        fields: ['firstName*', 'lastName*', 'role', 'gender', 'email', 'phone', 'qualification', 'specialization', 'employmentType', 'salary', 'employeeNo', 'address'],
      },
      {
        type: 'books',
        label: 'Library Books',
        fields: ['title*', 'author*', 'isbn', 'category', 'publisher', 'yearPublished', 'copiesTotal', 'shelfLocation'],
      },
      {
        type: 'subjects',
        label: 'Subjects',
        fields: ['name*', 'code', 'category'],
      },
      {
        type: 'suppliers',
        label: 'Suppliers',
        fields: ['name*', 'category', 'contact', 'phone', 'email', 'address'],
      },
      {
        type: 'facilities',
        label: 'Facilities',
        fields: ['name*', 'type', 'capacity', 'location'],
      },
      {
        type: 'alumni',
        label: 'Alumni',
        fields: ['firstName*', 'lastName*', 'gender', 'email', 'phone', 'graduationYear', 'career', 'employer', 'industry', 'location', 'admissionNo'],
      },
      {
        type: 'visitors',
        label: 'Visitor History',
        fields: ['visitorName*', 'idNumber', 'phone', 'purpose', 'personToSee', 'vehicleReg', 'status', 'checkInTime', 'checkOutTime'],
      },
    ],
  })
}
