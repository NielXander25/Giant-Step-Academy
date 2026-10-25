import { z } from "zod";

// The extra parts of Giant Step's termly report card, beside the subject scores.
// The Form Teacher fills them in for each student. Pure definitions: shared by forms, the result page and the PDF.

export const PSYCHOMOTOR = [
  { key: "sports", label: "Sports" },
  { key: "craftWork", label: "Craft Work" },
  { key: "speechComposition", label: "Speech Composition" },
  { key: "drawingPainting", label: "Drawing & Painting" },
] as const;

export const AFFECTIVE = [
  { key: "socialBehaviour", label: "Social Behaviour" },
  { key: "neatness", label: "Neatness" },
  { key: "punctuality", label: "Punctuality" },
  { key: "attentiveness", label: "Attentiveness" },
] as const;

export const RATING_KEYS = [...PSYCHOMOTOR, ...AFFECTIVE].map((r) => r.key);
export type RatingKey = (typeof RATING_KEYS)[number];

export const RATINGS = ["A", "B", "C", "D", "E"] as const;
export type Rating = (typeof RATINGS)[number];
export const RATING_MEANING: Record<Rating, string> = { A: "Excellent", B: "Very good", C: "Good", D: "Fair", E: "Poor" };

export type Ratings = Partial<Record<RatingKey, Rating>>;
export type Attendance = { present: number | null; opened: number | null };

const ratingSchema = z.enum(RATINGS);

/** Reads stored ratings, dropping anything that is not a known area with an A–E rating. */
export function parseRatings(raw: unknown): Ratings {
  if (!raw || typeof raw !== "object") return {};
  const out: Ratings = {};
  for (const key of RATING_KEYS) {
    const v = ratingSchema.safeParse((raw as Record<string, unknown>)[key]);
    if (v.success) out[key] = v.data;
  }
  return out;
}

export function parseAttendance(raw: unknown): Attendance {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const n = (v: unknown) => (typeof v === "number" && Number.isInteger(v) && v >= 0 ? v : null);
  return { present: n(r.present), opened: n(r.opened) };
}

export const formatAttendance = (a: Attendance) =>
  a.present === null && a.opened === null ? null : `${a.present ?? "—"} of ${a.opened ?? "—"}`;

export const ratingsInput = z.object(Object.fromEntries(RATING_KEYS.map((k) => [k, ratingSchema.nullable().optional()]))).partial();
export const attendanceInput = z
  .object({ present: z.number().int().min(0).max(400).nullable(), opened: z.number().int().min(0).max(400).nullable() })
  .refine((a) => a.present === null || a.opened === null || a.present <= a.opened, "Times present cannot be more than times school opened.");

export const ordinal = (n: number) => {
  const sfx = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (sfx[(v - 20) % 10] || sfx[v] || sfx[0]);
};

/** "20%" when the score columns add up to 100 (as on the school's card), otherwise "/20". */
export const columnMax = (max: number, total: number) => (total === 100 ? `${max}%` : `/${max}`);
