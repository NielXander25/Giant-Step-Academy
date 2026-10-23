import { describe, expect, it } from "vitest";
import { PIN_PATTERN, maskPin, makePin, normalizePin } from "./format";
import { hashPin } from "./hash";
import { canEnable, effectivePinStatus, expiryFrom } from "./lifecycle";
import { hashViewToken, newViewToken, viewSessionExpiry } from "./view-session";

describe("PIN format", () => {
  it("always looks like GSA plus six digits", () => {
    for (let i = 0; i < 500; i++) expect(makePin()).toMatch(PIN_PATTERN);
  });
  it("is random: 2000 PINs are almost all different, and not sequential", () => {
    const pins = Array.from({ length: 2000 }, makePin);
    expect(new Set(pins).size).toBeGreaterThan(1990);
    const numbers = pins.map((p) => Number(p.slice(3)));
    const increasing = numbers.slice(1).filter((n, i) => n === numbers[i] + 1).length;
    expect(increasing).toBeLessThan(5);
  });
  it("never produces trivial PINs such as 000000 or 111111", () => {
    for (let i = 0; i < 3000; i++) expect(makePin()).not.toMatch(/^GSA(\d)\1{5}$/);
  });
  it("cleans up what a parent types", () => {
    expect(normalizePin("gsa482915")).toBe("GSA482915");
    expect(normalizePin(" GSA 482 915 ")).toBe("GSA482915");
    expect(normalizePin("GSA-482915")).toBe("GSA482915");
    expect(normalizePin("482915")).toBe("GSA482915");
  });
  it("rejects anything that cannot be a PIN", () => {
    for (const bad of ["", "GSA", "GSA12345", "GSA1234567", "ABC123456", "GSA12345X", "'; DROP TABLE"]) expect(normalizePin(bad)).toBeNull();
  });
  it("masks all but the last two digits", () => {
    expect(maskPin("GSA482915")).toBe("GSA****15");
  });
});

describe("PIN hashing", () => {
  it("is stable, secret-dependent and never contains the PIN", () => {
    process.env.PIN_PEPPER = "a".repeat(40);
    const h1 = hashPin("GSA482915");
    expect(hashPin("GSA482915")).toBe(h1);
    expect(hashPin("GSA482916")).not.toBe(h1);
    expect(h1).toMatch(/^[0-9a-f]{64}$/);
    expect(h1).not.toContain("482915");
    process.env.PIN_PEPPER = "b".repeat(40);
    expect(hashPin("GSA482915")).not.toBe(h1); // a different secret gives a different hash
  });
  it("refuses to run without a proper secret", () => {
    process.env.PIN_PEPPER = "short";
    expect(() => hashPin("GSA482915")).toThrow(/PIN_PEPPER/);
    delete process.env.PIN_PEPPER;
    expect(() => hashPin("GSA482915")).toThrow(/PIN_PEPPER/);
  });
});

describe("PIN lifecycle", () => {
  const now = new Date("2026-11-01T10:00:00Z");
  const pin = (o: Partial<Parameters<typeof effectivePinStatus>[0]> = {}) => ({ status: "ACTIVE" as const, usageCount: 0, maxUses: 2, expiresAt: null, ...o });

  it("a fresh PIN is active and an unused one never expires on its own", () => {
    expect(effectivePinStatus(pin(), now)).toBe("ACTIVE");
  });
  it("after two uses it is exhausted, even if the stored status was not updated", () => {
    expect(effectivePinStatus(pin({ usageCount: 1 }), now)).toBe("ACTIVE");
    expect(effectivePinStatus(pin({ usageCount: 2 }), now)).toBe("EXHAUSTED");
  });
  it("expires 40 days after the first use", () => {
    const first = new Date("2026-10-01T00:00:00Z");
    expect(expiryFrom(first).toISOString()).toBe("2026-11-10T00:00:00.000Z");
    expect(effectivePinStatus(pin({ usageCount: 1, expiresAt: expiryFrom(first) }), new Date("2026-11-09T23:59:00Z"))).toBe("ACTIVE");
    expect(effectivePinStatus(pin({ usageCount: 1, expiresAt: expiryFrom(first) }), new Date("2026-11-10T00:00:00Z"))).toBe("EXPIRED");
  });
  it("disabled always wins, and only a still-usable disabled PIN can be re-enabled", () => {
    expect(effectivePinStatus(pin({ status: "DISABLED", usageCount: 2 }), now)).toBe("DISABLED");
    expect(canEnable(pin({ status: "DISABLED", usageCount: 1 }), now)).toBe(true);
    expect(canEnable(pin({ status: "DISABLED", usageCount: 2 }), now)).toBe(false);
    expect(canEnable(pin({ status: "DISABLED", expiresAt: new Date("2026-10-01T00:00:00Z") }), now)).toBe(false);
    expect(canEnable(pin({ status: "EXPIRED" }), now)).toBe(false);
    expect(canEnable(pin({ status: "EXHAUSTED", usageCount: 2 }), now)).toBe(false);
  });
});

describe("view pass", () => {
  it("is long, random and stored only as a hash", () => {
    const a = newViewToken();
    expect(a.length).toBeGreaterThanOrEqual(40);
    expect(newViewToken()).not.toBe(a);
    expect(hashViewToken(a)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashViewToken(a)).not.toContain(a);
  });
  it("lasts 30 minutes", () => {
    const now = new Date("2026-11-01T10:00:00Z");
    expect(viewSessionExpiry(now).toISOString()).toBe("2026-11-01T10:30:00.000Z");
  });
});
