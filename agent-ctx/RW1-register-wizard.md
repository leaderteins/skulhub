# Task RW1 — 6-Step School Registration Wizard

**Agent:** RW1 (Registration Wizard)
**Scope:** Rewrite `src/components/auth/register-form.tsx` as a premium 6-step wizard + extend auth-store + extend register API response.

## Files Modified
1. `src/lib/auth-store.ts`
   - Extended `ServerRegisterPayload` with optional fields: `level`, `knecCode`,
     `yearEstablished`, `category`, `gender`, `motto`, `primaryColor`, `address`,
     `adminPhone`.
   - Added `schoolCode` to `ServerRegisterResponse.school` and to the
     `serverRegister` return shape.
2. `src/app/api/auth/register/route.ts`
   - Added `schoolCode: school.schoolCode` to the JSON response so the success
     screen can display it.
3. `src/components/auth/register-form.tsx`
   - Complete rewrite as a 6-step wizard with progress stepper, branding panel,
     per-step validation, review summary, and success screen.

## Wizard Steps
1. **School Basics** — School Name *, School Category * (National/County/Sub-County/Private/International), School Email, School Phone
2. **School Type** — Education Level * (Primary/Junior Secondary/Secondary/University/Mixed), KNEC Code, Year Established (with min/max bounds)
3. **Gender & Location** — Gender * (3 visual cards: Boys/Mars, Girls/Venus, Mixed/Users with gradient icons), County * (47 Kenyan counties + Other), Address (textarea)
4. **School Identity** — Motto, Primary Color (7 preset swatches + custom color picker + live preview tile with branded button + soft badge + hex code), Logo upload placeholder (styled dashed box, no actual upload)
5. **Principal Account** — Admin Name *, Admin Email *, Admin Phone, Password * (with show/hide toggle + 4-segment strength meter), Confirm Password * (with green checkmark when matching)
6. **Review & Submit** — All entered data displayed in 5 grouped cards with "Edit" buttons that jump back to the relevant step + 30-day trial callout + Terms of Service notice + "Start Free Trial" button

## Wizard Features
- **Progress Stepper**: 6 nodes at the top showing step icons, with checkmarks for completed steps, gradient connector lines that fill as you progress, hover tooltips with step names, and click-to-jump (only to reachable steps).
- **Left Branding Panel** (lg+): SkulHub logo + name, "Register Your School" heading, description text, animated progress bar with "Step X of 6" + percentage, current step name + description, 3 trust feature cards (Instant setup, Secure & isolated, Pre-loaded curriculum), and a tip card at the bottom.
- **Right Panel**: Card with glassmorphism (`bg-card/80 backdrop-blur-xl`), mobile branding header (visible on small screens), stepper, step heading, animated step content (slide-in from right when going forward, from left when going back), navigation row (Back/Continue), and sign-in link.
- **Validation**: Each step validates required fields on Continue. Invalid fields show red borders, error messages, and a toast notification. Submitting from Step 6 re-validates all required steps (1, 2, 3, 5) and jumps back to the first invalid one.
- **Animation**: Uses `tailwindcss-animate` classes (`animate-in fade-in-50 slide-in-from-right-8/left-8 duration-300`) keyed by step number for smooth transitions.
- **Success Screen**: Glassmorphism card with animated green check icon, school name, prominent school code display (large monospace with emerald accent), school URL slug, "Enter Dashboard" button (calls `setAuthView('login')` which lets `page.tsx` render the dashboard).
- **Responsive**: Mobile-first — branding panel hides on small screens, replaced by compact logo + login link in the form header. Stepper scales to fit. Grid layouts collapse to single column.

## Design System
- **Theme**: Emerald/teal gradient backgrounds (`from-emerald-50 via-teal-50 to-cyan-50`), with dark mode variants.
- **Decorative blobs**: Three blurred gradient circles (emerald, teal, cyan) in the background.
- **Buttons**: `bg-gradient-to-r from-emerald-600 to-teal-600` for primary actions.
- **Cards**: `border-0 bg-card/80 shadow-2xl backdrop-blur-xl` for glassmorphism.
- **Color Picker Presets**: Emerald `#10b981`, Teal `#14b8a6`, Cyan `#06b6d4`, Amber `#f59e0b`, Rose `#f43f5e`, Violet `#8b5cf6`, Slate `#64748b`.
- **Icons**: Lucide React (School, User, Mail, Lock, Phone, MapPin, Building2, GraduationCap, Mars, Venus, Users, Palette, Upload, Hash, CalendarDays, Quote, Eye, EyeOff, Check, Loader2, PencilLine, ShieldCheck, Rocket, Sparkles, CheckCircle2, ArrowLeft, ArrowRight).
- **No indigo or blue colors** — uses emerald/teal throughout (per design rules).

## Verification
- `bun run lint` → clean (no errors, no warnings)
- `bun run db:push` → ran to regenerate Prisma client (schema already had all fields, but client was stale; this fixed a `PrismaClientValidationError: Unknown argument 'knecCode'` that was pre-existing)
- Dev server (Next.js 16 + Turbopack) compiles the form cleanly, returns HTTP 200 on `/`
- API smoke test: `POST /api/auth/register` with full wizard payload returns 201 with `{ school: { id, name, slug, schoolCode: "SKH-2026-003", plan, status, trialEndsAt }, user: { ... }, token }` — all new fields (category, level, knecCode, yearEstablished, gender, county, address, motto, primaryColor, adminPhone) are persisted to the School record.
- The success screen's `schoolCode` display works end-to-end: API returns it → auth-store passes it through → success screen renders it.

## Coordination Notes for Other Agents
- The `ServerRegisterPayload` interface in `src/lib/auth-store.ts` now accepts all the new wizard fields as optional. Any code that calls `serverRegister` can pass any subset of these.
- The register API response now includes `school.schoolCode` — useful for any UI that needs to display the school's login code.
- The wizard auto-jumps to invalid steps on submit, so partial submissions are prevented.
- The form is fully client-side validated before submission; the API route's own validation serves as a defense-in-depth.
- The "Enter Dashboard" button on the success screen sets `authView` to `'login'`, which lets `page.tsx` render the dashboard (since `serverRegister` already set the user in the store via auto-login).
