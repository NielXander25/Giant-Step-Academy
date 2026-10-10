# Phase 4 — Students and spreadsheet import

## How to upload
Keep the folder layout. Files under **CHANGED** replace the old file completely; files under **NEW** are added. There are no folders with dots or square brackets in this phase.

## NEW (26 files + this manifest)
```
src/app/(admin)/admin/students/edit/page.tsx
src/app/(admin)/admin/students/import/page.tsx
src/app/(admin)/admin/students/import/review/page.tsx
src/app/(admin)/admin/students/page.tsx
src/app/(teacher)/teacher/students/approvals/page.tsx
src/app/(teacher)/teacher/students/edit/page.tsx
src/app/(teacher)/teacher/students/import/page.tsx
src/app/(teacher)/teacher/students/import/review/page.tsx
src/app/(teacher)/teacher/students/page.tsx
src/app/api/import-template/route.ts
src/app/api/student-imports/route.ts
src/components/students/add-student-form.tsx
src/components/students/batch-actions.tsx
src/components/students/batch-view.tsx
src/components/students/edit-student-form.tsx
src/components/students/import-preview.tsx
src/components/students/import-uploader.tsx
src/lib/students/actions.ts
src/lib/students/batch-access.ts
src/lib/students/import-commit.ts
src/lib/students/import-parse.ts
src/lib/students/import-validate.ts
src/lib/students/normalize.ts
src/lib/students/students.test.ts
src/lib/students/template.ts
src/lib/validators/student.ts
docs/manifests/PHASE-4.md
```

## CHANGED (replace the whole file) — 5 files
```
next.config.ts
package-lock.json
package.json
src/components/dashboard/nav-config.ts
src/lib/audit.ts
```

## What changed in each CHANGED file
- `package.json`, `package-lock.json`: added the `exceljs` spreadsheet library.
- `next.config.ts`: `exceljs` is kept out of the bundle (it loads faster and builds more reliably that way).
- `src/components/dashboard/nav-config.ts`: "Students" (Admin) and "My students" (Teacher) are switched on.
- `src/lib/audit.ts`: new audit action names for student updates and uploads.

## No database changes, no new Vercel variables
Every table used here already exists from Phase 1.

## Rules built into this phase
- Template columns: Admission Number, Full Name, Gender (optional), Date of Birth (optional). The class is chosen on upload, not in the sheet.
- Admission numbers are stored upper-case without spaces (`gsa/ss2/001 ` becomes `GSA/SS2/001`). The result portal will use the same rule.
- A Form Teacher (or Admin) uploads straight into their class. A subject teacher's upload waits for the class's Form Teacher, or an Admin, to approve it.
- Every row is checked and labelled New / Existing / Duplicate / Problem. Problem and duplicate rows are skipped and listed, never imported silently.
- The preview is re-checked at the moment of import, so an out-of-date preview can never create duplicates or overwrite someone else.
- A student is enrolled in one class per session (enforced by the database).
- Form Teachers can edit name, gender and date of birth in their own class. Only Admins change admission numbers or status, and mark students as repeating.

## Differences from the plan
- Review and edit pages use `?batch=` and `?student=` in the address instead of folders like `[id]`, to avoid upload problems with brackets.
- Only `.xlsx` files are accepted (not CSV).

## Coming in Phase 5
CHANGED (replace whole file): `src/components/dashboard/nav-config.ts`. Everything else is NEW.
