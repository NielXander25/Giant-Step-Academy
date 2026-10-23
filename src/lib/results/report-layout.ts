import { z } from "zod";

// Which parts of the report card are shown. The school has not confirmed its official format yet,
// so these switches let an Admin adjust it without any code change.

export type ReportLayout = {
  showGender: boolean;
  showPosition: boolean;
  showClassSize: boolean; // "3rd of 28" instead of just "3rd"
  showSignatures: boolean;
  footerNote: string;
};

export const DEFAULT_LAYOUT: ReportLayout = { showGender: true, showPosition: true, showClassSize: true, showSignatures: true, footerNote: "" };
export const LAYOUT_KEY = "report.layout";

export const layoutSchema = z.object({
  showGender: z.boolean(),
  showPosition: z.boolean(),
  showClassSize: z.boolean(),
  showSignatures: z.boolean(),
  footerNote: z.string().trim().max(200),
});

export function parseLayout(raw: unknown): ReportLayout {
  const parsed = layoutSchema.partial().safeParse(raw);
  return { ...DEFAULT_LAYOUT, ...(parsed.success ? parsed.data : {}) };
}
