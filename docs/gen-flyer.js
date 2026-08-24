// SkulHub One-Page Marketing Flyer
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  PageBreak, AlignmentType, HeadingLevel, WidthType, BorderStyle,
  ShadingType, SectionType, TableLayoutType, PageOrientation,
} = require("docx");
const fs = require("fs");

const P = {
  primary: "059669", accent: "0D9488", body: "2C2C2C",
  secondary: "606060", bg: "F0FDF4", surface: "F0EDE5",
  headerBg: "059669", headerText: "FFFFFF",
  titleColor: "FFFFFF", subtitleColor: "E0F2F1",
};
const c = (h) => h.replace("#", "");
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

function buildFlyer() {
  const ch = [];

  // ── HEADER BANNER ──
  const headerTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      cantSplit: true,
      height: { value: 3600, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: P.primary },
        borders: noBorders,
        margins: { top: 200, bottom: 200, left: 400, right: 400 },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [new TextRun({ text: "SkulHub", size: 72, bold: true, color: P.titleColor, font: { ascii: "Arial" } })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 120 },
            children: [new TextRun({ text: "School Management System", size: 28, color: P.subtitleColor, font: { ascii: "Arial" } })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [new TextRun({ text: "33+ Modules  |  CBC & 8-4-4  |  M-Pesa Ready  |  13 Staff Roles  |  Parent Portal", size: 18, color: P.subtitleColor, font: { ascii: "Calibri" } })],
          }),
        ],
      })],
    })],
  });
  ch.push(headerTable);

  // ── WHY CHOOSE SKULHUB ──
  ch.push(new Paragraph({ spacing: { before: 200, after: 80 },
    children: [new TextRun({ text: "Why Schools Choose SkulHub", size: 28, bold: true, color: c(P.primary), font: { ascii: "Calibri" } })] }));

  const features = [
    { icon: "✅", title: "Built for Kenya", desc: "CBC, 8-4-4, KCSE, KNEC codes, all 47 counties" },
    { icon: "💰", title: "M-Pesa Daraja", desc: "STK Push fee collection — parents pay from their phone" },
    { icon: "👥", title: "13 Staff Roles", desc: "Granular access control — staff only see what they need" },
    { icon: "📱", title: "Parent Portal", desc: "Parents check fees, grades & attendance — no login needed" },
    { icon: "📊", title: "33+ Modules", desc: "Dashboard, finance, exams, attendance, library, transport & more" },
    { icon: "🏢", title: "Multi-School", desc: "Manage unlimited schools from one platform dashboard" },
  ];

  const featureTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [5000, 5000],
    borders: allNoBorders,
    rows: features.map((f, i) => new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? P.bg : "FFFFFF" },
          borders: noBorders, margins: { top: 60, bottom: 60, left: 200, right: 100 },
          children: [new Paragraph({ children: [
            new TextRun({ text: `${f.icon}  `, size: 22 }),
            new TextRun({ text: f.title, bold: true, size: 22, color: c(P.primary), font: { ascii: "Calibri" } }),
            new TextRun({ text: ` — ${f.desc}`, size: 20, color: c(P.body), font: { ascii: "Calibri" } }),
          ] })],
        }),
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: i % 2 === 0 ? P.bg : "FFFFFF" },
          borders: noBorders, margins: { top: 60, bottom: 60, left: 200, right: 100 },
          children: [],
        }),
      ],
    })),
  });

  // Actually, let me do a simpler 2-column layout
  const fTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [5000, 5000],
    borders: allNoBorders,
    rows: [
      // Row 1
      new TableRow({ cantSplit: true, children: [
        new TableCell({ borders: noBorders, margins: { top: 40, bottom: 40, left: 200, right: 100 },
          shading: { type: ShadingType.CLEAR, fill: P.bg },
          children: [new Paragraph({ children: [
            new TextRun({ text: "✅ ", size: 22 }),
            new TextRun({ text: "Built for Kenya", bold: true, size: 22, color: c(P.primary) }),
            new TextRun({ text: " — CBC, 8-4-4, KCSE, KNEC", size: 20, color: c(P.body) }),
          ] })] }),
        new TableCell({ borders: noBorders, margins: { top: 40, bottom: 40, left: 200, right: 100 },
          shading: { type: ShadingType.CLEAR, fill: P.bg },
          children: [new Paragraph({ children: [
            new TextRun({ text: "💰 ", size: 22 }),
            new TextRun({ text: "M-Pesa Daraja", bold: true, size: 22, color: c(P.primary) }),
            new TextRun({ text: " — STK Push fee collection", size: 20, color: c(P.body) }),
          ] })] }),
      ] }),
      // Row 2
      new TableRow({ cantSplit: true, children: [
        new TableCell({ borders: noBorders, margins: { top: 40, bottom: 40, left: 200, right: 100 },
          children: [new Paragraph({ children: [
            new TextRun({ text: "👥 ", size: 22 }),
            new TextRun({ text: "13 Staff Roles", bold: true, size: 22, color: c(P.primary) }),
            new TextRun({ text: " — Granular access control", size: 20, color: c(P.body) }),
          ] })] }),
        new TableCell({ borders: noBorders, margins: { top: 40, bottom: 40, left: 200, right: 100 },
          children: [new Paragraph({ children: [
            new TextRun({ text: "📱 ", size: 22 }),
            new TextRun({ text: "Parent Portal", bold: true, size: 22, color: c(P.primary) }),
            new TextRun({ text: " — Check fees on phone", size: 20, color: c(P.body) }),
          ] })] }),
      ] }),
      // Row 3
      new TableRow({ cantSplit: true, children: [
        new TableCell({ borders: noBorders, margins: { top: 40, bottom: 40, left: 200, right: 100 },
          shading: { type: ShadingType.CLEAR, fill: P.bg },
          children: [new Paragraph({ children: [
            new TextRun({ text: "📊 ", size: 22 }),
            new TextRun({ text: "33+ Modules", bold: true, size: 22, color: c(P.primary) }),
            new TextRun({ text: " — Everything in one place", size: 20, color: c(P.body) }),
          ] })] }),
        new TableCell({ borders: noBorders, margins: { top: 40, bottom: 40, left: 200, right: 100 },
          shading: { type: ShadingType.CLEAR, fill: P.bg },
          children: [new Paragraph({ children: [
            new TextRun({ text: "🏢 ", size: 22 }),
            new TextRun({ text: "Multi-School", bold: true, size: 22, color: c(P.primary) }),
            new TextRun({ text: " — Unlimited schools", size: 20, color: c(P.body) }),
          ] })] }),
      ] }),
    ],
  });
  ch.push(fTable);

  // ── PRICING ──
  ch.push(new Paragraph({ spacing: { before: 200, after: 80 },
    children: [new TextRun({ text: "Simple, Transparent Pricing", size: 28, bold: true, color: c(P.primary), font: { ascii: "Calibri" } })] }));

  const priceTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [2500, 2500, 2500, 2500],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 2, color: P.primary },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: P.primary },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "D5D0C8" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "D5D0C8" },
    },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: [
        ["Starter", "Standard", "Premium", "Enterprise"].map(t =>
          new TableCell({ shading: { type: ShadingType.CLEAR, fill: P.headerBg },
            margins: { top: 80, bottom: 80, left: 60, right: 60 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: t, bold: true, size: 20, color: P.headerText })] })] })
        ),
      ].flat() }),
      new TableRow({ cantSplit: true, children: [
        ["KES 2,500/mo", "KES 5,000/mo", "KES 10,000/mo", "Custom"].map(t =>
          new TableCell({ margins: { top: 60, bottom: 60, left: 60, right: 60 },
            children: [new Paragraph({ alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: t, bold: true, size: 22, color: c(P.primary) })] })] })
        ),
      ].flat() }),
      new TableRow({ cantSplit: true, children: [
        ["Up to 200\nstudents", "Up to 1,000\nstudents", "Unlimited\nstudents", "Unlimited\nstudents"].map(t =>
          new TableCell({ margins: { top: 40, bottom: 40, left: 60, right: 60 },
            shading: { type: ShadingType.CLEAR, fill: P.bg },
            children: t.split("\n").map(line => new Paragraph({ alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: line, size: 18, color: c(P.body) })] })) })
        ),
      ].flat() }),
    ],
  });
  ch.push(priceTable);

  // ── TRY IT NOW ──
  ch.push(new Paragraph({ spacing: { before: 200, after: 80 },
    children: [new TextRun({ text: "Try It Now — Free 30-Day Trial", size: 28, bold: true, color: c(P.primary), font: { ascii: "Calibri" } })] }));

  const trialTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    columnWidths: [5000, 5000],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: P.primary },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: P.primary },
      left: { style: BorderStyle.SINGLE, size: 4, color: P.primary },
      right: { style: BorderStyle.SINGLE, size: 4, color: P.primary },
      insideHorizontal: NB, insideVertical: NB,
    },
    rows: [new TableRow({
      cantSplit: true,
      children: [
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: P.bg },
          margins: { top: 120, bottom: 120, left: 200, right: 100 },
          borders: noBorders,
          children: [
            new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Visit:", bold: true, size: 22, color: c(P.primary) })] }),
            new Paragraph({ children: [new TextRun({ text: "skulhub.co.ke", size: 26, bold: true, color: c(P.accent) })] }),
            new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: "School Code:", bold: true, size: 20, color: c(P.primary) })] }),
            new Paragraph({ children: [new TextRun({ text: "SKH-2024-001", size: 22, color: c(P.body) })] }),
          ],
        }),
        new TableCell({
          shading: { type: ShadingType.CLEAR, fill: P.bg },
          margins: { top: 120, bottom: 120, left: 200, right: 100 },
          borders: noBorders,
          children: [
            new Paragraph({ spacing: { after: 60 }, children: [new TextRun({ text: "Demo Login:", bold: true, size: 22, color: c(P.primary) })] }),
            new Paragraph({ children: [new TextRun({ text: "admin@skulhub.ac.ke", size: 20, color: c(P.body) })] }),
            new Paragraph({ children: [new TextRun({ text: "Password: admin123", size: 20, color: c(P.body) })] }),
            new Paragraph({ spacing: { before: 80 }, children: [new TextRun({ text: "No credit card needed", italics: true, size: 18, color: c(P.secondary) })] }),
          ],
        }),
      ],
    })],
  });
  ch.push(trialTable);

  // ── CONTACT ──
  ch.push(new Paragraph({ spacing: { before: 200 },
    alignment: AlignmentType.CENTER,
    children: [
      new TextRun({ text: "Contact Us:  ", bold: true, size: 22, color: c(P.primary) }),
      new TextRun({ text: "0742 340 924  |  info@skulhub.co.ke  |  skulhub.co.ke", size: 22, color: c(P.body) }),
    ] }));

  ch.push(new Paragraph({ spacing: { before: 60 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text: "Built with \u2764 in Kenya for Kenyan Schools", size: 18, italics: true, color: c(P.secondary) })] }));

  return ch;
}

const doc = new Document({
  styles: { default: { document: {
    run: { font: { ascii: "Calibri" }, size: 22, color: c(P.body) },
    paragraph: { spacing: { line: 280 } },
  } } },
  sections: [{
    properties: {
      page: {
        size: { width: 11906, height: 16838, orientation: PageOrientation.PORTRAIT },
        margin: { top: 720, bottom: 720, left: 720, right: 720 },
      },
    },
    children: buildFlyer(),
  }],
});

Packer.toBuffer(doc).then(buf => {
  fs.writeFileSync("/home/z/my-project/docs/SkulHub-Flyer.docx", buf);
  console.log("Generated: SkulHub-Flyer.docx");
});
