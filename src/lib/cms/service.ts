import type { Prisma, Role } from "@prisma/client";
import { db } from "@/lib/db";
import { AuditAction, writeAudit } from "@/lib/audit";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { assertAllowed, canManageWebsiteContent } from "@/lib/permissions/policies";
import type { z } from "zod";
import type {
  announcementInput, enquiryInput, eventInput, galleryBulkInput, galleryInput, newsInput, staffInput, testimonialInput, ContentType,
} from "@/lib/validators/cms";
import { BLOCK_BY_KEY, coerceValue, blocksFor, type PageKey } from "./blocks";
import { slugify } from "./helpers";
import { SAMPLE_ANNOUNCEMENT, SAMPLE_EVENTS, SAMPLE_NEWS, SAMPLE_STAFF } from "./sample-content";

// All writes made by the content manager. Every function checks permission itself and writes an audit entry.
// (Refreshing the public site's cache is done by the server actions that call these.)

type Actor = { id: string; role: Role; canCreateAdmins?: boolean };
const allow = (user: Actor) => assertAllowed(canManageWebsiteContent(user), "Only an Admin can change the website.");
const audit = (user: Actor, what: string, entityId?: string, extra: Record<string, string | number | boolean | null> = {}) =>
  writeAudit({ actorId: user.id, actorRole: user.role, action: AuditAction.WEBSITE_CONTENT_CHANGED, entityType: "Website", entityId, metadata: { what, ...extra } });

async function uniqueSlug(base: string, ownId?: string): Promise<string> {
  const root = base || "post";
  for (let n = 1; n < 200; n++) {
    const candidate = n === 1 ? root : `${root}-${n}`;
    const clash = await db.newsPost.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!clash || clash.id === ownId) return candidate;
  }
  throw new ConflictError("Could not make a unique web address for this article. Try a different title.");
}

export async function saveNews(user: Actor, input: z.output<typeof newsInput>) {
  allow(user);
  const existing = input.id ? await db.newsPost.findUnique({ where: { id: input.id } }) : null;
  if (input.id && !existing) throw new NotFoundError("That article could not be found.");
  const slug = await uniqueSlug(slugify(input.slug?.trim() || input.title), input.id);
  const data = {
    slug, title: input.title, excerpt: input.excerpt, content: input.content, coverImageUrl: input.coverImageUrl,
    category: input.category, authorName: input.authorName, status: input.status,
    // The publish date is set the first time it goes live and kept after that.
    publishedAt: input.status === "PUBLISHED" ? (existing?.publishedAt ?? new Date()) : (existing?.publishedAt ?? null),
    isDemo: false, // editing a sample article makes it the school's own
  };
  const saved = existing ? await db.newsPost.update({ where: { id: existing.id }, data }) : await db.newsPost.create({ data });
  await audit(user, existing ? "news_updated" : "news_created", saved.id, { title: input.title, status: input.status });
  return { id: saved.id, slug };
}

export async function saveEvent(user: Actor, input: z.output<typeof eventInput>) {
  allow(user);
  const data = { title: input.title, description: input.description, location: input.location, startsAt: input.startsAt!, endsAt: input.endsAt, imageUrl: input.imageUrl, status: input.status, isDemo: false };
  if (input.id && !(await db.schoolEvent.findUnique({ where: { id: input.id }, select: { id: true } }))) throw new NotFoundError("That event could not be found.");
  const saved = input.id ? await db.schoolEvent.update({ where: { id: input.id }, data }) : await db.schoolEvent.create({ data });
  await audit(user, input.id ? "event_updated" : "event_created", saved.id, { title: input.title });
  return { id: saved.id };
}

export async function saveGalleryItem(user: Actor, input: z.output<typeof galleryInput>) {
  allow(user);
  const data = { imageUrl: input.imageUrl, caption: input.caption, category: input.category, sortOrder: input.sortOrder, status: input.status, isDemo: false };
  if (input.id && !(await db.galleryItem.findUnique({ where: { id: input.id }, select: { id: true } }))) throw new NotFoundError("That picture could not be found.");
  const saved = input.id ? await db.galleryItem.update({ where: { id: input.id }, data }) : await db.galleryItem.create({ data });
  await audit(user, input.id ? "gallery_updated" : "gallery_created", saved.id);
  return { id: saved.id };
}

export async function addGalleryItems(user: Actor, input: z.output<typeof galleryBulkInput>) {
  allow(user);
  const last = await db.galleryItem.aggregate({ _max: { sortOrder: true } });
  const start = (last._max.sortOrder ?? 0) + 1;
  await db.galleryItem.createMany({
    data: input.images.map((img, i) => ({ imageUrl: img.url, caption: img.caption, category: input.category, sortOrder: start + i, status: "PUBLISHED" as const })),
  });
  await audit(user, "gallery_added", undefined, { count: input.images.length });
  return { added: input.images.length };
}

export async function saveStaff(user: Actor, input: z.output<typeof staffInput>) {
  allow(user);
  const data = { name: input.name, position: input.position, department: input.department, photoUrl: input.photoUrl, bio: input.bio, sortOrder: input.sortOrder, status: input.status, isDemo: false };
  if (input.id && !(await db.staffProfile.findUnique({ where: { id: input.id }, select: { id: true } }))) throw new NotFoundError("That staff profile could not be found.");
  const saved = input.id ? await db.staffProfile.update({ where: { id: input.id }, data }) : await db.staffProfile.create({ data });
  await audit(user, input.id ? "staff_updated" : "staff_created", saved.id, { name: input.name });
  return { id: saved.id };
}

export async function saveAnnouncement(user: Actor, input: z.output<typeof announcementInput>) {
  allow(user);
  const data = { title: input.title, message: input.message, startsAt: input.startsAt, endsAt: input.endsAt, status: input.status, isDemo: false };
  if (input.id && !(await db.announcement.findUnique({ where: { id: input.id }, select: { id: true } }))) throw new NotFoundError("That announcement could not be found.");
  const saved = input.id ? await db.announcement.update({ where: { id: input.id }, data }) : await db.announcement.create({ data });
  await audit(user, input.id ? "announcement_updated" : "announcement_created", saved.id, { title: input.title });
  return { id: saved.id };
}

export async function saveTestimonial(user: Actor, input: z.output<typeof testimonialInput>) {
  allow(user);
  const data = { name: input.name, relationship: input.relationship, quote: input.quote, photoUrl: input.photoUrl, status: input.status, isDemo: false };
  if (input.id && !(await db.testimonial.findUnique({ where: { id: input.id }, select: { id: true } }))) throw new NotFoundError("That testimonial could not be found.");
  const saved = input.id ? await db.testimonial.update({ where: { id: input.id }, data }) : await db.testimonial.create({ data });
  await audit(user, input.id ? "testimonial_updated" : "testimonial_created", saved.id, { name: input.name });
  return { id: saved.id };
}

export async function deleteContent(user: Actor, type: ContentType, id: string) {
  allow(user);
  const where = { id };
  const result =
    type === "news" ? await db.newsPost.deleteMany({ where })
    : type === "events" ? await db.schoolEvent.deleteMany({ where })
    : type === "gallery" ? await db.galleryItem.deleteMany({ where })
    : type === "staff" ? await db.staffProfile.deleteMany({ where })
    : type === "announcements" ? await db.announcement.deleteMany({ where })
    : await db.testimonial.deleteMany({ where });
  if (result.count !== 1) throw new NotFoundError("That item could not be found.");
  await audit(user, `${type}_deleted`, id);
  return { id };
}

// ─── Page text and pictures ───

/** Saves edited blocks of one page. Only blocks that belong to that page are accepted, and every value is checked. */
export async function savePageBlocks(user: Actor, page: PageKey, values: Record<string, unknown>) {
  allow(user);
  const allowed = new Set(blocksFor(page).map((b) => b.key));
  const rows: { key: string; body: Prisma.InputJsonValue }[] = [];
  for (const [key, raw] of Object.entries(values)) {
    if (!allowed.has(key)) throw new ConflictError("One of the items does not belong to this page. Reload and try again.");
    const def = BLOCK_BY_KEY.get(key)!;
    const value = coerceValue(def, raw);
    if (value === null && def.type !== "image") throw new ConflictError(`"${def.label}" has a value that is not allowed.`);
    rows.push({ key, body: { value } as unknown as Prisma.InputJsonValue });
  }
  await db.$transaction(
    rows.map((r) => db.pageContent.upsert({ where: { key: r.key }, update: { body: r.body, isDemo: false }, create: { key: r.key, body: r.body } })),
  );
  await audit(user, "page_saved", undefined, { page, blocks: rows.length });
  return { saved: rows.length };
}

/** Puts a block back to the sample text. */
export async function resetBlock(user: Actor, key: string) {
  allow(user);
  if (!BLOCK_BY_KEY.has(key)) throw new NotFoundError("That item could not be found.");
  await db.pageContent.deleteMany({ where: { key } });
  await audit(user, "block_reset", undefined, { key });
  return { key };
}

// ─── Sample content ───

export async function loadSampleContent(user: Actor) {
  allow(user);
  const existing = await db.newsPost.count();
  if (existing > 0) throw new ConflictError("There is already news on the website, so the sample was not loaded.");
  const now = new Date();
  await db.$transaction([
    db.newsPost.createMany({ data: SAMPLE_NEWS.map((n, i) => ({ ...n, status: "PUBLISHED" as const, publishedAt: new Date(now.getTime() - i * 3 * 86_400_000), isDemo: true })) }),
    db.schoolEvent.createMany({ data: SAMPLE_EVENTS.map((e) => ({ ...e, status: "PUBLISHED" as const, isDemo: true })) }),
    db.staffProfile.createMany({ data: SAMPLE_STAFF.map((s) => ({ ...s, status: "PUBLISHED" as const, isDemo: true })) }),
    db.announcement.create({ data: { ...SAMPLE_ANNOUNCEMENT, status: "PUBLISHED", isDemo: true } }),
  ]);
  await audit(user, "sample_loaded");
  return { news: SAMPLE_NEWS.length, events: SAMPLE_EVENTS.length, staff: SAMPLE_STAFF.length };
}

export async function removeSampleContent(user: Actor) {
  allow(user);
  const where = { isDemo: true };
  const counts = await db.$transaction([
    db.newsPost.deleteMany({ where }), db.schoolEvent.deleteMany({ where }), db.galleryItem.deleteMany({ where }),
    db.staffProfile.deleteMany({ where }), db.announcement.deleteMany({ where }), db.testimonial.deleteMany({ where }),
  ]);
  const removed = counts.reduce((sum, c) => sum + c.count, 0);
  await audit(user, "sample_removed", undefined, { removed });
  return { removed };
}

export async function demoCounts() {
  const where = { isDemo: true };
  const [news, events, gallery, staff, announcements, testimonials] = await Promise.all([
    db.newsPost.count({ where }), db.schoolEvent.count({ where }), db.galleryItem.count({ where }),
    db.staffProfile.count({ where }), db.announcement.count({ where }), db.testimonial.count({ where }),
  ]);
  return { total: news + events + gallery + staff + announcements + testimonials, news, events, staff };
}

// ─── Enquiries ───

export const ENQUIRY_LIMIT_PER_HOUR = 5;

/** Saves a message from the public form. Called without a signed-in user, so it guards itself with a per-network limit. */
export async function submitEnquiry(input: z.output<typeof enquiryInput>, ipHash: string | null, now: Date = new Date()) {
  if (ipHash) {
    const recent = await db.enquiry.count({ where: { ipHash, createdAt: { gte: new Date(now.getTime() - 3_600_000) } } });
    if (recent >= ENQUIRY_LIMIT_PER_HOUR) throw new ConflictError("You have sent several messages already. Please try again later or call the school.");
  }
  const saved = await db.enquiry.create({
    data: { name: input.name, phone: input.phone, email: input.email, interest: input.interest ?? "General", message: input.message, ipHash },
  });
  await writeAudit({ action: AuditAction.ENQUIRY_RECEIVED, entityType: "Enquiry", entityId: saved.id, ipHash });
  return { id: saved.id };
}

export async function markEnquiry(user: Actor, enquiryId: string, handled: boolean) {
  allow(user);
  const done = await db.enquiry.updateMany({
    where: { id: enquiryId },
    data: handled ? { status: "HANDLED", handledById: user.id, handledAt: new Date() } : { status: "NEW", handledById: null, handledAt: null },
  });
  if (done.count !== 1) throw new NotFoundError("That message could not be found.");
  await writeAudit({ actorId: user.id, actorRole: user.role, action: AuditAction.ENQUIRY_HANDLED, entityType: "Enquiry", entityId: enquiryId, metadata: { handled } });
  return { id: enquiryId };
}
