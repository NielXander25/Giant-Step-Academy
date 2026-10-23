import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((v) => (v ? v : null));

// Only secure image links in a format the PDF can embed.
const logoUrl = z
  .string()
  .trim()
  .max(400)
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https:\/\/[^\s]+\.(png|jpe?g)(\?[^\s]*)?$/i.test(v), "Use a secure (https) link ending in .png, .jpg or .jpeg.");

const websiteUrl = z
  .string()
  .trim()
  .max(200)
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https:\/\/[^\s]+$/i.test(v), "Use a link starting with https://");

export const saveSchoolProfileInput = z.object({
  name: z.string().trim().min(2, "Enter the school's name.").max(100),
  motto: optionalText(120),
  address: optionalText(240),
  phone: optionalText(80),
  email: z
    .string().trim().max(120).optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || z.string().email().safeParse(v).success, "Enter a valid email address."),
  principalName: optionalText(100),
  logoUrl,
  websiteUrl,
});

export const saveReportLayoutInput = z.object({
  showGender: z.boolean(),
  showPosition: z.boolean(),
  showClassSize: z.boolean(),
  showSignatures: z.boolean(),
  footerNote: z.string().trim().max(200),
});
