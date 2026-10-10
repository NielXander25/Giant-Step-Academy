import { z } from "zod";
import {
  ADMISSION_PATTERN, NAME_PATTERN, cleanFullName, normalizeAdmissionNumber, parseDateOfBirth,
} from "@/lib/students/normalize";

const id = z.string().uuid();

const admissionNumber = z
  .string()
  .transform(normalizeAdmissionNumber)
  .refine((v) => ADMISSION_PATTERN.test(v), "Use letters, numbers and / . _ - (2 to 30 characters).");

const fullName = z
  .string()
  .transform(cleanFullName)
  .refine((v) => NAME_PATTERN.test(v), "Enter the student's full name (letters only).");

const gender = z
  .enum(["MALE", "FEMALE", ""])
  .optional()
  .transform((v) => (v ? v : null));

// From an <input type="date"> ("2014-03-25") or empty. Same rules as the spreadsheet import.
const dateOfBirth = z
  .string()
  .optional()
  .transform((v, ctx) => {
    const r = parseDateOfBirth(v ?? "");
    if (!r.ok) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: r.reason });
      return z.NEVER;
    }
    return r.value;
  });

export const addStudentInput = z.object({ classId: id, admissionNumber, fullName, gender, dateOfBirth });

export const updateStudentInput = z.object({
  studentId: id,
  fullName,
  gender,
  dateOfBirth,
  // Only Admins may change these; the server refuses them from anyone else.
  admissionNumber: admissionNumber.optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "WITHDRAWN"]).optional(),
});

export const setRepeaterInput = z.object({ enrollmentId: id, isRepeater: z.boolean() });

export const batchIdInput = z.object({ batchId: id });
export const rejectBatchInput = z.object({ batchId: id, reason: z.string().trim().min(3, "Give a short reason.").max(300) });
