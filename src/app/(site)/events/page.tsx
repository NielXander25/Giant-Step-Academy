import type { Metadata } from "next";
import { EventRow } from "@/components/site/cards";
import { PageHero, Section, SectionHeading } from "@/components/site/section";
import { PhotoGrid } from "@/components/site/photo-grid";
import { getEvents } from "@/lib/cms/site-data";
import { EVENT_GROUPS } from "@/lib/cms/school-photos";

export const metadata: Metadata = { title: "Events", description: "Upcoming and recent school events." };

export default async function EventsPage() {
  const { upcoming, past } = await getEvents();
  return (
    <>
      <PageHero eyebrow="Events" title="What's happening" intro="Dates for your diary." />
      <Section>
        {upcoming.length === 0 ? <p className="text-muted-foreground">No upcoming events are listed right now.</p> : <ul className="grid gap-4 md:grid-cols-2">{upcoming.map((e) => <EventRow key={e.id} event={e} />)}</ul>}
      </Section>
      {EVENT_GROUPS.map((g) => (
        <Section key={g.title} tone="soft">
          <SectionHeading eyebrow="In pictures" title={g.title} />
          <PhotoGrid photos={g.photos} />
        </Section>
      ))}
      {past.length > 0 && <Section><SectionHeading title="Recent events" /><ul className="grid gap-4 md:grid-cols-2">{past.map((e) => <EventRow key={e.id} event={e} />)}</ul></Section>}
    </>
  );
}
