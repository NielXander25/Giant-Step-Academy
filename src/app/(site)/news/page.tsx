import type { Metadata } from "next";
import Link from "next/link";
import { NewsCard } from "@/components/site/cards";
import { PageHero, Section } from "@/components/site/section";
import { getNews } from "@/lib/cms/site-data";

export const metadata: Metadata = { title: "News", description: "News and notices from the school." };
const PAGE = 9;

export default async function NewsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const page = Math.max(1, Number.parseInt((await searchParams).page ?? "1", 10) || 1);
  const { items, total } = await getNews(PAGE, page);
  const pages = Math.max(1, Math.ceil(total / PAGE));
  return (
    <>
      <PageHero eyebrow="News" title="News and notices" intro="The latest from around the school." />
      <Section>
        {items.length === 0 ? <p className="text-muted-foreground">No news yet. Please check back soon.</p> : <div className="grid gap-6 md:grid-cols-3">{items.map((p) => <NewsCard key={p.id} post={p} />)}</div>}
        {pages > 1 && (
          <nav aria-label="Pages" className="mt-10 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Page {page} of {pages}</span>
            <span className="flex gap-4">{page > 1 && <Link href={`/news?page=${page - 1}`} className="text-primary hover:underline">Newer</Link>}{page < pages && <Link href={`/news?page=${page + 1}`} className="text-primary hover:underline">Older</Link>}</span>
          </nav>
        )}
      </Section>
    </>
  );
}
