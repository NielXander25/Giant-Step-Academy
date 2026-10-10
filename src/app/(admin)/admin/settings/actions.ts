"use server";

import { defineAction } from "@/lib/action";
import { AuditAction, writeAudit } from "@/lib/audit";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { assertAllowed, canManageGrading } from "@/lib/permissions/policies";
import { removeBandsOverride, removeComponentsOverride, saveBands, saveComponents, saveRules } from "@/lib/results/config-store";
import { removeOverrideInput, saveBandsInput, saveComponentsInput, saveRulesInput } from "@/lib/validators/results";

type Actor = { id: string; role: "SUPER_ADMIN" | "ADMIN" | "TEACHER" };
const audit = (user: Actor, change: string, scope: string | null) =>
  writeAudit({ actorId: user.id, actorRole: user.role, action: AuditAction.RESULT_CONFIG_CHANGED, entityType: "ResultConfig", entityId: scope ?? undefined, metadata: { change, scope: scope ?? "all" } });

export const saveGradeBands = defineAction({
  roles: ADMIN_ROLES,
  input: saveBandsInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManageGrading(user));
    await saveBands(input.sectionId, input.bands.map((b) => ({ ...b, remark: b.remark || null })));
    await audit(user, "grade_bands_saved", input.sectionId);
    return { saved: true };
  },
});

export const removeGradeOverride = defineAction({
  roles: ADMIN_ROLES,
  input: removeOverrideInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManageGrading(user));
    await removeBandsOverride(input.sectionId);
    await audit(user, "grade_override_removed", input.sectionId);
    return { removed: true };
  },
});

export const saveAssessmentComponents = defineAction({
  roles: ADMIN_ROLES,
  input: saveComponentsInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManageGrading(user));
    await saveComponents(input.sectionId, input.components);
    await audit(user, "components_saved", input.sectionId);
    return { saved: true };
  },
});

export const removeComponentsOverrideAction = defineAction({
  roles: ADMIN_ROLES,
  input: removeOverrideInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManageGrading(user));
    await removeComponentsOverride(input.sectionId);
    await audit(user, "components_override_removed", input.sectionId);
    return { removed: true };
  },
});

export const saveResultRules = defineAction({
  roles: ADMIN_ROLES,
  input: saveRulesInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManageGrading(user));
    await saveRules(input, user.id);
    await audit(user, "rules_saved", null);
    return { saved: true };
  },
});
