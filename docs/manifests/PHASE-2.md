# Phase 2 — Sign-in and permissions

## How to upload
Upload every file in this zip, keeping the folder layout. Files under **CHANGED** replace the old file completely; files under **NEW** are added. Nothing else in your repo changes.

## NEW (34 files + this manifest)
```
src/app/(admin)/admin/layout.tsx
src/app/(admin)/admin/page.tsx
src/app/(auth)/login/actions.ts
src/app/(auth)/login/login-form.tsx
src/app/(auth)/login/page.tsx
src/app/(super-admin)/super-admin/layout.tsx
src/app/(super-admin)/super-admin/page.tsx
src/app/(teacher)/teacher/layout.tsx
src/app/(teacher)/teacher/page.tsx
src/app/api/auth/[...nextauth]/route.ts
src/app/dashboard/page.tsx
src/auth.config.ts
src/auth.ts
src/components/dashboard/dashboard-shell.tsx
src/components/dashboard/mobile-nav.tsx
src/components/dashboard/nav-config.ts
src/components/dashboard/nav-links.tsx
src/components/dashboard/page-header.tsx
src/components/dashboard/sidebar.tsx
src/components/dashboard/stat-card.tsx
src/components/dashboard/topbar.tsx
src/lib/action.ts
src/lib/audit.ts
src/lib/auth/authenticate.ts
src/lib/auth/session.ts
src/lib/auth/throttle.ts
src/lib/errors.ts
src/lib/permissions/assignments.ts
src/lib/permissions/policies.test.ts
src/lib/permissions/policies.ts
src/lib/request.ts
src/middleware.ts
src/types/next-auth.d.ts
vitest.config.mts
docs/manifests/PHASE-2.md
```

## CHANGED (replace the whole file)
```
.env.example
package-lock.json
package.json
src/app/page.tsx
```

## What changed in each CHANGED file
- `package.json`, `package-lock.json`: added `next-auth` (login) and `vitest` (tests), plus a `test` script.
- `.env.example`: `AUTH_SECRET` moved from "later" to active.
- `src/app/page.tsx`: added a "Staff sign in" button.

## Differences from the plan
- Added: `src/lib/auth/authenticate.ts`, `src/lib/auth/throttle.ts`, `src/lib/request.ts`, `src/lib/errors.ts` (login protection and shared helpers), `src/app/dashboard/page.tsx` (sends each role to its own area), `src/components/dashboard/nav-links.tsx`, `dashboard-shell.tsx`, `page-header.tsx`, `stat-card.tsx`.
- `page-header.tsx` now lives in `components/dashboard/` (it was planned for Phase 3's `components/shared/`).
- The test config is `vitest.config.mts` (not `.ts`).

## Needs a new Vercel environment variable
`AUTH_SECRET` (Production): a long random value, 40+ characters.

## Coming in Phase 3
CHANGED (replace whole file): `src/components/dashboard/nav-config.ts`, `src/app/api/setup/route.ts`, `package.json`, `package-lock.json`. Everything else is NEW.
