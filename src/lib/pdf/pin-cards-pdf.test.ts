import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { CREST_PNG } from "./crest";
import { PinCardsPdf } from "./pin-cards-pdf";

const PINS = Array.from({ length: 23 }, (_, i) => `GSA${String(482915 + i * 37).padStart(6, "0")}`);
const data = {
  pins: PINS, label: "SS2A First Term", createdAt: new Date("2026-10-30T10:00:00Z"), crest: CREST_PNG,
  school: { name: "Giant Step Academy", motto: "Securing a bright future", phone: "+234 813 913 9020", website: "https://giantstepacademy.com.ng" },
};

describe("printable PIN cards", () => {
  it("numbers every PIN, ten cards a page, then a register page", async () => {
    const buffer = await renderToBuffer(PinCardsPdf(data));
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    const dir = mkdtempSync(join(tmpdir(), "pins-"));
    const file = join(dir, "pins.pdf");
    writeFileSync(file, buffer);
    if (process.env.PIN_PDF_OUT) writeFileSync(process.env.PIN_PDF_OUT, buffer);
    const text = execFileSync("pdftotext", ["-layout", file, "-"], { encoding: "utf8" });
    const pages = text.split("\f").filter((p) => p.trim());
    expect(pages).toHaveLength(4); // 23 cards over 3 pages, plus the register
    expect(text).toContain("No. 001");
    expect(text).toContain("No. 023");
    expect(text).toContain("GSA 482 915");
    expect(text).toContain("giantstepacademy.com.ng/results");
    expect(pages[3]).toContain("PIN REGISTER");
    expect(pages[3]).toContain("023");
  });
});
