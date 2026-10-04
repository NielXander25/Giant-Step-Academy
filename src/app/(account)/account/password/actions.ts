"use server";

import { db } from "@/lib/db";
import { defineAction } from "@/lib/action";
import { AuditAction, writeAudit } from "@/lib/audit";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { AppError, ConflictError } from "@/lib/errors";
import { ALL_STAFF_ROLES } from "@/lib/permissions/roles";
import { changePasswordInput } from "@/lib/validators/people";

export const changePassword = defineAction({
  roles: ALL_STAFF_ROLES,
  input: changePasswordInput,
  allowPasswordChangePending: true,
  handler: async ({ user, input }) => {
    const row = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
    if (!row || !(await verifyPassword(row.passwordHash, input.currentPassword))) {
      throw new AppError("Your current password is incorrect.", "INVALID_PASSWORD");
    }
    if (input.newPassword === input.currentPassword) {
      throw new ConflictError("Choose a password different from your current one.");
    }
    await db.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(input.newPassword), mustChangePassword: false },
    });
    await writeAudit({ actorId: user.id, actorRole: user.role, action: AuditAction.PASSWORD_CHANGED, entityType: "User", entityId: user.id });
    return { done: true };
  },
});
