"use server";

import { db } from "@/lib/db";
import { defineAction } from "@/lib/action";
import { AuditAction, writeAudit } from "@/lib/audit";
import { loadSampleStructure } from "@/lib/demo-seed";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { assertAllowed, canManageAcademicStructure } from "@/lib/permissions/policies";
import {
  createClassInput, createLevelInput, createSectionInput, emptyInput, setClassActiveInput,
} from "@/lib/validators/academic";

export const loadSample = defineAction({
  roles: ADMIN_ROLES,
  input: emptyInput,
  handler: async ({ user }) => {
    assertAllowed(canManageAcademicStructure(user));
    if ((await db.classLevel.count()) > 0) throw new ConflictError("Classes already exist, so the sample was not loaded.");
    const result = await db.$transaction((tx) => loadSampleStructure(tx), { timeout: 20_000 });
    await writeAudit({
      actorId: user.id, actorRole: user.role, action: AuditAction.SAMPLE_STRUCTURE_LOADED,
      entityType: "ClassLevel", metadata: result,
    });
    return result;
  },
});

export const createSection = defineAction({
  roles: ADMIN_ROLES,
  input: createSectionInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManageAcademicStructure(user));
    const count = await db.section.count();
    try {
      const s = await db.section.create({ data: { name: input.name, sortOrder: count + 1 } });
      await writeAudit({
        actorId: user.id, actorRole: user.role, action: AuditAction.ACADEMIC_STRUCTURE_CHANGED,
        entityType: "Section", entityId: s.id, metadata: { change: "section_created", name: input.name },
      });
      return { id: s.id };
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError("A section with that name already exists.");
      throw error;
    }
  },
});

export const createLevel = defineAction({
  roles: ADMIN_ROLES,
  input: createLevelInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManageAcademicStructure(user));
    try {
      const level = await db.$transaction(async (tx) => {
        const last = await tx.classLevel.findFirst({ orderBy: { sortOrder: "desc" } });
        const created = await tx.classLevel.create({
          data: { sectionId: input.sectionId, name: input.name, isFinal: input.isFinal, sortOrder: (last?.sortOrder ?? 0) + 1 },
        });
        // The previous level now promotes into this one (editable when promotion is built).
        if (last && !last.isFinal && !last.nextLevelId) {
          await tx.classLevel.update({ where: { id: last.id }, data: { nextLevelId: created.id } });
        }
        return created;
      });
      await writeAudit({
        actorId: user.id, actorRole: user.role, action: AuditAction.ACADEMIC_STRUCTURE_CHANGED,
        entityType: "ClassLevel", entityId: level.id, metadata: { change: "level_created", name: input.name },
      });
      return { id: level.id };
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError("A level with that name already exists.");
      throw error;
    }
  },
});

export const createClass = defineAction({
  roles: ADMIN_ROLES,
  input: createClassInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManageAcademicStructure(user));
    const level = await db.classLevel.findUnique({ where: { id: input.levelId } });
    if (!level) throw new NotFoundError("That level could not be found.");
    try {
      const cls = await db.schoolClass.create({
        data: { levelId: level.id, arm: input.arm, name: `${level.name}${input.arm}` },
      });
      await writeAudit({
        actorId: user.id, actorRole: user.role, action: AuditAction.ACADEMIC_STRUCTURE_CHANGED,
        entityType: "SchoolClass", entityId: cls.id, metadata: { change: "class_created", name: cls.name },
      });
      return { id: cls.id };
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError("That class already exists.");
      throw error;
    }
  },
});

export const setClassActive = defineAction({
  roles: ADMIN_ROLES,
  input: setClassActiveInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManageAcademicStructure(user));
    const { count } = await db.schoolClass.updateMany({ where: { id: input.classId }, data: { isActive: input.isActive } });
    if (count !== 1) throw new NotFoundError("That class could not be found.");
    await writeAudit({
      actorId: user.id, actorRole: user.role, action: AuditAction.ACADEMIC_STRUCTURE_CHANGED,
      entityType: "SchoolClass", entityId: input.classId, metadata: { change: input.isActive ? "class_enabled" : "class_disabled" },
    });
    return { id: input.classId };
  },
});
