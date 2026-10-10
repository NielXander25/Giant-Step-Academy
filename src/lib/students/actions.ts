"use server";

import { db } from "@/lib/db";
import { defineAction } from "@/lib/action";
import { AuditAction, writeAudit } from "@/lib/audit";
import { ConflictError, ForbiddenError, NotFoundError } from "@/lib/errors";
import { getCurrentSessionId, loadTeacherScope } from "@/lib/permissions/assignments";
import {
  EMPTY_SCOPE, assertAllowed, canApproveStudentUpload, canManageClassStudents, isAdminOrAbove, studentUploadRule,
} from "@/lib/permissions/policies";
import { ALL_STAFF_ROLES, ADMIN_ROLES } from "@/lib/permissions/roles";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { normalizeName } from "@/lib/utils";
import { addStudentInput, batchIdInput, rejectBatchInput, setRepeaterInput, updateStudentInput } from "@/lib/validators/student";
import { commitBatch } from "./import-commit";
import type { RecordAction } from "./import-validate";

type Actor = { id: string; role: "SUPER_ADMIN" | "ADMIN" | "TEACHER" };
const scopeFor = (user: Actor) => (user.role === "TEACHER" ? loadTeacherScope(user.id) : Promise.resolve(EMPTY_SCOPE));
const audit = (user: Actor, action: (typeof AuditAction)[keyof typeof AuditAction], entityType: string, entityId: string, metadata?: Record<string, string | number | boolean | null>) =>
  writeAudit({ actorId: user.id, actorRole: user.role, action, entityType, entityId, metadata });

async function currentSessionOrFail() {
  const id = await getCurrentSessionId();
  if (!id) throw new ConflictError("Set a current academic session first.");
  return id;
}

// ─── Single students ───

export const addStudent = defineAction({
  roles: ALL_STAFF_ROLES,
  input: addStudentInput,
  handler: async ({ user, input }) => {
    const scope = await scopeFor(user);
    assertAllowed(canManageClassStudents(user, scope, input.classId), "You can only add students to your own class.");
    const sessionId = await currentSessionOrFail();
    const cls = await db.schoolClass.findFirst({ where: { id: input.classId, isActive: true }, select: { id: true } });
    if (!cls) throw new NotFoundError("That class is not active or could not be found.");

    try {
      const student = await db.student.create({
        data: {
          admissionNumber: input.admissionNumber,
          fullName: input.fullName,
          normalizedName: normalizeName(input.fullName),
          gender: input.gender,
          dateOfBirth: input.dateOfBirth,
          createdById: user.id,
          enrollments: { create: { sessionId, classId: input.classId } },
        },
        select: { id: true },
      });
      await audit(user, AuditAction.STUDENT_ADDED, "Student", student.id, { classId: input.classId });
      return { id: student.id };
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError("A student with that admission number already exists.");
      throw error;
    }
  },
});

export const updateStudent = defineAction({
  roles: ALL_STAFF_ROLES,
  input: updateStudentInput,
  handler: async ({ user, input }) => {
    const sessionId = await currentSessionOrFail();
    const student = await db.student.findUnique({
      where: { id: input.studentId },
      select: { id: true, enrollments: { where: { sessionId }, select: { classId: true } } },
    });
    if (!student) throw new NotFoundError("That student could not be found.");

    const admin = isAdminOrAbove(user);
    if (!admin) {
      // A Form Teacher may edit students in their own class. Admission number and status are Admin-only.
      const scope = await scopeFor(user);
      const classId = student.enrollments[0]?.classId;
      assertAllowed(classId !== undefined && canManageClassStudents(user, scope, classId), "You can only edit students in your own class.");
      if (input.admissionNumber !== undefined || input.status !== undefined) throw new ForbiddenError();
    }

    try {
      await db.student.update({
        where: { id: student.id },
        data: {
          fullName: input.fullName,
          normalizedName: normalizeName(input.fullName),
          gender: input.gender,
          dateOfBirth: input.dateOfBirth,
          ...(input.admissionNumber !== undefined ? { admissionNumber: input.admissionNumber } : {}),
          ...(input.status !== undefined ? { status: input.status } : {}),
        },
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError("Another student already has that admission number.");
      throw error;
    }
    await audit(user, AuditAction.STUDENT_UPDATED, "Student", student.id);
    return { id: student.id };
  },
});

export const setRepeater = defineAction({
  roles: ADMIN_ROLES,
  input: setRepeaterInput,
  handler: async ({ user, input }) => {
    const sessionId = await currentSessionOrFail();
    const { count } = await db.enrollment.updateMany({
      where: { id: input.enrollmentId, sessionId },
      data: { isRepeater: input.isRepeater },
    });
    if (count !== 1) throw new NotFoundError("That enrollment could not be found in the current session.");
    await audit(user, AuditAction.STUDENT_REPEATER_CHANGED, "Enrollment", input.enrollmentId, { isRepeater: input.isRepeater });
    return { id: input.enrollmentId };
  },
});

// ─── Spreadsheet import batches ───

async function ownBatch(userId: string, batchId: string) {
  const batch = await db.studentImportBatch.findFirst({ where: { id: batchId, uploadedById: userId } });
  if (!batch) throw new NotFoundError("That upload could not be found.");
  return batch;
}

export const submitBatch = defineAction({
  roles: ALL_STAFF_ROLES,
  input: batchIdInput,
  handler: async ({ user, input }) => {
    const batch = await ownBatch(user.id, input.batchId);
    if (batch.status !== "DRAFT") throw new ConflictError("This upload has already been submitted.");

    const importable = (await db.studentImportRecord.findMany({ where: { batchId: batch.id, status: { in: ["NEW", "EXISTING"] } }, select: { data: true } }))
      .filter((r) => ["CREATE", "ENROLL"].includes((r.data as { action?: RecordAction }).action ?? "SKIP")).length;
    if (importable === 0) throw new ConflictError("There is nothing to import: every row is invalid, repeated or already in the class.");

    // Re-check the rule now; assignments may have changed since the file was uploaded.
    const rule = studentUploadRule(user, await scopeFor(user), batch.classId);
    if (rule === "DENIED") throw new ForbiddenError("You can no longer upload students into that class.");

    if (rule === "DIRECT") {
      const result = await commitBatch({ batchId: batch.id, expectedStatus: "DRAFT" });
      await audit(user, AuditAction.STUDENT_IMPORTED, "StudentImportBatch", batch.id, { ...result, classId: batch.classId });
      return { status: "COMMITTED" as const, ...result };
    }

    const moved = await db.studentImportBatch.updateMany({ where: { id: batch.id, status: "DRAFT" }, data: { status: "PENDING_APPROVAL", requiresApproval: true } });
    if (moved.count !== 1) throw new ConflictError("This upload has already been submitted.");
    await audit(user, AuditAction.STUDENT_UPLOAD_SUBMITTED, "StudentImportBatch", batch.id, { classId: batch.classId });
    return { status: "PENDING_APPROVAL" as const, created: 0, enrolled: 0, skipped: 0 };
  },
});

export const cancelBatch = defineAction({
  roles: ALL_STAFF_ROLES,
  input: batchIdInput,
  handler: async ({ user, input }) => {
    const batch = await ownBatch(user.id, input.batchId);
    const moved = await db.studentImportBatch.updateMany({
      where: { id: batch.id, status: { in: ["DRAFT", "PENDING_APPROVAL"] } },
      data: { status: "CANCELLED" },
    });
    if (moved.count !== 1) throw new ConflictError("This upload can no longer be cancelled.");
    await audit(user, AuditAction.STUDENT_UPLOAD_CANCELLED, "StudentImportBatch", batch.id);
    return { id: batch.id };
  },
});

async function batchToReview(user: Actor & { canCreateAdmins?: boolean }, batchId: string) {
  const batch = await db.studentImportBatch.findUnique({ where: { id: batchId } });
  if (!batch) throw new NotFoundError("That upload could not be found.");
  const scope = await scopeFor(user);
  assertAllowed(canApproveStudentUpload(user, scope, { classId: batch.classId, uploadedById: batch.uploadedById }), "You cannot review this upload.");
  if (batch.status !== "PENDING_APPROVAL") throw new ConflictError("This upload is not waiting for approval.");
  return batch;
}

export const approveBatch = defineAction({
  roles: ALL_STAFF_ROLES,
  input: batchIdInput,
  handler: async ({ user, input }) => {
    const batch = await batchToReview(user, input.batchId);
    const result = await commitBatch({ batchId: batch.id, expectedStatus: "PENDING_APPROVAL", reviewerId: user.id });
    await audit(user, AuditAction.STUDENT_UPLOAD_APPROVED, "StudentImportBatch", batch.id, { classId: batch.classId });
    await audit(user, AuditAction.STUDENT_IMPORTED, "StudentImportBatch", batch.id, { ...result, classId: batch.classId });
    return result;
  },
});

export const rejectBatch = defineAction({
  roles: ALL_STAFF_ROLES,
  input: rejectBatchInput,
  handler: async ({ user, input }) => {
    const batch = await batchToReview(user, input.batchId);
    const moved = await db.studentImportBatch.updateMany({
      where: { id: batch.id, status: "PENDING_APPROVAL" },
      data: { status: "REJECTED", reviewedById: user.id, reviewedAt: new Date(), reviewNote: input.reason },
    });
    if (moved.count !== 1) throw new ConflictError("This upload is not waiting for approval.");
    await audit(user, AuditAction.STUDENT_UPLOAD_REJECTED, "StudentImportBatch", batch.id, { classId: batch.classId });
    return { id: batch.id };
  },
});
