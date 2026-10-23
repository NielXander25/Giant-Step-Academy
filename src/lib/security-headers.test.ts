import { describe, expect, it } from "vitest";
import { securityHeaders } from "./security-headers";

const header = (k: string) => securityHeaders.find((h) => h.key === k)?.value ?? "";

describe("security headers", () => {
  it("send every header the site relies on", () => {
    for (const k of ["Content-Security-Policy", "Strict-Transport-Security", "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"]) expect(header(k)).not.toBe("");
  });
  it("forbid framing, plugins and loading from unknown places", () => {
    const csp = header("Content-Security-Policy");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
    expect(csp).toContain("default-src 'self'");
    expect(header("X-Frame-Options")).toBe("DENY");
    expect(header("X-Content-Type-Options")).toBe("nosniff");
  });
  it("still allow what the site genuinely needs: picture uploads, the bot check and secure pictures", () => {
    const csp = header("Content-Security-Policy");
    expect(csp).toContain("https://api.cloudinary.com");
    expect(csp).toContain("https://challenges.cloudflare.com");
    expect(csp).toMatch(/img-src[^;]*https:/);
  });
  it("never allows scripts from anywhere but the site and the bot check", () => {
    const script = header("Content-Security-Policy").split("; ").find((d) => d.startsWith("script-src"))!;
    expect(script).not.toMatch(/\*|https:(?!\/\/)/);
    expect(script).toContain("https://challenges.cloudflare.com");
    expect(script).not.toContain("unsafe-eval");
  });
  it("permissions policy switches off camera, microphone and location", () => {
    for (const f of ["camera=()", "microphone=()", "geolocation=()"]) expect(header("Permissions-Policy")).toContain(f);
  });
});
