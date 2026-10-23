import { randomInt } from "node:crypto";
import { PIN_RULES } from "@/lib/constants";

// Pure helpers for the shape of a result PIN: "GSA" + 6 digits, for example GSA482915.

export const PIN_PATTERN = new RegExp(`^${PIN_RULES.prefix}\\d{${PIN_RULES.digits}}$`);

/** A random PIN from a cryptographically secure source (never Math.random). */
export function makePin(): string {
  for (;;) {
    const digits = String(randomInt(0, 10 ** PIN_RULES.digits)).padStart(PIN_RULES.digits, "0");
    if (/^(\d)\1+$/.test(digits)) continue; // skip 000000, 111111 ...
    return PIN_RULES.prefix + digits;
  }
}

/** Cleans up what a parent typed: spaces and dashes removed, upper-case, and the GSA prefix is optional. Null if it cannot be a PIN. */
export function normalizePin(input: string): string | null {
  const cleaned = input.normalize("NFKC").replace(/[\s-]+/g, "").toUpperCase();
  const withPrefix = /^\d+$/.test(cleaned) ? PIN_RULES.prefix + cleaned : cleaned;
  return PIN_PATTERN.test(withPrefix) ? withPrefix : null;
}

/** "GSA482915" -> "GSA****15". Enough for an Admin to tell PINs apart, useless to a thief. */
export function maskPin(pin: string): string {
  return `${PIN_RULES.prefix}${"*".repeat(PIN_RULES.digits - 2)}${pin.slice(-2)}`;
}
