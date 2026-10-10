import { z } from "zod";

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
