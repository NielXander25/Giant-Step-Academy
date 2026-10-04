"use server";

import { db } from "@/lib/db";
import { defineAction } from "@/lib/action";
import { AuditAction, writeAudit } from "@/lib/audit";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { assertAllowed, canManageAcademicStructure } from "@/lib/permissions/policies";
import { createSessionInput, setCurrentSessionInput, setCurrentTermInput } from "@/lib/validators/academic";

const TERM_NAMES = ["First Term", "Second Term", "Third Term"];

export const createSession = defineAction({
  roles: ADMIN_ROLES,
  input: createSessionInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManageAcademicStructure(user));
    if (await db.academicSession.findUnique({ where: { name: input.name } })) {
      throw new ConflictError("That session already exists.");
    }
    const isFirst = (await db.academicSession.count()) === 0;
    const session = await db.academicSession.create({
      data: {
        name: input.name,
        isCurrent: isFirst,
        terms: {
          create: TERM_NAMES.map((name, i) => ({ name, sortOrder: i + 1, isCurrent: isFirst && i === 0 })),
        },
      },
    });
    await writeAudit({
      actorId: user.id, actorRole: user.role, action: AuditAction.ACADEMIC_STRUCTURE_CHANGED,
      entityType: "AcademicSession", entityId: session.id, metadata: { change: "session_created", name: input.name },
    });
    return { id: session.id };
  },
});

async function makeCurrent(termId: string) {
  // One transaction: there is never a moment with two current sessions or terms.
  const term = await db.term.findUnique({ where: { id: termId }, select: { id: true, sessionId: true } });
  if (!term) throw new NotFoundError("That term could not be found.");
  await db.$transaction([
    db.term.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } }),
    db.academicSession.updateMany({ where: { isCurrent: true }, data: { isCurrent: false } }),
    db.academicSession.update({ where: { id: term.sessionId }, data: { isCurrent: true } }),
    db.term.update({ where: { id: term.id }, data: { isCurrent: true } }),
  ]);
  return term;
}

export const setCurrentTerm = defineAction({
  roles: ADMIN_ROLES,
  input: setCurrentTermInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManageAcademicStructure(user));
    const term = await makeCurrent(input.termId);
    await writeAudit({
      actorId: user.id, actorRole: user.role, action: AuditAction.ACADEMIC_STRUCTURE_CHANGED,
      entityType: "Term", entityId: term.id, metadata: { change: "current_term_set" },
    });
    return { id: term.id };
  },
});

export const setCurrentSession = defineAction({
  roles: ADMIN_ROLES,
  input: setCurrentSessionInput,
  handler: async ({ user, input }) => {
    assertAllowed(canManageAcademicStructure(user));
    const first = await db.term.findFirst({ where: { sessionId: input.sessionId }, orderBy: { sortOrder: "asc" }, select: { id: true } });
    if (!first) throw new NotFoundError("That session has no terms.");
    await makeCurrent(first.id);
    await writeAudit({
      actorId: user.id, actorRole: user.role, action: AuditAction.ACADEMIC_STRUCTURE_CHANGED,
      entityType: "AcademicSession", entityId: input.sessionId, metadata: { change: "current_session_set" },
    });
    return { id: input.sessionId };
  },
});
