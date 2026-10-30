import type { Metadata } from "next";
import { EventRow } from "@/components/site/cards";
import { PageHero, Section, SectionHeading } from "@/components/site/section";
import { SiteImage } from "@/components/site/site-image";
import { getEvents } from "@/lib/cms/site-data";
import { EVENT_PHOTOS } from "@/lib/cms/school-photos";

export const metadata: Metadata = { title: "Events", description: "Upcoming and recent school events." };

export default async function EventsPage() {
  const { upcoming, past } = await getEvents();
  return (
    <>
      <PageHero eyebrow="Events" title="What's happening" intro="Dates for your diary." />
      <Section>
        {upcoming.length === 0 ? <p className="text-muted-foreground">No upcoming events are listed right now.</p> : <ul className="grid gap-4 md:grid-cols-2">{upcoming.map((e) => <EventRow key={e.id} event={e} />)}</ul>}
      </Section>
      <Section tone="soft">
        <SectionHeading eyebrow="In pictures" title="Sports, matches and school days" />
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {EVENT_PHOTOS.map((ph) => (
            <li key={ph.src} className="group overflow-hidden rounded-2xl bg-white">
              <a href={ph.src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden">
                <SiteImage src={ph.src} alt={ph.alt} width={640} className="aspect-[4/3] w-full transition-transform duration-500 group-hover:scale-105" />
              </a>
              <p className="px-3 py-2 text-sm text-muted-foreground">{ph.caption}</p>
            </li>
          ))}
        </ul>
      </Section>
      {past.length > 0 && <Section><SectionHeading title="Recent events" /><ul className="grid gap-4 md:grid-cols-2">{past.map((e) => <EventRow key={e.id} event={e} />)}</ul></Section>}
    </>
  );
}
