import { createHmac } from "node:crypto";
import { headers } from "next/headers";

/**
 * A salted hash of the caller's IP address. We store this instead of the raw IP
 * so logs can spot abuse without keeping personal data.
 */
export async function getIpHash(): Promise<string | null> {
  try {
    const h = await headers();
    const forwarded = h.get("x-forwarded-for")?.split(",")[0]?.trim();
    const ip = forwarded || h.get("x-real-ip");
    if (!ip) return null;
    const secret = process.env.AUTH_SECRET ?? "dev-only-secret";
    return createHmac("sha256", secret).update(ip).digest("hex").slice(0, 32);
  } catch {
    return null;
  }
}
