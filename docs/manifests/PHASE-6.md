# Phase 6 — Result entry and the approval chain

## How to upload
Keep the folder layout. Files under **CHANGED** replace the old file completely; files under **NEW** are added. No folders with dots or square brackets.

## Before you start
Phase 6 needs Phase 5 to be live (it uses the grading and assessment settings). If Phase 4 or 5 never deployed, upload those zips first.

## NEW (20 files + this manifest)
```
src/app/(admin)/admin/results/page.tsx
src/app/(admin)/admin/results/sheet/page.tsx
src/app/(admin)/admin/results/subject/page.tsx
src/app/(teacher)/teacher/results/entry/page.tsx
src/app/(teacher)/teacher/results/page.tsx
src/app/(teacher)/teacher/reviews/page.tsx
src/app/(teacher)/teacher/reviews/subject/page.tsx
src/components/results/class-sheet-view.tsx
src/components/results/remarks-form.tsx
src/components/results/review-actions.tsx
src/components/results/score-grid.tsx
src/components/results/sheet-actions.tsx
src/components/results/status-badge.tsx
src/components/results/subject-scores-table.tsx
src/lib/results/actions.ts
src/lib/results/class-data.ts
src/lib/results/service.ts
src/lib/results/subject-view.ts
src/lib/results/workflow.test.ts
src/lib/results/workflow.ts
docs/manifests/PHASE-6.md
```

## CHANGED (replace the whole file) — 5 files
```
src/components/dashboard/nav-config.ts
src/lib/audit.ts
src/lib/permissions/policies.test.ts
src/lib/permissions/policies.ts
src/lib/validators/results.ts
```

## What changed in each CHANGED file
- `src/components/dashboard/nav-config.ts`: "Results" (Admin), "Result entry" and "Reviews" (Teacher) are switched on.
- `src/lib/audit.ts`: new audit names for reopened subjects, class sheets sent in, and unpublished results.
- `src/lib/permissions/policies.ts` and `policies.test.ts`: new rules for viewing subjects, the class sheet and remarks, with tests.
- `src/lib/validators/results.ts`: input checks for entering, reviewing and publishing results.

## No database changes, no new packages, no new Vercel variables

## How results move (the rules built in)
Subject results (one subject, one class, one term):
- Draft -> **Submitted** (a subject teacher submits to the Form Teacher) -> **Approved** or **Needs correction** (sent back with a reason, then corrected and resubmitted).
- A Form Teacher's own entries skip the Form Teacher review and are approved on submission.
- Nobody reviews their own submission.
- Scores can only be changed while a subject is a draft or needs correction AND the class has not gone to the Admin.

Class sheet (one class, one term):
- Draft -> the Form Teacher sends the class to the Admin once every subject is approved and every student has every score -> Admin **approves** (or sends chosen subjects back with a reason) -> Admin **publishes**.
- An Admin who sent a class in themselves cannot approve it.
- Published results can be unpublished (reason required) and go back to "approved".
- Only Admins approve and publish. Teachers and Form Teachers never can.

## Safety checks built in
- Everything is checked on the server against the teacher's assignments. Changing a class or subject in the address bar shows "not found".
- Scores below 0 or above a component's maximum are refused.
- Two people clicking at once cannot submit or approve the same results twice.
- Every step is saved as an approval record and in the audit log.
- A locked term (not yet switchable on screen) refuses score changes.

## Known limits (by design, for now)
- Results are entered for the CURRENT term only.
- Elective subjects: a subject marked non-compulsory only expects students who chose it, but there is no screen yet to record those choices. Until then treat every subject as compulsory.
- Parents cannot see results yet. That arrives with the PIN portal in Phase 7.

## Coming in Phase 7
CHANGED (replace whole file): `src/components/dashboard/nav-config.ts`, `src/lib/audit.ts`, `.env.example`. Everything else is NEW.
