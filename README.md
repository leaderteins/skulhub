# SkulHub — Professional School Management System

> The complete school management system for Kenyan schools and institutions worldwide.
> 33+ modules, multi-tenancy, parent portal, staff signup, CBC support, M-Pesa Daraja integration.

**Live Website:** [https://skulhub.vercel.app](https://skulhub.vercel.app)

---

## Features

- **33+ Modules**: Dashboard, Students, Staff, Academics, Attendance, Finance, Exams,
  Report Cards, Health, Discipline, Hostel/Boarding, Communications, Library, Transport,
  Cafeteria, Inventory, Procurement, Payroll, Appraisals, Feedback, and more.
- **Multi-Tenancy**: Each school gets isolated data. Register unlimited schools on one platform.
- **Role-Based Access**: 13 staff roles (admin, principal, bursar, teacher, librarian, nurse, etc.)
  with granular per-user module permissions.
- **Parent Portal**: Parents check fees, grades, attendance from their phone.
- **Staff Self-Signup**: Staff request to join a school; principal approves/rejects.
- **CBC & 8-4-4**: Supports Kenya's Competency-Based Curriculum and 8-4-4 system.
- **M-Pesa Daraja STK Push**: Real Safaricom Daraja API integration for fee payments.
- **Super Admin Console**: Platform owner dashboard for managing all schools.

---

## Demo Login Credentials

**School Code:** `SKH-2024-001` (SkulHub Academy)

### School Staff (use any of these with the school code above):

| Role            | Email                            | Password         |
| --------------- | -------------------------------- | ---------------- |
| Admin           | admin@skulhub.ac.ke              | admin123         |
| Principal       | principal@skulhub.ac.ke          | principal123     |
| Deputy Principal| deputy@skulhub.ac.ke             | deputy123        |
| Bursar          | bursar@skulhub.ac.ke              | bursar123        |
| Teacher         | teacher@skulhub.ac.ke             | teacher123       |
| Librarian       | librarian@skulhub.ac.ke           | librarian123     |
| Nurse           | nurse@skulhub.ac.ke               | nurse123         |
| Admissions      | admissions@skulhub.ac.ke         | admissions123    |
| Matron          | matron@skulhub.ac.ke              | matron123        |
| Secretary       | secretary@skulhub.ac.ke           | secretary123     |
| Bus Driver      | driver@skulhub.ac.ke              | driver123        |
| Gate Officer    | gate@skulhub.ac.ke                | gate123          |
| Cook            | cook@skulhub.ac.ke                 | cook123          |

### Super Admin (Platform Owner):

Press **Ctrl+Shift+A** on the login screen → enter access code: `skulhub-super-2026`

Then log in with:
- **Email:** `superadmin@skulhub.ac.ke`
- **Password:** `superadmin123`

> ⚠️ **Change these credentials in production** via Settings → Users & Roles.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + shadcn/ui (New York)
- **Database:** Prisma ORM (SQLite for dev, Postgres for production)
- **State:** Zustand (client), TanStack Query (server)
- **Auth:** Custom JWT-like HMAC-signed session tokens
- **Payments:** Safaricom Daraja M-Pesa API (STK Push)

---

## Local Development

```bash
# Install dependencies
bun install

# Set up the database
bun run db:push        # Creates tables from prisma/schema.prisma
bun run db:generate    # Regenerates Prisma client

# (Optional) Seed demo data
bun run prisma/seed-demo.ts

# Start dev server
bun run dev
```

The app runs on `http://localhost:3000`.

---

## Deploying to Vercel

1. **Fork/Push** this repo to GitHub (make sure it's public).
2. Go to [vercel.com](https://vercel.com) → New Project → import your GitHub repo.
3. **Set Environment Variables** (Project Settings → Environment Variables):
   - `DATABASE_URL` — a Postgres connection string (recommended: [Neon](https://neon.tech) free tier)
   - `SESSION_SECRET` — a random 32+ char string (`openssl rand -hex 32`)
   - (Optional) `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_SHORTCODE` for Daraja
4. **Deploy** — Vercel will run `postinstall` (prisma generate) and `build` (`prisma generate && next build`) automatically.
5. After deploy, run `bun run db:push` against your Postgres URL to create tables.
6. (Optional) Seed demo data: `DATABASE_URL=your_postgres_url bun run prisma/seed-demo.ts`

### Vercel Build Notes

- ✅ `next.config.ts` has NO `output: "standalone"` (Vercel handles its own build output).
- ✅ `postinstall` script uses `prisma generate || true` (won't fail the build if DB is unreachable).
- ✅ `src/lib/db.ts` has a fallback `DATABASE_URL` (uses local SQLite if env var not set).
- ✅ `start` script uses `next start` (not the standalone server).

---

## Daraja M-Pesa Integration

SkulHub has a complete Safaricom Daraja STK Push integration. See the in-app
**Settings → Daraja Guide** tab for a detailed explanation of:

- What Daraja is and how it differs from traditional Paybill
- The 8-step payment flow (from STK Push to invoice auto-update)
- All API endpoints used (OAuth, STK Push, Callback)
- Setup instructions (get credentials from developer.safaricom.co.ke)
- Phone number format conversion (0742 340 924 → 254742340924)
- Security & compliance notes

Quick setup: Settings → M-Pesa → enter Consumer Key, Secret, Passkey, Shortcode → Test Connection → Save.

---

## System Status & Auto-Correction

SkulHub includes a built-in system health monitor at **Settings → System Status**:

- **Auto-refreshes every 30 seconds** to detect issues.
- Checks: database, storage, network, auth, M-Pesa config.
- **Auto-correction**: when a fixable issue is detected, the system attempts a fix automatically
  and logs the result (e.g., Prisma client regeneration, cache clearing).
- Critical issues that can't be auto-fixed are highlighted for manual intervention.

---

## License

Proprietary. © 2026 SkulHub. Built with ❤️ in Kenya.
