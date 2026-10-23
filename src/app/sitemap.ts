import type { MetadataRoute } from "next";
import { getSitemapEntries } from "@/lib/cms/site-data";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  let entries: Awaited<ReturnType<typeof getSitemapEntries>> = { pages: ["/", "/about", "/academics", "/admissions", "/school-life", "/news", "/events", "/gallery", "/staff", "/contact", "/privacy"], posts: [] };
  try { entries = await getSitemapEntries(); } catch { /* the site map must never fail the build */ }
  const pages = [...new Set([...entries.pages, "/news", "/events", "/gallery", "/staff"])];
  return [
    ...pages.map((p) => ({ url: `${base}${p === "/" ? "" : p}`, changeFrequency: "weekly" as const, priority: p === "/" ? 1 : 0.7 })),
    ...entries.posts.map((p) => ({ url: `${base}/news/article?slug=${p.slug}`, lastModified: new Date(p.updatedAt), priority: 0.5 })),
  ];
}
