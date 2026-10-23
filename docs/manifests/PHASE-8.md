# Phase 8 — PDF report cards, school details and report layout

## How to upload
Keep the folder layout. Files under **CHANGED** replace the old file completely; files under **NEW** are added. No folders with dots or square brackets.

## Before you start
Phase 8 needs Phase 7 to be live. The site installs one new library (the PDF maker) by itself. **No new Vercel variables and no database changes.**

## NEW (12 files + this manifest)
```
src/app/(admin)/admin/settings/school/actions.ts
src/app/(admin)/admin/settings/school/page.tsx
src/app/(admin)/admin/settings/school/school-forms.tsx
src/app/api/results/pdf/route.ts
src/app/api/results/sample-pdf/route.ts
src/lib/pdf/logo.ts
src/lib/pdf/result-pdf.test.ts
src/lib/pdf/result-pdf.tsx
src/lib/pdf/sample.ts
src/lib/results/report-layout-store.ts
src/lib/results/report-layout.ts
src/lib/validators/school.ts
docs/manifests/PHASE-8.md
```

## CHANGED (replace the whole file) — 10 files
```
next.config.ts
package-lock.json
package.json
src/app/(portal)/results/view/page.tsx
src/components/dashboard/nav-config.ts
src/components/portal/result-sheet.tsx
src/lib/audit.ts
src/lib/permissions/policies.ts
src/lib/pin/result-data.ts
vitest.config.mts
```

## What changed in each CHANGED file
- `package.json`, `package-lock.json`: adds the PDF library (`@react-pdf/renderer`).
- `next.config.ts`: keeps the PDF library out of the bundle so it loads reliably.
- `vitest.config.mts`: lets the tests read `.tsx` files (for the PDF tests).
- `src/components/dashboard/nav-config.ts`: adds "School & report card".
- `src/lib/audit.ts`, `src/lib/permissions/policies.ts`: new audit name and permission rule for school details.
- `src/lib/pin/result-data.ts`: the report now carries the saved layout.
- `src/components/portal/result-sheet.tsx`: the on-screen report obeys the layout switches.
- `src/app/(portal)/results/view/page.tsx`: adds a **Download PDF** button next to Print.
- `src/lib/results/report-layout.ts`: now holds only the rules; database parts moved to the new `report-layout-store.ts`.

## What it does
- **Download PDF** on the result page produces a proper A4 report card (school header, logo, scores table, total/average/grade/position, remarks, signature lines). It works only during the 30-minute viewing pass and **never uses another PIN attempt**.
- **School & report card** (Admin menu > Results): enter the real school name, motto, address, phone, email, principal and logo link; choose what the report shows (gender, position, number of students, signature lines, a footer note); see a live preview and open a sample PDF.
- Placeholders such as `[SCHOOL ADDRESS]` stay visible until real details are saved, and a banner reminds the Admin.
- A broken or missing logo never stops a report from downloading. Only public https image links (PNG or JPG) are used.

## Still to come
- Uploading the logo straight from the page: Phase 9 (the website content manager).
- Pupil photograph on the report: not built (the brief marks it "if required"). Tell me if the school wants it.
- Attendance on the report: not built, as the school has not said how it records attendance.
