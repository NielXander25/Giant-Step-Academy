import type { Metadata } from "next";
import Link from "next/link";
import { EventRow } from "@/components/site/cards";
import { Reveal } from "@/components/site/reveal";
import { PageHero, Section, SectionHeading } from "@/components/site/section";
import { SiteImage } from "@/components/site/site-image";
import type { ListValue } from "@/lib/cms/blocks";
import { getBlocks, getEvents, getGallery } from "@/lib/cms/site-data";
import { galleryOrDefaults } from "@/lib/cms/school-photos";

export const metadata: Metadata = { title: "School life", description: "Facilities, activities and a look at life at school." };

export default async function SchoolLifePage() {
  const [b, events, galleryRows] = await Promise.all([getBlocks(["schoollife"]), getEvents(), getGallery()]);
  const gallery = galleryOrDefaults(galleryRows);
  const facilities = b["schoollife.facilities"] as ListValue;
  const activities = b["schoollife.activities"] as ListValue;
  return (
    <>
      <PageHero eyebrow="School life" title="More than lessons" intro={b["schoollife.intro"] as string} />
      {facilities.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Facilities" title="Where learning happens" />
          <ul className="grid gap-6 md:grid-cols-3">
            {facilities.map((f, i) => (
              <Reveal as="li" key={i} delay={i * 70} className="overflow-hidden rounded-2xl border border-border bg-card">
                <SiteImage src={f.image} alt={f.title} width={640} className="aspect-[4/3] w-full" />
                <div className="p-5"><h3 className="font-serif text-xl text-navy">{f.title}</h3><p className="mt-1 text-sm text-muted-foreground">{f.text}</p></div>
              </Reveal>
            ))}
          </ul>
        </Section>
      )}
      {activities.length > 0 && (
        <Section tone="soft">
          <SectionHeading eyebrow="Activities" title="Clubs and activities" />
          <ul className="grid gap-4 md:grid-cols-2">{activities.map((a, i) => <li key={i} className="rounded-2xl border border-border bg-white p-5"><h3 className="font-serif text-lg text-navy">{a.title}</h3><p className="mt-1 text-sm text-muted-foreground">{a.text}</p></li>)}</ul>
        </Section>
      )}
      {gallery.length > 0 && (
        <Section>
          <div className="mb-6 flex items-end justify-between"><SectionHeading eyebrow="Gallery" title="Moments from school" className="mb-0" /><Link href="/gallery" className="text-sm font-medium text-primary hover:underline">See all pictures</Link></div>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">{gallery.slice(0, 6).map((g) => <li key={g.id}><SiteImage src={g.imageUrl} alt={g.caption ?? ""} width={600} className="aspect-square w-full rounded-2xl" /></li>)}</ul>
        </Section>
      )}
      {events.upcoming.length > 0 && <Section tone="soft"><SectionHeading eyebrow="Coming up" title="Upcoming events" /><ul className="grid gap-4 md:grid-cols-2">{events.upcoming.slice(0, 4).map((e) => <EventRow key={e.id} event={e} />)}</ul></Section>}
      {facilities.length === 0 && activities.length === 0 && gallery.length === 0 && events.upcoming.length === 0 && (
        <Section><p className="text-muted-foreground">Pictures and details of school life will be added here soon.</p></Section>
      )}
    </>
  );
}
