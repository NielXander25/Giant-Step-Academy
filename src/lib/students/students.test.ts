import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { normalizeName } from "@/lib/utils";
import { parseStudentWorkbook } from "./import-parse";
import { summarize, validateRows, type ExistingStudent, type RawRow } from "./import-validate";
import { normalizeAdmissionNumber, parseDateOfBirth, parseGender } from "./normalize";
import { buildStudentTemplate } from "./template";

const NOW = new Date("2026-10-05T00:00:00Z");
const CLASS_A = "class-a";
const CLASS_B = "class-b";

const row = (n: number, adm: unknown, name: unknown, gender: unknown = "Female", dob: unknown = "25/03/2014"): RawRow => ({
  rowNumber: n, admissionNumber: adm, fullName: name, gender, dateOfBirth: dob,
});

describe("normalising", () => {
  it("admission numbers ignore case and spaces", () => {
    expect(normalizeAdmissionNumber(" gsa/ss2 /001 ")).toBe("GSA/SS2/001");
  });
  it("gender accepts the usual spellings and rejects the rest", () => {
    expect(parseGender("m")).toEqual({ ok: true, value: "MALE" });
    expect(parseGender("FEMALE")).toEqual({ ok: true, value: "FEMALE" });
    expect(parseGender("")).toEqual({ ok: true, value: null });
    expect(parseGender("boy").ok).toBe(false);
  });
  it("dates are read day-first and impossible dates are rejected", () => {
    const d = parseDateOfBirth("25/03/2014", NOW);
    expect(d.ok && d.value?.toISOString().slice(0, 10)).toBe("2014-03-25");
    const iso = parseDateOfBirth("2014-03-25", NOW);
    expect(iso.ok && iso.value?.toISOString().slice(0, 10)).toBe("2014-03-25");
    expect(parseDateOfBirth("31/02/2014", NOW).ok).toBe(false);
    expect(parseDateOfBirth("2030-01-01", NOW).ok).toBe(false);
    expect(parseDateOfBirth("1950-01-01", NOW).ok).toBe(false);
    expect(parseDateOfBirth("", NOW)).toEqual({ ok: true, value: null });
  });
  it("Excel date cells and serial numbers work", () => {
    const fromDate = parseDateOfBirth(new Date(Date.UTC(2014, 2, 25)), NOW);
    expect(fromDate.ok && fromDate.value?.toISOString().slice(0, 10)).toBe("2014-03-25");
    const fromSerial = parseDateOfBirth(41723, NOW); // 2014-03-25
    expect(fromSerial.ok && fromSerial.value?.toISOString().slice(0, 10)).toBe("2014-03-25");
  });
});

describe("validating import rows", () => {
  const existing = new Map<string, ExistingStudent>([
    ["GSA/001", { id: "s1", normalizedName: normalizeName("Ada Obi"), enrolledClassId: CLASS_A }], // already in this class
    ["GSA/002", { id: "s2", normalizedName: normalizeName("Chike Eze"), enrolledClassId: null }], // exists, not enrolled
    ["GSA/003", { id: "s3", normalizedName: normalizeName("Bola Ade"), enrolledClassId: CLASS_B }], // other class
  ]);
  const run = (rows: RawRow[]) => validateRows(rows, { classId: CLASS_A, existing, now: NOW });

  it("marks a brand-new student as NEW", () => {
    const [r] = run([row(2, "gsa/010", "  Ngozi   Okafor ")]);
    expect(r.status).toBe("NEW");
    expect(r.data).toMatchObject({ admissionNumber: "GSA/010", fullName: "Ngozi Okafor", gender: "FEMALE", dateOfBirth: "2014-03-25", action: "CREATE" });
  });
  it("explains each existing-student case", () => {
    const [same, enroll, other] = run([
      row(2, "GSA/001", "Ada Obi"),
      row(3, "GSA/002", "chike  eze"),
      row(4, "GSA/003", "Bola Ade"),
    ]);
    const [renamed] = run([row(2, "GSA/002", "Someone Else")]);
    expect(same).toMatchObject({ status: "EXISTING", data: { action: "NONE" } });
    expect(enroll).toMatchObject({ status: "EXISTING", data: { action: "ENROLL" } });
    expect(other.status).toBe("INVALID");
    expect(renamed.status).toBe("INVALID"); // same number, different name
  });
  it("flags repeats inside the file and keeps the first", () => {
    const [a, b] = run([row(2, "GSA/020", "Ife Bello"), row(3, "gsa/020", "Ife Bello")]);
    expect(a.status).toBe("NEW");
    expect(b.status).toBe("DUPLICATE");
    expect(b.errors[0]).toContain("row 2");
  });
  it("a repeat of an INVALID first row does not block a valid later row", () => {
    const [a, b] = run([row(2, "GSA/030", "Tunde Bako", "robot"), row(3, "GSA/030", "Tunde Bako")]);
    expect(a.status).toBe("INVALID");
    expect(b.status).toBe("NEW");
  });
  it("reports missing and malformed fields without importing them", () => {
    const rows = run([row(2, "", "No Number"), row(3, "GSA/040", ""), row(4, "GSA/041", "X1234"), row(5, "GSA/042", "Ok Name", "x"), row(6, "bad id!", "Ok Name")]);
    expect(rows.every((r) => r.status === "INVALID")).toBe(true);
    expect(rows[0].errors.join(" ")).toContain("Admission number is missing");
  });
  it("summarises counts and what will actually be imported", () => {
    const s = summarize(run([row(2, "GSA/050", "New One"), row(3, "GSA/001", "Ada Obi"), row(4, "GSA/002", "Chike Eze"), row(5, "GSA/050", "New One"), row(6, "", "")]));
    expect(s).toMatchObject({ totalRows: 5, newCount: 1, existingCount: 2, duplicateCount: 1, invalidCount: 1, importable: 2 });
  });
});

describe("spreadsheet round trip", () => {
  it("the downloadable template can be filled in and read back", async () => {
    const buffer = await buildStudentTemplate();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as unknown as ArrayBuffer);
    const ws = wb.getWorksheet("Students")!;
    ws.getRow(2).values = ["gsa/ss2/001", "Ada Obi", "Female", new Date(Date.UTC(2010, 2, 25))];
    ws.getRow(3).values = ["GSA/SS2/002", "Chike Eze", "M", "03/11/2010"];
    const filled = Buffer.from(await wb.xlsx.writeBuffer());

    const parsed = await parseStudentWorkbook(filled);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(parsed.rows).toHaveLength(2);
    const records = validateRows(parsed.rows, { classId: CLASS_A, existing: new Map(), now: NOW });
    expect(records.map((r) => r.status)).toEqual(["NEW", "NEW"]);
    expect(records[0].data.dateOfBirth).toBe("2010-03-25");
    expect(records[1].data.dateOfBirth).toBe("2010-11-03");
  });
  it("rejects files that are not spreadsheets or have no matching headings", async () => {
    expect((await parseStudentWorkbook(Buffer.from("not a spreadsheet"))).ok).toBe(false);
    const wb = new ExcelJS.Workbook();
    wb.addWorksheet("Sheet1").addRow(["Foo", "Bar"]);
    const bad = await parseStudentWorkbook(Buffer.from(await wb.xlsx.writeBuffer()));
    expect(bad.ok).toBe(false);
  });
});
