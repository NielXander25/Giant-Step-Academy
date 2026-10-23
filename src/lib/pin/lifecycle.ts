import { PIN_RULES } from "@/lib/constants";

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

/** The 40 days start at the first successful view. */
export function expiryFrom(firstUse: Date): Date {
  return new Date(firstUse.getTime() + PIN_RULES.expiryDaysFromFirstUse * 86_400_000);
}
