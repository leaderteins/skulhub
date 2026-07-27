# Task 5 — Students Module Agent

## Task
Build the **Students module** and its API routes for EduManage Pro (Next.js 16 + Prisma + SQLite).

## Deliverables

### 1. `src/app/api/students/route.ts`
- **GET** `/api/students?search=&classLevel=&gender=&status=&boarding=&page=&pageSize=`
  - Paginated list with guardian + current enrollment (stream+classLevel).
  - Filters: search (admissionNo, firstName, lastName, phone, email), classLevel
    (via enrollment.classLevelId), gender, status, boarding (true/false).
  - Defaults: page=1, pageSize=20 (capped at 100).
  - Returns `{ students, total, page, pageSize, stats, classLevels }`.
    - `stats` = unfiltered `{ total, boarding, dayScholars, newThisTerm }`.
    - `classLevels` = list of `{id, name, stage}` to power the filter dropdown.
- **POST** creates a student. Validates admissionNo/firstName/lastName, checks
  admissionNo uniqueness, optionally creates a Guardian inline, writes an
  ActivityLog entry, returns 201 with created student + guardian.

### 2. `src/app/api/students/[id]/route.ts`
- **GET** — full profile: guardian, enrollments (stream+classLevel), last-10
  attendance, last-10 grades (subject+exam), invoices (with payments _count).
  Computes `feeSummary` (totalBilled, totalPaid, balance, invoiceCount,
  paymentsCount), `attendanceStats` (present/absent/late/total), and
  `currentEnrollment` (Active enrollment, fallback to most recent).
- **PUT** — partial update with admissionNo uniqueness check; logs UPDATE.
- **DELETE** — hard delete (Prisma cascade); logs DELETE; 404 if not found.

### 3. `src/components/modules/students.tsx` — `StudentsModule`
- `'use client'` component rendered inside the main content area when
  `activeModule === 'students'` (already wired in `src/app/page.tsx`).
- Header row with title + emerald "Admit Student" button.
- Stat strip (4 StatCards): Total Students, Boarding, Day Scholars, New This Term.
- Filter bar: debounced search + class/gender/status/boarding selects + Clear.
- Responsive data table with horizontal scroll on mobile: avatar+name+
  admissionNo, class/stream, gender, guardian phone, status badge (statusColor),
  boarding/day badge (BedDouble/Sun icon), View action.
- Pagination (Prev/Next + page info + range).
- Loading skeleton table rows; EmptyState for empty/error.
- AdmitDialog: full admission form with auto-suggested admissionNo, all student
  fields, 47 Kenyan counties, blood group select, boarding Switch, optional
  inline guardian section. Submit → `apiPost` → sonner toast → refetch + close.
- StudentDetailDialog: gradient header (avatar+name+admission+status), 3 fee
  mini-stats, personal info card, guardian info card, enrollment history list,
  recent attendance list (rate badge + colored status), recent grades list
  (gradeColor badges), fee invoices list, Delete Student button (confirm →
  apiDelete → toast → close + refetch).

## Design Notes
- Emerald/teal academic theme; no indigo/blue.
- Uses `cn` from `@/lib/utils` and `formatKES/formatDate/fullName/initials/
  avatarColor/statusColor/gradeColor` from `@/lib/format`.
- Uses `useFetch`, `apiPost`, `apiDelete` from `@/lib/api`.
- Uses `StatCard`, `EmptyState` from `@/components/shared`.
- Uses shadcn/ui: card, button, input, label, switch, table, dialog, select,
  avatar, badge, skeleton, scroll-area, separator.
- Sonner toasts for all user feedback.
- Mobile-first responsive (sm/md/lg breakpoints).

## Testing
- `bun run lint` — clean for my files (no errors/warnings).
- Live curl tests confirmed:
  - GET list → 200 with 252 students + stats + classLevels.
  - GET detail → 200 with feeSummary + attendanceStats + currentEnrollment.
  - POST → 201 with created student + inline guardian.
  - PUT → 200 with updated fields.
  - DELETE → 200 {success:true}; re-DELETE → 404.

## Stage Summary
Students module is feature-complete: full CRUD API + polished, responsive UI
with stat strip, filters, table, admit dialog, and rich detail dialog. Ready
for use.
