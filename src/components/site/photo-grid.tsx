import { Reveal, type RevealFrom } from "@/components/site/reveal";
import { SiteImage } from "@/components/site/site-image";
import type { SchoolPhoto } from "@/lib/cms/school-photos";

// Photos fly in one after another across a row: from the left, from below, from the right, then a zoom.
const FLIGHT: RevealFrom[] = ["left", "up", "right", "zoom"];
export const flyFor = (i: number) => ({ from: FLIGHT[i % FLIGHT.length], delay: (i % 4) * 110 });

/** A grid of the school's own photos with captions. Each opens full size in a new tab. */
export function PhotoGrid({ photos, columns = "grid-cols-2 md:grid-cols-3", aspect = "aspect-[4/3]" }: { photos: SchoolPhoto[]; columns?: string; aspect?: string }) {
  return (
    <ul className={`grid gap-3 ${columns}`}>
      {photos.map((ph, i) => (
        <Reveal as="li" key={ph.src} {...flyFor(i)} className="group overflow-hidden rounded-3xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
          <a href={ph.src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden">
            <SiteImage src={ph.src} alt={ph.alt} width={640} className={`${aspect} w-full transition-transform duration-500 group-hover:scale-105`} />
          </a>
          <p className="px-3 py-2 text-sm text-muted-foreground">{ph.caption}</p>
        </Reveal>
      ))}
    </ul>
  );
}
