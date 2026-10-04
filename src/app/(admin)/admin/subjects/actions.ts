"use server";

import { db } from "@/lib/db";
import { defineAction } from "@/lib/action";
import { AuditAction, writeAudit } from "@/lib/audit";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { assertAllowed, canManageAcademicStructure } from "@/lib/permissions/policies";
import { createSubjectInput, setSubjectActiveInput } from "@/lib/validators/academic";

export const createSubject = defineAction({
  roles: ADMIN_ROLES,
  input: createSubjectInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManageAcademicStructure(user));
    try {
      const subject = await db.subject.create({ data: { name: input.name, code: input.code ?? null } });
      await writeAudit({
        actorId: user.id, actorRole: user.role, action: AuditAction.ACADEMIC_STRUCTURE_CHANGED,
        entityType: "Subject", entityId: subject.id, metadata: { change: "subject_created", name: input.name },
      });
      return { id: subject.id };
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError("A subject with that name or code already exists.");
      throw error;
    }
  },
});

export const setSubjectActive = defineAction({
  roles: ADMIN_ROLES,
  input: setSubjectActiveInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManageAcademicStructure(user));
    const { count } = await db.subject.updateMany({ where: { id: input.subjectId }, data: { isActive: input.isActive } });
    if (count !== 1) throw new NotFoundError("That subject could not be found.");
    await writeAudit({
      actorId: user.id, actorRole: user.role, action: AuditAction.ACADEMIC_STRUCTURE_CHANGED,
      entityType: "Subject", entityId: input.subjectId, metadata: { change: input.isActive ? "subject_enabled" : "subject_disabled" },
    });
    return { id: input.subjectId };
  },
});
