import type { Metadata } from "next";
import Link from "next/link";
import { PageHero, Section } from "@/components/site/section";
import { SiteImage } from "@/components/site/site-image";
import { optimizeImage } from "@/lib/cms/helpers";
import { getGallery } from "@/lib/cms/site-data";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Gallery", description: "Pictures from school life." };

export default async function GalleryPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const sp = await searchParams;
  const all = await getGallery();
  const categories = [...new Set(all.map((g) => g.category).filter((c): c is string => Boolean(c)))];
  const category = categories.find((c) => c === sp.category);
  const items = category ? all.filter((g) => g.category === category) : all;
  const chip = (on: boolean) => cn("rounded-full border border-border px-4 py-1.5 text-sm hover:bg-primary-soft", on && "border-navy bg-navy text-white hover:bg-navy");
  return (
    <>
      <PageHero eyebrow="Gallery" title="School in pictures" />
      <Section>
        {categories.length > 0 && <div className="mb-8 flex flex-wrap gap-2"><Link href="/gallery" className={chip(!category)}>All</Link>{categories.map((c) => <Link key={c} href={`/gallery?category=${encodeURIComponent(c)}`} className={chip(c === category)}>{c}</Link>)}</div>}
        {items.length === 0 ? <p className="text-muted-foreground">Pictures will be added here soon.</p> : (
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {items.map((g) => (
              <li key={g.id} className="group overflow-hidden rounded-2xl">
                <a href={optimizeImage(g.imageUrl, 1600) ?? g.imageUrl} target="_blank" rel="noopener noreferrer" className="block">
                  <SiteImage src={g.imageUrl} alt={g.caption ?? "School picture"} width={560} className="aspect-square w-full transition-transform duration-500 group-hover:scale-105" />
                </a>
                {g.caption && <p className="mt-2 px-1 text-sm text-muted-foreground">{g.caption}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>
    </>
  );
}
