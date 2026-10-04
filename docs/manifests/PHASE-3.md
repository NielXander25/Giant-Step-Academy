# Phase 3 — Academic structure, teachers and assignments

## How to upload
Keep the folder layout. Files under **CHANGED** replace the old file completely; files under **NEW** are added. Folders with brackets like `(admin)` are fine. If any file fails to upload, create it by hand (Add file > Create new file) and tell me which one.

## NEW (45 files + this manifest)
```
src/app/(account)/account/layout.tsx
src/app/(account)/account/password/actions.ts
src/app/(account)/account/password/page.tsx
src/app/(account)/account/password/password-form.tsx
src/app/(admin)/admin/assignments/actions.ts
src/app/(admin)/admin/assignments/assignment-forms.tsx
src/app/(admin)/admin/assignments/page.tsx
src/app/(admin)/admin/classes/actions.ts
src/app/(admin)/admin/classes/class-forms.tsx
src/app/(admin)/admin/classes/page.tsx
src/app/(admin)/admin/sessions/actions.ts
src/app/(admin)/admin/sessions/page.tsx
src/app/(admin)/admin/sessions/session-forms.tsx
src/app/(admin)/admin/subjects/actions.ts
src/app/(admin)/admin/subjects/page.tsx
src/app/(admin)/admin/subjects/subject-forms.tsx
src/app/(admin)/admin/teacher-requests/actions.ts
src/app/(admin)/admin/teacher-requests/page.tsx
src/app/(admin)/admin/teacher-requests/request-actions.tsx
src/app/(admin)/admin/teachers/actions.ts
src/app/(admin)/admin/teachers/page.tsx
src/app/(auth)/register-teacher/actions.ts
src/app/(auth)/register-teacher/page.tsx
src/app/(auth)/register-teacher/register-form.tsx
src/app/(super-admin)/super-admin/admins/actions.ts
src/app/(super-admin)/super-admin/admins/admin-forms.tsx
src/app/(super-admin)/super-admin/admins/page.tsx
src/app/(teacher)/teacher/onboarding/actions.ts
src/app/(teacher)/teacher/onboarding/onboarding-form.tsx
src/app/(teacher)/teacher/onboarding/page.tsx
src/components/shared/action-button.tsx
src/components/shared/empty-state.tsx
src/components/shared/form-message.tsx
src/components/ui/select.tsx
src/components/ui/table.tsx
src/components/ui/textarea.tsx
src/lib/demo-seed.ts
src/lib/email.ts
src/lib/format.ts
src/lib/permissions/roles.ts
src/lib/prisma-errors.ts
src/lib/use-action.ts
src/lib/validators/academic.ts
src/lib/validators/people.ts
src/lib/validators/validators.test.ts
docs/manifests/PHASE-3.md
```

## CHANGED (replace the whole file) — 8 files
```
README.md
src/app/(auth)/login/page.tsx
src/app/(teacher)/teacher/page.tsx
src/components/dashboard/nav-config.ts
src/lib/action.ts
src/lib/audit.ts
src/lib/auth/session.ts
src/middleware.ts
```

## What changed in each CHANGED file
- `src/components/dashboard/nav-config.ts`: the pages built in this phase are switched on in the menu, and "Change password" is added for everyone.
- `src/lib/auth/session.ts`: accounts with a temporary password are sent to the change-password page first.
- `src/lib/action.ts`: server actions refuse to run while a temporary password is still active (except the change-password action itself).
- `src/lib/audit.ts`: new audit action names.
- `src/middleware.ts`: `/account/...` now requires sign-in.
- `src/app/(auth)/login/page.tsx`: "Request one" link to teacher registration.
- `src/app/(teacher)/teacher/page.tsx`: reminder to complete the profile.
- `README.md`: optional email setup.

## No database changes
The Phase 1 migration already contains every table used here. Nothing new is applied to Neon.

## Differences from the plan
- Added: temporary-password flow and the Change password page (`src/app/(account)/...`), because Admin accounts are created with a temporary password.
- Dropped: changes to `src/app/api/setup/route.ts` (not needed).
- Admin creation lives only at `/super-admin/admins`. The "can create admins" grant is stored and enforced by the permission rules, but a screen where a granted Admin creates admins is not built yet.

## Optional Vercel variables (email)
`RESEND_API_KEY` and `EMAIL_FROM`. Without them, approval emails are skipped and everything else works.

## Coming in Phase 4
CHANGED (replace whole file): `src/components/dashboard/nav-config.ts`, `src/lib/audit.ts`, `package.json`, `package-lock.json`. Everything else is NEW.
