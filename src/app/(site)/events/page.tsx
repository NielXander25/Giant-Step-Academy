import type { Metadata } from "next";
import { EventRow } from "@/components/site/cards";
import { PageHero, Section, SectionHeading } from "@/components/site/section";
import { getEvents } from "@/lib/cms/site-data";

export const metadata: Metadata = { title: "Events", description: "Upcoming and recent school events." };

export default async function EventsPage() {
  const { upcoming, past } = await getEvents();
  return (
    <>
      <PageHero eyebrow="Events" title="What's happening" intro="Dates for your diary." />
      <Section>
        {upcoming.length === 0 ? <p className="text-muted-foreground">No upcoming events are listed right now.</p> : <ul className="grid gap-4 md:grid-cols-2">{upcoming.map((e) => <EventRow key={e.id} event={e} />)}</ul>}
      </Section>
      {past.length > 0 && <Section tone="soft"><SectionHeading title="Recent events" /><ul className="grid gap-4 md:grid-cols-2">{past.map((e) => <EventRow key={e.id} event={e} />)}</ul></Section>}
    </>
  );
}
