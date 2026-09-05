import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * GET /api/idcards/generate?studentId=xxx
 *
 * Returns HTML for a printable ID card with:
 * - School logo + name + motto
 * - Student photo (from photoUrl, or initials avatar fallback)
 * - Student name, admission no, class, stream
 * - QR code (encodes student ID for scanning at biometric gate)
 * - Term + academic year
 * - School brand color border
 */
export async function GET(req: NextRequest) {
  try {
    const studentId = req.nextUrl.searchParams.get('studentId')
    if (!studentId) {
      return NextResponse.json({ error: 'studentId is required' }, { status: 400 })
    }

    const students = await db.$queryRawUnsafe<any[]>(`
      SELECT s.*, sc.name as school_name, sc.motto as school_motto, sc.address as school_address,
             sc.phone as school_phone, sc."primaryColor" as school_color, sc.email as school_email,
             cl.name as class_name, st.name as stream_name
      FROM "Student" s
      LEFT JOIN "School" sc ON sc.id = s."schoolId"
      LEFT JOIN "Enrollment" e ON e."studentId" = s.id AND e.status = 'Active'
      LEFT JOIN "ClassLevel" cl ON cl.id = e."classLevelId"
      LEFT JOIN "Stream" st ON st.id = e."streamId"
      WHERE s.id = $1 LIMIT 1
    `, studentId).catch(() => [])

    if (students.length === 0) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const s = students[0]
    const color = s.school_color || '#10b981'
    const today = new Date().toLocaleDateString('en-KE', { month: 'short', year: 'numeric' })
    const initials = `${s.firstName?.[0] || ''}${s.lastName?.[0] || ''}`.toUpperCase()

    // QR code using a free QR API (renders student ID as scannable QR)
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(s.id)}`

    const photoHtml = s.photoUrl
      ? `<img src="${s.photoUrl}" alt="Student" style="width:90px;height:90px;border-radius:8px;object-fit:cover;border:2px solid ${color}" />`
      : `<div style="width:90px;height:90px;border-radius:8px;background:${color};display:flex;align-items:center;justify-content:center;color:white;font-size:28px;font-weight:bold;border:2px solid ${color}">${initials}</div>`

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>ID Card — ${s.firstName} ${s.lastName}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      body { font-family: Arial, sans-serif; padding: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #f0f0f0; }
      .card { width: 340px; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.15); background: white; }
      .header { background: linear-gradient(135deg, ${color}, ${color}dd); color: white; padding: 14px 16px; display: flex; align-items: center; gap: 10px; }
      .header .logo { width: 36px; height: 36px; background: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: ${color}; font-size: 16px; font-weight: bold; }
      .header .info h1 { font-size: 14px; line-height: 1.2; }
      .header .info p { font-size: 9px; opacity: 0.85; }
      .body { padding: 16px; display: flex; gap: 14px; align-items: center; }
      .photo { flex-shrink: 0; }
      .details { flex: 1; min-width: 0; }
      .details .name { font-size: 16px; font-weight: bold; color: #1a1a1a; margin-bottom: 4px; }
      .details .row { display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px; }
      .details .row span:first-child { color: #666; }
      .details .row span:last-child { font-weight: 600; }
      .qr-section { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-top: 1px solid #eee; }
      .qr-section img { width: 60px; height: 60px; }
      .qr-text { font-size: 8px; color: #999; }
      .footer { background: ${color}; height: 6px; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 8px; font-weight: 600; }
      .badge.active { background: #dcfce7; color: #16a34a; }
      @media print { body { background: white; } .no-print { display: none; } }
    </style></head><body>
      <div class="card">
        <div class="header">
          <div class="logo">${(s.school_name || 'S')[0]}</div>
          <div class="info">
            <h1>${s.school_name || 'SkulHub Academy'}</h1>
            <p>${s.school_motto || ''} | ${s.school_phone || ''}</p>
          </div>
        </div>
        <div class="body">
          <div class="photo">${photoHtml}</div>
          <div class="details">
            <div class="name">${s.firstName} ${s.lastName}</div>
            <div class="row"><span>Adm No:</span><span>${s.admissionNo}</span></div>
            <div class="row"><span>Class:</span><span>${s.class_name || '—'}</span></div>
            <div class="row"><span>Stream:</span><span>${s.stream_name || '—'}</span></div>
            <div class="row"><span>Gender:</span><span>${s.gender}</span></div>
            <div class="row"><span>Type:</span><span>${s.boarding ? 'Boarding' : 'Day Scholar'}</span></div>
            <div class="row"><span>Status:</span><span class="badge ${s.status === 'Active' ? 'active' : ''}" style="background:${s.status === 'Active' ? '#dcfce7' : '#fee2e2'};color:${s.status === 'Active' ? '#16a34a' : '#dc2626'}">${s.status}</span></div>
          </div>
        </div>
        <div class="qr-section">
          <img src="${qrUrl}" alt="QR Code" />
          <div>
            <p class="qr-text">Scan at school gate for biometric check-in</p>
            <p class="qr-text">Term: ${today} · ID: ${s.id.slice(-8).toUpperCase()}</p>
          </div>
        </div>
        <div class="footer"></div>
      </div>
      <div class="no-print" style="position:fixed;bottom:20px;left:50%;transform:translateX(-50%);">
        <button onclick="window.print()" style="padding:10px 24px;background:${color};color:white;border:none;border-radius:8px;cursor:pointer;font-size:14px;">Print ID Card</button>
      </div>
    </body></html>`

    return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message }, { status: 500 })
  }
}
