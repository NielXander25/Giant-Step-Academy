# Phase 1 — Foundation

Every file in this phase is **NEW**. Upload everything in this zip.

## Files

```
.env.example
.gitignore
README.md
next.config.ts
package-lock.json
package.json
postcss.config.mjs
prisma/migrations/20261001000000_init/migration.sql
prisma/migrations/migration_lock.toml
prisma/schema.prisma
scripts/build.mjs
src/app/api/setup/route.ts
src/app/globals.css
src/app/layout.tsx
src/app/not-found.tsx
src/app/page.tsx
src/app/setup/page.tsx
src/app/setup/setup-form.tsx
src/components/brand/logo-placeholder.tsx
src/components/ui/badge.tsx
src/components/ui/button.tsx
src/components/ui/card.tsx
src/components/ui/input.tsx
src/components/ui/label.tsx
src/lib/auth/password.ts
src/lib/constants.ts
src/lib/db.ts
src/lib/env.ts
src/lib/setup/bootstrap.ts
src/lib/utils.ts
tsconfig.json
```

## Differences from the plan
- Dropped as unnecessary: `components.json`, `eslint.config.mjs`.
- Added: `scripts/build.mjs` (runs database migrations safely on deploy), `src/app/setup/page.tsx` and `src/app/setup/setup-form.tsx` (a setup page, so no terminal is needed), `package-lock.json`, `docs/manifests/PHASE-1.md`.
- Moved earlier from Phase 2: `src/lib/auth/password.ts` (the Super Admin password must be hashed during setup).

## Coming in Phase 2
CHANGED (replace whole file): `package.json`, `package-lock.json`, `.env.example`.
Everything else in Phase 2 is NEW.
