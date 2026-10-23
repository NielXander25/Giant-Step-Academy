# Giant Step Academy — school platform

Next.js + TypeScript + Tailwind CSS + Prisma + Neon (PostgreSQL), deployed on Vercel.

## Deploying (no terminal needed)

1. **Neon** — create a project. Copy two connection strings:
   - *Pooled* (host contains `-pooler`) → `DATABASE_URL` (add `&pgbouncer=true&connect_timeout=15` at the end)
   - *Direct* (no `-pooler`) → `DIRECT_URL`
2. **GitHub** — upload this project's files to your repository (never upload `.env` files or `node_modules`).
3. **Vercel** — import the repository, then add these Environment Variables (Production):
   `DATABASE_URL`, `DIRECT_URL`, `SETUP_TOKEN`, `SUPER_ADMIN_NAME`, `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD`
   (see `.env.example` for the format). `SETUP_TOKEN` should be a long random value you make up.
4. **Deploy.** The build automatically creates/updates the database tables in Neon (`prisma migrate deploy`).
5. Open `https://YOUR-SITE/setup`, enter your `SETUP_TOKEN`, and run setup once. This creates the Super Admin
   and default school settings. Afterwards remove `SETUP_TOKEN` and `SUPER_ADMIN_PASSWORD` from Vercel.

### Preview deployments
Preview builds **skip database migrations** so they can never change your live database by accident.

## Optional: email notifications
Approval and rejection emails to teachers are sent through [Resend](https://resend.com) when these two variables exist in Vercel.
Without them the app works normally and simply skips the emails.
`RESEND_API_KEY` (your Resend key) and `EMAIL_FROM` (for example `Giant Step Academy <no-reply@yourdomain.com>`, on a domain verified in Resend).

## Result PINs (Phase 7)
Add these in Vercel (Production), then redeploy:
- `PIN_PEPPER`: **required**. A long random value (40+ characters). It scrambles PINs before they are stored. **Keep a safe copy and never change it**: changing it makes every existing PIN stop working.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`: optional. Turns on Cloudflare's free "I am not a robot" check on the result page.

## Website pictures (Phase 9)
Picture uploads use Cloudinary (free plan is fine). Create an account, then add these in Vercel (Production) and redeploy:
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` (from your Cloudinary dashboard)
- `NEXT_PUBLIC_SITE_URL`: the website's address, for example `https://www.giantstepacademy.ng` (used by Google and link previews)
Without Cloudinary the content manager still works: Admins can paste a picture link instead of uploading.
Optional: `RESEND_API_KEY` and `EMAIL_FROM` make the contact form also email the school.

## Changing the brand
All colours live in `src/app/globals.css` (the `:root` block). Fonts are set in `src/app/layout.tsx`.

## Phase records
Each development phase adds a file to `docs/manifests/` listing exactly which files were new or changed.
