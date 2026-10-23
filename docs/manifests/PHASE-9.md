# Phase 9 — The public website and the content manager

## BEFORE YOU DEPLOY (one database addition)
This phase adds one small table (website enquiries). It is created **automatically** when the site deploys (the migration file `prisma/migrations/20261101000000_enquiries/migration.sql` is included). **Upload that file along with the rest** (it is in a folder, so use Add file > Create new file if the uploader skips it).

## Vercel settings to add (all optional, but needed for picture uploads)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`: from a free Cloudinary account. Without them the content manager still works: Admins can paste a picture link instead of uploading.
- `NEXT_PUBLIC_SITE_URL`: the website's address (for Google and link previews), e.g. `https://www.yourschool.ng`.

## NEW (54 files + this manifest)
```
prisma/migrations/20261101000000_enquiries/migration.sql
src/app/(admin)/admin/cms/content/page.tsx
src/app/(admin)/admin/cms/enquiries/page.tsx
src/app/(admin)/admin/cms/page.tsx
src/app/(admin)/admin/cms/pages/page.tsx
src/app/(admin)/admin/cms/pictures/page.tsx
src/app/(site)/about/page.tsx
src/app/(site)/academics/page.tsx
src/app/(site)/admissions/page.tsx
src/app/(site)/contact/actions.ts
src/app/(site)/contact/page.tsx
src/app/(site)/events/page.tsx
src/app/(site)/gallery/page.tsx
src/app/(site)/layout.tsx
src/app/(site)/news/article/page.tsx
src/app/(site)/news/page.tsx
src/app/(site)/privacy/page.tsx
src/app/(site)/school-life/page.tsx
src/app/(site)/staff/page.tsx
src/app/api/uploads/sign/route.ts
src/app/icon.svg
src/app/robots.ts
src/app/sitemap.ts
src/components/cms/block-editor.tsx
src/components/cms/content-form.tsx
src/components/cms/image-field.tsx
src/components/cms/picture-slot.tsx
src/components/site/cards.tsx
src/components/site/enquiry-form.tsx
src/components/site/nav.ts
src/components/site/reveal.tsx
src/components/site/rich-text.tsx
src/components/site/school-logo.tsx
src/components/site/section.tsx
src/components/site/site-image.tsx
src/components/site/site-nav.tsx
src/components/site/site-shell.tsx
src/components/site/steps-motif.tsx
src/lib/cms/actions.ts
src/lib/cms/blocks.ts
src/lib/cms/cms-extra.test.ts
src/lib/cms/cms.test.ts
src/lib/cms/helpers.ts
src/lib/cms/images.ts
src/lib/cms/modules.ts
src/lib/cms/rich-text.ts
src/lib/cms/sample-content.ts
src/lib/cms/service.ts
src/lib/cms/site-data.ts
src/lib/cms/site-queries.ts
src/lib/cms/upload-client.ts
src/lib/cms/upload-sign.ts
src/lib/site-url.ts
src/lib/validators/cms.ts
docs/manifests/PHASE-9.md
```

## CHANGED (replace the whole file) — 8 files
```
README.md
prisma/schema.prisma
src/app/(admin)/admin/settings/school/actions.ts
src/app/globals.css
src/app/layout.tsx
src/app/page.tsx
src/components/dashboard/nav-config.ts
src/lib/audit.ts
```

## What changed in each CHANGED file
- `src/app/page.tsx`: the temporary home page is replaced by the real school home page.
- `src/app/layout.tsx`, `src/app/globals.css`: search-engine details and a gentle fade-in animation.
- `prisma/schema.prisma`: adds the Enquiry table definition.
- `src/app/(admin)/admin/settings/school/actions.ts`: school details now refresh the public site straight away; adds a logo-only save.
- `src/components/dashboard/nav-config.ts`: "Website content" is switched on.
- `src/lib/audit.ts`, `README.md`: new audit names and setup notes.

## The public website
Home, About, Academics (Nursery, Primary, Secondary), Admissions (with enquiry form and FAQ), School life, News (with articles), Events, Gallery, Staff, Contact and Privacy. Mobile-first, accessible (skip link, keyboard menu, readable contrast), with a calm fade-in animation that switches off for visitors who prefer reduced motion. Also: sitemap, robots file, search/sharing details and a crest icon for the browser tab.

## What an Admin can change (Admin > Website content)
- **Pictures**: the logo and every main picture on the site, from one screen. Choose a picture from your phone or computer, press Save, and it is live. Replace or remove any time.
- **Page text**: every heading, paragraph, list (values, admission steps, FAQ, facilities, activities) and picture on every page. Anything not yet edited shows sample text, and "Use sample text" puts it back.
- **News, Events, Gallery (many pictures at once), Staff, Announcements (a notice bar), Testimonials.**
- **Enquiries**: messages from the contact form, with call and WhatsApp buttons, and a mark-as-handled switch.
- **Sample content**: one button loads fictional articles, events and staff so the site looks complete; one button removes it all without touching anything the school wrote. No parent quotes are ever invented.

## The logo
The crest (shield, name label, five stars, rising sun, path and motto) and the name are drawn as sharp vector graphics from the photo of the school banner, so they stay crisp at any size. It is a faithful redraw, not the original file. **Upload the school's official logo under Admin > Website content > Pictures and it replaces the drawn one on the website.**
The logo does not yet appear on the PDF report cards unless an official logo has been uploaded.

## Safety and speed
- Everything the Admin types is shown as safe text: nothing can inject scripts or break the page. Links must be https, email or phone.
- Pictures upload straight to Cloudinary with a one-time signature; the secret never reaches the browser.
- Only Admins can change the website, and every change is recorded in the audit log.
- The contact form has a hidden spam trap and a limit of five messages an hour per network.
- Public pages read through a cache that clears whenever the Admin saves, so visits rarely touch the database (protecting the free database hours).
- Pages are built when visited, so deploying never depends on the database being awake.

## Not in this phase
Online application forms and payments, a lightbox gallery viewer, and the school crest on PDF report cards without an uploaded logo.
