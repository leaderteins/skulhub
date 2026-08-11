# Task SS1 — Staff Self-Signup System

## What was built
- Staff self-registration form (school code + personal details) → UserAccount
  created with status "Pending" + linked Staff record created.
- Principal/admin approval module: review pending requests, approve/reject
  with optional reason.
- Login route hardened to block Pending/Rejected/Inactive users with clear
  messages (including rejection reason).

## Files added
- `src/app/api/auth/staff-signup/route.ts` — POST endpoint
- `src/app/api/staff-approvals/route.ts` — GET (list pending + recent) +
  PUT (approve/reject)
- `src/components/auth/staff-signup.tsx` — staff signup form with 3-step
  explanation on left, success screen
- `src/components/modules/staff-approvals.tsx` — principal's approval module

## Files modified
- `prisma/schema.prisma` — added rejectionReason + staffId on UserAccount
  + Staff.userAccounts back-relation
- `src/app/api/auth/login/route.ts` — added guards for Pending/Rejected/
  Inactive statuses
- `src/lib/auth-store.ts` — AuthView type expanded, added staffSignup()
  action + StaffSignupPayload type, added 'staffapprovals' to ALL_MODULES
  + MODULE_ACCESS for admin/principal/deputy_principal
- `src/lib/store.ts` — added 'staffapprovals' to ModuleKey
- `src/app/page.tsx` — renders <StaffSignup /> + <StaffApprovalsModule />
- `src/components/layout/sidebar.tsx` — added Staff Approvals nav under People
- `src/components/layout/header.tsx` — added staffapprovals title entry
- `src/components/layout/command-palette.tsx` — added Staff Approvals item
- `src/components/auth/login-form.tsx` — added "Staff sign up" links (2 places)

## API contract
- POST /api/auth/staff-signup
  Body: { schoolCode, name, email, password, phone, role, gender,
         qualification, specialization }
  Returns: { success: true, message, userId, employeeNo, schoolName }
- GET /api/staff-approvals (auth required — admin/principal/super_admin)
  Returns: { pending[], recent[], summary: { pending, approved, rejected } }
- PUT /api/staff-approvals (auth required)
  Body: { userId, action: "approve" | "reject", rejectionReason? }
  Returns: { success: true, message }

## Verification
- Lint: 0 errors, 0 warnings
- db:push: schema applied successfully
- All endpoints tested live via curl:
  * Valid signup → 201 + login works after approval
  * Invalid schoolCode → 404
  * Short password → 400
  * Duplicate email → 409
  * Approve flow → user can log in immediately
  * Reject flow with reason → login returns 403 + reason
  * GET without auth → 401

## Notes for other agents
- UserAccount.status can now be: Active | Suspended | Inactive | Pending | Rejected
- UserAccount.staffId links a self-registered user to their Staff record
- The Staff Approvals module is visible only to admin, principal, and
  deputy_principal
- "Staff sign up" link added to login screen — calls setAuthView('staff-signup')
- Dev server restarted on port 3000
