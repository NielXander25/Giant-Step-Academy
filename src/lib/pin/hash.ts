import { createHmac } from "node:crypto";

// PINs are never stored. We keep HMAC-SHA256(PIN_PEPPER, pin). The secret "pepper" lives only in the server's
// environment, so a copy of the database alone cannot be used to work out any PIN.

export function isPepperConfigured(): boolean {
  return (process.env.PIN_PEPPER ?? "").length >= 32;
}

export function hashPin(pin: string): string {
  const pepper = process.env.PIN_PEPPER ?? "";
  if (pepper.length < 32) throw new Error("PIN_PEPPER is not set (it must be a random value of 32+ characters).");
  return createHmac("sha256", pepper).update(pin).digest("hex");
}
