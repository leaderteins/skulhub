// SkulHub System Documentation & Sign-off Document
// Generates a professional Word document with system overview, user flows, and sign-off section.

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, PageBreak, Header, Footer, PageNumber,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  PageOrientation, SectionType, TableLayoutType, LevelFormat,
} = require("docx");
const fs = require("fs");
const path = require("path");
const { imageSize } = require("image-size");

// ── Palette: WM-1 Warm Teal (education) ──
const P = {
  bg: "F4F1E9",
  primary: "15857A",
  body: "2C2C2C",
  secondary: "606060",
  accent: "FF6A3B",
  surface: "F0EDE5",
  headerBg: "15857A",
  headerText: "FFFFFF",
  innerLine: "D5D0C8",
  titleColor: "FFFFFF",
  subtitleColor: "B0B8C0",
  metaColor: "90989F",
  footerColor: "687078",
};
const c = (hex) => hex.replace("#", "");

// ── Borders ──
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

// ── Helpers ──
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160, line: 312 },
    children: [new TextRun({ text, bold: true, size: 32, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, size: 28, color: c(P.primary), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100, line: 312 },
    children: [new TextRun({ text, bold: true, size: 24, color: c(P.body), font: { ascii: "Calibri", eastAsia: "SimHei" } })],
  });
}

function body(text) {
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { line: 312, after: 80 },
    children: [new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Calibri" } })],
  });
}

function bullet(text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { line: 312, after: 40 },
    children: [new TextRun({ text, size: 22, color: c(P.body), font: { ascii: "Calibri" } })],
  });
}

function bold(text) {
  return new TextRun({ text, bold: true, size: 22, color: c(P.primary), font: { ascii: "Calibri" } });
}

function tableHeaderCell(text) {
  return new TableCell({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text, bold: true, size: 20, color: P.headerText, font: { ascii: "Calibri" } })],
    })],
    shading: { type: ShadingType.CLEAR, fill: P.headerBg },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
  });
}

function tableCell(text, opts = {}) {
  return new TableCell({
    children: [new Paragraph({
      spacing: { line: 280 },
      children: [new TextRun({ text, size: 20, color: c(P.body), font: { ascii: "Calibri" }, ...opts })],
    })],
    shading: opts.bg ? { type: ShadingType.CLEAR, fill: opts.bg } : undefined,
    margins: { top: 60, bottom: 60, left: 120, right: 120 },
  });
}

function makeTable(headers, rows, colWidths) {
  const headerRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: headers.map(h => tableHeaderCell(h)),
  });
  const dataRows = rows.map((row, i) => new TableRow({
    cantSplit: true,
    children: row.map((cell, j) => tableCell(cell, { bg: i % 2 === 0 ? P.surface : undefined })),
  }));
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: colWidths,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: P.headerBg },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: P.headerBg },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.innerLine },
      insideVertical: NB,
    },
    rows: [headerRow, ...dataRows],
  });
}

// ── Cover (R1 Pure Paragraph) ──
function buildCover() {
  const padL = 1200, padR = 800;
  const children = [];

  // Top spacing
  children.push(new Paragraph({ spacing: { before: 3600 } }));

  // English label
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    spacing: { after: 500 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } },
    children: [new TextRun({
      text: "S  Y  S  T  E  M    D  O  C  U  M  E  N  T  A  T  I  O  N",
      size: 18, color: P.accent, font: { ascii: "Calibri" },
    })],
  }));

  // Main title
  children.push(new Paragraph({
    indent: { left: padL },
    spacing: { after: 100, line: 920, lineRule: "atLeast" },
    children: [new TextRun({
      text: "SkulHub",
      size: 80, bold: true, color: P.titleColor, font: { ascii: "Arial" },
    })],
  }));
  children.push(new Paragraph({
    indent: { left: padL },
    spacing: { after: 300, line: 600, lineRule: "atLeast" },
    children: [new TextRun({
      text: "School Management System",
      size: 36, bold: false, color: P.subtitleColor, font: { ascii: "Arial" },
    })],
  }));

  // Subtitle
  children.push(new Paragraph({
    indent: { left: padL },
    spacing: { after: 800 },
    children: [new TextRun({
      text: "System Documentation & User Flow Guide",
      size: 26, color: P.subtitleColor, font: { ascii: "Arial" },
    })],
  }));

  // Meta info
  const metaLines = [
    "Version: 1.0",
    "Date: August 2026",
    "Prepared by: SkulHub Development Team",
    "Website: skulhub.co.ke",
    "Email: info@skulhub.co.ke",
    "Phone: 0742 340 924",
  ];
  for (const line of metaLines) {
    children.push(new Paragraph({
      indent: { left: padL + 200 },
      spacing: { after: 80 },
      border: { left: { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 12 } },
      children: [new TextRun({ text: line, size: 24, color: P.metaColor, font: { ascii: "Arial" } })],
    }));
  }

  // Bottom spacing
  children.push(new Paragraph({ spacing: { before: 2800 } }));

  // Footer
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: P.accent, space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: "CONFIDENTIAL", size: 16, color: P.footerColor, font: { ascii: "Arial" } }),
      new TextRun({ text: "                                        " }),
      new TextRun({ text: "SkulHub  2026", size: 16, color: P.footerColor, font: { ascii: "Arial" } }),
    ],
  }));

  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: P.bg },
        borders: noBorders,
        children,
      })],
    })],
  })];
}

// ── Body Content ──
function buildBody() {
  const children = [];

  // ── 1. SYSTEM OVERVIEW ──
  children.push(h1("1. System Overview"));
  children.push(body("SkulHub is a comprehensive, cloud-based school management system designed specifically for Kenyan schools and educational institutions. It provides 33+ integrated modules covering every aspect of school operations, from student admissions and fee collection to examination management and parent communication."));
  children.push(body("The system is built on Next.js 16 with TypeScript, uses Prisma ORM with PostgreSQL for data storage, and is hosted on Vercel's global CDN. It supports multi-tenancy, allowing unlimited schools to operate on a single platform with complete data isolation."));

  children.push(h2("1.1 Key Features"));
  children.push(bullet("33+ integrated modules covering all school operations"));
  children.push(bullet("Multi-tenancy with complete data isolation between schools"));
  children.push(bullet("13 staff roles with granular, role-based access control"));
  children.push(bullet("Parent portal for fee checking, grades, and attendance"));
  children.push(bullet("Staff self-signup with principal approval workflow"));
  children.push(bullet("M-Pesa Daraja STK Push integration for fee collection"));
  children.push(bullet("CBC (Grade 1-8) and 8-4-4 (Form 1-4) curriculum support"));
  children.push(bullet("Printable invoices, receipts, and report cards with school letterhead"));
  children.push(bullet("Dark mode for eye comfort"));
  children.push(bullet("Auto-retry on connection errors with system health monitoring"));

  children.push(h2("1.2 Technology Stack"));
  children.push(makeTable(
    ["Component", "Technology", "Purpose"],
    [
      ["Framework", "Next.js 16 (App Router)", "Web application framework"],
      ["Language", "TypeScript 5", "Type-safe development"],
      ["Styling", "Tailwind CSS 4 + shadcn/ui", "Responsive UI design"],
      ["Database", "PostgreSQL (Neon)", "Persistent data storage"],
      ["ORM", "Prisma 6", "Database access layer"],
      ["Hosting", "Vercel", "Global CDN deployment"],
      ["Code Repository", "GitHub (Private)", "Version control"],
      ["Authentication", "HMAC-signed session tokens", "Secure login"],
      ["Payments", "Safaricom Daraja API", "M-Pesa STK Push"],
      ["State Management", "Zustand", "Client-side state"],
    ],
    [3000, 3500, 3500]
  ));

  // ── 2. USER ROLES & ACCESS ──
  children.push(h1("2. User Roles & Access Control"));
  children.push(body("SkulHub supports 13 distinct staff roles plus a platform super admin. Each role has specific module access permissions that can be further customized on a per-user basis by the school admin or principal."));

  children.push(h2("2.1 Role Descriptions"));
  children.push(makeTable(
    ["Role", "Key Responsibilities", "Module Access Level"],
    [
      ["Super Admin", "Platform owner, manages all schools", "Super Admin dashboard, Settings"],
      ["Admin", "School administrator, full access", "All 33+ modules"],
      ["Principal", "Head of school, full access", "All modules except system settings"],
      ["Deputy Principal", "Assists principal, academic focus", "Academic + administration modules"],
      ["Bursar", "Fee collection, finance", "Finance, procurement, payroll"],
      ["Teacher", "Teaching, attendance, grades", "Students, academics, attendance, exams"],
      ["Librarian", "Library management", "Library, inventory requests"],
      ["Nurse", "Health records", "Health module, students"],
      ["Matron", "Boarding supervision", "Hostel, health, discipline"],
      ["Secretary", "Administration, communications", "Admissions, students, communications"],
      ["Admissions Clerk", "Student admissions", "Admissions, students, ID cards"],
      ["Bus Driver", "Transport management", "Transport module"],
      ["Gate Man", "Security, visitor tracking", "Visitors, transport"],
      ["Cook", "Kitchen, meal management", "Cafeteria, inventory requests"],
    ],
    [2500, 4500, 3000]
  ));

  // ── 3. USER FLOWS ──
  children.push(h1("3. User Flows"));
  children.push(body("This section describes the step-by-step workflow for each major user type, from login to completing their primary tasks."));

  // Admin Flow
  children.push(h2("3.1 School Admin Flow"));
  children.push(h3("Login Process"));
  children.push(bullet("Visit skulhub.co.ke and click 'Sign In'"));
  children.push(bullet("Enter school code (e.g., SKH-2024-001) and click 'Continue'"));
  children.push(bullet("Enter admin email and password"));
  children.push(bullet("System authenticates and redirects to the dashboard"));
  children.push(h3("Daily Tasks"));
  children.push(bullet("View dashboard for school-wide statistics (students, fees, attendance)"));
  children.push(bullet("Manage staff approvals (approve/reject new staff signups)"));
  children.push(bullet("Configure module access for individual users (Settings > Module Access)"));
  children.push(bullet("Set up fee structures and generate bulk invoices"));
  children.push(bullet("Monitor financial reports and collection rates"));
  children.push(bullet("Manage school settings (general, academic, notifications, M-Pesa)"));

  // Principal Flow
  children.push(h2("3.2 Principal Flow"));
  children.push(h3("Login Process"));
  children.push(bullet("Same as admin: school code + email + password"));
  children.push(h3("Daily Tasks"));
  children.push(bullet("Review dashboard for key metrics and trends"));
  children.push(bullet("Approve/reject staff registration requests"));
  children.push(bullet("Monitor attendance trends and student performance"));
  children.push(bullet("Publish announcements for staff, students, and parents"));
  children.push(bullet("Review discipline incidents and take action"));
  children.push(bullet("Oversee hostel/boarding allocations"));
  children.push(bullet("Generate and review comprehensive reports"));

  // Bursar Flow
  children.push(h2("3.3 Bursar Flow"));
  children.push(h3("Login Process"));
  children.push(bullet("Same as admin: school code + email + password"));
  children.push(h3("Daily Tasks"));
  children.push(bullet("View financial dashboard: total billed, collected, outstanding"));
  children.push(bullet("Generate invoices for students (individual or bulk)"));
  children.push(bullet("Record payments (M-Pesa, Cash, Bank Transfer, Cheque)"));
  children.push(bullet("Cash payments get auto-generated reference numbers (CSH-YYYYMMDD-XXXX)"));
  children.push(bullet("Print invoices and payment receipts with school letterhead"));
  children.push(bullet("Initiate M-Pesa STK Push for fee collection (if Daraja configured)"));
  children.push(bullet("Manage expenses and scholarships"));
  children.push(bullet("Generate financial reports for the principal"));

  // Teacher Flow
  children.push(h2("3.4 Teacher Flow"));
  children.push(h3("Login Process"));
  children.push(bullet("Same as admin: school code + email + password"));
  children.push(h3("Daily Tasks"));
  children.push(bullet("Mark daily attendance for assigned class"));
  children.push(bullet("Record grades for assessments and exams"));
  children.push(bullet("Add external exam marks (KCSE, KCPE, Mock) for students"));
  children.push(bullet("Change wrongly assigned subjects on assessments"));
  children.push(bullet("Create and assign homework"));
  children.push(bullet("Create lesson plans and schemes of work"));
  children.push(bullet("View timetable for teaching schedule"));
  children.push(bullet("Submit inventory requests for teaching materials"));

  // Parent Flow
  children.push(h2("3.5 Parent Flow"));
  children.push(h3("Login Process"));
  children.push(bullet("Visit skulhub.co.ke and click 'Parent? Access parent portal'"));
  children.push(bullet("Enter school code, student admission number, and guardian phone number"));
  children.push(bullet("No password required - verified by matching phone number"));
  children.push(h3("Portal Features"));
  children.push(bullet("View child's fee summary (billed, paid, balance)"));
  children.push(bullet("Check recent attendance records"));
  children.push(bullet("View recent grades and exam results"));
  children.push(bullet("Read school announcements"));
  children.push(bullet("Check upcoming events"));

  // Staff Signup Flow
  children.push(h2("3.6 Staff Self-Signup Flow"));
  children.push(h3("Registration Process"));
  children.push(bullet("Staff member visits skulhub.co.ke and clicks 'Staff? Sign up to join your school'"));
  children.push(bullet("Enters the school code (provided by the school)"));
  children.push(bullet("Fills personal details: name, email, password, phone, role, gender, qualification, specialization"));
  children.push(bullet("Account is created with 'Pending' status"));
  children.push(bullet("Principal/Admin sees the request in 'Staff Approvals' module"));
  children.push(bullet("Principal approves or rejects (with reason) the request"));
  children.push(bullet("If approved: staff can log in with their credentials"));
  children.push(bullet("If rejected: staff sees the rejection reason when trying to log in"));

  // School Registration Flow
  children.push(h2("3.7 New School Registration Flow"));
  children.push(h3("Registration Process"));
  children.push(bullet("School visits skulhub.co.ke and clicks 'Start Free Trial'"));
  children.push(bullet("Completes 6-step registration wizard:"));
  children.push(bullet("  Step 1: School basics (name, category, email, phone)"));
  children.push(bullet("  Step 2: School type (level, KNEC code, year established)"));
  children.push(bullet("  Step 3: Gender & location (Boys/Girls/Mixed, county, address)"));
  children.push(bullet("  Step 4: School identity (motto, brand color, logo)"));
  children.push(bullet("  Step 5: Principal account (name, email, password)"));
  children.push(bullet("  Step 6: Review & submit"));
  children.push(bullet("System auto-generates school code (e.g., SKH-2026-003)"));
  children.push(bullet("School gets 30-day free trial"));
  children.push(bullet("Principal can log in immediately and start using the system"));

  // Super Admin Flow
  children.push(h2("3.8 Super Admin (Platform Owner) Flow"));
  children.push(h3("Login Process"));
  children.push(bullet("On the login screen, press Ctrl+Shift+A"));
  children.push(bullet("Enter access code: skulhub-super-2026"));
  children.push(bullet("Enter super admin email and password"));
  children.push(h3("Platform Management Tasks"));
  children.push(bullet("View all registered schools with stats (students, staff, revenue)"));
  children.push(bullet("Activate, suspend, upgrade, or delete schools"));
  children.push(bullet("Monitor platform-wide revenue and growth"));
  children.push(bullet("View and manage demo requests from the website"));
  children.push(bullet("Track referrals and commission payouts"));
  children.push(bullet("Monitor system health (database, storage, network, auth, M-Pesa)"));

  // ── 4. MODULE OVERVIEW ──
  children.push(h1("4. Module Overview"));
  children.push(body("SkulHub includes 33+ modules organized into functional groups. Each module is accessible from the sidebar based on the user's role and permissions."));

  children.push(h2("4.1 Module List"));
  children.push(makeTable(
    ["Module", "Group", "Description"],
    [
      ["Dashboard", "Overview", "Real-time school stats, charts, and activity feed"],
      ["Admissions", "People", "Manage student applications and enrollment pipeline"],
      ["Students", "People", "Student profiles, enrollment, guardian information"],
      ["Staff & Teachers", "People", "Staff management, assignments, departments"],
      ["Staff Approvals", "People", "Approve/reject staff self-signup requests"],
      ["Alumni", "People", "Graduate tracking and donations"],
      ["Academics", "Academic", "Classes, subjects, streams, departments"],
      ["Attendance", "Academic", "Daily marking, reports, trends"],
      ["Examinations", "Academic", "Question banks, CATs, grading, external marks"],
      ["Report Cards", "Academic", "KCSE-style printable report cards"],
      ["Lesson Plans", "Academic", "Schemes of work and lesson planning"],
      ["Homework", "Academic", "Assignment creation and tracking"],
      ["Timetable", "Academic", "Weekly class schedule with visual grid"],
      ["Finance & Fees", "Administration", "Invoices, payments, M-Pesa, expenses"],
      ["Payroll", "Administration", "Staff salaries and payslips"],
      ["Communications", "Administration", "Announcements, SMS/email queue"],
      ["Library", "Administration", "Books, borrowing, returns"],
      ["Transport", "Administration", "Routes, vehicles, assignments"],
      ["Inventory", "Administration", "Assets, stocktake, restock, purchase orders"],
      ["Health & Wellness", "Academic", "Medical records, clinic visits"],
      ["Hostel & Boarding", "Academic", "Dormitories, beds, allocations"],
      ["Events & Activities", "Academic", "Calendar and event management"],
      ["Discipline", "Academic", "Incidents and sanctions tracking"],
      ["Cafeteria & Meals", "Administration", "Menu and dining attendance"],
      ["Procurement", "Administration", "Suppliers and purchase orders"],
      ["Facilities", "Administration", "Facility booking management"],
      ["Visitors & Gate", "Administration", "Security and visitor tracking"],
      ["Staff Room Board", "Insights", "Live display screen for staff"],
      ["Appraisals", "Insights", "Staff performance reviews"],
      ["Feedback", "Insights", "Surveys and ratings"],
      ["ID Cards", "Insights", "Printable student/staff IDs"],
      ["Data Import", "Insights", "Bulk data migration"],
      ["Reports", "Insights", "Analytics and reporting"],
      ["Settings", "Insights", "System configuration"],
    ],
    [3000, 2000, 5000]
  ));

  // ── 5. SECURITY & DATA PROTECTION ──
  children.push(h1("5. Security & Data Protection"));
  children.push(h2("5.1 Authentication"));
  children.push(bullet("HMAC-signed session tokens (7-day expiry)"));
  children.push(bullet("Passwords hashed with bcrypt (10 rounds)"));
  children.push(bullet("HttpOnly cookies prevent XSS token theft"));
  children.push(bullet("Per-user module access overrides (admin can tick/untick modules per user)"));

  children.push(h2("5.2 Data Isolation"));
  children.push(bullet("Each school has a unique schoolId"));
  children.push(bullet("All queries are scoped to the user's schoolId"));
  children.push(bullet("Schools cannot access each other's data"));
  children.push(bullet("Super admin can see aggregate data across all schools"));

  children.push(h2("5.3 Database Security"));
  children.push(bullet("PostgreSQL hosted on Neon (encrypted at rest)"));
  children.push(bullet("SSL/TLS connection (sslmode=require)"));
  children.push(bullet("Automated daily backups (Neon)"));
  children.push(bullet("Point-in-time recovery available"));

  // ── 6. DEPLOYMENT ──
  children.push(h1("6. Deployment Architecture"));
  children.push(h2("6.1 Infrastructure"));
  children.push(makeTable(
    ["Component", "Provider", "Location", "Purpose"],
    [
      ["Code Repository", "GitHub", "Cloud", "Version control (private repo)"],
      ["Web Hosting", "Vercel", "Global CDN", "Next.js deployment"],
      ["Database", "Neon", "Singapore (ap-southeast-1)", "PostgreSQL"],
      ["DNS", "Cloudflare", "Global", "Domain name resolution"],
      ["Domain", "Truehost", "Kenya", "skulhub.co.ke registration"],
    ],
    [2500, 2000, 2500, 3000]
  ));

  children.push(h2("6.2 Deployment Flow"));
  children.push(bullet("Developer pushes code to GitHub"));
  children.push(bullet("Vercel auto-detects the push and starts building"));
  children.push(bullet("Vercel runs: prisma generate -> next build"));
  children.push(bullet("If build succeeds, deployment goes live automatically"));
  children.push(bullet("Changes are visible on skulhub.co.ke within 2-3 minutes"));

  // ── 7. DEMO CREDENTIALS ──
  children.push(h1("7. Demo Credentials"));
  children.push(body("The following credentials are for the demo school (SkulHub Academy, code: SKH-2024-001):"));
  children.push(makeTable(
    ["Role", "Email", "Password"],
    [
      ["Admin", "admin@skulhub.ac.ke", "admin123"],
      ["Principal", "principal@skulhub.ac.ke", "principal123"],
      ["Deputy Principal", "deputy@skulhub.ac.ke", "deputy123"],
      ["Bursar", "bursar@skulhub.ac.ke", "bursar123"],
      ["Teacher", "teacher@skulhub.ac.ke", "teacher123"],
      ["Librarian", "librarian@skulhub.ac.ke", "librarian123"],
      ["Nurse", "nurse@skulhub.ac.ke", "nurse123"],
      ["Admissions", "admissions@skulhub.ac.ke", "admissions123"],
      ["Matron", "matron@skulhub.ac.ke", "matron123"],
      ["Secretary", "secretary@skulhub.ac.ke", "secretary123"],
      ["Bus Driver", "driver@skulhub.ac.ke", "driver123"],
      ["Gate Officer", "gate@skulhub.ac.ke", "gate123"],
      ["Cook", "cook@skulhub.ac.ke", "cook123"],
      ["Super Admin", "superadmin@skulhub.ac.ke", "superadmin123"],
    ],
    [3000, 4500, 2500]
  ));
  children.push(body("Super Admin access: Press Ctrl+Shift+A on the login screen, then enter access code: skulhub-super-2026"));

  // ── 8. SIGN-OFF ──
  children.push(new Paragraph({ children: [new PageBreak()] }));
  children.push(h1("8. System Sign-off"));
  children.push(body("By signing below, the parties acknowledge that they have reviewed the SkulHub School Management System documentation, understand the system's capabilities, user flows, and security measures, and agree to the system being deployed and used as described above."));

  children.push(h2("8.1 Acknowledgement"));
  children.push(bullet("The system has been reviewed and meets the school's requirements."));
  children.push(bullet("All user roles and access permissions are understood and agreed upon."));
  children.push(bullet("The school agrees to maintain the confidentiality of all login credentials."));
  children.push(bullet("The school understands that data is stored securely on cloud servers (Vercel + Neon PostgreSQL)."));
  children.push(bullet("The school agrees to the pricing plan selected below."));
  children.push(bullet("The system is accepted for production use."));

  children.push(h2("8.2 Subscription Details"));
  children.push(makeTable(
    ["Field", "Details"],
    [
      ["School Name", "_______________________________________"],
      ["School Code", "_______________________________________"],
      ["Selected Plan", "Starter (KES 2,500/mo) / Standard (KES 5,000/mo) / Premium (KES 10,000/mo)"],
      ["Billing Cycle", "Monthly / Annually (2 months free)"],
      ["Trial End Date", "_______________________________________"],
      ["Subscription Start Date", "_______________________________________"],
    ],
    [3000, 7000]
  ));

  children.push(h2("8.3 Authorised Signatures"));

  // Signature table
  const sigTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [5000, 5000],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: P.primary },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: P.primary },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: P.innerLine },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: P.innerLine },
    },
    rows: [
      new TableRow({
        cantSplit: true,
        children: [
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: "School Representative", bold: true, size: 22, color: c(P.primary) })] }),
              new Paragraph({ spacing: { before: 200 }, children: [] }),
              new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Name: _______________________________", size: 20, color: c(P.body) })] }),
              new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "Title: ________________________________", size: 20, color: c(P.body) })] }),
              new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "Signature: ___________________________", size: 20, color: c(P.body) })] }),
              new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "Date: ________________________________", size: 20, color: c(P.body) })] }),
              new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "Stamp:", size: 20, color: c(P.body) })] }),
              new Paragraph({ spacing: { before: 400 }, children: [] }),
            ],
            margins: { top: 200, bottom: 200, left: 200, right: 200 },
          }),
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: "SkulHub Platform Owner", bold: true, size: 22, color: c(P.primary) })] }),
              new Paragraph({ spacing: { before: 200 }, children: [] }),
              new Paragraph({ spacing: { before: 200 }, children: [new TextRun({ text: "Name: _______________________________", size: 20, color: c(P.body) })] }),
              new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "Title: ________________________________", size: 20, color: c(P.body) })] }),
              new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "Signature: ___________________________", size: 20, color: c(P.body) })] }),
              new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "Date: ________________________________", size: 20, color: c(P.body) })] }),
              new Paragraph({ spacing: { before: 120 }, children: [new TextRun({ text: "Stamp:", size: 20, color: c(P.body) })] }),
              new Paragraph({ spacing: { before: 400 }, children: [] }),
            ],
            margins: { top: 200, bottom: 200, left: 200, right: 200 },
          }),
        ],
      }),
    ],
  });
  children.push(sigTable);

  children.push(h2("8.4 Terms & Conditions"));
  children.push(bullet("The school agrees to pay the monthly subscription fee by the 5th of each month."));
  children.push(bullet("The subscription can be cancelled at any time with 30 days' notice."));
  children.push(bullet("Data export is available on request at no additional cost."));
  children.push(bullet("SkulHub is not liable for data loss due to school negligence (e.g., sharing credentials)."));
  children.push(bullet("Support is available via email (info@skulhub.co.ke) and phone (0742 340 924)."));
  children.push(bullet("Free training is provided for the first session (up to 20 staff)."));
  children.push(bullet("The school is responsible for maintaining accurate data in the system."));
  children.push(bullet("Any custom feature requests will be quoted separately."));

  children.push(new Paragraph({ spacing: { before: 400 } }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 200 },
    children: [new TextRun({
      text: "--- End of Document ---",
      size: 20, color: c(P.secondary), italics: true, font: { ascii: "Calibri" },
    })],
  }));

  return children;
}

// ── Assemble Document ──
const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 22, color: c(P.body) },
        paragraph: { spacing: { line: 312 } },
      },
      heading1: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 32, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 360, after: 160, line: 312 } },
      },
      heading2: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 28, bold: true, color: c(P.primary) },
        paragraph: { spacing: { before: 280, after: 120, line: 312 } },
      },
      heading3: {
        run: { font: { ascii: "Calibri", eastAsia: "SimHei" }, size: 24, bold: true, color: c(P.body) },
        paragraph: { spacing: { before: 200, after: 100, line: 312 } },
      },
    },
  },
  sections: [
    // Cover section
    {
      properties: {
        page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } },
      },
      children: buildCover(),
    },
    // Body section
    {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "SkulHub System Documentation", size: 18, color: c(P.secondary), font: { ascii: "Calibri" } })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", size: 18, color: c(P.secondary) }),
              new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) }),
            ],
          })],
        }),
      },
      children: buildBody(),
    },
  ],
});

Packer.toBuffer(doc).then(buf => {
  const outPath = "/home/z/my-project/docs/SkulHub-System-Documentation.docx";
  fs.writeFileSync(outPath, buf);
  console.log("Generated: " + outPath);
});
