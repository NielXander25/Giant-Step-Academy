import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { getAnnouncements, getSchool } from "@/lib/cms/site-data";
import { isPlaceholder, mapsHref, splitPhones, telHref, whatsappHref } from "@/lib/cms/helpers";
import { SchoolLogo } from "./school-logo";
import { AdmissionPopup } from "./admission-popup";
import { SiteNav } from "./site-nav";
import { WhatsAppButton } from "./whatsapp-button";
import { RESULTS_LINK, SITE_LINKS } from "./nav";

// The school's WhatsApp line for the floating button, whatever other numbers the school profile lists.
const SCHOOL_WHATSAPP = "+234 813 913 9020";

/** The header, footer and notice bar that wrap every public page. */
export async function SiteShell({ children }: { children: React.ReactNode }) {
  const [school, announcements] = await Promise.all([getSchool(), getAnnouncements()]);
  const phones = splitPhones(school.phone);
  const address = isPlaceholder(school.address) ? null : school.address;
  const email = isPlaceholder(school.email) ? null : school.email;
  const map = mapsHref(address);

  return (
    <>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-navy focus:shadow-lg">Skip to content</a>

      {announcements.length > 0 && (
        <div className="bg-accent text-sm text-accent-foreground">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 py-2 text-center sm:px-8">
            {announcements.map((a) => <p key={a.id}><strong>{a.title}:</strong> {a.message}</p>)}
          </div>
        </div>
      )}

      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/75 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5 sm:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-3" aria-label={`${school.name} home`}>
            <span className="hidden sm:block"><SchoolLogo school={school} height={42} /></span>
            <span className="sm:hidden"><SchoolLogo school={school} height={36} compact /></span>
            <span className="truncate font-serif text-lg leading-tight text-navy sm:hidden">{school.name}</span>
          </Link>
          <div className="flex-1" />
          <SiteNav />
        </div>
      </header>

      <main id="main">{children}</main>

      <footer className="bg-navy text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-[1.4fr_1fr_1.2fr]">
          <div>
            <div className="mb-4"><SchoolLogo school={school} height={46} onDark /></div>
            {school.motto && !isPlaceholder(school.motto) && <p className="max-w-xs italic text-white/75">{school.motto}</p>}
            <p className="mt-3 text-sm text-white/60">Nursery · Primary · Secondary</p>
          </div>
          <nav aria-label="Footer">
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Explore</p>
            <ul className="space-y-2 text-sm">
              {[...SITE_LINKS, RESULTS_LINK].map((l) => <li key={l.href}><Link href={l.href} className="text-white/85 hover:text-white">{l.label}</Link></li>)}
            </ul>
          </nav>
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-white/60">Visit or call</p>
            <ul className="space-y-3 text-sm text-white/85">
              {address && <li className="flex gap-3"><MapPin className="mt-0.5 size-4 shrink-0 text-white/60" aria-hidden="true" />{map ? <a href={map} target="_blank" rel="noopener noreferrer" className="hover:text-white">{address}</a> : address}</li>}
              {phones.map((p) => (
                <li key={p} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Phone className="size-4 shrink-0 text-white/60" aria-hidden="true" />
                  <a href={telHref(p)} className="hover:text-white">{p}</a>
                  <a href={whatsappHref(p)} target="_blank" rel="noopener noreferrer" className="rounded-full bg-white/10 px-2 py-0.5 text-xs hover:bg-white/20">WhatsApp</a>
                </li>
              ))}
              {email && <li className="flex gap-3"><Mail className="mt-0.5 size-4 shrink-0 text-white/60" aria-hidden="true" /><a href={`mailto:${email}`} className="hover:text-white">{email}</a></li>}
              {!address && phones.length === 0 && !email && <li className="text-white/60">Contact details coming soon.</li>}
            </ul>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5 text-xs text-white/60 sm:px-8">
            <p>© {new Date().getFullYear()} {school.name}. All rights reserved.</p>
            <p className="flex gap-4"><Link href="/privacy" className="hover:text-white">Privacy</Link><Link href="/login" className="hover:text-white">Staff sign in</Link></p>
          </div>
        </div>
      </footer>
      <WhatsAppButton href={whatsappHref(SCHOOL_WHATSAPP)} />
      <AdmissionPopup />
    </>
  );
}
