'use client'

/**
 * Print utility — opens a print-friendly window with school letterhead.
 * Used for invoices, receipts, report cards, and other printable documents.
 */

interface SchoolInfo {
  name: string
  email?: string | null
  phone?: string | null
  address?: string | null
  motto?: string | null
  logo?: string | null
  primaryColor?: string | null
}

interface PrintOptions {
  title: string
  subtitle?: string
  school: SchoolInfo | null
  bodyHtml: string
  /** Optional CSS to inject (in addition to the default letterhead styles) */
  extraCss?: string
}

/**
 * Opens a new browser window with the document + school letterhead,
 * triggers the print dialog, then the user can save as PDF or print.
 */
export function printWithLetterhead({ title, subtitle, school, bodyHtml, extraCss = '' }: PrintOptions) {
  const schoolName = school?.name || 'SkulHub Academy'
  const schoolEmail = school?.email || ''
  const schoolPhone = school?.phone || ''
  const schoolAddress = school?.address || ''
  const schoolMotto = school?.motto || ''
  const brandColor = school?.primaryColor || '#059669'

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} — ${schoolName}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      color: #1f2937;
      padding: 32px 40px;
      max-width: 800px;
      margin: 0 auto;
      line-height: 1.5;
    }
    /* School Letterhead */
    .letterhead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 3px solid ${brandColor};
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .letterhead-left { display: flex; align-items: center; gap: 12px; }
    .logo-box {
      width: 56px; height: 56px;
      background: ${brandColor};
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: bold; font-size: 20px;
    }
    .school-info h1 {
      font-size: 22px; color: #111827; font-weight: 700;
    }
    .school-info p {
      font-size: 11px; color: #6b7280; margin-top: 2px;
    }
    .school-info .motto {
      font-style: italic; color: ${brandColor};
    }
    .letterhead-right {
      text-align: right;
    }
    .letterhead-right .doc-type {
      font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
      color: ${brandColor}; font-weight: 600;
    }
    .letterhead-right .doc-title {
      font-size: 18px; font-weight: 700; color: #111827; margin-top: 4px;
    }
    .letterhead-right .doc-subtitle {
      font-size: 11px; color: #6b7280; margin-top: 2px;
    }

    /* Document body */
    .doc-body { margin-top: 8px; }

    /* Tables */
    table {
      width: 100%; border-collapse: collapse; margin: 16px 0;
    }
    th, td {
      text-align: left; padding: 10px 12px; font-size: 13px;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: ${brandColor}11; font-weight: 600; color: #374151;
      text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;
    }
    tr:last-child td { border-bottom: none; }

    /* Amount total */
    .total-row {
      background: ${brandColor}08; font-weight: 700;
    }
    .total-row td { border-top: 2px solid ${brandColor}; }

    /* Info grid */
    .info-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
      margin-bottom: 20px;
    }
    .info-card {
      background: #f9fafb; border-radius: 8px; padding: 12px 16px;
    }
    .info-card .label {
      font-size: 10px; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;
    }
    .info-card .value {
      font-size: 14px; font-weight: 600; color: #111827; margin-top: 2px;
    }

    /* Status badges */
    .badge {
      display: inline-block; padding: 3px 10px; border-radius: 12px;
      font-size: 11px; font-weight: 600; text-transform: uppercase;
    }
    .badge-paid { background: #d1fae5; color: #065f46; }
    .badge-partial { background: #fef3c7; color: #92400e; }
    .badge-unpaid { background: #fee2e2; color: #991b1b; }
    .badge-cancelled { background: #f3f4f6; color: #6b7280; }

    /* Footer */
    .doc-footer {
      margin-top: 48px; padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      display: flex; justify-content: space-between; align-items: flex-end;
    }
    .signature {
      border-top: 1px solid #1f2937; padding-top: 4px;
      width: 200px; font-size: 11px; color: #6b7280;
    }
    .doc-footer .meta {
      font-size: 10px; color: #9ca3af; text-align: right;
    }

    /* Print button (hidden when printing) */
    .print-actions {
      text-align: center; margin-bottom: 24px;
    }
    .print-btn {
      background: ${brandColor}; color: white; border: none;
      padding: 10px 24px; border-radius: 6px; font-size: 14px;
      cursor: pointer; font-weight: 600;
    }
    .print-btn:hover { opacity: 0.9; }
    @media print {
      .print-actions { display: none; }
      body { padding: 0; max-width: none; }
    }

    ${extraCss}
  </style>
</head>
<body>
  <div class="print-actions">
    <button class="print-btn" onclick="window.print()">Print / Save as PDF</button>
  </div>

  <!-- School Letterhead -->
  <div class="letterhead">
    <div class="letterhead-left">
      <div class="logo-box">${schoolName.charAt(0).toUpperCase()}</div>
      <div class="school-info">
        <h1>${schoolName}</h1>
        ${schoolAddress ? `<p>${schoolAddress}</p>` : ''}
        ${schoolPhone || schoolEmail ? `<p>${[schoolPhone, schoolEmail].filter(Boolean).join(' · ')}</p>` : ''}
        ${schoolMotto ? `<p class="motto">"${schoolMotto}"</p>` : ''}
      </div>
    </div>
    <div class="letterhead-right">
      <div class="doc-type">${title}</div>
      ${subtitle ? `<div class="doc-title">${subtitle}</div>` : ''}
    </div>
  </div>

  <!-- Document Body -->
  <div class="doc-body">
    ${bodyHtml}
  </div>

  <!-- Footer -->
  <div class="doc-footer">
    <div class="signature">
      Authorized Signature
    </div>
    <div class="meta">
      Generated on ${new Date().toLocaleString()}<br>
      Powered by SkulHub
    </div>
  </div>

  <script>
    // Auto-trigger print dialog after a short delay
    setTimeout(() => window.print(), 500);
  </script>
</body>
</html>`

  // Open in a new window and write the HTML
  const printWindow = window.open('', '_blank', 'width=900,height=700')
  if (printWindow) {
    printWindow.document.open()
    printWindow.document.write(html)
    printWindow.document.close()
  } else {
    // Popup blocked — fallback: create a hidden iframe
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)
    const doc = iframe.contentWindow?.document
    if (doc) {
      doc.open()
      doc.write(html)
      doc.close()
      setTimeout(() => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(() => document.body.removeChild(iframe), 1000)
      }, 500)
    }
  }
}

/**
 * Helper: format a number as KES currency for print documents.
 */
export function formatKESForPrint(amount: number): string {
  return 'KES ' + amount.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

/**
 * Helper: generate an auto-reference for cash payments.
 * Format: CSH-YYYYMMDD-XXXX (where XXXX is a random 4-digit number)
 */
export function generateCashReference(): string {
  const d = new Date()
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const random = Math.floor(1000 + Math.random() * 9000)
  return `CSH-${dateStr}-${random}`
}

/**
 * Helper: generate a receipt number for payments.
 * Format: RCP-YYYYMMDD-XXXX
 */
export function generateReceiptNumber(): string {
  const d = new Date()
  const dateStr = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
  const random = Math.floor(1000 + Math.random() * 9000)
  return `RCP-${dateStr}-${random}`
}
