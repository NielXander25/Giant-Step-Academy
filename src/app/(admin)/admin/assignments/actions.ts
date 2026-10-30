"use server";

import { db } from "@/lib/db";
import { defineAction } from "@/lib/action";
import { AuditAction, writeAudit } from "@/lib/audit";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { getCurrentSessionId } from "@/lib/permissions/assignments";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { assertAllowed, canAssignTeachers } from "@/lib/permissions/policies";
import {
  assignFormTeacherInput, assignSubjectTeacherInput, classSubjectInput, clearFormTeacherInput, clearSubjectTeacherInput,
} from "@/lib/validators/academic";

async function currentSessionOrFail() {
  const sessionId = await getCurrentSessionId();
  if (!sessionId) throw new ConflictError("Set a current academic session first.");
  return sessionId;
}

async function activeTeacherOrFail(teacherId: string) {
  const teacher = await db.user.findFirst({ where: { id: teacherId, role: "TEACHER", status: "ACTIVE" }, select: { id: true } });
  if (!teacher) throw new NotFoundError("That teacher is not active or could not be found.");
}

async function activeClassOrFail(classId: string) {
  const cls = await db.schoolClass.findFirst({ where: { id: classId, isActive: true }, select: { id: true } });
  if (!cls) throw new NotFoundError("That class is not active or could not be found.");
}

type AuditUser = { id: string; role: "SUPER_ADMIN" | "ADMIN" | "TEACHER" };
const audit = (user: AuditUser, entityId: string, metadata: Record<string, string | null>) =>
  writeAudit({
    actorId: user.id, actorRole: user.role, action: AuditAction.TEACHER_ASSIGNMENT_CHANGED,
    entityType: "SchoolClass", entityId, metadata,
  });

// ─── Subjects offered by a class ───

export const addClassSubject = defineAction({
  roles: ADMIN_ROLES,
  input: classSubjectInput,
  handler: async ({ user, input }) => {
    assertAllowed(canAssignTeachers(user));
    await activeClassOrFail(input.classId);
    const subject = await db.subject.findFirst({ where: { id: input.subjectId, isActive: true }, select: { id: true } });
    if (!subject) throw new NotFoundError("That subject is not active or could not be found.");
    try {
      await db.classSubject.create({ data: { classId: input.classId, subjectId: input.subjectId } });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError("This class already offers that subject.");
      throw error;
    }
    await audit(user, input.classId, { change: "subject_added", subjectId: input.subjectId });
    return { ok: true };
  },
});

export const removeClassSubject = defineAction({
  roles: ADMIN_ROLES,
  input: classSubjectInput,
  handler: async ({ user, input }) => {
    assertAllowed(canAssignTeachers(user));
    // Never remove a subject that already has results; it would orphan them.
    const hasResults = await db.subjectResultBatch.count({ where: { classId: input.classId, subjectId: input.subjectId } });
    if (hasResults > 0) throw new ConflictError("Results already exist for this subject in this class, so it cannot be removed.");
    const sessionId = await currentSessionOrFail();
    await db.$transaction([
      db.subjectAssignment.deleteMany({ where: { classId: input.classId, subjectId: input.subjectId, sessionId } }),
      db.classSubject.deleteMany({ where: { classId: input.classId, subjectId: input.subjectId } }),
    ]);
    await audit(user, input.classId, { change: "subject_removed", subjectId: input.subjectId });
    return { ok: true };
  },
});

// ─── Form Teacher ───

export const assignFormTeacher = defineAction({
  roles: ADMIN_ROLES,
  input: assignFormTeacherInput,
  handler: async ({ user, input }) => {
    assertAllowed(canAssignTeachers(user));
    const sessionId = await currentSessionOrFail();
    await activeClassOrFail(input.classId);
    await activeTeacherOrFail(input.teacherId);
    try {
      await db.$transaction([
        db.formTeacherAssignment.deleteMany({ where: { classId: input.classId, sessionId } }),
        db.formTeacherAssignment.create({ data: { classId: input.classId, teacherId: input.teacherId, sessionId } }),
      ]);
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError("This teacher is already the Form Teacher of another class this session.");
      throw error;
    }
    await audit(user, input.classId, { change: "form_teacher_set", teacherId: input.teacherId });
    return { ok: true };
  },
});

export const clearFormTeacher = defineAction({
  roles: ADMIN_ROLES,
  input: clearFormTeacherInput,
  handler: async ({ user, input }) => {
    assertAllowed(canAssignTeachers(user));
    const sessionId = await currentSessionOrFail();
    await db.formTeacherAssignment.deleteMany({ where: { classId: input.classId, sessionId } });
    await audit(user, input.classId, { change: "form_teacher_cleared" });
    return { ok: true };
  },
});

// ─── Subject Teacher ───

export const assignSubjectTeacher = defineAction({
  roles: ADMIN_ROLES,
  input: assignSubjectTeacherInput,
  handler: async ({ user, input }) => {
    assertAllowed(canAssignTeachers(user));
    const sessionId = await currentSessionOrFail();
    await activeTeacherOrFail(input.teacherId);
    const offered = await db.classSubject.findUnique({
      where: { classId_subjectId: { classId: input.classId, subjectId: input.subjectId } },
      select: { id: true },
    });
    if (!offered) throw new ConflictError("That subject is not offered by this class.");
    await db.subjectAssignment.upsert({
      where: { classId_subjectId_sessionId: { classId: input.classId, subjectId: input.subjectId, sessionId } },
      update: { teacherId: input.teacherId },
      create: { classId: input.classId, subjectId: input.subjectId, sessionId, teacherId: input.teacherId },
    });
    await audit(user, input.classId, { change: "subject_teacher_set", subjectId: input.subjectId, teacherId: input.teacherId });
    return { ok: true };
  },
});

export const clearSubjectTeacher = defineAction({
  roles: ADMIN_ROLES,
  input: clearSubjectTeacherInput,
  handler: async ({ user, input }) => {
    assertAllowed(canAssignTeachers(user));
    const sessionId = await currentSessionOrFail();
    await db.subjectAssignment.deleteMany({ where: { classId: input.classId, subjectId: input.subjectId, sessionId } });
    await audit(user, input.classId, { change: "subject_teacher_cleared", subjectId: input.subjectId });
    return { ok: true };
  },
});
