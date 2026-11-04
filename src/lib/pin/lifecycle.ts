export type PinStatusName = "ACTIVE" | "DISABLED" | "EXHAUSTED" | "EXPIRED";

type PinState = { status: PinStatusName; usageCount: number; maxUses: number; expiresAt: Date | null };

/**
 * What a PIN really is right now. The stored status can lag behind (a PIN that ran out of time is only marked
 * EXPIRED when someone next touches it), so this works it out from the facts.
 */
export function effectivePinStatus(pin: PinState, now: Date = new Date()): PinStatusName {
  if (pin.status === "DISABLED") return "DISABLED";
  if (pin.usageCount >= pin.maxUses || pin.status === "EXHAUSTED") return "EXHAUSTED";
  if (pin.status === "EXPIRED" || (pin.expiresAt !== null && pin.expiresAt <= now)) return "EXPIRED";
  return "ACTIVE";
}

/** A disabled PIN can be switched back on only if it still has uses left and has not run out of time. */
export function canEnable(pin: PinState, now: Date = new Date()): boolean {
  return pin.status === "DISABLED" && pin.usageCount < pin.maxUses && (pin.expiresAt === null || pin.expiresAt > now);
}


export type TermOrder = { sessionName: string; sortOrder: number };

/**
 * True when `term` comes after `bound` in the school calendar: a later school year (session names such as
 * "2026/2027" sort in year order), or the same year and a later term.
 */
export function isLaterTerm(term: TermOrder, bound: TermOrder): boolean {
  const byYear = term.sessionName.localeCompare(bound.sessionName, "en", { numeric: true });
  return byYear !== 0 ? byYear > 0 : term.sortOrder > bound.sortOrder;
}
