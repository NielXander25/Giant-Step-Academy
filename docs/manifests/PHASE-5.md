# Phase 5 — Grading, assessment and the calculation engine

## How to upload
Keep the folder layout. Files under **CHANGED** replace the old file completely; files under **NEW** are added. No folders with dots or square brackets.

## Before you start
Phase 5 needs Phase 4 to be live on GitHub (it shares `nav-config.ts` and `audit.ts` with it). If Phase 4 never deployed, upload the Phase 4 zip first.

## NEW (15 files + this manifest)
```
src/app/(admin)/admin/settings/actions.ts
src/app/(admin)/admin/settings/assessment/components-editor.tsx
src/app/(admin)/admin/settings/assessment/page.tsx
src/app/(admin)/admin/settings/assessment/rules-form.tsx
src/app/(admin)/admin/settings/grading/grade-bands-editor.tsx
src/app/(admin)/admin/settings/grading/page.tsx
src/components/results/scope-tabs.tsx
src/components/results/score-preview.tsx
src/lib/results/calc.ts
src/lib/results/config-store.ts
src/lib/results/grading.ts
src/lib/results/ranking.ts
src/lib/results/results.test.ts
src/lib/results/rules.ts
src/lib/validators/results.ts
docs/manifests/PHASE-5.md
```

## CHANGED (replace the whole file) — 3 files
```
src/components/dashboard/nav-config.ts
src/lib/audit.ts
src/lib/permissions/policies.ts
```

## What changed in each CHANGED file
- `src/components/dashboard/nav-config.ts`: "Grading" is switched on and "Assessment & rules" is added.
- `src/lib/audit.ts`: new audit action `RESULT_CONFIG_CHANGED`.
- `src/lib/permissions/policies.ts`: new rule `canManageGrading` (Admin and Super Admin only).

## No database changes, no new packages, no new Vercel variables

## What the engine does (all of it is configurable on the two settings pages)
- A subject's total is the sum of its components (for example CA + Exam). It is only graded when every component has a valid score.
- Scores below 0 or above a component's maximum are refused, never graded.
- Average = the mean of the subject percentages, out of 100, rounded to 2 decimals.
- Missing subjects: by default the student gets no average, grade or position until every subject is in. The school can instead choose "use the subjects entered so far".
- Positions: tied averages share a position. "Standard" gives 1, 2, 2, 4; "Dense" gives 1, 2, 2, 3.
- Grade bands may differ per section (for example Primary and Secondary). A section without its own setup uses the all-sections one.
- Once any score has been entered, score components can only be renamed (not added, removed or re-weighted).

## Sample values
"Fill with sample" buttons offer CA 40 + Exam 60 and grades A–F as a starting point. They are samples, not the school's official scheme.

## Coming in Phase 6
CHANGED (replace whole file): `src/components/dashboard/nav-config.ts`, `src/lib/audit.ts`. Everything else is NEW.
