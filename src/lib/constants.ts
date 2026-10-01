export const APP_NAME = "Giant Step Academy";

/** Shown wherever fictional sample content appears. */
export const DEMO_LABEL = "Demo content";

/** Key written to SystemSetting once first-time setup has run. */
export const SETUP_COMPLETED_KEY = "setup_completed";

/** Result PIN rules (confirmed with the client). Used from Phase 7. */
export const PIN_RULES = {
  prefix: "GSA",
  digits: 6, // 1,000,000 possible values
  maxUses: 2,
  expiryDaysFromFirstUse: 40,
} as const;

/** School-specific rules that are still unconfirmed. Stored as settings so they can change without code. */
export const DEFAULT_SETTINGS = {
  "results.tieMethod": "STANDARD_COMPETITION", // 1,2,2,4
  "results.incompletePolicy": "WITHHOLD_POSITION",
  "portal.viewSessionMinutes": 30,
} as const;
