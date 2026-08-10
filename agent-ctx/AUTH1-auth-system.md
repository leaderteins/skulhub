# AUTH1 — Auth System Builder

## Task
Build the real authentication system for EduManage Pro — server-side auth with hashed passwords, school registration, and login.

## Status: COMPLETE

## What was built
- `src/lib/auth-utils.ts` — hashing, slug, HMAC-signed stateless session tokens, super-admin auto-provisioning
- `src/app/api/auth/register/route.ts` — school + admin creation with auto-seeded curriculum (Form 1-4, 15 subjects, 9 departments)
- `src/app/api/auth/login/route.ts` — bcrypt-based login with last-login tracking
- `src/app/api/auth/me/route.ts` — session validation
- `src/app/api/superadmin/route.ts` — added auth guard to existing GET (preserved SA-Dashboard agent's rich aggregation logic)
- `src/app/api/superadmin/[id]/route.ts` — added auth guard + platform-school protection to existing GET/PUT/DELETE
- `src/components/auth/register-form.tsx` — beautiful two-column registration form with trust signals + success screen
- `src/components/auth/super-admin-dashboard.tsx` — platform console with stat cards, schools table, edit/delete dialogs
- `src/lib/auth-store.ts` — added `serverToken`, `isSuperAdmin`, `authView`, `serverLogin`, `serverRegister`; kept demo login as fallback
- `src/components/auth/login-form.tsx` — added "Register your school" + "Super Admin Login" buttons; uses serverLogin first, demo login as fallback
- `src/app/page.tsx` — renders RegisterForm when authView='register' (even after auto-login, so success screen shows); renders SuperAdminDashboard for super_admin

## Key design decisions
- **Stateless HMAC-signed tokens** (not JWT lib) — `base64url(payload).base64url(hmac)` with 7-day TTL, no DB session table needed
- **Auto-provisioned super admin** — `superadmin@edumanage.ac.ke` / `superadmin123` is created on first login attempt with that email, attached to a system "EduManage Platform" school (slug="platform")
- **Platform school protection** — slug="platform" school cannot be modified/deleted via superadmin API; excluded from listings and counts
- **Demo login fallback** — if `serverLogin` fails (e.g. user not in DB), `login()` is tried as fallback so dev convenience is preserved
- **Idempotent seeding** — default subjects/departments/class-levels are checked for existence before insert (Subject has BOTH name+code unique, so we check both)
- **authView stays 'register' after auto-login** — so RegisterForm can show its success screen before page.tsx switches to the dashboard

## Super admin credentials
- Email: `superadmin@edumanage.ac.ke`
- Password: `superadmin123`
- Auto-provisioned on first login attempt with this email

## API auth patterns for other agents
Use `getUserFromRequest(req)` from `@/lib/auth-utils` to get the authenticated user. Returns null if not authenticated or suspended.
```ts
import { getUserFromRequest } from '@/lib/auth-utils'
const user = await getUserFromRequest(req)
if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
// user.id, user.email, user.role, user.schoolId, user.school.name, etc.
```

For super-admin-only endpoints:
```ts
if (user.role !== 'super_admin') {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

## Auth store fields available
- `user: SystemUser | null` — current user (id, name, email, role, avatar, schoolId, schoolName, schoolSlug, isSuperAdmin)
- `serverToken: string | null` — persisted HMAC-signed session token
- `isSuperAdmin: boolean` — derived from user.role === 'super_admin'
- `authView: 'login' | 'register'` — which auth screen to show
- `setAuthView(view)` — switch between login/register
- `serverLogin(email, password)` — calls /api/auth/login, sets user+token
- `serverRegister(data)` — calls /api/auth/register, auto-logs-in
- `login(email, password)` — demo fallback (Zustand-only)
- `logout()` — clears all auth state, resets authView to 'login'

## Files for reference
- Auth utilities: `/home/z/my-project/src/lib/auth-utils.ts`
- Auth store: `/home/z/my-project/src/lib/auth-store.ts`
- Auth API routes: `/home/z/my-project/src/app/api/auth/{register,login,me}/route.ts`
- Superadmin API routes: `/home/z/my-project/src/app/api/superadmin/{route,[id]/route}.ts`
- Auth components: `/home/z/my-project/src/components/auth/{login-form,register-form,super-admin-dashboard}.tsx`

## Lint status
0 errors, 0 warnings (clean)
