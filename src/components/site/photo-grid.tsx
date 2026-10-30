import { SiteImage } from "@/components/site/site-image";
import type { SchoolPhoto } from "@/lib/cms/school-photos";

/** A grid of the school's own photos with captions. Each opens full size in a new tab. */
export function PhotoGrid({ photos, columns = "grid-cols-2 md:grid-cols-3" }: { photos: SchoolPhoto[]; columns?: string }) {
  return (
    <ul className={`grid gap-3 ${columns}`}>
      {photos.map((ph) => (
        <li key={ph.src} className="group overflow-hidden rounded-2xl bg-white">
          <a href={ph.src} target="_blank" rel="noopener noreferrer" className="block overflow-hidden">
            <SiteImage src={ph.src} alt={ph.alt} width={640} className="aspect-[4/3] w-full transition-transform duration-500 group-hover:scale-105" />
          </a>
          <p className="px-3 py-2 text-sm text-muted-foreground">{ph.caption}</p>
        </li>
      ))}
    </ul>
  );
}
