import { z } from "zod";

const id = z.string().uuid();

export const createSessionInput = z.object({
  name: z
    .string()
    .trim()
    .regex(/^\d{4}\/\d{4}$/, "Use the format 2026/2027.")
    .refine((v) => {
      const [a, b] = v.split("/").map(Number);
      return b === a + 1;
    }, "The second year must follow the first (for example 2026/2027)."),
});
export const setCurrentSessionInput = z.object({ sessionId: id });
export const setCurrentTermInput = z.object({ termId: id });

export const createSectionInput = z.object({ name: z.string().trim().min(2, "Enter a name.").max(40) });
export const createLevelInput = z.object({
  sectionId: id,
  name: z.string().trim().min(2, "Enter a name.").max(40),
  isFinal: z.boolean().default(false),
});
export const createClassInput = z.object({
  levelId: id,
  arm: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9]{1,3}$/, "Use 1 to 3 letters or numbers, such as A.")
    .transform((v) => v.toUpperCase()),
});
export const setClassActiveInput = z.object({ classId: id, isActive: z.boolean() });
export const emptyInput = z.object({});

export const createSubjectInput = z.object({
  name: z.string().trim().min(2, "Enter the subject name.").max(60),
  code: z
    .string()
    .trim()
    .max(10)
    .optional()
    .transform((v) => (v ? v.toUpperCase() : undefined)),
});
export const setSubjectActiveInput = z.object({ subjectId: id, isActive: z.boolean() });

export const classSubjectInput = z.object({ classId: id, subjectId: id });
export const assignFormTeacherInput = z.object({ classId: id, teacherId: id });
export const clearFormTeacherInput = z.object({ classId: id });
export const assignSubjectTeacherInput = z.object({ classId: id, subjectId: id, teacherId: id });
export const clearSubjectTeacherInput = z.object({ classId: id, subjectId: id });
