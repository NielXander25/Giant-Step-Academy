import type { Metadata } from "next";
import Link from "next/link";
import { RichText } from "@/components/site/rich-text";
import { Reveal } from "@/components/site/reveal";
import { PageHero, Section } from "@/components/site/section";
import { SiteImage } from "@/components/site/site-image";
import { SECTIONS } from "@/components/site/nav";
import { Button } from "@/components/ui/button";
import type { ImageValue } from "@/lib/cms/blocks";
import { getBlocks } from "@/lib/cms/site-data";

export const metadata: Metadata = { title: "Academics", description: "Nursery, Primary and Secondary education." };

export default async function AcademicsPage() {
  const b = await getBlocks(["academics"]);
  const subjects = b["academics.subjects"] as string;
  return (
    <>
      <PageHero eyebrow="Academics" title="Learning from the first day to graduation" intro={b["academics.intro"] as string} />
      {SECTIONS.map((s, i) => {
        const img = b[`academics.${s.key}.image`] as ImageValue;
        return (
          <Section key={s.key} id={s.key} tone={i % 2 ? "soft" : "white"}>
            <div className={`grid items-center gap-10 md:grid-cols-2 ${i % 2 ? "md:[&>*:first-child]:order-2" : ""}`}>
              <Reveal>
                <div className="mb-4 h-1.5 w-16 rounded-full" style={{ background: s.color }} />
                <h2 className="mb-4 text-3xl text-navy md:text-4xl">{s.name}</h2>
                <RichText source={b[s.block] as string} />
              </Reveal>
              <Reveal delay={100}><SiteImage src={img?.url} alt={img?.alt || `${s.name} section`} width={900} className="aspect-[4/3] w-full rounded-3xl" /></Reveal>
            </div>
          </Section>
        );
      })}
      {subjects.trim() && <Section tone="sand"><h2 className="mb-5 text-3xl text-navy">Subjects and programmes</h2><RichText source={subjects} className="max-w-3xl" /></Section>}
      <Section tone="navy"><div className="flex flex-wrap items-center justify-between gap-5"><h2 className="text-3xl text-white">Find the right class for your child.</h2><Button asChild size="lg" variant="accent"><Link href="/admissions">Admissions</Link></Button></div></Section>
    </>
  );
}
