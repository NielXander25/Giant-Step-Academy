import type { Metadata } from "next";
import { BellRing, Check } from "lucide-react";
import { EnquiryForm } from "@/components/site/enquiry-form";
import { RichText } from "@/components/site/rich-text";
import { Reveal } from "@/components/site/reveal";
import { PageHero, Section, SectionHeading } from "@/components/site/section";
import type { ListValue } from "@/lib/cms/blocks";
import { getBlocks } from "@/lib/cms/site-data";

export const metadata: Metadata = { title: "Admissions", description: "How to apply to Nursery, Primary or Secondary." };

export default async function AdmissionsPage() {
  const b = await getBlocks(["admissions", "home"]);
  const notice = b["admissions.notice"] as string;
  const steps = b["admissions.steps"] as ListValue;
  const needs = b["admissions.requirements"] as ListValue;
  const faq = b["admissions.faq"] as ListValue;
  const fees = b["admissions.fees"] as string;

  return (
    <>
      <PageHero eyebrow="Admissions" title="Join our school family" intro={b["admissions.intro"] as string} />
      {notice && (
        <div className="bg-accent-soft"><p className="mx-auto flex max-w-6xl items-center gap-3 px-5 py-4 text-sm font-medium text-navy sm:px-8"><BellRing className="size-4 text-accent" aria-hidden="true" />{notice}</p></div>
      )}
      {steps.length > 0 && (
        <Section>
          <SectionHeading eyebrow="How to apply" title="Four simple steps" />
          <ol className="grid gap-6 md:grid-cols-2">
            {steps.map((s, i) => (
              <Reveal as="li" key={i} delay={i * 70} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-navy font-serif text-lg text-white">{i + 1}</span>
                <div><h3 className="font-serif text-xl text-navy">{s.title}</h3><p className="mt-1 text-muted-foreground">{s.text}</p></div>
              </Reveal>
            ))}
          </ol>
        </Section>
      )}
      {(needs.length > 0 || fees.trim()) && (
        <Section tone="soft">
          <div className="grid gap-10 md:grid-cols-2">
            {needs.length > 0 && (
              <div>
                <h2 className="mb-4 text-2xl text-navy">What to bring</h2>
                <ul className="space-y-3">{needs.map((n, i) => <li key={i} className="flex gap-3"><Check className="mt-1 size-4 shrink-0 text-accent" aria-hidden="true" />{n.text}</li>)}</ul>
              </div>
            )}
            {fees.trim() && <div><h2 className="mb-4 text-2xl text-navy">Fees and payment</h2><RichText source={fees} /></div>}
          </div>
        </Section>
      )}
      {faq.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Questions" title="What parents often ask" />
          <div className="max-w-3xl divide-y divide-border rounded-2xl border border-border">
            {faq.map((f, i) => (
              <details key={i} className="group p-5"><summary className="cursor-pointer list-none font-serif text-lg text-navy marker:hidden">{f.question}</summary><p className="mt-3 text-muted-foreground">{f.answer}</p></details>
            ))}
          </div>
        </Section>
      )}
      <Section tone="sand">
        <div className="grid gap-10 md:grid-cols-[0.8fr_1.2fr]">
          <div><h2 className="text-3xl text-navy">Ask us anything</h2><p className="mt-3 text-muted-foreground">Send a message and the school will call you back about admission, the right class and the next step.</p></div>
          <div className="rounded-2xl border border-border bg-white p-6"><EnquiryForm defaultInterest="General" /></div>
        </div>
      </Section>
    </>
  );
}
