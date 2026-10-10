import {
  ADMISSION_PATTERN, NAME_PATTERN, cleanFullName, normalizeAdmissionNumber, parseDateOfBirth, parseGender, type GenderValue,
} from "./normalize";
import { normalizeName } from "@/lib/utils";

export type RawRow = {
  rowNumber: number;
  admissionNumber: unknown;
  fullName: unknown;
  gender: unknown;
  dateOfBirth: unknown;
};

/** A student already in the database, with where they are enrolled in the current session (if anywhere). */
export type ExistingStudent = { id: string; normalizedName: string; enrolledClassId: string | null };

export type RecordStatus = "NEW" | "EXISTING" | "DUPLICATE" | "INVALID";
export type RecordAction = "CREATE" | "ENROLL" | "NONE" | "SKIP";

export type ValidatedRecord = {
  rowNumber: number;
  status: RecordStatus;
  errors: string[];
  matchedStudentId: string | null;
  data: {
    admissionNumber: string;
    fullName: string;
    gender: GenderValue | null;
    dateOfBirth: string | null; // ISO date, or null
    action: RecordAction;
  };
};

const text = (v: unknown) => (v === null || v === undefined ? "" : String(v));

/**
 * Checks every row and says exactly what would happen to it. Nothing is skipped silently:
 * each row ends up NEW, EXISTING, DUPLICATE or INVALID, with reasons.
 */
export function validateRows(
  rows: RawRow[],
  ctx: { classId: string; existing: Map<string, ExistingStudent>; now?: Date },
): ValidatedRecord[] {
  const firstSeen = new Map<string, number>(); // admission number -> row number of the first usable row

  return rows.map((row) => {
    const errors: string[] = [];
    const admissionNumber = normalizeAdmissionNumber(text(row.admissionNumber));
    const fullName = cleanFullName(text(row.fullName));

    if (!admissionNumber) errors.push("Admission number is missing.");
    else if (!ADMISSION_PATTERN.test(admissionNumber)) {
      errors.push("Admission number may only use letters, numbers and / . _ - (2 to 30 characters).");
    }

    if (!fullName) errors.push("Full name is missing.");
    else if (!NAME_PATTERN.test(fullName)) errors.push("Full name has unusual characters or is too short.");

    const gender = parseGender(row.gender);
    if (!gender.ok) errors.push("Gender must be Male, Female, M or F (or left blank).");

    const dob = parseDateOfBirth(row.dateOfBirth, ctx.now);
    if (!dob.ok) errors.push(dob.reason);

    const data: ValidatedRecord["data"] = {
      admissionNumber,
      fullName,
      gender: gender.ok ? gender.value : null,
      dateOfBirth: dob.ok && dob.value ? dob.value.toISOString().slice(0, 10) : null,
      action: "SKIP",
    };
    const result = (status: RecordStatus, msgs: string[], matched: string | null = null): ValidatedRecord => ({
      rowNumber: row.rowNumber, status, errors: msgs, matchedStudentId: matched, data,
    });

    if (errors.length > 0) return result("INVALID", errors);

    const earlier = firstSeen.get(admissionNumber);
    if (earlier !== undefined) {
      return result("DUPLICATE", [`Repeats the admission number on row ${earlier}.`]);
    }

    const existing = ctx.existing.get(admissionNumber);
    if (!existing) {
      firstSeen.set(admissionNumber, row.rowNumber);
      data.action = "CREATE";
      return result("NEW", []);
    }

    if (existing.normalizedName !== normalizeName(fullName)) {
      return result("INVALID", ["This admission number already belongs to a different student."], existing.id);
    }
    if (existing.enrolledClassId === ctx.classId) {
      firstSeen.set(admissionNumber, row.rowNumber);
      data.action = "NONE";
      return result("EXISTING", ["Already in this class. No change."], existing.id);
    }
    if (existing.enrolledClassId) {
      return result("INVALID", ["Already enrolled in a different class this session."], existing.id);
    }
    firstSeen.set(admissionNumber, row.rowNumber);
    data.action = "ENROLL";
    return result("EXISTING", ["Student already exists. They will be added to this class."], existing.id);
  });
}

export function summarize(records: ValidatedRecord[]) {
  const count = (s: RecordStatus) => records.filter((r) => r.status === s).length;
  return {
    totalRows: records.length,
    newCount: count("NEW"),
    existingCount: count("EXISTING"),
    duplicateCount: count("DUPLICATE"),
    invalidCount: count("INVALID"),
    importable: records.filter((r) => r.data.action === "CREATE" || r.data.action === "ENROLL").length,
  };
}
