import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { DEFAULT_LAYOUT, parseLayout } from "@/lib/results/report-layout";
import { isSafeLogoUrl } from "./logo";
import { ResultPdf } from "./result-pdf";
import { SAMPLE_RESULT } from "./sample";

// A real 1x1 PNG, to prove a logo can be embedded.
const PNG = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==", "base64");

async function textOf(buffer: Buffer): Promise<string> {
  const file = join(mkdtempSync(join(tmpdir(), "pdf-")), "r.pdf");
  writeFileSync(file, buffer);
  return execFileSync("pdftotext", ["-layout", file, "-"], { encoding: "utf8" });
}

describe("report card PDF", () => {
  it("is a real PDF containing the student's details, scores and summary", async () => {
    const buffer = await renderToBuffer(ResultPdf({ data: SAMPLE_RESULT, logo: null }));
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    const text = await textOf(buffer);
    for (const expected of ["Giant Step Academy", "Sample Student", "GSA/SAMPLE/001", "SS2A", "2026/2027", "English Language", "Mathematics", "Biology", "83", "72.67", "3rd of 28", "A hardworking student.", "Keep it up."]) {
      expect(text).toContain(expected);
    }
  });
  it("embeds a logo when one is supplied", async () => {
    const without = await renderToBuffer(ResultPdf({ data: SAMPLE_RESULT, logo: null }));
    const withLogo = await renderToBuffer(ResultPdf({ data: SAMPLE_RESULT, logo: PNG }));
    expect(withLogo.length).toBeGreaterThan(without.length);
  });
  it("obeys the report layout switches", async () => {
    const layout = { ...DEFAULT_LAYOUT, showPosition: false, showGender: false, showSignatures: false, footerNote: "Next term begins 5 January" };
    const text = await textOf(await renderToBuffer(ResultPdf({ data: { ...SAMPLE_RESULT, layout }, logo: null })));
    expect(text).not.toContain("Position");
    expect(text).not.toContain("3rd");
    expect(text).not.toContain("Gender");
    expect(text).not.toContain("signature");
    expect(text).toContain("Next term begins 5 January");
  });
  it("shows the position without the class size when asked", async () => {
    const text = await textOf(await renderToBuffer(ResultPdf({ data: { ...SAMPLE_RESULT, layout: { ...DEFAULT_LAYOUT, showClassSize: false } }, logo: null })));
    expect(text).toContain("3rd");
    expect(text).not.toContain("of 28");
  });
  it("copes with a result that has no position, no remarks and no scores yet", async () => {
    const data = { ...SAMPLE_RESULT, summary: { ...SAMPLE_RESULT.summary, position: null, formTeacherRemark: null, principalRemark: null, average: null }, subjects: [{ name: "Physics", scores: [null, null], total: null, grade: null, remark: null }] };
    const buffer = await renderToBuffer(ResultPdf({ data, logo: null }));
    expect((await textOf(buffer))).toContain("Physics");
  });
  it("handles a long list of subjects across pages without losing any", async () => {
    const subjects = Array.from({ length: 45 }, (_, i) => ({ name: `Subject ${String(i + 1).padStart(2, "0")}`, scores: [30, 50], total: 80, grade: "A", remark: "Excellent" }));
    const text = await textOf(await renderToBuffer(ResultPdf({ data: { ...SAMPLE_RESULT, subjects }, logo: null })));
    expect(text).toContain("Subject 01");
    expect(text).toContain("Subject 45");
  });
});

describe("report layout settings", () => {
  it("fall back to showing everything when nothing is saved or the saved value is damaged", () => {
    expect(parseLayout(undefined)).toEqual(DEFAULT_LAYOUT);
    expect(parseLayout("nonsense")).toEqual(DEFAULT_LAYOUT);
    expect(parseLayout({ showPosition: false })).toEqual({ ...DEFAULT_LAYOUT, showPosition: false });
    expect(parseLayout({ showPosition: "no" })).toEqual(DEFAULT_LAYOUT);
  });
});

describe("logo links", () => {
  it("only public https addresses are fetched", () => {
    expect(isSafeLogoUrl("https://res.cloudinary.com/x/logo.png")).toBe(true);
    for (const bad of ["http://example.com/a.png", "https://localhost/a.png", "https://127.0.0.1/a.png", "https://192.168.1.5/a.png", "https://[::1]/a.png", "https://intranet.internal/a.png", "ftp://example.com/a.png", "javascript:alert(1)", "not a url"]) {
      expect(isSafeLogoUrl(bad)).toBe(false);
    }
  });
});
