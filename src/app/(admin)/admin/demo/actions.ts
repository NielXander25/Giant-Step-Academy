"use server";

import { defineAction } from "@/lib/action";
import { AuditAction, writeAudit } from "@/lib/audit";
import { clearDemoSchool, isDemoSite, loadDemoSchool } from "@/lib/demo/demo-school";
import { ForbiddenError } from "@/lib/errors";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { emptyInput } from "@/lib/validators/academic";

const demoOnly = () => {
  if (!isDemoSite()) throw new ForbiddenError("The practice school can only be loaded on the demo site.");
};

export const loadDemoAction = defineAction({
  roles: ADMIN_ROLES,
  input: emptyInput,
  handler: async ({ user }) => {
    demoOnly();
    const guide = await loadDemoSchool(user.id);
    await writeAudit({ actorId: user.id, actorRole: user.role, action: AuditAction.DEMO_LOADED, entityType: "SystemSetting", metadata: { students: guide.students.length } });
    return { students: guide.students.length };
  },
});

export const clearDemoAction = defineAction({
  roles: ADMIN_ROLES,
  input: emptyInput,
  handler: async ({ user }) => {
    demoOnly();
    await clearDemoSchool();
    await writeAudit({ actorId: user.id, actorRole: user.role, action: AuditAction.DEMO_CLEARED, entityType: "SystemSetting" });
    return { cleared: true };
  },
});
