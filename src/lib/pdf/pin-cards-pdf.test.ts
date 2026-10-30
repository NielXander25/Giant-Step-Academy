import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { renderToBuffer } from "@react-pdf/renderer";
import { describe, expect, it } from "vitest";
import { CREST_PNG } from "./crest";
import { PinCardsPdf } from "./pin-cards-pdf";

const data = {
  pins: [] as string[], label: "First Term 2026/2027", createdAt: new Date("2026-10-30T10:00:00Z"), crest: CREST_PNG,
  school: { name: "Giant Step Academy", motto: "Securing a bright future", phone: "+234 813 913 9020", website: "https://giantstepacademy.com.ng" },
};

describe("printable PIN list", () => {
  it("numbers every PIN with a tick box, fifty a page in two columns", async () => {
    const pins = Array.from({ length: 63 }, (_, i) => `GSA${String(482915 + i * 37).padStart(6, "0")}`);
    const buffer = await renderToBuffer(PinCardsPdf({ ...data, pins }));
    expect(buffer.subarray(0, 5).toString()).toBe("%PDF-");
    const dir = mkdtempSync(join(tmpdir(), "pins-"));
    const file = join(dir, "pins.pdf");
    writeFileSync(file, buffer);
    if (process.env.PIN_PDF_OUT) writeFileSync(process.env.PIN_PDF_OUT, buffer);
    const text = execFileSync("pdftotext", ["-layout", file, "-"], { encoding: "utf8" });
    const pages = text.split("\f").filter((p) => p.trim());
    expect(pages).toHaveLength(2); // 50 on the first page, 13 on the second
    expect(pages[0]).toContain("001");
    expect(pages[0]).toContain("050");
    expect(pages[1]).toContain("063");
    expect(text).toContain("GSA 482 915");
    expect(text).toContain("Batch: First Term 2026/2027");
    expect(text).toContain("any student in any class");
  });
});
