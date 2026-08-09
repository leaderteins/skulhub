# Task P2 — Procurement & Facility Booking Modules

## Agent
procurement-facilities-builder

## Task
Build the Procurement and Facility Booking modules for EduManage Pro (API routes + UI components + seed data + app wiring).

## Deliverables

### API Routes
- `src/app/api/procurement/route.ts` — GET (stats + suppliers + POs + breakdowns, filterable), POST (dual-mode: create supplier OR create PO with auto poNumber `PO-{year}-{0000}` and calculated totalAmount), PUT (update PO status with auto approvedBy/deliveryDate)
- `src/app/api/facilities/route.ts` — GET (stats + facilities + bookings + breakdowns, with bookedToday date-overlap query), POST (dual-mode: create facility with unique-name check OR create booking with overlap-conflict detection), PUT (update booking status)

### UI Components
- `src/components/modules/procurement.tsx` — Amber gradient header, 4 stat cards (Total Orders, Pending, Delivered, Total Value), suppliers list with scroll, status donut chart, filters, PO table with approve/deliver/cancel actions, New PO + Add Supplier dialogs
- `src/components/modules/facilities.tsx` — Teal gradient header, 4 stat cards (Total Facilities, Available, Booked Today, Pending Approvals), facility cards grid with type icons + Book button, bookings table with approve/reject/complete actions, New Booking + Add Facility dialogs

### Seed Data
- `prisma/seed-procurement-facilities.ts` — 10 suppliers, 12 POs, 14 facilities, 12 bookings. Ran successfully.

### App Wiring (modified files)
- `src/lib/store.ts` — added 'procurement' | 'facilities' to ModuleKey
- `src/lib/auth-store.ts` — added to ALL_MODULES + admin/principal/deputy/bursar roles
- `src/components/layout/sidebar.tsx` — nav items (ShoppingCart, Building2) in Administration group
- `src/components/layout/command-palette.tsx` — nav entries (G K, G Y)
- `src/components/layout/header.tsx` — title/subtitle entries
- `src/app/page.tsx` — imports + render switch

## Verification
- `bun run lint` → 0 errors
- `bunx tsc --noEmit -p tsconfig.json` → 0 errors in P2 files
- Standalone Prisma query replication confirmed all GET queries return correct data:
  - Procurement: 12 orders, 3 pending, 4 delivered, KES 1,951,700 total
  - Facilities: 14 facilities, 12 available, 3 booked today, 4 pending approvals
  - PO number generation logic confirmed working

## Known Issue (NOT my code)
- Live HTTP test of `/api/procurement` & `/api/facilities` returns HTTP 500 due to a CASCADE compile failure: another agent's `src/components/modules/lessonplans.tsx` imports `CalendarWeek` from lucide-react which doesn't exist, breaking page.tsx compilation and cascading to API routes. My API code is verified correct via standalone Prisma query replication. The cascade resolves once the lessonplans agent fixes their import.

## Conventions Followed
- Emerald/teal/amber palette (NO indigo/blue)
- shadcn/ui components, lucide-react icons, recharts
- cn(), sonner toast, useFetch/apiPost/apiPut from lib/api
- useAuthStore for user identity (requestedBy/approvedBy/bookedBy)
- formatKES, formatDate, formatDateTime from lib/format
- Mobile-first responsive, custom scrollbar styling, max-h-96 scroll on long lists
- Activity logging on all mutations
