import { describe, expect, it } from "vitest";
import { BLOCKS, BLOCK_BY_KEY, PAGES, blocksFor, coerceValue, resolveBlocks } from "./blocks";
import { isPlaceholder, mapsHref, optimizeImage, slugify, splitPhones, telHref, whatsappHref } from "./helpers";
import { parseInline, parseRichText, plainText, safeHref } from "./rich-text";

describe("the safe text format", () => {
  it("turns headings, paragraphs and bullet lists into blocks", () => {
    const blocks = parseRichText("## Welcome\n\nFirst line\nsecond line\n\n- one\n- two\n\n### Small\nEnd");
    expect(blocks.map((b) => b.type)).toEqual(["h2", "p", "ul", "h3", "p"]);
    expect(blocks[1]).toMatchObject({ type: "p", inline: [{ type: "text", text: "First line second line" }] });
    expect(blocks[2]).toMatchObject({ type: "ul" });
    expect((blocks[2] as { items: unknown[] }).items).toHaveLength(2);
  });
  it("handles bold, italic and links", () => {
    expect(parseInline("a **bold** and *soft* and [site](https://example.com)")).toEqual([
      { type: "text", text: "a " }, { type: "bold", text: "bold" }, { type: "text", text: " and " }, { type: "italic", text: "soft" },
      { type: "text", text: " and " }, { type: "link", text: "site", href: "https://example.com" },
    ]);
  });
  it("never lets a dangerous link through: it becomes plain text", () => {
    for (const bad of ["javascript:alert(1)", "data:text/html,<script>1</script>", "http://insecure.example.com", "//evil.com", "ftp://x.com/f"]) {
      expect(safeHref(bad)).toBeNull();
      const parts = parseInline(`[click](${bad})`);
      expect(parts.some((p) => p.type === "link")).toBe(false); // never becomes a clickable link
      expect(parts[0]).toEqual({ type: "text", text: "click" });
    }
    expect(safeHref("mailto:office@school.ng")).toBe("mailto:office@school.ng");
    expect(safeHref("tel:+2348139139020")).toBe("tel:+2348139139020");
    expect(safeHref("/admissions")).toBe("/admissions");
  });
  it("keeps pasted HTML as harmless text (nothing is ever treated as markup)", () => {
    const blocks = parseRichText('<script>alert("x")</script>\n\n<img src=x onerror=alert(1)>');
    expect(JSON.stringify(blocks)).toContain("<script>"); // shown as text; the renderer escapes it
    expect(blocks.every((b) => b.type === "p")).toBe(true);
  });
  it("copes with empty, null and Windows line endings", () => {
    expect(parseRichText("")).toEqual([]);
    expect(parseRichText(null)).toEqual([]);
    expect(parseRichText("A\r\n\r\nB").map((b) => b.type)).toEqual(["p", "p"]);
  });
  it("makes a short plain summary", () => {
    expect(plainText("## Hi\n\nSome **bold** words [x](https://a.com)", 200)).toBe("Hi Some bold words x https://a.com");
    expect(plainText("a".repeat(300), 50)).toHaveLength(50);
  });
});

describe("helpers", () => {
  it("makes clean web addresses from titles", () => {
    expect(slugify("Inter-House Sports Day 2026!")).toBe("inter-house-sports-day-2026");
    expect(slugify("  Café & Science  Fair ")).toBe("cafe-and-science-fair");
    expect(slugify("!!!")).toBe("");
    expect(slugify("x".repeat(200)).length).toBeLessThanOrEqual(80);
  });
  it("splits and links Nigerian phone numbers", () => {
    expect(splitPhones("0813 913 9020 / 0911 696 1727")).toEqual(["0813 913 9020", "0911 696 1727"]);
    expect(splitPhones("[SCHOOL PHONE]")).toEqual([]);
    expect(splitPhones(null)).toEqual([]);
    expect(telHref("0813 913 9020")).toBe("tel:+2348139139020");
    expect(telHref("+234 813 913 9020")).toBe("tel:+2348139139020");
    expect(whatsappHref("0911 696 1727")).toBe("https://wa.me/2349116961727");
  });
  it("resizes Cloudinary pictures and leaves others alone", () => {
    expect(optimizeImage("https://res.cloudinary.com/demo/image/upload/v1/giant-step/a.jpg", 800)).toBe("https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,c_limit/v1/giant-step/a.jpg");
    expect(optimizeImage("https://res.cloudinary.com/demo/image/upload/w_100/a.jpg", 800)).toBe("https://res.cloudinary.com/demo/image/upload/w_100/a.jpg");
    expect(optimizeImage("https://example.com/a.jpg", 800)).toBe("https://example.com/a.jpg");
    expect(optimizeImage(null, 800)).toBeNull();
  });
  it("only offers a map link for a real address", () => {
    expect(mapsHref("[SCHOOL ADDRESS]")).toBeNull();
    expect(mapsHref("No. 5 Nasarawa Street, Kaduna")).toContain("google.com/maps");
    expect(isPlaceholder("[SCHOOL PHONE]")).toBe(true);
    expect(isPlaceholder("0813 913 9020")).toBe(false);
  });
});

describe("the editable content registry", () => {
  it("has unique keys, belongs to real pages, and every page has content", () => {
    const keys = BLOCKS.map((b) => b.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const b of BLOCKS) expect(PAGES.map((p) => p.key)).toContain(b.page);
    for (const p of PAGES) expect(blocksFor(p.key).length).toBeGreaterThan(0);
  });
  it("defaults never state facts the school has not confirmed", () => {
    const all = JSON.stringify(BLOCKS.map((b) => b.default)).toLowerCase();
    for (const risky of ["founded in", "established in", "since 19", "since 20", "₦", "naira", "% pass"]) expect(all).not.toContain(risky);
    expect(BLOCK_BY_KEY.get("contact.hours")!.default).toBe("");
    expect(BLOCK_BY_KEY.get("admissions.fees")!.default).toBe("");
  });
  it("saved content wins over defaults, and damaged content falls back to the default", () => {
    const merged = resolveBlocks("home", {
      "home.hero.title": { value: "Welcome to our school" },
      "home.hero.subtitle": { value: 42 }, // wrong shape
      "home.hero.image": { value: { url: "https://res.cloudinary.com/x/image/upload/a.jpg", alt: "Pupils" } },
    });
    expect(merged["home.hero.title"]).toBe("Welcome to our school");
    expect(merged["home.hero.subtitle"]).toBe(BLOCK_BY_KEY.get("home.hero.subtitle")!.default);
    expect(merged["home.hero.image"]).toEqual({ url: "https://res.cloudinary.com/x/image/upload/a.jpg", alt: "Pupils" });
    expect(merged["home.values"]).toEqual(BLOCK_BY_KEY.get("home.values")!.default);
  });
  it("an Admin can deliberately empty a text or remove an image", () => {
    const merged = resolveBlocks("home", { "admissions.notice": { value: "" }, "home.hero.image": { value: null } });
    expect(merged["admissions.notice"]).toBe("");
    expect(merged["home.hero.image"]).toBeNull();
  });
  it("lists are cleaned: unknown fields dropped, empty items removed, size capped", () => {
    const def = BLOCK_BY_KEY.get("home.values")!;
    const v = coerceValue(def, [{ title: "A", text: "a", evil: "<x>" }, { title: "", text: "" }, ...Array.from({ length: 20 }, (_, i) => ({ title: `T${i}`, text: "t" }))]) as Record<string, string>[];
    expect(v).toHaveLength(def.maxItems!);
    expect(v[0]).toEqual({ title: "A", text: "a" });
    expect(coerceValue(def, "not a list")).toBeNull();
  });
  it("rejects insecure or oversized image addresses", () => {
    const def = BLOCK_BY_KEY.get("home.hero.image")!;
    expect(coerceValue(def, { url: "http://x.com/a.jpg", alt: "" })).toBeNull();
    expect(coerceValue(def, { url: "javascript:alert(1)", alt: "" })).toBeNull();
    expect(coerceValue(def, { url: "https://x.com/" + "a".repeat(600), alt: "" })).toBeNull();
  });
});
