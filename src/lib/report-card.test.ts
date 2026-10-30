import { describe, expect, it } from "vitest";
import { stageOfLevel, SUBJECTS_BY_STAGE } from "@/lib/curriculum";
import { buildSampleResult } from "@/lib/pdf/sample";
import { matchSample, parseSampleCookie, sampleCookieValue } from "@/lib/pin/sample-access";
import { columnMax, formatAttendance, ordinal, parseAttendance, parseRatings } from "@/lib/results/report-card";

describe("curriculum", () => {
  it("finds the report card each level uses", () => {
    expect(stageOfLevel("Pre-Reception 1")).toBe("NURSERY");
    expect(stageOfLevel("Pre-Nursery 1")).toBe("NURSERY");
    expect(stageOfLevel("Basic 4")).toBe("PRIMARY");
    expect(stageOfLevel("Basic 8")).toBe("JSS");
    expect(stageOfLevel("Nursery 3")).toBe("NURSERY");
    expect(stageOfLevel("Primary 6")).toBe("PRIMARY");
    expect(stageOfLevel("JSS2")).toBe("JSS");
    expect(stageOfLevel("Basic 8")).toBe("JSS");
    expect(stageOfLevel("SS3")).toBe("SS");
    expect(stageOfLevel("Creche")).toBeNull();
  });
  it("uses the subjects from the school's cards", () => {
    expect(SUBJECTS_BY_STAGE.PRIMARY).toEqual(expect.arrayContaining(["English Studies", "Verbal Reasoning", "History", "Physical & Health Education", "Basic Technology (Computer)"]));
    expect(SUBJECTS_BY_STAGE.JSS).toEqual(expect.arrayContaining(["History", "Intermediate Science"]));
    expect(SUBJECTS_BY_STAGE.JSS).not.toContain("Basic Technology (Computer)");
    expect(SUBJECTS_BY_STAGE.SS).toHaveLength(15);
    for (const list of Object.values(SUBJECTS_BY_STAGE)) expect(new Set(list).size).toBe(list.length);
  });
});

describe("sample result", () => {
  it("opens only with the sample name, a sample admission number and the sample PIN", () => {
    expect(matchSample({ studentName: "sample  student", admissionNumber: "sample-ss", pin: "gsa sample" })).toBe("SS");
    expect(matchSample({ studentName: "Sample Student", admissionNumber: "SAMPLE/NUR", pin: "GSA-SAMPLE" })).toBe("NUR");
    expect(matchSample({ studentName: "tunde ajayi", admissionNumber: "demo/ss2/001", pin: "GSA-SAMPLE" })).toBe("TUNDE2");
    expect(matchSample({ studentName: "Tunde Ajayi", admissionNumber: "SAMPLE-SS", pin: "GSA-SAMPLE" })).toBeNull(); // name and number must belong together
    expect(matchSample({ studentName: "Sample Student", admissionNumber: "SAMPLE-SS", pin: "GSA123456" })).toBeNull();
    expect(matchSample({ studentName: "Ada Obi", admissionNumber: "SAMPLE-SS", pin: "GSA-SAMPLE" })).toBeNull();
    expect(matchSample({ studentName: "Sample Student", admissionNumber: "GSA/SS2/001", pin: "GSA-SAMPLE" })).toBeNull();
  });
  it("only trusts a well-formed cookie", () => {
    expect(parseSampleCookie(sampleCookieValue("JSS", "sample"))).toEqual({ key: "JSS", termId: "sample" });
    expect(parseSampleCookie("TUNDE3:6b1f3c2e-8f6a-4c55-9d0e-2a7b1c9d4e10")).toEqual({ key: "TUNDE3", termId: "6b1f3c2e-8f6a-4c55-9d0e-2a7b1c9d4e10" });
    for (const bad of [undefined, "", "XX:sample", "SS:", "SS:'; drop", "SS", "toString:sample", "__proto__:sample"]) expect(parseSampleCookie(bad)).toBeNull();
  });
  it("builds a complete made-up card for every level", () => {
    for (const stage of ["NURSERY", "PRIMARY", "JSS", "SS"] as const) {
      const r = buildSampleResult(stage);
      expect(r.subjects.map((s) => s.name).sort()).toEqual([...SUBJECTS_BY_STAGE[stage]].sort());
      for (const s of r.subjects) {
        expect(s.total).toBe(s.scores.reduce((a, b) => (a ?? 0) + (b ?? 0), 0));
        expect(s.scores[0]).toBeLessThanOrEqual(20);
        expect(s.scores[2]).toBeLessThanOrEqual(60);
      }
    }
    expect(buildSampleResult("SS")).toEqual(buildSampleResult("SS")); // the same every time
  });
});

describe("report card details", () => {
  it("keeps only known areas rated A to E", () => {
    expect(parseRatings({ sports: "A", neatness: "E", punctuality: "F", hacked: "A" })).toEqual({ sports: "A", neatness: "E" });
    expect(parseRatings(null)).toEqual({});
  });
  it("reads attendance safely", () => {
    expect(formatAttendance(parseAttendance({ present: 110, opened: 120 }))).toBe("110 of 120");
    expect(formatAttendance(parseAttendance({ present: -1, opened: "x" }))).toBeNull();
    expect(formatAttendance(parseAttendance(undefined))).toBeNull();
  });
  it("labels columns and positions like the printed card", () => {
    expect(columnMax(20, 100)).toBe("20%");
    expect(columnMax(40, 70)).toBe("/40");
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 23].map(ordinal)).toEqual(["1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "23rd"]);
  });
});
