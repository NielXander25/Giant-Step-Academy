import { z } from "zod";
import { PAGES } from "@/lib/cms/blocks";
import { parseLagosDateTime } from "@/lib/cms/helpers";
import { imageUrl, optionalImageUrl } from "@/lib/cms/images";

const id = z.string().uuid();
const optionalText = (max: number) => z.string().trim().max(max).optional().transform((v) => (v ? v : null));
const status = z.enum(["DRAFT", "PUBLISHED"]);

// A date-time box gives "2026-11-05T09:30" (Lagos time). Empty means "not set".
const optionalWhen = z
  .string().trim().optional()
  .transform((v, ctx) => {
    if (!v) return null;
    const d = parseLagosDateTime(v);
    if (!d) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Choose a valid date and time." }); return z.NEVER; }
    return d;
  });

export const newsInput = z.object({
  id: id.optional(),
  title: z.string().trim().min(3, "Enter a title.").max(140),
  slug: z.string().trim().max(80).optional(),
  excerpt: optionalText(300),
  content: z.string().trim().min(1, "Write the article.").max(20000),
  coverImageUrl: optionalImageUrl,
  category: optionalText(40),
  authorName: optionalText(80),
  status,
});

export const eventInput = z
  .object({
    id: id.optional(),
    title: z.string().trim().min(3, "Enter a title.").max(140),
    description: optionalText(2000),
    location: optionalText(120),
    startsAt: optionalWhen,
    endsAt: optionalWhen,
    imageUrl: optionalImageUrl,
    status,
  })
  .superRefine((v, ctx) => {
    if (!v.startsAt) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["startsAt"], message: "Choose when it starts." });
    else if (v.endsAt && v.endsAt <= v.startsAt) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endsAt"], message: "The end must be after the start." });
  });

export const galleryInput = z.object({
  id: id.optional(),
  imageUrl,
  caption: optionalText(200),
  category: optionalText(40),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  status,
});
export const galleryBulkInput = z.object({
  category: optionalText(40),
  images: z.array(z.object({ url: imageUrl, caption: optionalText(200) })).min(1).max(20),
});

export const staffInput = z.object({
  id: id.optional(),
  name: z.string().trim().min(2, "Enter the name.").max(100),
  position: z.string().trim().min(2, "Enter the position.").max(100),
  department: optionalText(80),
  photoUrl: optionalImageUrl,
  bio: optionalText(1500),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  status,
});

export const announcementInput = z
  .object({
    id: id.optional(),
    title: z.string().trim().min(3, "Enter a title.").max(100),
    message: z.string().trim().min(3, "Enter the message.").max(500),
    startsAt: optionalWhen,
    endsAt: optionalWhen,
    status,
  })
  .superRefine((v, ctx) => {
    if (v.startsAt && v.endsAt && v.endsAt <= v.startsAt) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endsAt"], message: "The end must be after the start." });
  });

export const testimonialInput = z.object({
  id: id.optional(),
  name: z.string().trim().min(2, "Enter the name.").max(100),
  relationship: optionalText(80),
  quote: z.string().trim().min(5, "Enter the testimonial.").max(800),
  photoUrl: optionalImageUrl,
  status,
});

export const CONTENT_TYPES = ["news", "events", "gallery", "staff", "announcements", "testimonials"] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];
export const deleteContentInput = z.object({ type: z.enum(CONTENT_TYPES), id });

export const savePageInput = z.object({
  page: z.enum(PAGES.map((p) => p.key) as [string, ...string[]]),
  values: z.record(z.string().max(80), z.unknown()),
});
export const resetBlockInput = z.object({ key: z.string().max(80) });
export const emptyCms = z.object({});

// The public enquiry form
export const enquiryInput = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  phone: z
    .string().trim().min(7, "Please enter a phone number.").max(25)
    .regex(/^[0-9+()\-\s]+$/, "Use digits only.")
    .refine((v) => v.replace(/\D/g, "").length >= 7, "Please enter a phone number."),
  email: z.string().trim().max(120).optional().transform((v) => (v ? v : null)).refine((v) => v === null || z.string().email().safeParse(v).success, "Enter a valid email address."),
  interest: z.enum(["Nursery", "Primary", "Secondary", "General"]).optional(),
  message: z.string().trim().min(5, "Please write a short message.").max(1000),
});
export const markEnquiryInput = z.object({ enquiryId: id, handled: z.boolean() });
