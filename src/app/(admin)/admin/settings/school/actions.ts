"use server";

import { db } from "@/lib/db";
import { defineAction } from "@/lib/action";
import { AuditAction, writeAudit } from "@/lib/audit";
import { assertAllowed, canManageSchoolProfile } from "@/lib/permissions/policies";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { saveReportLayout } from "@/lib/results/report-layout-store";
import { saveReportLayoutInput, saveSchoolProfileInput } from "@/lib/validators/school";

export const saveSchoolProfile = defineAction({
  roles: ADMIN_ROLES,
  input: saveSchoolProfileInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManageSchoolProfile(user));
    // Once the main details are real (no [PLACEHOLDER] text left), the profile stops being flagged as placeholder.
    const placeholder = [input.name, input.address, input.phone, input.motto, input.email].some((v) => v?.includes("[")) || !input.address || !input.phone;
    await db.schoolProfile.upsert({
      where: { id: "singleton" },
      update: { ...input, isPlaceholder: placeholder },
      create: { id: "singleton", ...input, isPlaceholder: placeholder },
    });
    await writeAudit({ actorId: user.id, actorRole: user.role, action: AuditAction.SCHOOL_PROFILE_CHANGED, entityType: "SchoolProfile", entityId: "singleton", metadata: { part: "profile" } });
    return { saved: true };
  },
});

export const saveReportLayoutAction = defineAction({
  roles: ADMIN_ROLES,
  input: saveReportLayoutInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManageSchoolProfile(user));
    await saveReportLayout(input, user.id);
    await writeAudit({ actorId: user.id, actorRole: user.role, action: AuditAction.SCHOOL_PROFILE_CHANGED, entityType: "SchoolProfile", entityId: "singleton", metadata: { part: "report_layout" } });
    return { saved: true };
  },
});
