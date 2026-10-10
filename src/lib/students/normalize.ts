// Pure cleaning/parsing helpers for student data. Shared by the importer, the forms and (later) the result portal,
// so a student is always matched the same way everywhere.

/** Admission numbers are stored upper-case with no spaces, so "gsa/ss2/001 " and "GSA/SS2/001" are the same. */
export function normalizeAdmissionNumber(value: string): string {
  return value.normalize("NFKC").replace(/\s+/g, "").toUpperCase();
}

export const ADMISSION_PATTERN = /^[A-Z0-9][A-Z0-9/._-]{1,29}$/;

export function cleanFullName(value: string): string {
  return value.normalize("NFKC").trim().replace(/\s+/g, " ");
}

// Letters (any language), spaces, hyphens, apostrophes and full stops.
export const NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]{1,99}$/u;

export type GenderValue = "MALE" | "FEMALE";

export function parseGender(value: unknown): { ok: true; value: GenderValue | null } | { ok: false } {
  if (value === null || value === undefined) return { ok: true, value: null };
  const v = String(value).trim().toLowerCase();
  if (v === "") return { ok: true, value: null };
  if (v === "m" || v === "male") return { ok: true, value: "MALE" };
  if (v === "f" || v === "female") return { ok: true, value: "FEMALE" };
  return { ok: false };
}

const utcDate = (y: number, m: number, d: number): Date | null => {
  const date = new Date(Date.UTC(y, m - 1, d));
  // Reject impossible dates such as 31/02/2015 (JavaScript would silently roll them over).
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d ? date : null;
};

export type DobResult = { ok: true; value: Date | null } | { ok: false; reason: string };

/**
 * Accepts an Excel date, an Excel serial number, "2014-03-25" or day-first "25/03/2014" (also - and .).
 * Returns a date at UTC midnight, or a short reason it was rejected.
 */
export function parseDateOfBirth(input: unknown, now: Date = new Date()): DobResult {
  if (input === null || input === undefined || (typeof input === "string" && input.trim() === "")) {
    return { ok: true, value: null };
  }

  let date: Date | null = null;

  if (input instanceof Date) {
    date = Number.isNaN(input.getTime()) ? null : utcDate(input.getUTCFullYear(), input.getUTCMonth() + 1, input.getUTCDate());
  } else if (typeof input === "number") {
    // Excel stores dates as days since 1899-12-30.
    if (input > 1 && input < 80000) date = new Date(Math.round((input - 25569) * 86_400_000));
  } else {
    const s = String(input).trim();
    let m = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(s);
    if (m) date = utcDate(Number(m[1]), Number(m[2]), Number(m[3]));
    else {
      m = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/.exec(s);
      if (m) date = utcDate(Number(m[3]), Number(m[2]), Number(m[1]));
    }
  }

  if (!date) return { ok: false, reason: "Date of birth is not a valid date (use 25/03/2014 or 2014-03-25)." };

  const year = date.getUTCFullYear();
  if (date > now || year > now.getUTCFullYear() - 1 || year < now.getUTCFullYear() - 40) {
    return { ok: false, reason: "Date of birth looks wrong. Check the year." };
  }
  return { ok: true, value: date };
}

/** "2014-03-25" for an <input type="date">. */
export function toDateInputValue(date: Date | null | undefined): string {
  return date ? date.toISOString().slice(0, 10) : "";
}
