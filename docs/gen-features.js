// SkulHub Product Features Sheet & School Onboarding Checklist
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  PageBreak, Header, Footer, PageNumber,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  SectionType, TableLayoutType, PageOrientation,
} = require("docx");
const fs = require("fs");

const P = {
  primary: "15857A", body: "2C2C2C", secondary: "606060",
  accent: "FF6A3B", surface: "F0EDE5", headerBg: "15857A",
  headerText: "FFFFFF", innerLine: "D5D0C8",
  bg: "F4F1E9", titleColor: "FFFFFF", subtitleColor: "B0B8C0",
  metaColor: "90989F", footerColor: "687078",
};
const c = (h) => h.replace("#", "");
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 160, line: 312 },
    children: [new TextRun({ text, bold: true, size: 32, color: c(P.primary), font: { ascii: "Calibri" } })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, size: 28, color: c(P.primary), font: { ascii: "Calibri" } })] });
}
function body(text) {
  return new Paragraph({ alignment: AlignmentType.JUSTIFIED, spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Calibri" } })] });
}
function bullet(text) {
  return new Paragraph({ bullet: { level: 0 }, spacing: { line: 312, after: 40 },
    children: [new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Calibri" } })] });
}
function thCell(text) {
  return new TableCell({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, bold: true, size: 20, color: P.headerText, font: { ascii: "Calibri" } })] })],
    shading: { type: ShadingType.CLEAR, fill: P.headerBg }, margins: { top: 80, bottom: 80, left: 120, right: 120 } });
}
function tdCell(text, opts = {}) {
  return new TableCell({ children: [new Paragraph({ spacing: { line: 280 },
    children: [new TextRun({ text, size: 20, color: c(P.body), font: { ascii: "Calibri" }, ...opts })] })],
    shading: opts.bg ? { type: ShadingType.CLEAR, fill: opts.bg } : undefined,
    margins: { top: 60, bottom: 60, left: 120, right: 120 } });
}
function makeTable(headers, rows, colWidths) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED, columnWidths: colWidths,
    borders: { top: { style: BorderStyle.SINGLE, size: 2, color: P.headerBg }, bottom: { style: BorderStyle.SINGLE, size: 2, color: P.headerBg },
      left: NB, right: NB, insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.innerLine }, insideVertical: NB },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: headers.map(h => thCell(h)) }),
      ...rows.map((row, i) => new TableRow({ cantSplit: true, children: row.map(cell => tdCell(cell, { bg: i % 2 === 0 ? P.surface : undefined })) })),
    ],
  });
}

// ── Cover ──
function buildCover() {
  const padL = 1200, padR = 800;
  const ch = [];
  ch.push(new Paragraph({ spacing: { before: 3600 } }));
  ch.push(new Paragraph({ indent: { left: padL, right: padR }, spacing: { after: 500 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } },
    children: [new TextRun({ text: "P  R  O  D  U  C  T    F  E  A  T  U  R  E  S    &    O  N  B  O  A  R  D  I  N  G", size: 18, color: P.accent, font: { ascii: "Calibri" } })] }));
  ch.push(new Paragraph({ indent: { left: padL }, spacing: { after: 100, line: 920, lineRule: "atLeast" },
    children: [new TextRun({ text: "SkulHub", size: 80, bold: true, color: P.titleColor, font: { ascii: "Arial" } })] }));
  ch.push(new Paragraph({ indent: { left: padL }, spacing: { after: 300, line: 600, lineRule: "atLeast" },
    children: [new TextRun({ text: "Product Features & Onboarding Guide", size: 36, color: P.subtitleColor, font: { ascii: "Arial" } })] }));
  ch.push(new Paragraph({ indent: { left: padL }, spacing: { after: 800 },
    children: [new TextRun({ text: "Complete module list, feature comparison, and school setup checklist", size: 26, color: P.subtitleColor, font: { ascii: "Arial" } })] }));
  for (const line of ["Version: 1.0", "Date: August 2026", "Website: skulhub.co.ke", "Phone: 0742 340 924"]) {
    ch.push(new Paragraph({ indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 12 } },
      children: [new TextRun({ text: line, size: 24, color: P.metaColor, font: { ascii: "Arial" } })] }));
  }
  ch.push(new Paragraph({ spacing: { before: 2800 } }));
  ch.push(new Paragraph({ indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: P.accent, space: 8 } }, spacing: { before: 200 },
    children: [new TextRun({ text: "CONFIDENTIAL", size: 16, color: P.footerColor, font: { ascii: "Arial" } }),
      new TextRun({ text: "                                        " }),
      new TextRun({ text: "SkulHub  2026", size: 16, color: P.footerColor, font: { ascii: "Arial" } })] }));
  return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED, borders: allNoBorders,
    rows: [new TableRow({ height: { value: 16838, rule: "exact" }, children: [new TableCell({ shading: { type: ShadingType.CLEAR, fill: P.bg }, borders: noBorders, children: ch })] })] })];
}

function buildBody() {
  const ch = [];

  // 1. COMPLETE MODULE LIST
  ch.push(h1("1. Complete Module List (33+ Modules)"));
  ch.push(body("SkulHub includes 33+ integrated modules covering every aspect of school management. Each module is role-based, meaning users only see the modules relevant to their role."));

  ch.push(h2("Overview Group"));
  ch.push(makeTable(
    ["Module", "Key Features", "Who Uses It"],
    [
      ["Dashboard", "Real-time stats: students, staff, fees, attendance. Charts, trends, activity feed, live clock.", "All staff"],
    ],
    [2500, 5500, 2000]
  ));

  ch.push(h2("People Group"));
  ch.push(makeTable(
    ["Module", "Key Features", "Who Uses It"],
    [
      ["Admissions", "Application pipeline, online applications, interview scheduling, enrollment conversion.", "Admin, Admissions, Principal"],
      ["Students", "Student profiles, guardian info, enrollment history, medical alerts, documents.", "All staff (read), Admin (write)"],
      ["Staff & Teachers", "Staff profiles, departments, qualifications, assignments, salary tracking.", "Admin, Principal"],
      ["Staff Approvals", "Approve/reject staff self-signup requests with rejection reasons.", "Admin, Principal"],
      ["Alumni", "Graduate database, career tracking, donations, event invitations.", "Admin, Principal"],
    ],
    [2500, 5500, 2000]
  ));

  ch.push(h2("Academic Group"));
  ch.push(makeTable(
    ["Module", "Key Features", "Who Uses It"],
    [
      ["Academics", "Class levels (CBC Grade 1-8 + Form 1-4), streams, subjects, departments.", "Admin, Principal, Deputy"],
      ["Attendance", "Daily marking, class-wise, trends, reports, parent notifications.", "Teachers, Admin"],
      ["Examinations", "Question banks, CATs, mock exams, KCSE-style grading, external marks import.", "Teachers, Admin"],
      ["Report Cards", "KCSE-format printable report cards with school letterhead.", "Teachers, Admin, Principal"],
      ["Lesson Plans", "Schemes of work, lesson planning, topic coverage tracking.", "Teachers, HOD"],
      ["Homework", "Assignment creation, submission tracking, parent notifications.", "Teachers"],
      ["Timetable", "Visual weekly grid, color-coded subjects, teacher/room assignment.", "Admin, Teachers"],
      ["Health & Wellness", "Medical records, clinic visits, medication tracking, health alerts.", "Nurse, Admin"],
      ["Events & Activities", "School calendar, event creation, participant tracking.", "Admin, Secretary"],
      ["Discipline", "Incident recording, sanctions, behavioral tracking, parent alerts.", "Admin, Teachers, Principal"],
      ["Hostel & Boarding", "Dormitories, rooms, beds, allocations, inspections.", "Matron, Admin"],
    ],
    [2500, 5500, 2000]
  ));

  ch.push(h2("Administration Group"));
  ch.push(makeTable(
    ["Module", "Key Features", "Who Uses It"],
    [
      ["Finance & Fees", "Invoices, payments (M-Pesa, Cash, Bank, Cheque), expenses, scholarships, auto-receipts.", "Bursar, Admin"],
      ["Payroll", "Staff salaries, payslips, deductions (PAYE, NSSF, NHIF), net pay.", "Bursar, Admin"],
      ["Communications", "Announcements (staff, students, parents), SMS/email queue.", "Admin, Secretary, Principal"],
      ["Library", "Books, ISBN, borrowing/returns, overdue tracking, search.", "Librarian"],
      ["Transport", "Routes, vehicles, drivers, student assignments, pickup tracking.", "Admin, Driver"],
      ["Inventory", "Assets, stocktake, restock requests, purchase orders, auto-reorder.", "Admin, Deputy"],
      ["Cafeteria & Meals", "Menu planning, meal attendance, dietary tracking.", "Cook, Admin"],
      ["Procurement", "Suppliers, purchase orders, delivery tracking.", "Admin, Bursar"],
      ["Facilities", "Hall/lab booking, maintenance requests.", "Admin"],
      ["Visitors & Gate", "Visitor check-in/out, purpose, person-to-see, vehicle reg.", "Gate Man"],
      ["Inventory Requests", "Staff request items from store, approval workflow.", "All staff"],
    ],
    [2500, 5500, 2000]
  ));

  ch.push(h2("Insights Group"));
  ch.push(makeTable(
    ["Module", "Key Features", "Who Uses It"],
    [
      ["Staff Room Board", "Live display screen: today's schedule, announcements, birthdays.", "All staff"],
      ["Appraisals", "Staff performance reviews, ratings, feedback, goals.", "Principal, Admin"],
      ["Feedback", "Surveys, ratings, parent/student/staff feedback.", "Admin, Principal"],
      ["ID Cards", "Printable student/staff ID cards with barcodes.", "Admin, Secretary"],
      ["Data Import", "Bulk CSV import for students, staff, grades.", "Admin"],
      ["Reports", "Analytics, custom reports, financial summaries, enrollment stats.", "Admin, Principal, Bursar"],
      ["Settings", "School config, M-Pesa Daraja, users, module access, system health.", "Admin"],
    ],
    [2500, 5500, 2000]
  ));

  // 2. FEATURE COMPARISON
  ch.push(new Paragraph({ children: [new PageBreak()] }));
  ch.push(h1("2. Feature Comparison vs Competitors"));
  ch.push(makeTable(
    ["Feature", "SkulHub", "EduManage", "ClassCharts", "Excel/Sheets"],
    [
      ["Modules", "33+", "12", "5", "Unlimited (manual)"],
      ["M-Pesa Daraja STK Push", "Yes", "No", "No", "No"],
      ["CBC Support (Grade 1-8)", "Yes", "No", "No", "Manual"],
      ["8-4-4 Support (Form 1-4)", "Yes", "Partial", "No", "Manual"],
      ["Staff Roles", "13", "6", "3", "N/A"],
      ["Parent Portal", "Yes (no login)", "No", "No", "No"],
      ["Staff Self-Signup", "Yes (with approval)", "No", "No", "No"],
      ["Multi-School Platform", "Yes", "No", "No", "No"],
      ["Dark Mode", "Yes", "No", "No", "N/A"],
      ["Printable Invoices + Receipts", "Yes (with letterhead)", "Basic", "No", "Manual"],
      ["Auto Payment References", "Yes (Cash/Bank)", "No", "No", "No"],
      ["Timetable Visual Grid", "Yes", "Basic", "No", "No"],
      ["External Exam Marks Import", "Yes (KCSE/KCPE/Mock)", "No", "No", "Manual"],
      ["Referral Tracking", "Yes", "No", "No", "No"],
      ["Demo Request Form", "Yes", "No", "No", "No"],
      ["System Health Monitor", "Yes (auto-refresh)", "No", "No", "No"],
      ["Connection Auto-Retry", "Yes (3 retries)", "No", "No", "No"],
      ["Starting Price", "KES 2,500/mo", "KES 5,000/mo", "$50/mo", "Free"],
    ],
    [3000, 2000, 2000, 1500, 1500]
  ));

  // 3. SCHOOL ONBOARDING CHECKLIST
  ch.push(new Paragraph({ children: [new PageBreak()] }));
  ch.push(h1("3. School Onboarding Checklist"));
  ch.push(body("Use this checklist when onboarding a new school. Follow each step to ensure a smooth setup process."));

  ch.push(h2("Day 1: Registration & Setup"));
  ch.push(makeTable(
    ["Step", "Task", "Status", "Notes"],
    [
      ["1", "School registers on skulhub.co.ke (6-step wizard)", "☐", "School gets a school code (e.g., SKH-2026-003)"],
      ["2", "Send welcome email with login instructions", "☐", "Use email template #4 from docs/email-templates.md"],
      ["3", "Call the school to confirm they logged in", "☐", "Verify they can access the dashboard"],
      ["4", "Configure school settings (name, motto, colors)", "☐", "Settings > General tab"],
      ["5", "Set up academic year and term dates", "☐", "Settings > Academic tab"],
      ["6", "Create class levels and streams", "☐", "Academics > Class Levels"],
      ["7", "Add subjects and assign to departments", "☐", "Academics > Subjects"],
      ["8", "Set up fee structure for each class level", "☐", "Finance > Fee Structure"],
    ],
    [500, 4500, 1000, 4000]
  ));

  ch.push(h2("Day 2-3: Data Migration"));
  ch.push(makeTable(
    ["Step", "Task", "Status", "Notes"],
    [
      ["9", "Import existing student data (CSV)", "☐", "Data Import > Upload CSV"],
      ["10", "Import existing staff data", "☐", "Staff > Add Staff (or CSV import)"],
      ["11", "Set up guardian/parent contacts", "☐", "Students > Edit > Guardian tab"],
      ["12", "Generate invoices for current term", "☐", "Finance > Generate Invoices (bulk)"],
      ["13", "Record any existing payments", "☐", "Finance > Record Payment"],
      ["14", "Set up timetable (weekly schedule)", "☐", "Timetable > Add Lessons"],
      ["15", "Configure M-Pesa Daraja (if Premium)", "☐", "Settings > M-Pesa tab"],
    ],
    [500, 4500, 1000, 4000]
  ));

  ch.push(h2("Day 4-7: Training & Adoption"));
  ch.push(makeTable(
    ["Step", "Task", "Status", "Notes"],
    [
      ["16", "Conduct staff training session (1 hour)", "☐", "Cover: login, dashboard, attendance, grades"],
      ["17", "Train bursar on invoice/payment workflow", "☐", "Cover: generate invoice, record payment, print receipt"],
      ["18", "Train teachers on attendance + homework", "☐", "Cover: mark attendance, create homework, enter grades"],
      ["19", "Set up staff accounts and module access", "☐", "Settings > Module Access > Tick modules per user"],
      ["20", "Share parent portal info with parents", "☐", "Send school code + instructions via WhatsApp/SMS"],
      ["21", "Publish first announcement", "☐", "Communications > New Announcement"],
      ["22", "Test M-Pesa Daraja STK Push (if Premium)", "☐", "Finance > Test STK Push with small amount"],
      ["23", "Verify data accuracy (spot check 5 students)", "☐", "Compare with school's existing records"],
    ],
    [500, 4500, 1000, 4000]
  ));

  ch.push(h2("Day 14: First Check-in"));
  ch.push(makeTable(
    ["Step", "Task", "Status", "Notes"],
    [
      ["24", "Call school to check for issues", "☐", "Any login problems? Any questions?"],
      ["25", "Review usage stats (dashboard activity)", "☐", "How many invoices generated? Attendance marked?"],
      ["26", "Suggest features they haven't tried", "☐", "Library, transport, health, events, discipline"],
      ["27", "Offer additional training if needed", "☐", "Free for first session"],
    ],
    [500, 4500, 1000, 4000]
  ));

  ch.push(h2("Day 25: Trial Conversion"));
  ch.push(makeTable(
    ["Step", "Task", "Status", "Notes"],
    [
      ["28", "Send trial-ending reminder email", "☐", "Use email template #5 from docs/email-templates.md"],
      ["29", "Call to discuss plan selection", "☐", "Recommend plan based on student count"],
      ["30", "Process first payment (M-Pesa/Bank)", "☐", "Update subscription status in Super Admin"],
      ["31", "Generate subscription invoice", "☐", "Send to school via email"],
      ["32", "Confirm subscription is active", "☐", "Super Admin > Schools > Activate"],
    ],
    [500, 4500, 1000, 4000]
  ));

  // 4. TROUBLESHOOTING GUIDE
  ch.push(h2("Common Issues & Solutions"));
  ch.push(makeTable(
    ["Issue", "Solution"],
    [
      ["Can't log in", "Check: correct school code, correct email, password is case-sensitive. Try: admin@skulhub.ac.ke / admin123"],
      ["Dashboard shows 0 students", "Run: bun run prisma/seed-demo.ts to load demo data. Or add students manually."],
      ["M-Pesa STK Push not working", "Go to Settings > M-Pesa, enter Daraja credentials (Consumer Key, Secret, Passkey, Shortcode). See Daraja Guide tab."],
      ["Staff can't see modules", "Go to Settings > Module Access, select the user, tick the modules they need."],
      ["Can't print invoices", "Click the printer icon on any invoice row. Opens a new window with school letterhead."],
      ["Connection error", "System auto-retries 3 times. If persistent, wait 30 seconds and refresh."],
      ["Dark mode not working", "Click the sun/moon icon in the nav bar (top-right corner)."],
      ["Super admin access", "Press Ctrl+Shift+A on login screen. Access code: skulhub-super-2026"],
    ],
    [3500, 6500]
  ));

  ch.push(new Paragraph({ spacing: { before: 400 } }));
  ch.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 },
    children: [new TextRun({ text: "--- End of Document ---", size: 20, color: c(P.secondary), italics: true, font: { ascii: "Calibri" } })] }));

  return ch;
}

const doc = new Document({
  styles: { default: { document: {
    run: { font: { ascii: "Calibri" }, size: 22, color: c(P.body) },
    paragraph: { spacing: { line: 312 } },
  }, heading1: { run: { font: { ascii: "Calibri" }, size: 32, bold: true, color: c(P.primary) }, paragraph: { spacing: { before: 360, after: 160, line: 312 } } },
  heading2: { run: { font: { ascii: "Calibri" }, size: 28, bold: true, color: c(P.primary) }, paragraph: { spacing: { before: 280, after: 120, line: 312 } } },
  } },
  sections: [
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } } }, children: buildCover() },
    { properties: { type: SectionType.NEXT_PAGE, page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 } } },
      headers: { default: new (require("docx").Header)({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SkulHub Product Features & Onboarding", size: 18, color: c(P.secondary), font: { ascii: "Calibri" } })] })] }) },
      footers: { default: new (require("docx").Footer)({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 18, color: c(P.secondary) }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })] })] }) },
      children: buildBody() },
  ],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/z/my-project/docs/SkulHub-Features-Onboarding.docx", buf);
  console.log("Generated: SkulHub-Features-Onboarding.docx");
});
