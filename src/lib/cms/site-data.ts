import { unstable_cache } from "next/cache";
import * as q from "./site-queries";

// The public website reads through Next's data cache, so most visits never touch the database
// (this keeps the free database plan's "compute hours" safe). Saving anything in the content manager
// clears the "site" tag, and the new content appears straight away. Otherwise it refreshes every 10 minutes.

const options = { tags: ["site"], revalidate: 600 };

export const getSchool = unstable_cache(q.loadSchool, ["site-school"], options);
export const getBlocks = unstable_cache(q.loadBlocks, ["site-blocks-v3"], options);
export const getAnnouncements = unstable_cache(async () => q.loadAnnouncements(), ["site-announcements"], { tags: ["site"], revalidate: 300 });
export const getNews = unstable_cache(async (limit: number, page: number) => q.loadNews({ limit, page }), ["site-news"], options);
export const getNewsBySlug = unstable_cache(async (slug: string) => q.loadNewsBySlug(slug), ["site-news-item"], options);
export const getEvents = unstable_cache(async () => q.loadEvents(), ["site-events"], options);
export const getGallery = unstable_cache(q.loadGallery, ["site-gallery-v2"], options);
export const getStaff = unstable_cache(q.loadStaff, ["site-staff"], options);
export const getTestimonials = unstable_cache(async () => q.loadTestimonials(6), ["site-testimonials"], options);
export const getSitemapEntries = unstable_cache(async () => q.loadSitemapEntries(), ["site-sitemap"], options);
