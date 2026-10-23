import { createHash, randomBytes } from "node:crypto";
import { PIN_RULES } from "@/lib/constants";

// After a successful view the browser gets a short-lived "view pass" (a cookie). Reloading, printing or downloading
// during the pass does not use another attempt. Only a hash of the pass is stored in the database.

export const VIEW_COOKIE = "gsa_result_pass";

export function newViewToken(): string {
  return randomBytes(32).toString("base64url");
}

export const hashViewToken = (token: string) => createHash("sha256").update(token).digest("hex");

export const viewSessionExpiry = (now: Date = new Date()) => new Date(now.getTime() + PIN_RULES.viewSessionMinutes * 60_000);
