import { z } from "zod";

// School-specific rules that are still unconfirmed. They live in the database (SystemSetting),
// so the Admin can change them on the Assessment settings page without any code change.

export const TIE_METHODS = {
  STANDARD_COMPETITION: { label: "Standard (1, 2, 2, 4)", help: "Tied students share a position and the next position is skipped." },
  DENSE: { label: "Dense (1, 2, 2, 3)", help: "Tied students share a position and the next position follows on." },
} as const;
export type TieMethod = keyof typeof TIE_METHODS;

export const INCOMPLETE_POLICIES = {
  WITHHOLD_POSITION: {
    label: "Withhold average and position until every subject is in",
    help: "A student missing any subject gets no average, grade or position yet. Safest, and the default.",
  },
  RANK_AVAILABLE: {
    label: "Use the subjects entered so far",
    help: "The average covers only the subjects entered, and the student is ranked with everyone else. Can be unfair if subjects are missing.",
  },
} as const;
export type IncompletePolicy = keyof typeof INCOMPLETE_POLICIES;

export type ResultRules = { tieMethod: TieMethod; incompletePolicy: IncompletePolicy };

export const DEFAULT_RULES: ResultRules = { tieMethod: "STANDARD_COMPETITION", incompletePolicy: "WITHHOLD_POSITION" };

export const SETTING_KEYS = { tieMethod: "results.tieMethod", incompletePolicy: "results.incompletePolicy" } as const;

const rulesSchema = z.object({
  tieMethod: z.enum(["STANDARD_COMPETITION", "DENSE"]),
  incompletePolicy: z.enum(["WITHHOLD_POSITION", "RANK_AVAILABLE"]),
});

/** Reads rules from raw setting values, falling back to the defaults for anything missing or invalid. */
export function parseRules(raw: { tieMethod?: unknown; incompletePolicy?: unknown }): ResultRules {
  const parsed = rulesSchema.safeParse({
    tieMethod: raw.tieMethod ?? DEFAULT_RULES.tieMethod,
    incompletePolicy: raw.incompletePolicy ?? DEFAULT_RULES.incompletePolicy,
  });
  return parsed.success ? parsed.data : DEFAULT_RULES;
}
