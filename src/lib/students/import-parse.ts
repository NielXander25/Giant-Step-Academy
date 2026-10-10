import ExcelJS from "exceljs";
import type { RawRow } from "./import-validate";

export const MAX_ROWS = 500;
export const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

type ParseResult = { ok: true; rows: RawRow[] } | { ok: false; error: string };

const ALIASES: Record<"admissionNumber" | "fullName" | "gender" | "dateOfBirth", string[]> = {
  admissionNumber: ["admission number", "admission no", "admission no.", "admission num", "adm no", "adm. no", "admission", "student id"],
  fullName: ["full name", "name", "student name", "fullname"],
  gender: ["gender", "sex"],
  dateOfBirth: ["date of birth", "dob", "birth date", "birthdate", "d.o.b"],
};

function plain(value: unknown): string | number | Date | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number") return value;
  if (typeof value === "boolean") return String(value);
  if (typeof value === "object") {
    const v = value as Record<string, unknown>;
    if ("result" in v) return plain(v.result); // formula cells
    if (Array.isArray(v.richText)) return (v.richText as { text: string }[]).map((t) => t.text).join("");
    if (typeof v.text === "string") return v.text; // hyperlink cells
  }
  return String(value);
}

const headerKey = (cell: unknown) => String(plain(cell) ?? "").trim().toLowerCase().replace(/\s+/g, " ");

/** Reads the first sheet of an uploaded .xlsx file into plain rows. Never trusts the file's layout. */
export async function parseStudentWorkbook(buffer: Buffer): Promise<ParseResult> {
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  } catch {
    return { ok: false, error: "That file could not be read. Please upload the .xlsx template you downloaded." };
  }

  const sheet = workbook.getWorksheet("Students") ?? workbook.worksheets[0];
  if (!sheet) return { ok: false, error: "The file has no sheets." };

  // Find the header row (normally row 1; we look at the first 5 in case of a title row).
  let headerRow = 0;
  const columns: Partial<Record<keyof typeof ALIASES, number>> = {};
  for (let r = 1; r <= Math.min(5, sheet.rowCount) && !headerRow; r++) {
    const found: Partial<Record<keyof typeof ALIASES, number>> = {};
    sheet.getRow(r).eachCell({ includeEmpty: false }, (cell, col) => {
      const key = headerKey(cell.value);
      for (const field of Object.keys(ALIASES) as (keyof typeof ALIASES)[]) {
        if (ALIASES[field].includes(key) && found[field] === undefined) found[field] = col;
      }
    });
    if (found.admissionNumber && found.fullName) {
      headerRow = r;
      Object.assign(columns, found);
    }
  }
  if (!headerRow) {
    return { ok: false, error: "Could not find the 'Admission Number' and 'Full Name' columns. Use the template without renaming its headings." };
  }

  const rows: RawRow[] = [];
  for (let r = headerRow + 1; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    const get = (col?: number) => (col ? plain(row.getCell(col).value) : null);
    const item: RawRow = {
      rowNumber: r,
      admissionNumber: get(columns.admissionNumber),
      fullName: get(columns.fullName),
      gender: get(columns.gender),
      dateOfBirth: get(columns.dateOfBirth),
    };
    const empty = [item.admissionNumber, item.fullName, item.gender, item.dateOfBirth].every(
      (v) => v === null || String(v).trim() === "",
    );
    if (empty) continue;
    rows.push(item);
    if (rows.length > MAX_ROWS) {
      return { ok: false, error: `That file has more than ${MAX_ROWS} students. Please split it into smaller files.` };
    }
  }

  if (rows.length === 0) return { ok: false, error: "The file has no student rows under the headings." };
  return { ok: true, rows };
}
