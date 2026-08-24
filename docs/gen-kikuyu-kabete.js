const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, PageBreak, Header, Footer, PageNumber, AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType, SectionType, TableLayoutType } = require("docx");
const fs = require("fs");

const P = { primary: "15857A", body: "2C2C2C", secondary: "606060", accent: "FF6A3B", surface: "F0EDE5", headerBg: "15857A", headerText: "FFFFFF", innerLine: "D5D0C8", bg: "F4F1E9", titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" };
const c = (h) => h.replace("#", "");
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { ...noBorders, insideHorizontal: NB, insideVertical: NB };

function h1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160, line: 312 }, children: [new TextRun({ text: t, bold: true, size: 32, color: c(P.primary), font: { ascii: "Calibri" } })] }); }
function h2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120, line: 312 }, children: [new TextRun({ text: t, bold: true, size: 28, color: c(P.primary), font: { ascii: "Calibri" } })] }); }
function body(t) { return new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { line: 312, after: 80 }, children: [new TextRun({ text: t, size: 22, color: c(P.body), font: { ascii: "Calibri" } })] }); }
function bullet(t) { return new Paragraph({ bullet: { level: 0 }, spacing: { line: 312, after: 40 }, children: [new TextRun({ text: t, size: 22, color: c(P.body), font: { ascii: "Calibri" } })] }); }
function thCell(t) { return new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: t, bold: true, size: 16, color: P.headerText, font: { ascii: "Calibri" } })] })], shading: { type: ShadingType.CLEAR, fill: P.headerBg }, margins: { top: 50, bottom: 50, left: 60, right: 60 } }); }
function tdCell(t, opts = {}) { return new TableCell({ children: [new Paragraph({ spacing: { line: 240 }, children: [new TextRun({ text: t, size: 16, color: c(P.body), font: { ascii: "Calibri" }, ...opts })] })], shading: opts.bg ? { type: ShadingType.CLEAR, fill: opts.bg } : undefined, margins: { top: 30, bottom: 30, left: 60, right: 60 } }); }

const schools = JSON.parse(fs.readFileSync("/tmp/kikuyu_kabete_schools.json", "utf8"));

function buildCover() {
  const padL = 1200, padR = 800, ch = [];
  ch.push(new Paragraph({ spacing: { before: 3600 } }));
  ch.push(new Paragraph({ indent: { left: padL, right: padR }, spacing: { after: 500 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } }, children: [new TextRun({ text: "K  I  K  U  Y  U    &    K  A  B  E  T  E    S  C  H  O  O  L  S", size: 18, color: P.accent, font: { ascii: "Calibri" } })] }));
  ch.push(new Paragraph({ indent: { left: padL }, spacing: { after: 100, line: 920, lineRule: "atLeast" }, children: [new TextRun({ text: "SkulHub", size: 80, bold: true, color: P.titleColor, font: { ascii: "Arial" } })] }));
  ch.push(new Paragraph({ indent: { left: padL }, spacing: { after: 300, line: 600, lineRule: "atLeast" }, children: [new TextRun({ text: "Kikuyu & Kabete Schools Database", size: 36, color: P.subtitleColor, font: { ascii: "Arial" } })] }));
  ch.push(new Paragraph({ indent: { left: padL }, spacing: { after: 800 }, children: [new TextRun({ text: `${schools.length} schools in your area with contacts, locations, and priority ratings`, size: 26, color: P.subtitleColor, font: { ascii: "Arial" } })] }));
  for (const line of ["Version: 1.0", "Date: August 2026", `Schools: ${schools.length} (Kikuyu + Kabete + Kiambu)`, "High Priority Targets: 13", "Website: skulhub.co.ke", "Phone: 0742 340 924"]) {
    ch.push(new Paragraph({ indent: { left: padL + 200 }, spacing: { after: 80 }, border: { left: { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 12 } }, children: [new TextRun({ text: line, size: 24, color: P.metaColor, font: { ascii: "Arial" } })] }));
  }
  ch.push(new Paragraph({ spacing: { before: 2800 } }));
  ch.push(new Paragraph({ indent: { left: padL, right: padR }, border: { top: { style: BorderStyle.SINGLE, size: 2, color: P.accent, space: 8 } }, spacing: { before: 200 }, children: [new TextRun({ text: "CONFIDENTIAL", size: 16, color: P.footerColor, font: { ascii: "Arial" } }), new TextRun({ text: "                                        " }), new TextRun({ text: "SkulHub  2026", size: 16, color: P.footerColor, font: { ascii: "Arial" } })] }));
  return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED, borders: allNoBorders, rows: [new TableRow({ height: { value: 16838, rule: "exact" }, children: [new TableCell({ shading: { type: ShadingType.CLEAR, fill: P.bg }, borders: noBorders, children: ch })] })] })];
}

function buildBody() {
  const ch = [];
  
  ch.push(h1("1. Your Local School Database"));
  ch.push(body(`This document contains ${schools.length} schools in the Kikuyu and Kabete constituencies of Kiambu County, plus nearby high-value targets. All contacts were collected from publicly available sources including teacher.co.ke, kenyaplex.com, private-schools.co.ke, and individual school websites.`));
  ch.push(body("Schools are organized by constituency and marked with priority ratings. Start with HIGH priority schools first — they have the most students and budget."));

  // HIGH PRIORITY summary
  ch.push(h2("Quick Start: High Priority Schools (Visit These First!)"));
  const highPriority = schools.filter(s => s.priority === "HIGH");
  ch.push(body(`${highPriority.length} schools are marked HIGH priority based on student count, school type, and likelihood of having budget for digital management systems.`));
  ch.push(body(""));
  
  const hpHeaders = ["School", "Constituency", "Phone", "Email", "Location"];
  const hpRows = highPriority.map(s => [s.school, s.constituency, s.phone, s.email, s.location]);
  ch.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
    columnWidths: [2500, 1200, 1500, 2500, 2300],
    borders: { top: { style: BorderStyle.SINGLE, size: 2, color: P.headerBg }, bottom: { style: BorderStyle.SINGLE, size: 2, color: P.headerBg }, left: NB, right: NB, insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.innerLine }, insideVertical: NB },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: hpHeaders.map(h => thCell(h)) }),
      ...hpRows.map((row, i) => new TableRow({ cantSplit: true, children: row.map(cell => tdCell(cell, { bg: "FFF3E0" })) })),
    ],
  }));

  // Kikuyu Constituency
  ch.push(new Paragraph({ children: [new PageBreak()] }));
  ch.push(h1("2. Kikuyu Constituency Schools"));
  const kikuyuSchools = schools.filter(s => s.constituency === "Kikuyu");
  ch.push(body(`${kikuyuSchools.length} schools found in Kikuyu Constituency.`));
  
  const headers = ["School", "Principal", "Phone", "Alt Phone", "Email", "Type", "Students", "Location", "Priority"];
  const rows = kikuyuSchools.map(s => [s.school, s.principal, s.phone, s.alt_phone, s.email, s.type, s.students, s.location, s.priority]);
  ch.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
    columnWidths: [2000, 1200, 1200, 1000, 2000, 1500, 700, 1800, 600],
    borders: { top: { style: BorderStyle.SINGLE, size: 2, color: P.headerBg }, bottom: { style: BorderStyle.SINGLE, size: 2, color: P.headerBg }, left: NB, right: NB, insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.innerLine }, insideVertical: NB },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: headers.map(h => thCell(h)) }),
      ...rows.map((row, i) => new TableRow({ cantSplit: true, children: row.map(cell => tdCell(cell, { bg: i % 2 === 0 ? P.surface : undefined, bold: row[8] === "HIGH", color: row[8] === "HIGH" ? c(P.primary) : c(P.body) })) })),
    ],
  }));

  // Kabete Constituency
  ch.push(new Paragraph({ children: [new PageBreak()] }));
  ch.push(h1("3. Kabete Constituency Schools"));
  const kabeteSchools = schools.filter(s => s.constituency === "Kabete");
  ch.push(body(`${kabeteSchools.length} schools found in Kabete Constituency.`));
  
  const kabeteRows = kabeteSchools.map(s => [s.school, s.principal, s.phone, s.alt_phone, s.email, s.type, s.students, s.location, s.priority]);
  ch.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
    columnWidths: [2000, 1200, 1200, 1000, 2000, 1500, 700, 1800, 600],
    borders: { top: { style: BorderStyle.SINGLE, size: 2, color: P.headerBg }, bottom: { style: BorderStyle.SINGLE, size: 2, color: P.headerBg }, left: NB, right: NB, insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.innerLine }, insideVertical: NB },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: headers.map(h => thCell(h)) }),
      ...kabeteRows.map((row, i) => new TableRow({ cantSplit: true, children: row.map(cell => tdCell(cell, { bg: i % 2 === 0 ? P.surface : undefined, bold: row[8] === "HIGH", color: row[8] === "HIGH" ? c(P.primary) : c(P.body) })) })),
    ],
  }));

  // Other Kiambu (nearby high-value)
  ch.push(new Paragraph({ children: [new PageBreak()] }));
  ch.push(h1("4. Other Kiambu County Schools (High-Value Targets)"));
  const otherSchools = schools.filter(s => s.constituency === "Kiambu");
  ch.push(body(`${otherSchools.length} additional schools in Kiambu County that are worth visiting if you are in the area.`));
  
  const otherRows = otherSchools.map(s => [s.school, s.principal, s.phone, s.alt_phone, s.email, s.type, s.students, s.location, s.priority]);
  ch.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
    columnWidths: [2000, 1200, 1200, 1000, 2000, 1500, 700, 1800, 600],
    borders: { top: { style: BorderStyle.SINGLE, size: 2, color: P.headerBg }, bottom: { style: BorderStyle.SINGLE, size: 2, color: P.headerBg }, left: NB, right: NB, insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.innerLine }, insideVertical: NB },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: headers.map(h => thCell(h)) }),
      ...otherRows.map((row, i) => new TableRow({ cantSplit: true, children: row.map(cell => tdCell(cell, { bg: i % 2 === 0 ? P.surface : undefined, bold: row[8] === "HIGH", color: row[8] === "HIGH" ? c(P.primary) : c(P.body) })) })),
    ],
  }));

  // Email template specific for your area
  ch.push(new Paragraph({ children: [new PageBreak()] }));
  ch.push(h1("5. Email Template for Kikuyu/Kabete Schools"));
  ch.push(body("Use this email template when reaching out to schools in Kikuyu and Kabete. Personalize it for each school."));
  ch.push(new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "Subject: ", bold: true, size: 22, color: c(P.primary) }), new TextRun({ text: "Helping [School Name] digitize with SkulHub - Free 30-Day Trial", size: 22, color: c(P.body), italics: true })] }));
  ch.push(body("Dear [Principal Name],"));
  ch.push(body("I hope this finds you well. My name is [Your Name] and I am a local entrepreneur based in Kiambu County. I have built SkulHub - a complete school management system designed specifically for Kenyan schools."));
  ch.push(body("Having grown up in this area and knowing the challenges schools in Kikuyu and Kabete face, I designed SkulHub to help schools like [School Name]:"));
  ch.push(bullet("Collect fees via M-Pesa Daraja (STK Push - parents pay from their phone)"));
  ch.push(bullet("Track attendance in real-time - no more paper registers"));
  ch.push(bullet("Generate KCSE-format report cards with your school letterhead"));
  ch.push(bullet("Give parents a portal to check fees and grades online"));
  ch.push(bullet("Manage 33+ modules: students, staff, exams, library, transport, health, hostel, timetable, and more"));
  ch.push(body("I would love to visit [School Name] and give you a free 15-minute demo. I am available any day this week."));
  ch.push(body("In the meantime, you can try it free for 30 days at skulhub.co.ke:"));
  ch.push(bullet("School Code: SKH-2024-001"));
  ch.push(bullet("Email: admin@skulhub.ac.ke"));
  ch.push(bullet("Password: admin123"));
  ch.push(body("Would [Day] at [Time] work for me to come by?"));
  ch.push(body("Best regards,\n[Your Name]\nSkulHub Founder\nPhone: 0742 340 924\nEmail: info@skulhub.co.ke\nWeb: skulhub.co.ke"));

  // How to find more schools
  ch.push(h1("6. How to Find More Schools in Your Area"));
  ch.push(body("To expand this list, use these resources:"));
  ch.push(bullet("private-schools.co.ke/kiambu/kikuyu - Lists 11 private schools in Kikuyu"));
  ch.push(bullet("teacher.co.ke - Search by sub-county for principal names + phone numbers"));
  ch.push(bullet("kenyaplex.com/schools - Browse schools by county"));
  ch.push(bullet("kenyaschoolsdirectory.co.ke - Search by county"));
  ch.push(bullet("Facebook groups: 'Kikuyu District Affairs', 'Kiambu County Schools'"));
  ch.push(bullet("Visit the Kikuyu Education Office for a full list of registered schools"));
  ch.push(bullet("Drive around Kikuyu town and Kabete - note school names and gate contacts"));

  ch.push(new Paragraph({ spacing: { before: 400 } }));
  ch.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: "--- End of Document ---", size: 20, color: c(P.secondary), italics: true, font: { ascii: "Calibri" } })] }));
  
  return ch;
}

const doc = new Document({
  styles: { default: { document: { run: { font: { ascii: "Calibri" }, size: 22, color: c(P.body) }, paragraph: { spacing: { line: 312 } } },
    heading1: { run: { font: { ascii: "Calibri" }, size: 32, bold: true, color: c(P.primary) }, paragraph: { spacing: { before: 360, after: 160, line: 312 } } },
    heading2: { run: { font: { ascii: "Calibri" }, size: 28, bold: true, color: c(P.primary) }, paragraph: { spacing: { before: 280, after: 120, line: 312 } } },
  } },
  sections: [
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } } }, children: buildCover() },
    { properties: { type: SectionType.NEXT_PAGE, page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SkulHub - Kikuyu & Kabete Schools Database", size: 18, color: c(P.secondary), font: { ascii: "Calibri" } })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 18, color: c(P.secondary) }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })] })] }) },
      children: buildBody() },
  ],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/z/my-project/docs/SkulHub-Kikuyu-Kabete-Schools.docx", buf);
  console.log("Generated: SkulHub-Kikuyu-Kabete-Schools.docx");
});
