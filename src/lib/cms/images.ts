import { z } from "zod";

/** An image the Admin chose: an uploaded Cloudinary picture or any secure (https) address. */
export const imageUrl = z
  .string()
  .trim()
  .max(500)
  .regex(/^https:\/\/[^\s]+$/i, "Use a secure (https) image address.");

export const optionalImageUrl = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((v) => (v ? v : null))
  .refine((v) => v === null || /^https:\/\/[^\s]+$/i.test(v), "Use a secure (https) image address.");

export const UPLOAD_FOLDER = "giant-step";
export const ALLOWED_FORMATS = "jpg,jpeg,png,webp";
export const MAX_UPLOAD_BYTES = 6 * 1024 * 1024;
