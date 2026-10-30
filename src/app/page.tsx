import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BellRing } from "lucide-react";
import { Reveal } from "@/components/site/reveal";
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

      {/* Apple-style opening: a big, calm headline on white, the three sections as colour chips, then the photo. */}
      <div className="relative overflow-hidden bg-white">
        <div aria-hidden="true" className="pointer-events-none absolute -left-40 top-10 size-[26rem] rounded-full bg-sky/20 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-40 top-40 size-[26rem] rounded-full bg-sun/25 blur-3xl" />
        <div className="relative mx-auto max-w-5xl px-5 pb-16 pt-14 text-center sm:px-8 md:pb-24 md:pt-24">
          <div className="fade-up flex flex-wrap justify-center gap-2">
            {SECTIONS.map((sec) => (
              <Link key={sec.key} href="/admissions" className="rounded-full px-4 py-1.5 text-sm font-semibold transition-transform hover:-translate-y-0.5" style={{ color: sec.color, background: `${sec.color}1a` }}>{sec.name}</Link>
            ))}
          </div>
          <h1 className="fade-up mx-auto mt-6 max-w-4xl text-5xl leading-[1.05] text-navy sm:text-6xl lg:text-7xl" style={{ animationDelay: "80ms" }}>
            {b["home.hero.title"] as string}
          </h1>
          <p className="fade-up mx-auto mt-6 max-w-2xl text-xl leading-relaxed text-muted-foreground md:text-2xl" style={{ animationDelay: "160ms" }}>{b["home.hero.subtitle"] as string}</p>
          <div className="fade-up mt-9 flex flex-wrap justify-center gap-3" style={{ animationDelay: "240ms" }}>
            <Button asChild size="lg"><Link href="/admissions">Admissions <ArrowRight className="size-4" aria-hidden="true" /></Link></Button>
            <Button asChild size="lg" variant="yellow"><Link href="/events">See our events</Link></Button>
          </div>
          {notice && (
            <p className="fade-up mx-auto mt-7 inline-flex items-center gap-2 rounded-full bg-sun/20 px-4 py-2 text-sm font-medium text-navy" style={{ animationDelay: "320ms" }}>
              <BellRing className="size-4 shrink-0 text-tangerine" aria-hidden="true" />{notice}
            </p>
          )}
          <div className="fade-up relative mt-14" style={{ animationDelay: "300ms" }}>
            <div aria-hidden="true" className="absolute inset-x-10 -bottom-6 h-24 rounded-full bg-gradient-to-r from-sky/40 via-sun/40 to-sky/40 blur-2xl" />
            <SiteImage src={hero?.url} alt={hero?.alt ?? ""} width={1600} priority className="relative aspect-[16/9] w-full rounded-[2.25rem] object-[60%_center] shadow-[0_30px_80px_-30px_rgba(0,0,0,0.35)] md:aspect-[21/9]" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 pt-12 sm:px-8 md:pt-16">
        <ul className="grid gap-4 md:grid-cols-3">
          {SECTIONS.map((s, i) => (
            <Reveal as="li" key={s.key} from="up" delay={i * 120}>
              <Link href="/admissions" className="group block h-full overflow-hidden rounded-3xl bg-muted transition-transform hover:-translate-y-1">
                <div className="mx-6 mt-6 h-1.5 w-12 rounded-full" style={{ background: s.color }} />
                <div className="p-6">
                  <h2 className="font-serif text-2xl text-navy">{s.name}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{plainText(b[s.block] as string, 110)}</p>
                  <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
                </div>
              </Link>
            </Reveal>
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
          <Reveal from="right"><SiteImage src={aboutImage?.url} alt={aboutImage?.alt ?? ""} width={900} className="aspect-[5/4] w-full rounded-3xl" /></Reveal>
        </div>
      </Section>

      {values.length > 0 && (
        <Section tone="soft">
          <SectionHeading eyebrow="What we stand for" title="The values behind every school day" />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v, i) => (
              <Reveal as="li" key={i} from="zoom" delay={i * 110} className="rounded-3xl bg-white p-7 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <span className="text-5xl font-bold tracking-tight" style={{ color: ["#0071e3", "#ff9500", "#34c759", "#af52de", "#ff2d55", "#32ade6"][i % 6] }}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-2 font-serif text-xl text-navy">{v.title}</h3>
                {v.text && <p className="mt-2 text-sm text-muted-foreground">{v.text}</p>}
              </Reveal>
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
              <li key={t.id} className="rounded-3xl bg-muted p-7">
                <p className="text-lg leading-relaxed text-navy">“{t.quote}”</p>
                <p className="mt-4 text-sm font-medium">{t.name}</p>
                {t.relationship && <p className="text-xs text-muted-foreground">{t.relationship}</p>}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section>
        <div className="flex flex-col items-start justify-between gap-6 relative overflow-hidden rounded-[2.25rem] bg-primary p-8 text-white md:flex-row md:items-center md:p-12">
          <div>
            <h2 className="text-3xl text-white md:text-4xl">Ready to give your child a giant step?</h2>
            <span aria-hidden="true" className="mt-4 block h-1.5 w-16 rounded-full bg-sun" />
            <p className="mt-2 max-w-xl text-white/80">{notice || "Talk to us about admission into Nursery, Primary or Secondary."}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" variant="yellow"><Link href="/admissions">How to apply</Link></Button>
            <Button asChild size="lg" variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10"><Link href="/admissions#enquire">Contact us</Link></Button>
          </div>
        </div>
      </Section>
    </SiteShell>
  );
}
