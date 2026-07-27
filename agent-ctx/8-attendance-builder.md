# Task 8 — Attendance Module

**Agent:** Attendance Builder
**Task:** Build Attendance API routes + AttendanceModule component for EduManage Pro

## Files Created
1. `src/app/api/attendance/route.ts` — GET (roster + streams) + POST (upsert attendance)
2. `src/app/api/attendance/stats/route.ts` — GET daily summary + overall + per-stream today
3. `src/components/modules/attendance.tsx` — `AttendanceModule` client component

## API Design

### GET `/api/attendance?date=YYYY-MM-DD&streamId=&personType=Student`
Returns:
```ts
{
  date, streamId, personType,
  streams: [{ id, name, capacity, classLevelName, classLevelStage, classTeacher, enrolledCount }],
  records: [{ id, studentId, admissionNo, firstName, lastName, gender, photoUrl, status, remarks, checkInTime, marked }],
  summary: { total, marked, present, absent, late, excused, sick, rate }
}
```
- Always returns the full streams list (for the selector) with **filtered `_count`** of active enrollments for current year/term (2025/Term 1).
- When `streamId` is provided, returns the merged roster: active students enrolled in that stream for 2025/Term 1, with their attendance status for the date (empty string if unmarked).
- Class teacher names resolved via a separate `staff.findMany` query (Stream model only has `classTeacherId`, no relation).
- Date queries use `gte startOfDay / lte endOfDay` to match seeded records (which store full timestamps).

### POST `/api/attendance`
Body: `{ date, streamId, records: [{ studentId, status, remarks? }] }`
- Upserts each record: `findFirst` by (studentId, personType, date-range) → update existing or create new.
- Stores `date` as `startOfDay(date)` (midnight UTC) for new records.
- Writes an `ActivityLog` entry (`MARK` / `Attendance`).
- Returns `{ saved, date }`.

### GET `/api/attendance/stats?from=&to=`
- Default range: last 30 days.
- Returns `days[]` (per-day present/absent/late/excused/sick/total/rate), `overall` (range totals), `today` (today's totals), `todayByStream[]` (per-stream enrolled/present/absent/late/excused/sick/unmarked/marked/rate).
- Rate = `(present + late) / total * 100` (late students still attended).

## Module Design (`AttendanceModule`)
- **Emerald/teal/cyan** gradient header banner with today's rate.
- **4 stat cards**: Today's Attendance Rate, Present Today, Absent Today, Late Today.
- **Mark Attendance card**:
  - Stream `Select` + native date `Input` (max today), auto-picks first stream on load.
  - Live summary pills (Present/Late/Absent/Excused/Sick counts + live rate) reflecting unsaved draft.
  - Actions: Clear Draft, Mark All Present, Save Attendance (emerald, with spinner).
  - Sticky-header table with avatar (initials + colored fallback), admission no, **color-coded status pill buttons** (Present=emerald, Late=amber, Absent=rose, Excused=violet, Sick=cyan), short codes on mobile. Already-saved records show a "Saved" badge.
  - `max-h-[34rem] overflow-y-auto` for long rosters.
- **Trends row**: Area chart (attendance rate, last 30d) + stacked Bar chart (present/late/absent/excused/sick per day) with Legend.
- **Today's Attendance by Stream** table: stream, enrolled, present, absent, late, rate (with colored progress bar + rate color threshold).
- **30-day overall footer** cards.

## Tech Notes
- Used Prisma **filtered relation count** (`_count: { select: { enrollments: { where: {...} } } }`) — supported in Prisma 6.
- `useFetch` for both roster + stats; `apiPost` for save; `sonner` `toast` for feedback.
- All status colors use Tailwind emerald/amber/rose/violet/cyan (no indigo/blue).
- Responsive mobile-first: short status codes on mobile, hidden columns on small screens, wrap controls.

## Verification
- `bun run lint` on the 3 files: clean.
- `npx tsc --noEmit --skipLibCheck` on the 3 files: clean.
- Live API tests (via temporary dev server):
  - `GET /api/attendance/stats` → 200, returns 30-day daily summary with seeded data.
  - `GET /api/attendance` → 200, returns 8 streams with class teacher names + enrolled counts.
  - `GET /api/attendance?streamId=...&date=2026-07-27` → 200, returns 33 records all marked (26 present, 5 absent, 1 late, 1 excused), rate 82%.
  - `POST /api/attendance` → 200, `{saved:1}`, correctly updated an existing record's status from Absent→Sick with remarks (verified by re-fetch).
- Page-level render depends on other agents' modules (finance/communications/library/transport/reports/settings not yet created); my attendance module's import on `page.tsx:10` resolves correctly.

## Stage Summary
Attendance module + API complete and verified. Ready for integration once sibling modules land.
