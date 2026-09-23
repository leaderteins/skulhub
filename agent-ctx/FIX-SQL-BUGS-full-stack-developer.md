# Task ID: FIX-SQL-BUGS
## Agent: full-stack-developer
## Task: Fix PostgreSQL-only SQL syntax that breaks silently on SQLite

### Files Modified (10 total)

**Biometric (3 files)** — `NOW()` → `datetime('now')` or omit `@default(now())` columns:
1. `src/app/api/biometric/devices/route.ts`
   - POST INSERT: dropped `createdAt` column (has `@default(now())`); `updatedAt` uses `datetime('now')`
   - PUT: `"updatedAt"` and `"lastSeen"` both use `datetime('now')`
2. `src/app/api/biometric/sync/route.ts`
   - INSERT BiometricLog: dropped `timestamp` + `createdAt` (both `@default(now())`)
   - INSERT BusBoarding: dropped `timestamp` + `createdAt`
3. `src/app/api/biometric/logs/route.ts`
   - INSERT BiometricTemplate: dropped `enrolledAt` + `createdAt`

**Super Admin (7 files)** — `::int`/`::float` removed; `NOW()`/`INTERVAL` → `datetime()`:
4. `src/app/api/superadmin/health/route.ts` — removed 5 casts, added `toNum`, safe bigint date handling, override `lastLogin` in spread to prevent JSON serialization crash
5. `src/app/api/superadmin/compare/route.ts` — removed 9 casts; replaced `WHERE s.id = ANY($1::text[])` with parameterized `IN ($1,$2,...)` + spread `...ids`
6. `src/app/api/superadmin/churn/route.ts` — removed 1 `::int`
7. `src/app/api/superadmin/[id]/route.ts` — removed casts from 4 aggregate queries; PUT uses `datetime('now')`
8. `src/app/api/superadmin/bulk/route.ts` — all 4 UPDATEs use `datetime('now')`; `extend_trial` uses `datetime('now','+30 days')`
9. `src/app/api/superadmin/platform-stats/route.ts` — removed 1 `::int`; `NOW() - INTERVAL '7 days'` → `datetime('now','-7 days')`
10. `src/app/api/superadmin/trials/route.ts` — removed 2 `::int`; override raw bigint fields in spread to prevent JSON crash

### Verification
- `bun run lint` → exit 0 ✓
- `rg -n 'NOW\(\)|::int|::float|::text|ANY\(\$|INTERVAL' src/app/api/biometric src/app/api/superadmin` → only comment matches (no live PG syntax) ✓
- Smoke tests on dev server:
  - `GET /api/superadmin/health` → summary{totalSchools:1, warning:1} + schools[0]{users:5, students:426, lastLogin:1788618131367} ✓
  - `GET /api/superadmin/platform-stats` → totals{students:426, staff:33, users:5, totalRevenue:14500} ✓
  - `GET /api/superadmin/trials` → summary{converted:1, conversionRate:100} ✓
  - `GET /api/superadmin/churn` → summary{totalChurned:0} ✓
  - `GET /api/superadmin/<id>` → full school record ✓
  - `GET /api/superadmin/compare?ids=X,X` → 2 schools with all counts ✓
  - `PUT /api/superadmin/<id>` (maxStudents=1500) → {success:true, school:{...}} ✓
  - `POST /api/biometric/devices` → 201, device persisted with timestamps ✓
  - `POST /api/biometric/sync` → 201, log persisted with timestamps ✓

### Key Decisions
- Used a `toNum` helper in files touching COUNT/SUM results (health, compare, trials) for consistent bigint→number conversion
- In addition to removing casts, OVERRODE raw bigint fields in `...spread` (health.lastLogin, trials.user_count/student_count) because `NextResponse.json` calls `JSON.stringify` which throws on bigint — without override, the spread leaks bigints even when computed Number() values are added later
- Safe bigint handling before `new Date(v)` to avoid `new Date(bigint)` crash (applied in health/route.ts)
- Did NOT change any business logic — only the SQL syntax + numeric coercion

### Stage Summary
- ✅ All 10 files fixed; PG-only SQL constructs eliminated
- ✅ Lint passes clean
- ✅ Grep verification confirms no live PG syntax remains (only comments)
- ✅ All smoke tests return real data instead of empty/errored responses
