// SkulHub Marketing & Revenue Plan Document
// Generates a professional Word document with marketing strategy, revenue projections,
// and embedded charts.

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, PageBreak, Header, Footer, PageNumber,
  AlignmentType, HeadingLevel, WidthType, BorderStyle, ShadingType,
  PageOrientation, SectionType, TableLayoutType,
} = require("docx");
const fs = require("fs");
const { imageSize } = require("image-size");

// ── Palette: WM-1 Warm Teal (education/marketing) ──
const P = {
  bg: "F4F1E9", primary: "15857A", body: "2C2C2C", secondary: "606060",
  accent: "FF6A3B", surface: "F0EDE5", headerBg: "15857A", headerText: "FFFFFF",
  innerLine: "D5D0C8", titleColor: "FFFFFF", subtitleColor: "B0B8C0",
  metaColor: "90989F", footerColor: "687078",
};
const c = (hex) => hex.replace("#", "");
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
function h3(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100, line: 312 },
    children: [new TextRun({ text, bold: true, size: 24, color: c(P.body), font: { ascii: "Calibri" } })] });
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
    shading: opts.bg ? { type: ShadingType.CLEAR, fill: opts.bg } : undefined, margins: { top: 60, bottom: 60, left: 120, right: 120 } });
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

function embedChart(filePath, maxWidth = 500) {
  const buf = fs.readFileSync(filePath);
  const dims = imageSize(buf);
  const h = Math.round(maxWidth * (dims.height / dims.width));
  return new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200, after: 100 },
    children: [new ImageRun({ data: buf, transformation: { width: maxWidth, height: h }, type: "png" })] });
}

// ── Cover ──
function buildCover() {
  const padL = 1200, padR = 800;
  const ch = [];
  ch.push(new Paragraph({ spacing: { before: 3600 } }));
  ch.push(new Paragraph({ indent: { left: padL, right: padR }, spacing: { after: 500 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } },
    children: [new TextRun({ text: "M  A  R  K  E  T  I  N  G    &    R  E  V  E  N  U  E    P  L  A  N", size: 18, color: P.accent, font: { ascii: "Calibri" } })] }));
  ch.push(new Paragraph({ indent: { left: padL }, spacing: { after: 100, line: 920, lineRule: "atLeast" },
    children: [new TextRun({ text: "SkulHub", size: 80, bold: true, color: P.titleColor, font: { ascii: "Arial" } })] }));
  ch.push(new Paragraph({ indent: { left: padL }, spacing: { after: 300, line: 600, lineRule: "atLeast" },
    children: [new TextRun({ text: "Marketing & Revenue Strategy", size: 36, color: P.subtitleColor, font: { ascii: "Arial" } })] }));
  ch.push(new Paragraph({ indent: { left: padL }, spacing: { after: 800 },
    children: [new TextRun({ text: "12-Month Growth Plan for the Kenyan Education Market", size: 26, color: P.subtitleColor, font: { ascii: "Arial" } })] }));
  for (const line of ["Version: 1.0", "Date: August 2026", "Prepared by: SkulHub", "Website: skulhub.co.ke", "Phone: 0742 340 924"]) {
    ch.push(new Paragraph({ indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 12 } },
      children: [new TextRun({ text: line, size: 24, color: P.metaColor, font: { ascii: "Arial" } })] }));
  }
  ch.push(new Paragraph({ spacing: { before: 2800 } }));
  ch.push(new Paragraph({ indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: P.accent, space: 8 } }, spacing: { before: 200 },
    children: [ new TextRun({ text: "CONFIDENTIAL", size: 16, color: P.footerColor, font: { ascii: "Arial" } }),
      new TextRun({ text: "                                        " }),
      new TextRun({ text: "SkulHub  2026", size: 16, color: P.footerColor, font: { ascii: "Arial" } }) ] }));
  return [new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, layout: TableLayoutType.FIXED, borders: allNoBorders,
    rows: [new TableRow({ height: { value: 16838, rule: "exact" }, children: [new TableCell({ shading: { type: ShadingType.CLEAR, fill: P.bg }, borders: noBorders, children: ch })] })] })];
}

// ── Body ──
function buildBody() {
  const ch = [];
  const CHARTS = "/home/z/my-project/docs/charts";

  // 1. EXECUTIVE SUMMARY
  ch.push(h1("1. Executive Summary"));
  ch.push(body("SkulHub is a comprehensive school management system built for the Kenyan education market. This document outlines the marketing strategy, pricing model, revenue projections, and growth plan for the first 12 months of operation."));
  ch.push(body("The target is to acquire 35 schools within 12 months, generating KES 175,000/month in recurring revenue (KES 2.1M annually). The strategy focuses on direct school visits, WhatsApp group marketing, Facebook advertising, and a referral program offering 15% commission."));

  // 2. MARKET ANALYSIS
  ch.push(h1("2. Market Analysis"));
  ch.push(h2("2.1 Target Market"));
  ch.push(body("Kenya has over 30,000 primary and secondary schools. The target market for SkulHub is private schools, which have the budget and decision-making autonomy to adopt digital management systems. There are approximately 8,000 private schools in Kenya."));
  ch.push(h2("2.2 Competitor Landscape"));
  ch.push(makeTable(
    ["Competitor", "Strengths", "Weaknesses", "SkulHub Advantage"],
    [
      ["EduManage", "Established brand", "No M-Pesa, no CBC, limited modules", "33+ modules, M-Pesa Daraja, CBC support"],
      ["ClassCharts", "Attendance focus", "Not built for Kenya, expensive", "Built for Kenya, affordable, parent portal"],
      ["Manual Systems", "Free", "Error-prone, time-consuming, no analytics", "Saves 10+ hours/week, real-time analytics"],
      ["Excel/Google Sheets", "Flexible, free", "No multi-user, no automation", "13 roles, auto-invoicing, M-Pesa"],
    ],
    [2000, 2500, 2500, 3000]
  ));

  // 3. PRICING STRATEGY
  ch.push(h1("3. Pricing Strategy"));
  ch.push(body("SkulHub offers 4 pricing tiers designed to accommodate schools of all sizes, from small primary schools to large secondary institutions."));
  ch.push(makeTable(
    ["Plan", "Monthly (KES)", "Annual (KES)", "Students", "Key Features"],
    [
      ["Starter", "2,500", "25,000 (2 months free)", "Up to 200", "All 33+ modules, 5 users, parent portal, email support"],
      ["Standard", "5,000", "50,000 (2 months free)", "Up to 1,000", "20 users, SMS notifications, priority support, data migration"],
      ["Premium", "10,000", "100,000 (2 months free)", "Unlimited", "M-Pesa Daraja, dedicated support, custom branding, API access"],
      ["Enterprise", "Custom", "Custom", "Unlimited", "On-premise, SLA, custom development, dedicated manager"],
    ],
    [1500, 1500, 2500, 1500, 3000]
  ));

  // Revenue chart
  ch.push(h2("3.1 Expected Plan Distribution"));
  ch.push(body("Based on market research and competitor analysis, the expected distribution of schools across pricing plans is projected as follows:"));
  ch.push(embedChart(`${CHARTS}/plan_distribution.png`, 450));

  ch.push(h2("3.2 Annual Revenue by Plan (Year 1 Projection)"));
  ch.push(body("With 35 schools in Year 1, the projected annual revenue by plan:"));
  ch.push(embedChart(`${CHARTS}/annual_revenue.png`, 500));

  // 4. REVENUE PROJECTIONS
  ch.push(h1("4. Revenue Projections"));
  ch.push(body("The following chart shows the projected revenue growth and school acquisition over 12 months:"));
  ch.push(embedChart(`${CHARTS}/revenue_growth.png`, 550));

  ch.push(h2("4.1 Monthly Revenue Breakdown"));
  ch.push(makeTable(
    ["Month", "New Schools", "Total Schools", "Monthly Revenue (KES)", "Cumulative Revenue (KES)"],
    [
      ["Month 1", "2", "2", "5,000", "5,000"],
      ["Month 2", "3", "5", "12,500", "17,500"],
      ["Month 3", "5", "10", "25,000", "42,500"],
      ["Month 4", "3", "13", "32,500", "75,000"],
      ["Month 5", "4", "17", "42,500", "117,500"],
      ["Month 6", "3", "20", "50,000", "167,500"],
      ["Month 7", "5", "25", "62,500", "230,000"],
      ["Month 8", "3", "28", "70,000", "300,000"],
      ["Month 9", "4", "32", "80,000", "380,000"],
      ["Month 10", "1", "33", "82,500", "462,500"],
      ["Month 11", "1", "34", "85,000", "547,500"],
      ["Month 12", "1", "35", "87,500", "635,000"],
    ],
    [1500, 1500, 1500, 2500, 2500]
  ));
  ch.push(body("Note: Monthly revenue varies based on the mix of Starter (KES 2,500), Standard (KES 5,000), and Premium (KES 10,000) plans. The Year 1 total projected revenue is approximately KES 635,000, with a run-rate of KES 87,500/month by Month 12."));

  ch.push(h2("4.2 Year 2-3 Projections"));
  ch.push(makeTable(
    ["Metric", "Year 1", "Year 2", "Year 3"],
    [
      ["Total Schools", "35", "80", "150"],
      ["Monthly Revenue (KES)", "87,500", "200,000", "375,000"],
      ["Annual Revenue (KES)", "1,050,000", "2,400,000", "4,500,000"],
      ["Referral Commission Paid (KES)", "157,500", "360,000", "675,000"],
      ["Net Revenue (KES)", "892,500", "2,040,000", "3,825,000"],
    ],
    [3000, 2000, 2000, 2000]
  ));

  // 5. MARKETING STRATEGY
  ch.push(h1("5. Marketing Strategy"));
  ch.push(h2("5.1 Marketing Channels"));
  ch.push(body("The following chart shows the projected customer acquisition by marketing channel:"));
  ch.push(embedChart(`${CHARTS}/marketing_channels.png`, 500));

  ch.push(h2("5.2 Channel Breakdown"));
  ch.push(makeTable(
    ["Channel", "Cost (KES/mo)", "Expected Customers/yr", "Cost per Customer", "ROI"],
    [
      ["School Visits", "500 (transport)", "8", "KES 750", "High"],
      ["WhatsApp Groups", "0 (free)", "3", "KES 0", "Very High"],
      ["Facebook Ads", "3,500", "4", "KES 10,500", "Medium"],
      ["Referrals", "1,500 (commission)", "6", "KES 3,000", "High"],
      ["Google Ads", "1,000", "2", "KES 6,000", "Medium"],
      ["Education Events", "5,000 (per event)", "5", "KES 12,000", "Medium"],
    ],
    [2000, 2000, 2000, 2000, 1500]
  ));

  ch.push(h2("5.3 12-Month Marketing Calendar"));
  ch.push(makeTable(
    ["Month", "Focus Area", "Activities", "Budget (KES)"],
    [
      ["Month 1-2", "Foundation", "Social media setup, Google My Business, content creation", "5,000"],
      ["Month 3-4", "Direct Outreach", "Visit 10 schools, join WhatsApp groups, email campaigns", "10,000"],
      ["Month 5-6", "Paid Advertising", "Facebook ads, Google ads, flyer distribution", "20,000"],
      ["Month 7-8", "Partnerships", "Education consultants, referral program launch", "15,000"],
      ["Month 9-10", "Events", "Attend KESSHA, KAPE, education fairs", "30,000"],
      ["Month 11-12", "Retention & Growth", "Customer success, upsell to higher plans, annual contracts", "10,000"],
    ],
    [1500, 2000, 4000, 2000]
  ));

  // 6. SALES SCRIPT
  ch.push(h1("6. Sales Script"));
  ch.push(h2("6.1 Opening (30 seconds)"));
  ch.push(body("\"Good morning! I'm [Your Name] from SkulHub. We've built a complete school management system designed specifically for Kenyan schools, with CBC support, M-Pesa fee collection, and a parent portal. I'd love to show you how it works in just 10 minutes.\""));

  ch.push(h2("6.2 Demo Flow (10 minutes)"));
  ch.push(bullet("Show the dashboard (2 min) - real-time stats, 410 students, KES 3.6M billed"));
  ch.push(bullet("Add a student (2 min) - show how fast admissions work"));
  ch.push(bullet("Generate an invoice (2 min) - show the fee structure and auto-generation"));
  ch.push(bullet("Record a payment (2 min) - show auto-receipt with school letterhead"));
  ch.push(bullet("Show the parent portal (1 min) - parents check fees on their phone"));
  ch.push(bullet("Show report cards (1 min) - KCSE-style printable reports"));

  ch.push(h2("6.3 Close (30 seconds)"));
  ch.push(body("\"You can start your free 30-day trial today, no credit card needed. Your school code will be ready in 2 minutes. Would you like me to set that up for you right now?\""));

  ch.push(h2("6.4 Objection Handling"));
  ch.push(makeTable(
    ["Objection", "Response"],
    [
      ["We already have a system", "SkulHub integrates M-Pesa and CBC, most systems don't. Can I show you the difference in 5 minutes?"],
      ["It's too expensive", "At KES 2,500/month for 200 students, that's KES 12.50 per student. One late fee saved pays for the whole year."],
      ["We need to think about it", "Absolutely. Start the free trial, test it with real data for 30 days. No commitment."],
      ["Our staff isn't tech-savvy", "The interface is designed for non-technical users. I'll personally train your team, free for the first session."],
      ["We're worried about data security", "All data is encrypted and stored on secure cloud servers. We use the same security as banks."],
      ["Can we get a discount?", "Yes! Annual billing gives you 2 months free. And if you refer another school, you both get 1 month free."],
    ],
    [3000, 7000]
  ));

  // 7. REFERRAL PROGRAM
  ch.push(h1("7. Referral Program"));
  ch.push(body("SkulHub's referral program incentivizes existing customers and education consultants to bring in new schools. Referrers earn 15% commission on every referred school's monthly subscription, for as long as the school remains a customer."));
  ch.push(h2("7.1 Commission Structure"));
  ch.push(makeTable(
    ["Plan", "Monthly Subscription", "Commission Rate", "Monthly Commission", "Annual Commission"],
    [
      ["Starter", "KES 2,500", "15%", "KES 375", "KES 4,500"],
      ["Standard", "KES 5,000", "15%", "KES 750", "KES 9,000"],
      ["Premium", "KES 10,000", "15%", "KES 1,500", "KES 18,000"],
      ["Enterprise", "KES 20,000+", "15%", "KES 3,000+", "KES 36,000+"],
    ],
    [1500, 2000, 1500, 2000, 2000]
  ));
  ch.push(h2("7.2 Example Earnings"));
  ch.push(bullet("Refer 1 school on Standard plan: KES 750/month (KES 9,000/year)"));
  ch.push(bullet("Refer 5 schools: KES 3,750/month (KES 45,000/year)"));
  ch.push(bullet("Refer 10 schools: KES 7,500/month (KES 90,000/year)"));
  ch.push(bullet("Refer 20 schools: KES 15,000/month (KES 180,000/year)"));

  // 8. MODULE USAGE
  ch.push(h1("8. Module Usage Analytics"));
  ch.push(body("The following chart shows the projected module usage rate across all schools on the platform:"));
  ch.push(embedChart(`${CHARTS}/module_usage.png`, 500));

  // 9. KEY METRICS
  ch.push(h1("9. Key Performance Indicators (KPIs)"));
  ch.push(makeTable(
    ["KPI", "Month 3 Target", "Month 6 Target", "Month 12 Target"],
    [
      ["Total Schools", "10", "20", "35"],
      ["Monthly Revenue (KES)", "25,000", "50,000", "87,500"],
      ["Free Trials Active", "5", "8", "10"],
      ["Trial-to-Paid Conversion", "60%", "65%", "70%"],
      ["Customer Churn Rate", "< 5%", "< 3%", "< 2%"],
      ["Average Revenue per School", "KES 2,500", "KES 2,750", "KES 2,857"],
      ["Referral Signups", "2", "6", "12"],
      ["Support Response Time", "< 4 hours", "< 2 hours", "< 1 hour"],
    ],
    [3000, 2000, 2000, 2000]
  ));

  // 10. RISKS & MITIGATION
  ch.push(h1("10. Risks & Mitigation"));
  ch.push(makeTable(
    ["Risk", "Impact", "Likelihood", "Mitigation"],
    [
      ["Slow adoption by schools", "High", "Medium", "Free 30-day trial, free training, personal demos"],
      ["Competitor price war", "Medium", "Low", "Focus on value (M-Pesa, CBC), not just price"],
      ["Internet connectivity issues", "Medium", "Medium", "Offline mode (future), mobile-first design"],
      ["Data security concerns", "High", "Low", "Encrypted storage, SSL, regular backups"],
      ["Staff turnover at client schools", "Medium", "High", "Easy onboarding, documentation, video tutorials"],
      ["Economic downturn", "High", "Low", "Flexible pricing, Starter plan at KES 2,500/mo"],
    ],
    [2500, 1500, 1500, 4500]
  ));

  // 11. CONTACT
  ch.push(h1("11. Contact Information"));
  ch.push(makeTable(
    ["Channel", "Details"],
    [
      ["Website", "skulhub.co.ke"],
      ["Email", "info@skulhub.co.ke"],
      ["Phone", "0742 340 924"],
      ["WhatsApp", "0742 340 924"],
      ["Location", "Nairobi, Kenya"],
      ["Hours", "Mon-Fri 8AM-6PM EAT"],
    ],
    [3000, 7000]
  ));

  ch.push(new Paragraph({ spacing: { before: 400 } }));
  ch.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 200 },
    children: [new TextRun({ text: "--- End of Marketing & Revenue Plan ---", size: 20, color: c(P.secondary), italics: true, font: { ascii: "Calibri" } })] }));

  return ch;
}

// ── Assemble ──
const doc = new Document({
  styles: { default: { document: {
    run: { font: { ascii: "Calibri", eastAsia: "Microsoft YaHei" }, size: 22, color: c(P.body) },
    paragraph: { spacing: { line: 312 } },
  }, heading1: { run: { font: { ascii: "Calibri" }, size: 32, bold: true, color: c(P.primary) }, paragraph: { spacing: { before: 360, after: 160, line: 312 } } },
  heading2: { run: { font: { ascii: "Calibri" }, size: 28, bold: true, color: c(P.primary) }, paragraph: { spacing: { before: 280, after: 120, line: 312 } } },
  heading3: { run: { font: { ascii: "Calibri" }, size: 24, bold: true, color: c(P.body) }, paragraph: { spacing: { before: 200, after: 100, line: 312 } } },
  } },
  sections: [
    { properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 0, bottom: 0, left: 0, right: 0 } } }, children: buildCover() },
    { properties: { type: SectionType.NEXT_PAGE, page: { size: { width: 11906, height: 16838 }, margin: { top: 1440, bottom: 1440, left: 1701, right: 1417 } } },
      headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "SkulHub Marketing & Revenue Plan", size: 18, color: c(P.secondary), font: { ascii: "Calibri" } })] })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "Page ", size: 18, color: c(P.secondary) }), new TextRun({ children: [PageNumber.CURRENT], size: 18, color: c(P.secondary) })] })] }) },
      children: buildBody() },
  ],
});

Packer.toBuffer(doc).then(buf => {
  const outPath = "/home/z/my-project/docs/SkulHub-Marketing-Revenue-Plan.docx";
  fs.writeFileSync(outPath, buf);
  console.log("Generated: " + outPath);
});
