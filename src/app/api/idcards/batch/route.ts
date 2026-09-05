import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/idcards/batch?classLevelId=xxx&status=Active
 *
 * Returns HTML with ALL student ID cards laid out for batch printing.
 * 4 cards per row, multiple pages.
 */
export async function GET(req: NextRequest) {
  try {
    const classLevelId = req.nextUrl.searchParams.get('classLevelId')
    const status = req.nextUrl.searchParams.get('status') || 'Active'

    let query = `
      SELECT s.*, sc.name as school_name, sc.motto as school_motto,
             sc."primaryColor" as school_color, sc.phone as school_phone,
             cl.name as class_name, st.name as stream_name
      FROM "Student" s
      LEFT JOIN "School" sc ON sc.id = s."schoolId"
      LEFT JOIN "Enrollment" e ON e."studentId" = s.id AND e.status = 'Active'
      LEFT JOIN "ClassLevel" cl ON cl.id = e."classLevelId"
      LEFT JOIN "Stream" st ON st.id = e."streamId"
      WHERE s.status = $1
    `
    const params: any[] = [status]
    if (classLevelId) {
      query += ` AND e."classLevelId" = $2`
      params.push(classLevelId)
    }
    query += ` ORDER BY s."lastName", s."firstName"`

    const students = await db.$queryRawUnsafe<any[]>(query, ...params).catch(() => [])

    if (students.length === 0) {
      return NextResponse.json({ error: 'No students found' }, { status: 404 })
    }

    const school = students[0]
    const color = school.school_color || '#10b981'
    const schoolName = school.school_name || 'SkulHub Academy'
    const today = new Date().toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })

    const cards = students.map((s: any) => {
      const initials = `${s.firstName?.[0] || ''}${s.lastName?.[0] || ''}`.toUpperCase()
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=50x50&data=${encodeURIComponent(s.id)}`
      const photoHtml = s.photoUrl
        ? `<img src="${s.photoUrl}" style="width:60px;height:60px;border-radius:6px;object-fit:cover;border:1.5px solid ${color}" />`
        : `<div style="width:60px;height:60px;border-radius:6px;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-size:18px;font-weight:bold;border:1.5px solid ${color}">${initials}</div>`

      return `<div class="card">
        <div class="header" style="background:${color}">
          <div class="logo">${(schoolName)[0]}</div>
          <div class="info"><h1>${schoolName}</h1><p>${s.school_motto || ''}</p></div>
        </div>
        <div class="body">
          <div class="photo">${photoHtml}</div>
          <div class="details">
            <div class="name">${s.firstName} ${s.lastName}</div>
            <div class="row"><span>Adm:</span><span>${s.admissionNo}</span></div>
            <div class="row"><span>Class:</span><span>${s.class_name || '—'}</span></div>
            <div class="row"><span>Type:</span><span>${s.boarding ? 'Boarding' : 'Day'}</span></div>
          </div>
          <img src="${qrUrl}" class="qr" alt="QR" />
        </div>
      </div>`
    }).join('')

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Batch ID Cards — ${schoolName}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
      .title { text-align: center; margin-bottom: 20px; }
      .title h1 { font-size: 20px; color: ${color}; }
      .title p { font-size: 12px; color: #666; }
      .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; max-width: 800px; margin: 0 auto; }
      @media print { body { background: white; padding: 10px; } .no-print { display: none; } .grid { gap: 6px; } }
      .card { width: 100%; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); background: white; page-break-inside: avoid; }
      .header { padding: 8px 10px; display: flex; align-items: center; gap: 6px; }
      .header .logo { width: 24px; height: 24px; background: white; border-radius: 5px; display: flex; align-items: center; justify-content: center; color: ${color}; font-size: 12px; font-weight: bold; }
      .header .info h1 { font-size: 10px; color: white; line-height: 1.2; }
      .header .info p { font-size: 7px; color: rgba(255,255,255,0.8); }
      .body { padding: 8px 10px; display: flex; gap: 8px; align-items: center; }
      .details { flex: 1; min-width: 0; }
      .details .name { font-size: 11px; font-weight: bold; margin-bottom: 2px; }
      .details .row { font-size: 8px; display: flex; justify-content: space-between; margin-bottom: 1px; }
      .details .row span:first-child { color: #666; }
      .details .row span:last-child { font-weight: 600; }
      .qr { width: 40px; height: 40px; flex-shrink: 0; }
    </style></head><body>
      <div class="title">
        <h1>${schoolName} — Student ID Cards</h1>
        <p>${students.length} cards · ${today} · ${classLevelId ? 'Class: ' + (students[0].class_name || '—') : 'All Classes'}</p>
      </div>
      <div class="grid">${cards}</div>
      <div class="no-print" style="text-align:center;margin-top:20px;">
        <button onclick="window.print()" style="padding:10px 24px;background:${color};color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;">Print All ID Cards (${students.length})</button>
      </div>
    </body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
