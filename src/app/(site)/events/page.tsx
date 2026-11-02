import type { Metadata } from "next";
import Link from "next/link";
import { EventRow } from "@/components/site/cards";
import { PageHero, Section, SectionHeading } from "@/components/site/section";
import { flyFor, Reveal } from "@/components/site/reveal";
import { GalleryAlbum } from "@/components/site/gallery-album";
import { SiteImage } from "@/components/site/site-image";
import type { ListValue } from "@/lib/cms/blocks";
import { optimizeImage } from "@/lib/cms/helpers";
import { getBlocks, getEvents, getGallery } from "@/lib/cms/site-data";
import { GALLERY_ALBUMS } from "@/lib/cms/school-photos";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Gallery and Events", description: "What's coming up, and life at Giant Step Academy in pictures." };

// Upcoming events, then the photo albums (Graduation always last), with any pictures an Admin uploads before it.
export default async function GalleryAndEventsPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const sp = await searchParams;
  const [{ upcoming, past }, gallery, b] = await Promise.all([getEvents(), getGallery(), getBlocks(["schoollife"])]);
  const categories = [...new Set(gallery.map((g) => g.category).filter((c): c is string => Boolean(c)))];
  const category = categories.find((c) => c === sp.category);
  const uploads = category ? gallery.filter((g) => g.category === category) : gallery;
  const life = [...(b["schoollife.facilities"] as ListValue), ...(b["schoollife.activities"] as ListValue)].filter((i) => i.image);
  const graduation = GALLERY_ALBUMS.find((a) => a.key === "graduation");
  const albums = GALLERY_ALBUMS.filter((a) => a !== graduation);
  const chip = (on: boolean) => cn("rounded-full px-4 py-1.5 text-sm font-medium", on ? "bg-navy text-white" : "bg-white text-navy hover:bg-white/70");

  return (
    <>
      <PageHero eyebrow="Gallery and Events" title="Life at Giant Step" intro="What's coming up, and our school in pictures." />

      <nav aria-label="Albums" className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-5 py-3 sm:px-8 [scrollbar-width:none]">
          <a href="#upcoming" className="shrink-0 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-navy hover:bg-black/5">Events</a>
          {GALLERY_ALBUMS.map((a) => (
            <a key={a.key} href={`#${a.key}`} className="flex shrink-0 items-center gap-2 rounded-full bg-muted px-4 py-1.5 text-sm font-medium text-navy hover:bg-black/5">
              <span aria-hidden="true" className="size-2 rounded-full" style={{ background: a.color }} />{a.title}
            </a>
          ))}
        </div>
      </nav>

      <Section id="upcoming">
        <SectionHeading eyebrow="Coming up" title="Upcoming events" />
        {upcoming.length === 0 ? <p className="text-muted-foreground">No upcoming events are listed right now.</p> : <ul className="grid gap-4 md:grid-cols-2">{upcoming.map((e) => <EventRow key={e.id} event={e} />)}</ul>}
      </Section>

      {albums.map((a, i) => (
        <Section key={a.key} id={a.key} tone={i % 2 ? "white" : "soft"}>
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold" style={{ color: a.color === "#ffcc00" ? "#b38f00" : a.color }}>
              <span aria-hidden="true" className="h-1.5 w-8 rounded-full" style={{ background: a.color }} />Album
            </p>
            <h2 className="text-4xl text-navy md:text-5xl">{a.title}</h2>
            <p className="mt-4 text-xl leading-relaxed text-muted-foreground">{a.intro}</p>
          </div>
          <GalleryAlbum photos={a.photos} color={a.color} />
        </Section>
      ))}

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

      {graduation && (
        <Section id={graduation.key}>
          <div className="mb-10 max-w-2xl">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#b38f00]"><span aria-hidden="true" className="h-1.5 w-8 rounded-full bg-sun" />Album</p>
            <h2 className="text-4xl text-navy md:text-5xl">{graduation.title}</h2>
            <p className="mt-4 text-xl leading-relaxed text-muted-foreground">{graduation.intro}</p>
          </div>
          <GalleryAlbum photos={graduation.photos} color={graduation.color} />
        </Section>
      )}
    </>
  );
}
