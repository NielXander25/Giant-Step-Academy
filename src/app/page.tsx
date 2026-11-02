import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BellRing } from "lucide-react";
import { CrestMark } from "@/components/site/school-logo";
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

      {/* Bold opening: a deep school-blue banner with a photo behind it, yellow highlights and the three sections in
          full colour. */}
      <div className="relative overflow-hidden bg-[#0a3d8f] text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={hero?.url || "/images/gallery/students-in-uniform.jpg"} alt="" aria-hidden="true" className="absolute inset-0 size-full object-cover object-[50%_30%] opacity-30" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-[#0a3d8f]/80 via-[#0a3d8f]/85 to-[#0b1d3d]" />
        <div aria-hidden="true" className="pointer-events-none absolute -right-24 -top-24 size-[26rem] rounded-full bg-sun/30 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -left-24 size-[26rem] rounded-full bg-sky/40 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-5 pb-20 pt-16 sm:px-8 md:pb-28 md:pt-24">
          {/* An understated school mark: the crest, a fine yellow rule and the school's name in spaced small capitals. */}
          <div className="fade-up flex items-center gap-3 sm:gap-4">
            <CrestMark onDark size={44} />
            <span aria-hidden="true" className="h-px w-8 shrink-0 bg-sun sm:w-10" />
            <p className="whitespace-nowrap text-[12px] font-medium uppercase tracking-[0.3em] text-white/85 sm:text-[13px] sm:tracking-[0.32em]">
              Giant Step Academy<span className="hidden sm:inline"><span className="mx-2 text-sun">·</span><span className="text-white/60">Sabon Tasha, Kaduna</span></span>
            </p>
          </div>
          <h1 className="fade-up mt-7 max-w-4xl text-5xl font-extrabold leading-[1.02] text-white sm:text-6xl lg:text-7xl" style={{ animationDelay: "80ms" }}>
            Securing a <span className="text-sun">bright future</span>, one giant step at a time
          </h1>
          <p className="fade-up mt-6 max-w-2xl text-xl leading-relaxed text-white/85 md:text-2xl" style={{ animationDelay: "160ms" }}>{b["home.hero.subtitle"] as string}</p>

          <div className="fade-up mt-8 flex flex-wrap gap-3" style={{ animationDelay: "220ms" }}>
            {SECTIONS.map((sec) => (
              <Link key={sec.key} href="/admissions" className="rounded-full px-5 py-2 text-base font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5" style={{ background: sec.color }}>{sec.name}</Link>
            ))}
          </div>

          <div className="fade-up mt-10 flex flex-wrap gap-3" style={{ animationDelay: "280ms" }}>
            <Button asChild size="lg" variant="yellow" className="h-14 px-8 text-lg font-bold"><Link href="/admissions">Apply for admission <ArrowRight className="size-5" aria-hidden="true" /></Link></Button>
            <Button asChild size="lg" variant="outline" className="h-14 border-white/50 bg-transparent px-8 text-lg font-semibold text-white hover:bg-white/10"><Link href="/events">See our events</Link></Button>
          </div>
          {notice && (
            <p className="fade-up mt-8 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white ring-1 ring-white/20" style={{ animationDelay: "340ms" }}>
              <BellRing className="size-4 shrink-0 text-sun" aria-hidden="true" />{notice}
            </p>
          )}
        </div>
        <div aria-hidden="true" className="relative flex h-2">
          <span className="flex-1 bg-sun" /><span className="flex-1" style={{ background: SECTIONS[0].color }} /><span className="flex-1" style={{ background: SECTIONS[1].color }} /><span className="flex-1" style={{ background: SECTIONS[2].color }} />
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-5 pt-14 sm:px-8 md:pt-20">
        <ul className="grid gap-5 md:grid-cols-3">
          {SECTIONS.map((s, i) => (
            <Reveal as="li" key={s.key} from="up" delay={i * 120}>
              <Link href="/admissions" className="group relative block h-full overflow-hidden rounded-3xl p-7 text-white shadow-[0_20px_50px_-25px_rgba(0,0,0,0.45)] transition-transform hover:-translate-y-1" style={{ background: s.color }}>
                <span aria-hidden="true" className="absolute -right-10 -top-10 size-36 rounded-full bg-white/15" />
                <span className="relative block text-sm font-bold uppercase tracking-[0.16em] text-white/80">{["Pre-Nursery to Nursery 3", "Basic 1 to 6", "Basic 7 to SS3"][i]}</span>
                <h2 className="relative mt-2 text-3xl font-extrabold text-white">{s.name}</h2>
                <p className="relative mt-3 text-[15px] leading-relaxed text-white/90">{plainText(b[s.block] as string, 110)}</p>
                <span className="relative mt-5 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-bold" style={{ color: s.color }}>Learn more <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" /></span>
              </Link>
            </Reveal>
          ))}
        </ul>
      </div>

      <Section>
        <div className={aboutImage?.url ? "grid items-center gap-10 md:grid-cols-2" : "max-w-3xl"}>
          <div>
            <SectionHeading eyebrow="About us" title={b["home.about.title"] as string} className="mb-5" />
            <RichText source={b["home.about.body"] as string} />
            <Button asChild variant="outline" className="mt-6"><Link href="/about">More about the school</Link></Button>
          </div>
          {aboutImage?.url && <Reveal from="right"><SiteImage src={aboutImage.url} alt={aboutImage.alt ?? ""} width={900} className="aspect-[5/4] w-full rounded-3xl" /></Reveal>}
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
