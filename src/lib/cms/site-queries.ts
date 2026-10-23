import { db } from "@/lib/db";
import { PAGES, resolveBlocks, blocksFor, type BlockValue, type PageKey } from "./blocks";

// What the PUBLIC website reads. Everything returned is plain data (dates as text) so it can be cached safely.
// Only published items are ever returned.

export type SchoolInfo = { name: string; motto: string | null; address: string | null; phone: string | null; email: string | null; logoUrl: string | null; principalName: string | null };

export async function loadSchool(): Promise<SchoolInfo> {
  const s = await db.schoolProfile.findUnique({ where: { id: "singleton" } });
  return {
    name: s?.name ?? "Giant Step Academy", motto: s?.motto ?? null, address: s?.address ?? null, phone: s?.phone ?? null,
    email: s?.email ?? null, logoUrl: s?.logoUrl ?? null, principalName: s?.principalName ?? null,
  };
}

/** The text and pictures for one or more pages, with the sample text filling anything not yet edited. */
export async function loadBlocks(pages: PageKey[]): Promise<Record<string, BlockValue>> {
  const keys = pages.flatMap((p) => blocksFor(p).map((b) => b.key));
  const rows = await db.pageContent.findMany({ where: { key: { in: keys } }, select: { key: true, body: true } });
  const saved = Object.fromEntries(rows.map((r) => [r.key, r.body]));
  return Object.assign({}, ...pages.map((p) => resolveBlocks(p, saved)));
}

export type AnnouncementItem = { id: string; title: string; message: string };
export async function loadAnnouncements(now: Date = new Date()): Promise<AnnouncementItem[]> {
  const rows = await db.announcement.findMany({
    where: { status: "PUBLISHED", AND: [{ OR: [{ startsAt: null }, { startsAt: { lte: now } }] }, { OR: [{ endsAt: null }, { endsAt: { gte: now } }] }] },
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { id: true, title: true, message: true },
  });
  return rows;
}

export type NewsSummary = { id: string; slug: string; title: string; excerpt: string | null; coverImageUrl: string | null; category: string | null; authorName: string | null; publishedAt: string };
const published = (now: Date) => ({ status: "PUBLISHED" as const, publishedAt: { lte: now } });

export async function loadNews(opts: { limit: number; page?: number }, now: Date = new Date()): Promise<{ items: NewsSummary[]; total: number }> {
  const where = published(now);
  const [total, rows] = await Promise.all([
    db.newsPost.count({ where }),
    db.newsPost.findMany({
      where, orderBy: { publishedAt: "desc" }, skip: ((opts.page ?? 1) - 1) * opts.limit, take: opts.limit,
      select: { id: true, slug: true, title: true, excerpt: true, coverImageUrl: true, category: true, authorName: true, publishedAt: true, content: true },
    }),
  ]);
  return {
    total,
    items: rows.map((r) => ({ id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt, coverImageUrl: r.coverImageUrl, category: r.category, authorName: r.authorName, publishedAt: (r.publishedAt ?? now).toISOString() })),
  };
}

export type NewsArticle = NewsSummary & { content: string };
export async function loadNewsBySlug(slug: string, now: Date = new Date()): Promise<NewsArticle | null> {
  const r = await db.newsPost.findFirst({ where: { slug, ...published(now) } });
  return r ? { id: r.id, slug: r.slug, title: r.title, excerpt: r.excerpt, coverImageUrl: r.coverImageUrl, category: r.category, authorName: r.authorName, publishedAt: (r.publishedAt ?? now).toISOString(), content: r.content } : null;
}

export type EventItem = { id: string; title: string; description: string | null; location: string | null; startsAt: string; endsAt: string | null; imageUrl: string | null };
export async function loadEvents(now: Date = new Date()): Promise<{ upcoming: EventItem[]; past: EventItem[] }> {
  const rows = await db.schoolEvent.findMany({ where: { status: "PUBLISHED" }, orderBy: { startsAt: "asc" } });
  const items = rows.map<EventItem>((e) => ({ id: e.id, title: e.title, description: e.description, location: e.location, startsAt: e.startsAt.toISOString(), endsAt: e.endsAt?.toISOString() ?? null, imageUrl: e.imageUrl }));
  const cutoff = now.getTime() - 86_400_000; // an event stays "upcoming" until a day after it starts
  return { upcoming: items.filter((e) => new Date(e.startsAt).getTime() >= cutoff), past: items.filter((e) => new Date(e.startsAt).getTime() < cutoff).reverse().slice(0, 12) };
}

export type GalleryImage = { id: string; imageUrl: string; caption: string | null; category: string | null };
export async function loadGallery(): Promise<GalleryImage[]> {
  return db.galleryItem.findMany({
    where: { status: "PUBLISHED" }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], take: 120,
    select: { id: true, imageUrl: true, caption: true, category: true },
  });
}

export type StaffMember = { id: string; name: string; position: string; department: string | null; photoUrl: string | null; bio: string | null };
export async function loadStaff(): Promise<StaffMember[]> {
  return db.staffProfile.findMany({
    where: { status: "PUBLISHED" }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    select: { id: true, name: true, position: true, department: true, photoUrl: true, bio: true },
  });
}

export type TestimonialItem = { id: string; name: string; relationship: string | null; quote: string; photoUrl: string | null };
export async function loadTestimonials(limit = 6): Promise<TestimonialItem[]> {
  return db.testimonial.findMany({ where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" }, take: limit, select: { id: true, name: true, relationship: true, quote: true, photoUrl: true } });
}

export async function loadSitemapEntries(now: Date = new Date()) {
  const posts = await db.newsPost.findMany({ where: published(now), select: { slug: true, updatedAt: true }, orderBy: { publishedAt: "desc" }, take: 500 });
  return { pages: PAGES.map((p) => p.path), posts: posts.map((p) => ({ slug: p.slug, updatedAt: p.updatedAt.toISOString() })) };
}
