import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BellRing } from "lucide-react";
import { SiteShell } from "@/components/site/site-shell";
import { EventRow, NewsCard } from "@/components/site/cards";
import { RichText } from "@/components/site/rich-text";
import { Section, SectionHeading } from "@/components/site/section";
import { SiteImage } from "@/components/site/site-image";
import { SECTIONS } from "@/components/site/nav";
import { StepsMotif } from "@/components/site/steps-motif";
import { Button } from "@/components/ui/button";
import type { ImageValue, ListValue } from "@/lib/cms/blocks";
import { isPlaceholder, splitPhones } from "@/lib/cms/helpers";
import { plainText } from "@/lib/cms/rich-text";
import { getBlocks, getEvents, getNews, getSchool, getTestimonials } from "@/lib/cms/site-data";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: "Giant Step Academy | Nursery, Primary and Secondary School" },
  description: "Giant Step Academy, a school in Sabon Tasha, Kaduna, for children from Nursery to Secondary. See admissions, news and events.",
};

export default async function HomePage() {
  const [b, school, news, events, testimonials] = await Promise.all([
    getBlocks(["home", "academics"]), getSchool(), getNews(3, 1), getEvents(), getTestimonials(),
  ]);

  const hero = b["home.hero.image"] as ImageValue;
  const aboutImage = b["home.about.image"] as ImageValue;
  const values = b["home.values"] as ListValue;
  const notice = b["admissions.notice"] as string;

  const jsonLd = {
    "@context": "https://schema.org", "@type": "School", name: school.name, url: siteUrl(),
    ...(school.address && !isPlaceholder(school.address) ? { address: school.address } : {}),
    ...(splitPhones(school.phone)[0] ? { telephone: splitPhones(school.phone)[0] } : {}),
  };

  return (
    <SiteShell>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* A bright, warm banner built around the school's own photos. */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#fff6e0] via-white to-primary-soft">
        <div aria-hidden="true" className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-[#ffd34d]/40 blur-2xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 right-0 size-96 rounded-full bg-[#e07a2f]/15 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 pb-16 pt-10 sm:px-8 md:grid-cols-[1fr_1.05fr] md:pb-24 md:pt-16">
          <div>
            <p className="fade-up mb-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-navy shadow-sm">
              <span aria-hidden="true" className="size-2 rounded-full bg-[#e07a2f]" />{b["home.hero.eyebrow"] as string}
            </p>
            <h1 className="fade-up text-4xl leading-[1.08] text-navy sm:text-5xl lg:text-6xl" style={{ animationDelay: "80ms" }}>{b["home.hero.title"] as string}</h1>
            <p className="fade-up mt-5 max-w-xl text-lg text-muted-foreground" style={{ animationDelay: "160ms" }}>{b["home.hero.subtitle"] as string}</p>
            <div className="fade-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
              <Button asChild size="lg"><Link href="/admissions">Admissions <ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
              <Button asChild size="lg" variant="outline" className="bg-white"><Link href="/events">See our events</Link></Button>
            </div>
            {notice && (
              <p className="fade-up mt-8 inline-flex items-start gap-3 rounded-xl bg-white px-4 py-3 text-sm text-navy shadow-sm" style={{ animationDelay: "320ms" }}>
                <BellRing className="mt-0.5 size-4 shrink-0 text-[#e07a2f]" aria-hidden="true" />{notice}
              </p>
            )}
          </div>
          <div className="fade-up relative" style={{ animationDelay: "200ms" }}>
            <div aria-hidden="true" className="absolute -right-3 -top-3 h-full w-full rotate-2 rounded-[2rem] bg-[#ffd34d]" />
            <SiteImage src={hero?.url} alt={hero?.alt ?? ""} width={1400} priority className="relative aspect-[4/3] w-full rounded-[2rem] object-[60%_center] shadow-xl sm:aspect-[16/10]" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 pt-12 sm:px-8 md:pt-16">
        <ul className="grid gap-4 md:grid-cols-3">
          {SECTIONS.map((s) => (
            <li key={s.key}>
              <Link href={`/academics#${s.key}`} className="group block h-full overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md">
                <div className="h-2" style={{ background: s.color }} />
                <div className="p-6">
                  <h2 className="font-serif text-2xl text-navy">{s.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{plainText(b[s.block] as string, 110)}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <Section>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <SectionHeading eyebrow="About us" title={b["home.about.title"] as string} className="mb-5" />
            <RichText source={b["home.about.body"] as string} />
            <Button asChild variant="outline" className="mt-6"><Link href="/about">More about the school</Link></Button>
          </div>
          <SiteImage src={aboutImage?.url} alt={aboutImage?.alt ?? ""} width={900} className="aspect-[5/4] w-full rounded-3xl" />
        </div>
      </Section>

      {values.length > 0 && (
        <Section tone="soft">
          <SectionHeading eyebrow="What we stand for" title="The values behind every school day" />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <li key={i} className="rounded-2xl border border-border bg-white p-6">
                <span className="font-serif text-4xl text-accent/70">{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 font-serif text-xl text-navy">{v.title}</h3>
                {v.text && <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {news.items.length > 0 && (
        <Section>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="News" title="Latest from the school" className="mb-0" />
            <Link href="/news" className="text-sm font-medium text-primary hover:underline">All news</Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">{news.items.map((p) => <NewsCard key={p.id} post={p} />)}</div>
        </Section>
      )}

      {events.upcoming.length > 0 && (
        <Section tone="soft">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <SectionHeading eyebrow="Coming up" title="Upcoming events" className="mb-0" />
            <Link href="/events" className="text-sm font-medium text-primary hover:underline">All events</Link>
          </div>
          <ul className="grid gap-4 md:grid-cols-2">{events.upcoming.slice(0, 4).map((e) => <EventRow key={e.id} event={e} />)}</ul>
        </Section>
      )}

      {testimonials.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Parents say" title="Words from our families" />
          <ul className="grid gap-5 md:grid-cols-3">
            {testimonials.slice(0, 3).map((t) => (
              <li key={t.id} className="rounded-2xl border border-border bg-card p-6">
                <p className="font-serif text-lg leading-relaxed text-navy">“{t.quote}”</p>
                <p className="mt-4 text-sm font-medium">{t.name}</p>
                {t.relationship && <p className="text-xs text-muted-foreground">{t.relationship}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section tone="navy">
        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h2 className="text-3xl text-white md:text-4xl">Ready to give your child a giant step?</h2>
            <p className="mt-2 max-w-xl text-white/80">{notice || "Talk to us about admission into Nursery, Primary or Secondary."}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="accent"><Link href="/admissions">How to apply</Link></Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10"><Link href="/contact">Contact us</Link></Button>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}
