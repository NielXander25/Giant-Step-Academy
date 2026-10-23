# Phase 10 — Yearly promotion, audit log, launch hardening and checklist

## BEFORE YOU DEPLOY: add one Vercel variable
`CRON_SECRET` (Production): a random value of 24+ characters. Vercel then runs the nightly cleanup by itself and proves who it is with this secret. Without it the cleanup simply refuses to run; nothing else is affected.

## How to upload
Keep the folder layout. Files under **CHANGED** replace the old file completely; files under **NEW** are added. **`vercel.json` and `LAUNCH-CHECKLIST.md` sit at the top level of the repository**, next to `package.json`.

## NEW (13 files + this manifest)
```
LAUNCH-CHECKLIST.md
src/app/(admin)/admin/promotion/page.tsx
src/app/(admin)/admin/promotion/promotion-wizard.tsx
src/app/(super-admin)/super-admin/audit-logs/page.tsx
src/app/api/cron/expire-pins/route.ts
src/lib/pin/maintenance.ts
src/lib/promotion/actions.ts
src/lib/promotion/execute.ts
src/lib/promotion/plan.ts
src/lib/promotion/promotion.test.ts
src/lib/security-headers.test.ts
src/lib/security-headers.ts
vercel.json
docs/manifests/PHASE-10.md
```

## CHANGED (replace the whole file) — 6 files
```
next.config.ts
src/app/(admin)/admin/sessions/actions.ts
src/app/(admin)/admin/sessions/page.tsx
src/components/dashboard/nav-config.ts
src/lib/audit.ts
src/lib/validators/academic.ts
```

## What changed in each CHANGED file
- `next.config.ts`: sends the security headers on every page, and stops browsers storing result pages and the Admin area.
- `src/app/(admin)/admin/sessions/actions.ts` and `page.tsx`: a **Lock results / Unlock results** button on every term.
- `src/lib/validators/academic.ts`, `src/lib/audit.ts`: matching checks and audit names.
- `src/components/dashboard/nav-config.ts`: "Yearly promotion" (Admin) and "Audit logs" (Super Admin) are switched on.

## No database changes and no new packages

## Yearly promotion (Admin > Yearly promotion)
1. Create the new session first (Sessions & terms), then open this page and choose the year ending and the year it moves into.
2. You see exactly what will happen, class by class: who moves up, who repeats, who graduates, which classes will be created, and whether each class's results were published.
3. Rules: everyone moves up one level into the **same arm** (SS2A to SS3A). Students you marked as **repeating** stay in their class. The **final level graduates**. Primary 6 can lead into JSS1 if the levels are linked that way (the sample structure does this). Inactive and withdrawn students are left alone.
4. A missing arm (for example SS3C when only SS2C exists) is **created automatically**. Any class's destination can be changed by hand, or set to "Graduate them".
5. A class with no usable destination is shown in red, and its students are **not** promoted unless you pick a destination. You must tick a box to continue without them.
6. If a class's last-term results are not published, promotion stops unless you tick "continue anyway".
7. It happens **all at once or not at all**, and it is safe to run twice: students already moved are never moved again. Every move records which old class it came from. It is written to the audit log.
8. After promoting, make the new session current on **Sessions & terms**.

## Audit log (Super Admin > Audit logs)
Who did what and when, for logins, teacher approvals, assignments, imports, every result step, PINs, website changes and promotions. Filter by action or by role. Sign-ins are hidden by default (tick "Show sign-ins"). The website cannot edit or delete entries.

## Lock results
On Sessions & terms, **Lock results** freezes a term: nobody can change its scores or remarks until you unlock it. Use it once a term's results are final.

## Nightly cleanup
Every night at 3 am the site marks PINs whose 40 days are over as Expired, removes old viewing passes and old reset tokens, and records a summary in the audit log. It is safe to run any time.

## Security
Every page now carries browser security headers: it cannot be shown inside another website, scripts and styles may only load from the site (and the optional bot check), pictures must be secure, and the result pages, PDFs and Admin area are never cached by a browser. If a future change ever shows a blank item, `src/lib/security-headers.ts` is the one place to look.

## LAUNCH-CHECKLIST.md
A step-by-step list covering accounts and plans, every Vercel setting, real school information to enter, the website, a full dry run, security, backups and how to roll back, result day, and the things the system does not do yet.
