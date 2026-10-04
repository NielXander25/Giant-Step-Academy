"use server";

import { db } from "@/lib/db";
import { defineAction } from "@/lib/action";
import { AuditAction, writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { assertAllowed, canCreateAdmin, canManageAdmins } from "@/lib/permissions/policies";
import { createAdminInput, setAdminActiveInput, setAdminGrantInput } from "@/lib/validators/people";

export const createAdmin = defineAction({
  roles: ADMIN_ROLES,
  input: createAdminInput,
  handler: async ({ user, input }) => {
    assertAllowed(canCreateAdmin(user));
    const email = input.email.toLowerCase();
    if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
      throw new ConflictError("An account with this email already exists.");
    }
    try {
      const admin = await db.user.create({
        data: {
          email,
          name: input.name,
          passwordHash: await hashPassword(input.temporaryPassword),
          role: "ADMIN",
          // Only the Super Admin can hand out the "create admins" capability.
          canCreateAdmins: user.role === "SUPER_ADMIN" ? input.canCreateAdmins : false,
          mustChangePassword: true,
          createdById: user.id,
        },
        select: { id: true },
      });
      await writeAudit({
        actorId: user.id, actorRole: user.role, action: AuditAction.ADMIN_CREATED,
        entityType: "User", entityId: admin.id,
      });
      return { id: admin.id };
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError("An account with this email already exists.");
      throw error;
    }
  },
});

export const setAdminActive = defineAction({
  roles: ADMIN_ROLES,
  input: setAdminActiveInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManageAdmins(user));
    if (input.adminId === user.id) throw new ConflictError("You cannot change your own account here.");
    const { count } = await db.user.updateMany({
      where: { id: input.adminId, role: "ADMIN" },
      data: { status: input.active ? "ACTIVE" : "DEACTIVATED" },
    });
    if (count !== 1) throw new NotFoundError("That admin could not be found.");
    await writeAudit({
      actorId: user.id, actorRole: user.role,
      action: input.active ? AuditAction.ADMIN_REACTIVATED : AuditAction.ADMIN_DEACTIVATED,
      entityType: "User", entityId: input.adminId,
    });
    return { id: input.adminId };
  },
});

export const setAdminGrant = defineAction({
  roles: ADMIN_ROLES,
  input: setAdminGrantInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManageAdmins(user));
    const { count } = await db.user.updateMany({
      where: { id: input.adminId, role: "ADMIN" },
      data: { canCreateAdmins: input.canCreateAdmins },
    });
    if (count !== 1) throw new NotFoundError("That admin could not be found.");
    await writeAudit({
      actorId: user.id, actorRole: user.role, action: AuditAction.ADMIN_PERMISSION_CHANGED,
      entityType: "User", entityId: input.adminId, metadata: { canCreateAdmins: input.canCreateAdmins },
    });
    return { id: input.adminId };
  },
});
