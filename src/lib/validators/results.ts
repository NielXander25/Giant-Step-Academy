import { z } from "zod";
import { attendanceInput, ratingsInput } from "@/lib/results/report-card";

const scope = z.string().uuid().nullable(); // a section id, or null for "all sections"

export const saveBandsInput = z.object({
  sectionId: scope,
  bands: z
    .array(
      z.object({
        minScore: z.number().min(0).max(100),
        maxScore: z.number().min(0).max(100),
        grade: z.string().trim().min(1, "Enter a grade.").max(4),
        remark: z.string().trim().max(40).optional(),
      }),
    )
    .min(1)
    .max(15),
});
export const removeOverrideInput = z.object({ sectionId: z.string().uuid() });

export const saveComponentsInput = z.object({
  sectionId: scope,
  components: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        name: z.string().trim().min(1, "Enter a name.").max(30),
        maxScore: z.number().gt(0, "The maximum must be above 0.").max(100),
      }),
    )
    .min(1, "Add at least one component.")
    .max(6, "Use up to 6 components."),
});

export const saveRulesInput = z.object({
  tieMethod: z.enum(["STANDARD_COMPETITION", "DENSE"]),
  incompletePolicy: z.enum(["WITHHOLD_POSITION", "RANK_AVAILABLE"]),
});

// ─── Result entry and approval ───

const uuid = z.string().uuid();

export const saveScoresInput = z.object({
  classId: uuid,
  subjectId: uuid,
  rows: z
    .array(
      z.object({
        enrollmentId: uuid,
        // component id -> score (null = not entered yet)
        scores: z.record(uuid, z.number().min(0).max(1000).nullable()),
        remark: z.string().trim().max(200).optional(),
      }),
    )
    .max(300),
});
export const subjectRefInput = z.object({ classId: uuid, subjectId: uuid });
export const reviewSubjectInput = z.object({
  classId: uuid,
  subjectId: uuid,
  decision: z.enum(["APPROVE", "REJECT"]),
  reason: z.string().trim().max(300).optional(),
});
export const saveRemarksInput = z.object({
  classId: uuid,
  kind: z.enum(["FORM_TEACHER", "PRINCIPAL", "SUPERVISOR"]),
  remarks: z
    .array(z.object({
      enrollmentId: uuid,
      remark: z.string().trim().max(300),
      // Only the Form Teacher fills these in.
      ratings: ratingsInput.optional(),
      attendance: attendanceInput.optional(),
    }))
    .max(300),
});
export const classRefInput = z.object({ classId: uuid });
export const adminReviewInput = z.object({
  classId: uuid,
  decision: z.enum(["APPROVE", "RETURN", "WITHDRAW"]),
  reason: z.string().trim().max(300).optional(),
  subjectIds: z.array(uuid).max(40).optional(),
});
export const unpublishInput = z.object({ classId: uuid, reason: z.string().trim().min(3, "Give a short reason.").max(300) });
