const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  PageBreak, Header, Footer, PageNumber,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  SectionType, TableLayoutType,
} = require("docx");
const fs = require("fs");

const P = { primary: "15857A", body: "2C2C2C", secondary: "606060", accent: "FF6A3B", surface: "F0EDE5", headerBg: "15857A", headerText: "FFFFFF", innerLine: "D5D0C8", bg: "F4F1E9", titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" };
const c = (h) => h.replace("#", "");
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { ...noBorders, insideHorizontal: NB, insideVertical: NB };

function h1(t) { return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160, line: 312 }, children: [new TextRun({ text: t, bold: true, size: 32, color: c(P.primary), font: { ascii: "Calibri" } })] }); }
function h2(t) { return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120, line: 312 }, children: [new TextRun({ text: t, bold: true, size: 28, color: c(P.primary), font: { ascii: "Calibri" } })] }); }
function h3(t) { return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100, line: 312 }, children: [new TextRun({ text: t, bold: true, size: 24, color: c(P.body), font: { ascii: "Calibri" } })] }); }
function body(t) { return new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { line: 312, after: 80 }, children: [new TextRun({ text: t, size: 22, color: c(P.body), font: { ascii: "Calibri" } })] }); }
function bullet(t) { return new Paragraph({ bullet: { level: 0 }, spacing: { line: 312, after: 40 }, children: [new TextRun({ text: t, size: 22, color: c(P.body), font: { ascii: "Calibri" } })] }); }
function thCell(t) { return new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: t, bold: true, size: 18, color: P.headerText, font: { ascii: "Calibri" } })] })], shading: { type: ShadingType.CLEAR, fill: P.headerBg }, margins: { top: 60, bottom: 60, left: 80, right: 80 } }); }
function tdCell(t, opts = {}) { return new TableCell({ children: [new Paragraph({ spacing: { line: 260 }, children: [new TextRun({ text: t, size: 18, color: c(P.body), font: { ascii: "Calibri" }, ...opts })] })], shading: opts.bg ? { type: ShadingType.CLEAR, fill: opts.bg } : undefined, margins: { top: 40, bottom: 40, left: 80, right: 80 } }); }

const schools = JSON.parse(fs.readFileSync("/tmp/schools_data.json", "utf8"));

function buildCover() {
  const padL = 1200, padR = 800, ch = [];
  ch.push(new Paragraph({ spacing: { before: 3600 } }));
  ch.push(new Paragraph({ indent: { left: padL, right: padR }, spacing: { after: 500 }, border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } }, children: [new TextRun({ text: "S  C  H  O  O  L    C  O  N  T  A  C  T    D  A  T  A  B  A  S  E", size: 18, color: P.accent, font: { ascii: "Calibri" } })] }));
  ch.push(new Paragraph({ indent: { left: padL }, spacing: { after: 100, line: 920, lineRule: "atLeast" }, children: [new TextRun({ text: "SkulHub", size: 80, bold: true, color: P.titleColor, font: { ascii: "Arial" } })] }));
  ch.push(new Paragraph({ indent: { left: padL }, spacing: { after: 300, line: 600, lineRule: "atLeast" }, children: [new TextRun({ text: "Kenya Schools Contact Database", size: 36, color: P.subtitleColor, font: { ascii: "Arial" } })] }));
  ch.push(new Paragraph({ indent: { left: padL }, spacing: { after: 800 }, children: [new TextRun({ text: "School outreach contacts, email templates, and CRM guide", size: 26, color: P.subtitleColor, font: { ascii: "Arial" } })] }));
  for (const line of ["Version: 1.0", "Date: August 2026", `${schools.length} schools listed`, "Counties: Nairobi, Kiambu", "Website: skulhub.co.ke"]) {
    ch.push(new Paragraph({ indent: { left: padL + 200 }, spacing: { after: 80 }, border: { left: { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 12 } }, children: [new TextRun({ text: line, size: 24, color: P.metaColor, font: { ascii: "Arial" } })] }));
  }
  ch.push(new Paragraph({ spacing: { before: 2800 } }));
  ch.push(new Paragraph({ indent: { left: padL, right: padR }, border: { top: { style: BorderStyle.SINGLE, size: 2, color: P.accent, space: 8 } }, spacing: { before: 200 }, children: [new TextRun({ text: "CONFIDENTIAL", size: 16, color: P.footerColor, font: { ascii: "Arial" } }), new TextRun({ text: "                                        " }), new TextRun({ text: "SkulHub  2026", size: 16, color: P.footerColor, font: { ascii: "Arial" } })] }));
  return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED, borders: allNoBorders, rows: [new TableRow({ height: { value: 16838, rule: "exact" }, children: [new TableCell({ shading: { type: ShadingType.CLEAR, fill: P.bg }, borders: noBorders, children: ch })] })] })];
}

function buildBody() {
  const ch = [];

  // 1. EMAIL TEMPLATES
  ch.push(h1("1. Email Templates for School Outreach"));

  ch.push(h2("1.1 Initial Cold Email"));
  ch.push(new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "Subject: ", bold: true, size: 22, color: c(P.primary) }), new TextRun({ text: "Transform [School Name] with SkulHub - Free 30-Day Trial", size: 22, color: c(P.body), italics: true })] }));
  ch.push(body("Dear [Principal/Bursar Name],"));
  ch.push(body("I hope this email finds you well. My name is [Your Name] and I am the founder of SkulHub - a complete school management system built specifically for Kenyan schools."));
  ch.push(body("I came across [School Name] and was impressed by your commitment to education in [County]. I believe SkulHub can help your school:"));
  ch.push(bullet("Collect fees faster with M-Pesa integration (no more chasing payments)"));
  ch.push(bullet("Track attendance in real-time from any device"));
  ch.push(bullet("Generate KCSE-format report cards with one click"));
  ch.push(bullet("Manage admissions, exams, and students all in one place"));
  ch.push(bullet("Give parents access to fees, grades, and attendance via a parent portal"));
  ch.push(body("33+ modules. One platform. Built for Kenya."));
  ch.push(body("I would love to give you a free 15-minute demo at your convenience - no commitment required. You can also start a free 30-day trial right now at skulhub.co.ke."));
  ch.push(body("Would [Day of week] at [Time] work for a quick call?"));
  ch.push(body("Best regards,\n[Your Name]\nFounder, SkulHub\nPhone: 0742 340 924\nWeb: skulhub.co.ke"));

  ch.push(h2("1.2 Follow-Up Email (After No Response - 3 days later)"));
  ch.push(new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "Subject: ", bold: true, size: 22, color: c(P.primary) }), new TextRun({ text: "Re: Transform [School Name] with SkulHub", size: 22, color: c(P.body), italics: true })] }));
  ch.push(body("Dear [Principal/Bursar Name],"));
  ch.push(body("I wanted to follow up on my email last week about SkulHub. I understand you are busy, so I will keep this brief."));
  ch.push(body("Here is what [School Name] could achieve in the first month:"));
  ch.push(bullet("Digitize all student records"));
  ch.push(bullet("Start collecting fees via M-Pesa"));
  ch.push(bullet("Generate term-end report cards automatically"));
  ch.push(bullet("Empower parents to check fees and grades online"));
  ch.push(body("No setup cost. No contract. Cancel anytime. Free 30-day trial at skulhub.co.ke - no credit card needed."));
  ch.push(body("Or, if you prefer a guided demo, I am available this week. Just reply with a time that works for you."));
  ch.push(body("Best regards,\n[Your Name]\nPhone: 0742 340 924"));

  ch.push(h2("1.3 Demo Confirmation Email"));
  ch.push(new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "Subject: ", bold: true, size: 22, color: c(P.primary) }), new TextRun({ text: "Your SkulHub Demo is Confirmed - [Date] at [Time]", size: 22, color: c(P.body), italics: true })] }));
  ch.push(body("Dear [Contact Name],"));
  ch.push(body("Thank you for booking a demo of SkulHub! I am excited to show you how the system can transform [School Name]'s operations."));
  ch.push(body("Demo Details:"));
  ch.push(bullet("Date: [Date]"));
  ch.push(bullet("Time: [Time]"));
  ch.push(bullet("Format: [Zoom/Phone/In-person]"));
  ch.push(bullet("Duration: ~30 minutes"));
  ch.push(body("Before the demo, feel free to explore the system yourself:"));
  ch.push(bullet("Website: skulhub.co.ke"));
  ch.push(bullet("School Code: SKH-2024-001"));
  ch.push(bullet("Email: admin@skulhub.ac.ke"));
  ch.push(bullet("Password: admin123"));
  ch.push(body("Looking forward to speaking with you!\n\nBest regards,\n[Your Name]\nPhone: 0742 340 924"));

  // 2. SCHOOL CONTACT DATABASE
  ch.push(new Paragraph({ children: [new PageBreak()] }));
  ch.push(h1("2. Kenya Schools Contact Database"));
  ch.push(body("The following schools have been identified as potential SkulHub customers. The data was collected from publicly available sources including teacher.co.ke, kenyaplex.com, and school websites."));
  ch.push(body("Use this database to prioritize outreach. Focus on schools with 300+ students first (they have the budget and need)."));

  ch.push(h2("2.1 Nairobi County Schools"));
  ch.push(body(`${schools.filter(s => s.county === "Nairobi").length} schools in Nairobi County`));

  const nairobiHeaders = ["School Name", "Sub-County", "Principal", "Phone", "Email", "Students", "Type"];
  const nairobiRows = schools.filter(s => s.county === "Nairobi").map(s => [s.school, s.subcounty, s.principal, s.phone, s.email, s.students, s.type]);
  ch.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
    columnWidths: [2200, 1200, 1800, 1200, 2200, 800, 1000],
    borders: { top: { style: BorderStyle.SINGLE, size: 2, color: P.headerBg }, bottom: { style: BorderStyle.SINGLE, size: 2, color: P.headerBg }, left: NB, right: NB, insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.innerLine }, insideVertical: NB },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: nairobiHeaders.map(h => thCell(h)) }),
      ...nairobiRows.map((row, i) => new TableRow({ cantSplit: true, children: row.map(cell => tdCell(cell, { bg: i % 2 === 0 ? P.surface : undefined })) })),
    ],
  }));

  ch.push(h2("2.2 Kiambu County Schools"));
  const kiambuSchools = schools.filter(s => s.county === "Kiambu");
  ch.push(body(`${kiambuSchools.length} schools in Kiambu County`));
  if (kiambuSchools.length > 0) {
    const kiambuHeaders = ["School Name", "Sub-County", "Principal", "Phone", "Email", "Students", "Type"];
    const kiambuRows = kiambuSchools.map(s => [s.school, s.subcounty, s.principal, s.phone, s.email, s.students, s.type]);
    ch.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED,
      columnWidths: [2200, 1200, 1800, 1200, 2200, 800, 1000],
      borders: { top: { style: BorderStyle.SINGLE, size: 2, color: P.headerBg }, bottom: { style: BorderStyle.SINGLE, size: 2, color: P.headerBg }, left: NB, right: NB, insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.innerLine }, insideVertical: NB },
      rows: [
        new TableRow({ tableHeader: true, cantSplit: true, children: kiambuHeaders.map(h => thCell(h)) }),
        ...kiambuRows.map((row, i) => new TableRow({ cantSplit: true, children: row.map(cell => tdCell(cell, { bg: i % 2 === 0 ? P.surface : undefined })) })),
      ],
    }));
  }

  // 3. HOW TO FIND MORE SCHOOLS
  ch.push(new Paragraph({ children: [new PageBreak()] }));
  ch.push(h1("3. How to Find More Schools"));
  ch.push(body("The database above is a starting point. To expand your school contact list, use these free online resources:"));

  ch.push(h2("3.1 Free Online School Directories"));
  ch.push(makeTable(
    ["Source", "URL", "What You'll Find", "How to Use"],
    [
      ["Kenya Schools Directory", "kenyaschoolsdirectory.co.ke", "All schools by county, type", "Search by county, export contacts"],
      ["KenyaPlex", "kenyaplex.com/schools", "School contacts by county", "Browse county pages, copy phone/email"],
      ["Teacher.co.ke", "teacher.co.ke", "Principal names + phone numbers", "Search by county for sub-county schools"],
      ["eEducation Group", "eeducationgroup.com", "Private school contacts nationwide", "Browse by county, extract email/phone"],
      ["Yellow Pages Kenya", "yellowpageskenya.com", "Private schools by location", "Search 'private schools secondary'"],
      ["International Schools DB", "international-schools-database.com", "60+ international schools in Kenya", "Each listing has full contact details"],
      ["Nairobi County Gov", "nairobi.go.ke", "Official list of Nairobi schools", "Download PDF lists"],
    ],
    [2500, 2500, 2500, 2500]
  ));

  ch.push(h2("3.2 WhatsApp Groups to Join"));
  ch.push(bullet("Kenya School Administrators"));
  ch.push(bullet("Private Schools Kenya"));
  ch.push(bullet("Bursars Forum Kenya"));
  ch.push(bullet("Kenya Secondary School Heads Association (KESSHA)"));
  ch.push(bullet("Kenya Association of Private Schools (KAPE)"));
  ch.push(bullet("County-specific education groups (e.g., 'Nairobi Principals', 'Kiambu Bursars')"));

  ch.push(h2("3.3 Education Events to Attend"));
  ch.push(makeTable(
    ["Event", "Organizer", "When", "Who Attends"],
    [
      ["KESSHA Annual Conference", "Kenya Secondary School Heads Association", "June annually", "All secondary school principals"],
      ["KAPE Conference", "Kenya Association of Private Schools", "April annually", "Private school owners and principals"],
      ["Kenya Education Fair", "KICD", "Multiple per year", "School administrators, suppliers"],
      ["County Education Days", "Ministry of Education", "Termly", "County education officers, principals"],
    ],
    [2500, 2500, 2000, 3000]
  ));

  // 4. CRM TRACKING TEMPLATE
  ch.push(h1("4. CRM Tracking Template"));
  ch.push(body("Use this template to track your outreach to each school. Print one row per school, or use a spreadsheet (Excel/Google Sheets)."));

  ch.push(makeTable(
    ["School", "Contact", "Email Sent", "Response", "Demo Date", "Trial Started", "Converted", "Plan", "Notes"],
    [
      ["[School Name]", "[Principal/Bursar]", "[Date]", "[Yes/No]", "[Date]", "[Yes/No]", "[Yes/No]", "[Plan]", "[Notes]"],
      ["[School Name]", "[Principal/Bursar]", "[Date]", "[Yes/No]", "[Date]", "[Yes/No]", "[Yes/No]", "[Plan]", "[Notes]"],
      ["[School Name]", "[Principal/Bursar]", "[Date]", "[Yes/No]", "[Date]", "[Yes/No]", "[Yes/No]", "[Plan]", "[Notes]"],
      ["[School Name]", "[Principal/Bursar]", "[Date]", "[Yes/No]", "[Date]", "[Yes/No]", "[Yes/No]", "[Plan]", "[Notes]"],
      ["[School Name]", "[Principal/Bursar]", "[Date]", "[Yes/No]", "[Date]", "[Yes/No]", "[Yes/No]", "[Plan]", "[Notes]"],
    ],
    [1500, 1200, 1000, 800, 1000, 1000, 800, 800, 1900]
  ));

  ch.push(h2("4.1 Outreach Schedule"));
  ch.push(makeTable(
    ["Week", "Action", "Target Schools", "Expected Response"],
    [
      ["Week 1", "Send initial email to 10 schools", "10 schools", "2-3 replies"],
      ["Week 1", "Call 5 schools directly", "5 schools", "2 demos booked"],
      ["Week 2", "Follow up email to non-responders", "7 schools", "1-2 replies"],
      ["Week 2", "Visit 3 schools in person", "3 schools", "1-2 trials started"],
      ["Week 3", "WhatsApp group outreach", "50+ schools", "5-10 inquiries"],
      ["Week 3", "Facebook ads launch", "Broad audience", "2-3 demo requests"],
      ["Week 4", "Follow up on trials", "All trials", "1-2 conversions"],
    ],
    [1000, 3000, 2000, 2000]
  ));

  ch.push(new Paragraph({ spacing: { before: 400 } }));
  ch.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 }, children: [new TextRun({ text: "--- End of Document ---", size: 20, color: c(P.secondary), italics: true, font: { ascii: "Calibri" } })] }));

  return ch;
}

function makeTable(headers, rows, colWidths) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED, columnWidths: colWidths,
    borders: { top: { style: BorderStyle.SINGLE, size: 2, color: P.headerBg }, bottom: { style: BorderStyle.SINGLE, size: 2, color: P.headerBg }, left: NB, right: NB, insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.innerLine }, insideVertical: NB },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: headers.map(h => thCell(h)) }),
      ...rows.map((row, i) => new TableRow({ cantSplit: true, children: row.map(cell => tdCell(cell, { bg: i % 2 === 0 ? P.surface : undefined })) })),
    ],
  });
}

const doc = new Document({
  styles: { default: { document: { run: { font: { ascii: "Calibri" }, size: 22, color: c(P.body) }, paragraph: { spacing: { line: 312 } } },
    heading1: { run: { font: { ascii: "Calibri" }, size: 32, bold: true, color: c(P.primary) }, paragraph: { spacing: { before: 360, after: 160, line: 312 } } },
    heading2: { run: { font: { ascii: "Calibri" }, size: 28, bold: true, color: c(P.primary) }, paragraph: { spacing: { before: 280, after: 120, line: 312 } } },
  } },
  sections: [
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } } }, children: buildCover() },
    { properties: { type: SectionType.NEXT_PAGE, page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SkulHub School Contact Database", size: 18, color: c(P.secondary), font: { ascii: "Calibri" } })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 18, color: c(P.secondary) }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })] })] }) },
      children: buildBody() },
  ],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/z/my-project/docs/SkulHub-School-Contact-Database.docx", buf);
  console.log("Generated: SkulHub-School-Contact-Database.docx");
});
