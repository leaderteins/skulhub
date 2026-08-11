# Task SC1 — School Code Login System & Parent Portal

**Agent**: SC1 (School Code Login + Parent Portal builder)
**Date**: 2025 session
**Status**: ✅ Complete

## What was built

### 1. School Code Lookup API
- `src/app/api/auth/school-code/route.ts`
- POST `{ schoolCode }` → `{ found: true, school: { id, name, slug, level, logo, schoolCode } }` or `{ found: false }`
- Tries exact match first, then uppercased variant (SQLite `schoolCode` is case-sensitive; seeded values are uppercase like `SKH-2024-001`).

### 2. Two-step School Code Login UI (rewrote `src/components/auth/login-form.tsx`)
- **Step 1**: "Enter your school code" — single input + Continue button. Calls `/api/auth/school-code`. Shows "School code not found" toast on failure. On success, transitions to Step 2.
- **Step 2**: "Sign in to {School Name}" — email + password form. Shows a branded school info card (logo placeholder, level, code). Back button returns to Step 1. On submit calls the existing `/api/auth/login` via `serverLogin()` (demo fallback preserved).
- **Left branding pane**: SkulHub logo + tagline "Secure. Role-based. Complete." + 4 feature cards (Role-Based Access, Per Class Data, Audit Trail, M-Pesa Ready) — emerald/teal gradient, decorative blobs.
- **Three links below the form** (as required):
  - "Don't have an account? Sign up"
  - "Want to register your school? Register school"
  - "Parent? Access parent portal"
- **Quick demo login buttons** kept at the bottom (works without school code — instant login for dev).

### 3. Parent Portal
- **API `src/app/api/parent/lookup/route.ts`** — POST `{ schoolCode, admissionNo, phone }`. Verifies school exists, student exists in that school with the admission number, and the provided phone matches the guardian's phone (uses new `src/lib/phone-utils.ts` normalizer that handles `0712XXXXXX`, `+254712XXXXXX`, `254712XXXXXX`, with spaces/dashes).
- **API `src/app/api/parent/[studentId]/route.ts`** — GET returns full parent dashboard:
  - Student info (name, admission no, class, stream, photo, boarding/day, status, guardian details)
  - Fee summary (total billed, paid, balance + invoice history)
  - Recent attendance (last 10 records)
  - Recent grades (latest 20, with subject + exam + term)
  - Announcements for `Parents` or `All` audience (latest 6, pinned first)
  - Upcoming events for `Parents` or `All` audience (next 6 scheduled/ongoing)
- **API `src/app/api/parent/demo/route.ts`** — GET returns demo credentials. Picks the student with the most invoices/attendance/grades so the dashboard isn't empty.
- **UI `src/components/auth/parent-portal.tsx`** — Emerald/teal themed:
  - Login screen with school code + admission number + guardian phone + "Auto-fill demo credentials" button. Branded left pane with feature cards (Fee Summary, Attendance, Grades, School Updates).
  - Dashboard: sticky header (Refresh / To login / Exit buttons), student header card (avatar, name, status & boarding badges, admission no, class, stream, guardian line), fee summary card with 3 colored stat tiles + invoice table, recent attendance card (colored P/A/L/S badges), recent grades card (subject + marks + grade badge using `gradeColor()`), announcements card (pinned + priority), upcoming events card (category color badges).
  - Empty states handled gracefully ("No invoices yet", "No grades published yet", etc.).
  - Uses `useFetch` hook from `src/lib/api.ts` for the dashboard data fetch.

### 4. Wiring
- Updated `src/lib/auth-store.ts` — expanded `AuthView` type from `'login' | 'register' | 'staff-signup'` to also include `'parent' | 'superadmin'`.
- Updated `src/app/page.tsx` — added `if (authView === 'parent') return <ParentPortal />` before the unauthenticated fallback, plus imported the new component.
- Login form's "Parent? Access parent portal" link calls `setAuthView('parent')`.
- Parent portal's "To login" button calls `setAuthView('login')` to return.

## Files created / modified

**Created:**
- `src/lib/phone-utils.ts`
- `src/app/api/auth/school-code/route.ts`
- `src/app/api/parent/lookup/route.ts`
- `src/app/api/parent/[studentId]/route.ts`
- `src/app/api/parent/demo/route.ts`
- `src/components/auth/parent-portal.tsx`

**Modified:**
- `src/lib/auth-store.ts` — added `'parent' | 'superadmin'` to `AuthView` union
- `src/components/auth/login-form.tsx` — full rewrite for two-step school code flow
- `src/app/page.tsx` — added parent portal branch + import

## Verification

- `bun run lint` → no errors.
- Dev server restarted cleanly, no runtime errors in `dev.log`.
- API smoke tests (all 200):
  - `POST /api/auth/school-code { schoolCode: "SKH-2024-001" }` → `found: true` with school object
  - `POST /api/auth/school-code { schoolCode: "BAD-CODE-999" }` → `found: false`
  - `GET /api/parent/demo` → returns `schoolCode`, `admissionNo`, `phone`, `studentName`
  - `POST /api/parent/lookup` with `+254717362700` → success; with `0717362700` (local format) → success (phone normalization works); with wrong phone → 403 with clear error
  - `GET /api/parent/{studentId}` → full dashboard payload with student, fees, attendance, grades, announcements, events
- Browser walkthrough (agent-browser):
  1. Loaded `/` → Step 1 school code form rendered with branding pane, 3 links, 14 demo quick-login buttons.
  2. Entered `SKH-2024-001` + Continue → Step 2 appeared with school name banner + email/password form.
  3. Clicked "Parent? Access parent portal" → parent portal login screen.
  4. Clicked "Auto-fill demo credentials" → form populated; clicked "View My Child's Record" → dashboard rendered with student "Veronica Awuor", fee summary, attendance/grades/announcements cards.
  5. Clicked "To login" → returned to LoginForm Step 1.
- QA screenshots saved to `qa-sc1-login-step1.png`, `qa-sc1-login-step2.png`, `qa-sc1-parent-login.png`, `qa-sc1-parent-dashboard.png`.

## Notes for downstream agents

- The `AuthView` type now also includes `'superadmin'` (per task spec). No UI uses it yet — super-admin login still goes through the existing flow (auto-provisioned on first login attempt via `ensureSuperAdmin()` in `auth-utils.ts`).
- The parent portal intentionally doesn't set a `user` in the auth store. It manages its own `studentId` state internally; "Exit" returns to the parent login, "To login" returns to the staff LoginForm.
- `normalizePhone()` in `src/lib/phone-utils.ts` is a generic helper — reuse for any future phone-verification flows.
- Demo credentials button only works when at least one active student with a linked guardian exists in the DB. Returns 404 with a helpful message otherwise.
