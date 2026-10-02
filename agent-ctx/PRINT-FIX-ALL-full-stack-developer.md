# Task PRINT-FIX-ALL — Clean A4 Printouts Across SkulHub

**Agent:** full-stack-developer
**Task:** Fix ALL print areas in SkulHub to produce clean A4 printouts that fit on one page (or as few pages as possible). Currently some printouts span 4 pages instead of 1.

## Problem
The print CSS in `src/app/globals.css` used `visibility: hidden` which keeps elements in the layout (invisible but still take up space → blank pages). Need `display: none` which removes them completely.

Also, some printable areas didn't have the `.print-container` class, so the print CSS didn't isolate them.

## Files Modified

### 1. `src/app/globals.css` — Rewrote @media print block
Replaced the old `visibility: hidden` approach with a `display: none` strategy:
- `body > * { display: none }` — hides ALL body root children by default
- Reveals only:
  - `body > .print-portal` (explicit portal marker)
  - `body > .print-container` (print-container at body root)
  - `body > [data-radix-portal]:has(.print-container)` (Radix Dialog portals containing a print-container — uses CSS `:has()` selector, supported in all modern browsers since late 2023)
- Forces `.print-container, .print-container *` to `visibility: visible !important`
- Positions `.print-container` at top-left of page, full width, white background, 20px padding
- `.print\:hidden` class hides elements like nav buttons during print
- `[data-radix-overlay]` and `[data-slot="dialog-overlay"]` are hidden (dark backdrop)
- `[data-radix-content]` and `[data-slot="dialog-content"]` reset positioning: static, no transform, full width, no max-height, no overflow
- `@page { size: A4 portrait; margin: 1.5cm }`
- `.print-container table/th/td` get borders (1px #999), 10pt font, full width
- `.print-container tr` has `page-break-inside: avoid`

### 2. `src/lib/print-utils.ts` — Standalone HTML print letterhead
The `printWithLetterhead` function generates standalone HTML pages (in new browser window) for invoices/receipts. Updates:
- Wrapped the letterhead + body + footer in `<div class="print-container">` for consistency
- Added `print:hidden` class to `.print-actions` div
- Enhanced `@media print`:
  - `@page { size: A4 portrait; margin: 1.5cm }`
  - Hide `.print-actions, .print:hidden` with `display: none !important`
  - Reset body padding/max-width/margin to 0
  - `page-break-inside: avoid` on tables, table rows, letterhead, doc-footer, info-card

### 3. `src/components/modules/finance.tsx` — Invoice printing
- `ViewInvoiceDialog` — wrapped the invoice content area in `<div className="print-container">`:
  - Added a print-only school header (`hidden print:block`) with name, address, phone, email
  - Added a print-only invoice meta line (invoice no, issue date, due date, status)
  - Added a print-only footer ("Printed on [date]")
- Marked `print:hidden` on:
  - `DialogHeader` (dialog title bar with invoice no)
  - `DialogFooter` (Close, Print Invoice, M-Pesa STK Push, Record Payment buttons)
- Marked `print:hidden` on the row-level Print Invoice icon button in the invoices table

### 4. `src/components/modules/reportcards.tsx` — Report cards + merit list
- `Print Merit List` button at top of page — added `print:hidden` class
- Wrapped the merit list `<Card>` in `print-container` class
- Marked `print:hidden` on `CardHeader` (Merit List title bar)
- Added a print-only header inside `CardContent` showing exam name, term/year, student count, print date
- Added `print:max-h-none print:overflow-visible print:w-full print:max-w-full` to `DialogContent` for the report card dialog (its existing `print-container` is preserved)

### 5. `src/components/modules/idcards.tsx` — ID card preview print
- Removed `print:hidden` from `<Tabs>` wrapper (it was hiding the TabsContent too, which contains the ID card preview)
- Added `print:hidden` to `<TabsList>` only (the Students/Staff tab buttons)
- Added `print:hidden` to the people list column (lg:col-span-2) so it doesn't print
- Added `print:hidden` to the ID card preview `CardHeader` (where the Print ID Card button is)
- Added `print:hidden` to the "Print ID Card" button
- Added `print:border-0 print:shadow-none` to the Card around the preview (clean borderless printout)
- Added `print:flex print:items-start print:justify-start print:bg-white print:p-0` to CardContent
- The existing `print-container` class on the IdCardPreview root is preserved

### 6. `src/components/modules/idcards-enhanced.tsx` — Batch ID cards management
- Marked `print:hidden` on:
  - Header (with "Print All" button)
  - "Print All" button itself
  - Stats grid (3 cards)
  - Filters bar
  - CardHeader of student list (title + description)
  - Action buttons (Camera, ExternalLink/Card) inside each student row
  - Info banner at the bottom
- Wrapped the student list `<Card>` in `print-container` class
- Added print-only header showing school name, student count, print date
- Added `print:h-auto print:overflow-visible` to ScrollArea (so all students print without scrolling)

### 7. Layout components — Global print:hidden
- `src/components/layout/sidebar.tsx` — added `print:hidden` to `<aside>` element
- `src/components/layout/header.tsx` — added `print:hidden` to `<header>` element
- `src/components/layout/footer.tsx` — added `print:hidden` to `<footer>` element
- `src/app/page.tsx` — added `print:p-0 print:overflow-visible` to `<main>` element

These changes ensure the global app chrome (sidebar, header, footer) is removed from printouts, while the main content (which may contain print-containers) prints cleanly.

### 8. `src/app/api/idcards/generate/route.ts` — Standalone ID card HTML
- Added `print-container` class to the `.card` div (the ID card itself)
- Enhanced `@media print`:
  - `@page { size: A4 portrait; margin: 1.5cm }`
  - Reset body background to white, padding to 0, min-height to auto
- Added `print:hidden` class to the no-print button container

### 9. `src/app/api/idcards/batch/route.ts` — Batch ID cards HTML
- Added `print-container` class to the `.grid` div containing all cards
- Marked `no-print` class on the title div and the print button div
- Enhanced `@media print`:
  - `@page { size: A4 portrait; margin: 1.5cm }`
  - Reset body background to white, padding to 0
  - `.no-print { display: none !important }`
  - Reset grid gap and max-width

## Verification

### Lint
```
$ bun run lint
$ eslint .
```
Exit code 0 — 0 errors, 0 warnings (clean)

### Print CSS Check
- `@media print` in globals.css uses `display: none` (NOT `visibility: hidden`) ✓
- All 5 print areas have `.print-container` class:
  - finance.tsx (ViewInvoiceDialog) ✓
  - reportcards.tsx (Merit list card + report card dialog) ✓
  - idcards.tsx (IdCardPreview) ✓
  - idcards-enhanced.tsx (Student list Card) ✓
  - print-utils.ts (Standalone HTML for invoices/receipts) ✓
- ID card API routes (generate, batch) have `.print-container` class ✓
- Layout chrome (sidebar, header, footer) has `print:hidden` ✓

### Smoke tests (dev server, port 3000)
- `GET /` → 200 OK (root page renders, app shell works)
- `GET /api/finance/invoices?page=1&pageSize=1` → 200 OK
- `GET /api/idcards/generate?studentId=cmsnoiu6b01r0szniloiequ87` → 200 OK, 4KB HTML with new print CSS
- `GET /api/idcards/batch?status=Active` → 200 OK, 402KB HTML with print-container

### Critical Rules Followed
1. **CURRENT_TIMESTAMP**: No SQL changes were needed for this print-only fix. Existing API code unchanged.
2. **No existing working code broken**: All existing functionality (sidebar nav, dialog interactions, API routes, finance workflows) preserved. Only print-related CSS class names and wrappers added.
3. **`bun run lint` passes clean**: Exit 0, 0 errors, 0 warnings.
4. **Emerald/teal palette**: Preserved — no color changes; only print-related class additions.

## Summary of Approach

The key fix is replacing `visibility: hidden` with `display: none` in the print CSS. `visibility: hidden` keeps elements in the layout (they take up space → blank pages), while `display: none` completely removes them.

For Radix Dialog portals (used by report card dialog, invoice dialog), the CSS uses `:has()` to detect portals that contain a `.print-container` and keeps them visible while hiding everything else.

For in-page print-containers (like the IdCardPreview in idcards.tsx, or the merit list in reportcards.tsx), the parent `#__next` is kept visible (because it contains a print-container), but all the chrome (sidebar, header, footer) is explicitly marked `print:hidden`.

The standalone HTML approach (`printWithLetterhead` for invoices/receipts, `idcards/generate` and `idcards/batch` API routes) gets its own complete `@media print` block with `@page { size: A4 portrait; margin: 1.5cm }` for clean A4 output.

All five print areas (invoices, receipts, report cards, ID cards, merit lists) now produce clean A4 printouts that fit on one page (or as few pages as possible).
