import type { Metadata } from "next";
import Link from "next/link";
import { RichText } from "@/components/site/rich-text";
import { Reveal } from "@/components/site/reveal";
import { PageHero, Section, SectionHeading } from "@/components/site/section";
import { SiteImage } from "@/components/site/site-image";
import { Button } from "@/components/ui/button";
import type { ImageValue, ListValue } from "@/lib/cms/blocks";
import { getBlocks, getSchool } from "@/lib/cms/site-data";

export const metadata: Metadata = { title: "About us", description: "Our story, mission, vision and values." };

export default async function AboutPage() {
  const [b, school] = await Promise.all([getBlocks(["about"]), getSchool()]);
  const image = b["about.story.image"] as ImageValue;
  const photo = b["about.principal.photo"] as ImageValue;
  const values = b["about.values"] as ListValue;
  const message = b["about.principal.message"] as string;
  const principal = (b["about.principal.name"] as string) || school.principalName || "";

  return (
    <>
      <PageHero eyebrow="About us" title={`Welcome to ${school.name}`} intro={b["about.intro"] as string} />
      <Section>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <Reveal><RichText source={b["about.story"] as string} /></Reveal>
          <Reveal delay={100}><SiteImage src={image?.url} alt={image?.alt ?? ""} width={900} className="aspect-[4/3] w-full rounded-3xl" /></Reveal>
        </div>
      </Section>
      <Section tone="soft">
        <div className="grid gap-6 md:grid-cols-2">
          {[["Our mission", b["about.mission"]], ["Our vision", b["about.vision"]]].map(([title, text], i) => (
            <Reveal key={title as string} delay={i * 80} className="rounded-2xl border border-border bg-white p-7">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-accent">{title as string}</p>
              <p className="mt-3 font-serif text-2xl leading-snug text-navy">{text as string}</p>
            </Reveal>
          ))}
        </div>
      </Section>
      {values.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Values" title="What we hold to" />
          <ul className="grid gap-5 md:grid-cols-3">
            {values.map((v, i) => (
              <Reveal as="li" key={i} delay={i * 80} className="border-t-2 border-accent pt-4">
                <h3 className="font-serif text-xl text-navy">{v.title}</h3>
                <p className="mt-2 text-muted-foreground">{v.text}</p>
              </Reveal>
            ))}
          </ul>
        </Section>
      )}
      {(principal || message) && (
        <Section tone="sand">
          <div className="grid items-start gap-10 md:grid-cols-[0.8fr_1.2fr]">
            <Reveal><SiteImage src={photo?.url} alt={photo?.alt || principal} width={600} className="aspect-[4/5] w-full rounded-3xl" /></Reveal>
            <Reveal delay={100}>
              <SectionHeading eyebrow="From the principal" title={principal ? `A message from ${principal}` : "A message from the principal"} className="mb-5" />
              <RichText source={message} />
              {principal && <p className="mt-6 font-serif text-lg text-navy">{principal}<span className="block text-sm font-sans text-muted-foreground">{b["about.principal.title"] as string}</span></p>}
            </Reveal>
          </div>
        </Section>
      )}
      <Section><div className="flex flex-wrap items-center justify-between gap-4"><p className="font-serif text-2xl text-navy">Meet the people who teach and lead our school.</p><Button asChild><Link href="/staff">Our staff</Link></Button></div></Section>
    </>
  );
}
