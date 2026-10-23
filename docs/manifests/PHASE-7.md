# Phase 7 — Result PINs and the Result Portal

## How to upload
Keep the folder layout. Files under **CHANGED** replace the old file completely; files under **NEW** are added. No folders with dots or square brackets. (GitHub's web uploader skips `.env.example`; that file is only a reference, so ignore it.)

## BEFORE YOU DEPLOY: add one Vercel variable
`PIN_PEPPER` (Production): a long random value, **40+ characters**. Use a password manager's generator. **Keep a safe copy and never change it later**: PINs are stored scrambled with this value, so changing it makes every existing PIN stop working.
Optional: `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` (free from Cloudflare) switch on an "I am not a robot" check on the result page.

## NEW (21 files + this manifest)
```
src/app/(admin)/admin/access-logs/page.tsx
src/app/(admin)/admin/pins/generate-form.tsx
src/app/(admin)/admin/pins/page.tsx
src/app/(portal)/results/actions.ts
src/app/(portal)/results/page.tsx
src/app/(portal)/results/result-form.tsx
src/app/(portal)/results/view/page.tsx
src/components/portal/print-button.tsx
src/components/portal/result-sheet.tsx
src/components/portal/turnstile-widget.tsx
src/lib/pin/access.ts
src/lib/pin/actions.ts
src/lib/pin/format.test.ts
src/lib/pin/format.ts
src/lib/pin/generate.ts
src/lib/pin/hash.ts
src/lib/pin/lifecycle.ts
src/lib/pin/result-data.ts
src/lib/pin/throttle.ts
src/lib/pin/turnstile.ts
src/lib/pin/view-session.ts
docs/manifests/PHASE-7.md
```

## CHANGED (replace the whole file) — 5 files
```
.env.example
README.md
src/app/page.tsx
src/components/dashboard/nav-config.ts
src/lib/constants.ts
```

## What changed in each CHANGED file
- `src/components/dashboard/nav-config.ts`: "PINs" and "Access logs" are switched on.
- `src/app/page.tsx`: a "Check results" button on the home page.
- `src/lib/constants.ts`: the 30-minute viewing time is added to the PIN rules.
- `README.md` and `.env.example`: notes about `PIN_PEPPER` and the optional bot check.

## No database changes and no new packages

## The PIN rules built in
- Format: `GSA` + 6 random digits (1,000,000 possibilities). Never sequential; trivial ones like 111111 are skipped.
- Stored only as a scrambled hash plus a masked label like `GSA****15`. The full PIN is shown **once**, when an Admin creates it.
- **Two** successful views per PIN. The attempt is used only when the result actually opens. Wrong details, a used-up PIN, an expired PIN or an unpublished result never use an attempt.
- The **40 days start at the first successful view**. A PIN nobody has used does not expire by itself.
- A PIN is **not tied to a student**. It can open two different students' results; the access log shows which.
- Creating a new PIN never cancels older ones.
- Admins can disable a PIN at once (even for someone mid-view) and re-enable it, as long as it still has uses left and has not expired. Used-up and expired PINs cannot be revived: create a new one.
- Parents enter: term, the student's full name, admission number and the PIN. Names ignore capitals and extra spaces; PINs ignore spaces, dashes and the GSA prefix.
- After a successful view the parent gets a 30-minute viewing pass: reloading or printing does not use another attempt. The warning text from the brief is shown on that page.
- Every failure shows the same message, so nobody can use the form to discover valid students or PINs.

## Protection against guessing
- 12 failed tries from one network in 15 minutes, or 30 per student in an hour, blocks further tries (blocked tries do not extend the block).
- Two people using the last attempt at the same moment: exactly one succeeds. The database itself also refuses a third use.
- Optional Cloudflare "not a robot" check.
- Every attempt is recorded (Admin > Access logs) with only a scrambled network code, never an IP address.

## Not in this phase
Download as a PDF file arrives in Phase 8. For now parents use "Print or save as PDF" on the result page.

## Coming in Phase 8
CHANGED (replace whole file): `package.json`, `package-lock.json`, `next.config.ts`, `src/components/dashboard/nav-config.ts`, `src/lib/audit.ts`, `src/lib/pin/result-data.ts`, `src/components/portal/result-sheet.tsx`, `src/app/(portal)/results/view/page.tsx`. Everything else is NEW.
