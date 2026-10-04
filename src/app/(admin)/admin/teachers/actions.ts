"use server";

import { db } from "@/lib/db";
import { defineAction } from "@/lib/action";
import { AuditAction, writeAudit } from "@/lib/audit";
import { NotFoundError } from "@/lib/errors";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { assertAllowed, canManageTeachers } from "@/lib/permissions/policies";
import { setTeacherActiveInput } from "@/lib/validators/people";

export const setTeacherActive = defineAction({
  roles: ADMIN_ROLES,
  input: setTeacherActiveInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManageTeachers(user));
    // Only teacher accounts can be changed here, never admins.
    const { count } = await db.user.updateMany({
      where: { id: input.teacherId, role: "TEACHER" },
      data: { status: input.active ? "ACTIVE" : "DEACTIVATED" },
    });
    if (count !== 1) throw new NotFoundError("That teacher could not be found.");
    await writeAudit({
      actorId: user.id, actorRole: user.role,
      action: input.active ? AuditAction.TEACHER_REACTIVATED : AuditAction.TEACHER_DEACTIVATED,
      entityType: "User", entityId: input.teacherId,
    });
    return { id: input.teacherId };
  },
});
