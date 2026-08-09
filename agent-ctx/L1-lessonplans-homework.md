# Task L1 — Lesson Plans & Homework/Assignments Modules

**Agent:** Claude (subagent L1)
**Date:** 2025-08-09
**Status:** ✅ Completed — lint clean, all routes 200 OK

## Scope
Built two new academic modules for EduManage Pro:
1. **Lesson Plans** (`/api/lessonplans` + `src/components/modules/lessonplans.tsx`)
2. **Homework & Assignments** (`/api/homework` + `src/components/modules/homework.tsx`)

## Files Created
- `src/app/api/lessonplans/route.ts` — GET (list + stats + subjects/classLevels), POST (create), PUT (status/field update)
- `src/app/api/homework/route.ts` — GET (list + stats + subjects/classLevels), POST (create), PUT (status/field update)
- `src/components/modules/lessonplans.tsx` — Full UI module (emerald gradient header, 4 stat cards, by-subject chips, filters, plan cards, add dialog)
- `src/components/modules/homework.tsx` — Full UI module (teal gradient header, 4 stat cards, status breakdown, filters, grouped homework cards, add dialog)
- `prisma/seed-lessonplans-homework.ts` — Seeded 16 lesson plans + 18 homework assignments across 13 subjects × 4 forms

## Files Modified
- `src/lib/store.ts` — Added `'lessonplans'` and `'homework'` to ModuleKey union
- `src/lib/auth-store.ts` — Added both modules to ALL_MODULES; granted access to admin, principal, deputy_principal, teacher, secretary roles
- `src/components/layout/sidebar.tsx` — Added nav items under "Academic" group with NotebookPen + PencilRuler icons
- `src/components/layout/command-palette.tsx` — Added navigation entries + `G N` (lesson plans) and `G W` (homework) keyboard shortcuts
- `src/app/page.tsx` — Imported + routed both new modules

## API Details

### `/api/lessonplans`
- `GET ?subjectId=&classLevelId=&week=&status=&search=` → `{ stats: { total, published, drafts, completed, thisWeek, currentWeek }, bySubject[], subjects[], classLevels[], lessonPlans[] }`
  - `currentWeek` = highest week number among existing plans (academic-week aligned)
- `POST` — creates a new lesson plan (validates topic + week)
- `PUT { id, status?, ...fields }` — updates status (Publish/Complete) or fields
- All mutations log to ActivityLog

### `/api/homework`
- `GET ?subjectId=&classLevelId=&status=&search=` → `{ stats: { total, active, closed, graded, overdue, dueThisWeek }, subjects[], classLevels[], homework[] }`
  - `overdue` = Active homework whose dueDate < now
  - `dueThisWeek` = Active homework due in current Mon–Sun week
- `POST` — creates new homework (validates title + dueDate)
- `PUT { id, status?, ...fields }` — updates status (Close/Grade/Reopen) or fields
- All mutations log to ActivityLog

## UI Highlights

### Lesson Plans Module
- Emerald gradient header banner showing current week + total plans
- 4 stat cards: Total Plans, Published, Drafts, This Week
- "Plans by Subject" chips with counts and percentages
- Filter bar: search, subject, class, week, status (with "Clear filters")
- Plan cards show: subject color strip, subject/code, class, week, topic, objectives, activities, resources, assessment, notes (collapsible "Show more"), author + time, status badge
- Quick actions on cards: Publish (from Draft), Complete (from Published)
- Add Lesson Plan dialog: auto-fills `createdBy` from `useAuthStore.user.name`, subject selector, class level selector, week (defaults to current school week), term, topic, and textareas for objectives/activities/resources/assessment/notes + status select

### Homework Module
- Teal gradient header banner showing total/active/overdue counts
- 4 stat cards: Total, Active, Overdue, Due This Week
- Status Breakdown card with Active/Closed/Graded/Overdue chips
- Filter bar: search, subject, class, status (with "Clear filters")
- Homework grouped into 4 sections: Overdue, Due Soon (<72h), Upcoming, Closed & Graded
- Cards show: subject color strip, title, description (clamped), due-date tone (danger/warn/ok/muted), max marks, author, status badge
- Quick actions: Close (from Active), Mark Graded (from Active/Closed), Reopen (from Closed)
- Add Homework dialog: auto-fills `createdBy` from `useAuthStore.user.name`, title, subject selector, class level selector, description, due date (defaults to +3 days at 11:59 PM), max marks (default 50), with helper hint explaining Active→Closed→Graded workflow

## Verification
- `bun run lint` — 0 errors, 0 warnings (clean)
- `curl /api/lessonplans` → 200 with `total: 16, published: 12, drafts: 3, completed: 1, thisWeek: 3, currentWeek: 6`
- `curl /api/homework` → 200 with `total: 18, active: 16, closed: 1, graded: 1, overdue: 1, dueThisWeek: 2`
- `curl /` → 200 (page compiles cleanly with new module imports)
- Dev log shows no errors; both new endpoints compile and respond in <50 ms

## Notes for Future Agents
- The LessonPlan and Homework Prisma models were already in `schema.prisma` (lines 989-1026); no schema changes were needed
- Seeded data uses Kenyan CBC content (Form 1-4, KICD textbooks, KCSE past papers, Kiswahili set books, etc.)
- Both modules' PUT endpoints accept `{ id, status, updatedBy }` (status-only updates work for quick actions)
- `updatedBy` field is passed for activity log attribution; `createdBy` is auto-filled from logged-in user
- Subjects & class levels are returned by both GET endpoints so the UI dropdowns don't need a separate fetch
