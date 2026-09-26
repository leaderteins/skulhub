# FIX-TIMETABLE-DASHBOARD — full-stack-developer

## Task Summary

Fix three issues in the SkulHub Next.js 16 app:
1. **Timetable add-lesson form** — change subject input to a shadcn/ui
   `<Select>` dropdown that pulls subjects from the database.
2. **Dashboard Recent Activity card** — was empty/broken because (a) no
   `/api/activity-log` route existed and (b) the dashboard's `Promise.all`
   swallowed the activity fetch when any one query failed.
3. **ActivityLog audit trail for timetable changes** — POST/PUT/DELETE on
   `/api/timetable` weren't writing to `ActivityLog`, so principal actions
   never surfaced in the dashboard feed.

## Files Touched

### New files
- `src/app/api/subjects/route.ts` — GET endpoint returning the Subject list
  for the timetable dropdown.
- `src/app/api/activity-log/route.ts` — GET endpoint returning the most
  recent 20 ActivityLog entries (raw SQL, SQLite+PG compatible).
- `agent-ctx/FIX-TIMETABLE-DASHBOARD-full-stack-developer.md` — this file.

### Modified files
- `prisma/schema.prisma` + `prisma/schema.prisma.pg` — added
  `schoolId String?` to `ActivityLog` (non-breaking; existing rows keep
  NULL).
- `src/lib/db.ts` — bumped `PRISMA_VERSION` so the singleton PrismaClient
  re-instantiates after the schema push picked up the new column.
- `src/components/modules/timetable.tsx` — `AddLessonDialog` now fetches
  from `/api/subjects`, renders a `<Select>` when subjects exist, falls
  back to a text `<Input>` when the list is empty, and stores `subjectId`
  (preferred) or `subjectName` (fallback) on submit.
- `src/app/api/timetable/route.ts` — POST now accepts `subjectId` OR
  `subjectName` (resolves the latter by lookup-or-create on the Subject
  table) and writes a `CREATE` row into ActivityLog.
- `src/app/api/timetable/[id]/route.ts` — added a new `PUT` handler
  (partial update + `UPDATE` ActivityLog insert) and reworked `DELETE`
  to log a `DELETE` ActivityLog entry.
- `src/app/api/dashboard/route.ts` — moved `activityLog.findMany` out of
  `Promise.all` and wrapped it in `.catch(() => [])` so an activity-log
  query failure no longer takes the whole dashboard down.
- `src/components/modules/dashboard.tsx` — extended the `ACTION_ICON`
  map (added `DELETE`, `EMAIL`, `SMS`, `STAFF_SIGNUP`, `LOGIN`) and
  reworked the Recent Activity card to render the action type as a
  Badge, the entity name, the user, the details, and a relative
  timestamp (`timeAgo`); added an empty-state.

## SQL Compatibility (per brief)

- Used `CURRENT_TIMESTAMP` everywhere (works on SQLite + PostgreSQL).
- **No** `NOW()`, **no** `::int`/`::float`/`::text` casts, **no**
  PG-only `ANY($1::text[])` array literals.
- `LIMIT $1` is parameterised — works on both engines.
- SELECT queries wrapped in `.catch(() => [])`; DML wrapped in
  `.catch(() => {})` so logging failures never break the actual
  timetable mutation.
- BigInt values are coerced to `Number()` / `.toString()` in JS, not in
  SQL.

## Verification

- `bun run lint` → exit 0, no warnings/errors.
- `rg -n 'NOW\(\)|::int|::float|::text' src/app/api/timetable
  src/app/api/activity-log src/app/api/subjects src/app/api/dashboard`
  → only docstring references in activity-log/route.ts (no live
  PG-only SQL).
- Live smoke tests (port 3000, login as `admin@skulhub.ac.ke` /
  `admin123`):
  - GET `/api/timetable` (no auth) → 401 ✓
  - GET `/api/timetable` (with auth) → 200, 5 entries, 13 subjects ✓
  - GET `/api/subjects` (with auth) → 200, 13 subjects ✓
  - GET `/api/activity-log?limit=20` (with auth) → 200, 20 activities ✓
  - GET `/api/dashboard` (with auth) → 200, activities include the new
    Timetable rows ✓
  - POST `/api/timetable` → 201 + ActivityLog `CREATE` row inserted ✓
  - PUT `/api/timetable/[id]` → 200 + ActivityLog `UPDATE` row inserted ✓
  - DELETE `/api/timetable/[id]` → 200 + ActivityLog `DELETE` row
    inserted ✓
- DB schema verified via `PRAGMA table_info(ActivityLog)` — `schoolId`
  column present at position 7 (TEXT, nullable).

## Notes for downstream agents

- The ActivityLog now has an optional `schoolId` column. When writing
  future audit-log entries from other modules, pass the user's
  `schoolId` (resolved from `getUserFromRequest(req).schoolId`) so the
  activity can be filtered by school on the super-admin dashboard.
- The dashboard route continues to surface ALL activities regardless
  of schoolId (existing rows have NULL schoolId). If you want to filter
  by school later, change the `findMany` to
  `where: { OR: [{ schoolId: user.schoolId }, { schoolId: null }] }`.
- The new `/api/subjects` endpoint is the canonical way to fetch
  subjects — please use it in any new module that needs a subject
  dropdown (lesson plans, homework, exams, etc.).
- The new `/api/timetable/[id]` PUT handler accepts a **partial** update
  body — only the fields you send will be written. Use it for moving a
  lesson to a different slot, changing the teacher, or updating the
  room.
