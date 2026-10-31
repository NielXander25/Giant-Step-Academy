import type { Metadata } from "next";
import Link from "next/link";
import { EventRow } from "@/components/site/cards";
import { PageHero, Section, SectionHeading } from "@/components/site/section";
import { flyFor, Reveal } from "@/components/site/reveal";
import { SiteImage } from "@/components/site/site-image";
import type { ListValue } from "@/lib/cms/blocks";
import { optimizeImage } from "@/lib/cms/helpers";
import { getBlocks, getEvents, getGallery } from "@/lib/cms/site-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Gallery and Events", description: "What's coming up, and life at Giant Step Academy in pictures." };

// Upcoming events, then any pictures the school uploads in the content manager (the site has none of its own).
export default async function GalleryAndEventsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const sp = await searchParams;
  const [{ upcoming, past }, gallery, b] = await Promise.all([getEvents(), getGallery(), getBlocks(["schoollife"])]);
  const categories = [...new Set(gallery.map((g) => g.category).filter((c): c is string => Boolean(c)))];
  const category = categories.find((c) => c === sp.category);
  const uploads = category ? gallery.filter((g) => g.category === category) : gallery;
  const life = [...(b["schoollife.facilities"] as ListValue), ...(b["schoollife.activities"] as ListValue)].filter((i) => i.image);
  const chip = (on: boolean) => cn("rounded-full px-4 py-1.5 text-sm font-medium", on ? "bg-navy text-white" : "bg-white text-navy hover:bg-white/70");

  return (
    <>
      <PageHero eyebrow="Gallery and Events" title="Life at Giant Step" intro="What's coming up at the school." />

      <Section>
        <SectionHeading eyebrow="Coming up" title="Upcoming events" />
        {upcoming.length === 0 ? <p className="text-muted-foreground">No upcoming events are listed right now.</p> : <ul className="grid gap-4 md:grid-cols-2">{upcoming.map((e) => <EventRow key={e.id} event={e} />)}</ul>}
      </Section>

      {gallery.length > 0 && (
        <Section tone="soft" id="gallery">
          <SectionHeading eyebrow="Gallery" title="Latest pictures" />
          {categories.length > 0 && (
            <div className="mb-8 flex flex-wrap gap-2">
              <Link href="/events#gallery" className={chip(!category)}>All</Link>
              {categories.map((c) => <Link key={c} href={`/events?category=${encodeURIComponent(c)}#gallery`} className={chip(c === category)}>{c}</Link>)}
            </div>
          )}
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {uploads.map((g, i) => (
              <Reveal as="li" key={g.id} {...flyFor(i)} className="group overflow-hidden rounded-3xl bg-white">
                <a href={optimizeImage(g.imageUrl, 1600) ?? g.imageUrl} target="_blank" rel="noopener noreferrer" className="block overflow-hidden">
                  <SiteImage src={g.imageUrl} alt={g.caption ?? "School picture"} width={560} className="aspect-square w-full transition-transform duration-500 group-hover:scale-105" />
                </a>
                {g.caption && <p className="px-3 py-2 text-sm text-muted-foreground">{g.caption}</p>}
              </Reveal>
            ))}
          </ul>
        </Section>
      )}



      {life.length > 0 && (
        <Section>
          <SectionHeading eyebrow="School life" title="More than lessons" />
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {life.map((a, i) => (
              <Reveal as="li" key={i} {...flyFor(i)} className="overflow-hidden rounded-3xl bg-muted">
                <SiteImage src={a.image} alt={a.title} width={640} className="aspect-[4/3] w-full" />
                <div className="p-5"><h3 className="text-lg text-navy">{a.title}</h3><p className="mt-1 text-sm text-muted-foreground">{a.text}</p></div>
              </Reveal>
            ))}
          </ul>
        </Section>
      )}

      {past.length > 0 && <Section tone="soft"><SectionHeading title="Recent events" /><ul className="grid gap-4 md:grid-cols-2">{past.map((e) => <EventRow key={e.id} event={e} />)}</ul></Section>}
    </>
  );
}
