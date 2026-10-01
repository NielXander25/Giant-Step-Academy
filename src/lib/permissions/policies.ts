import type { Role } from "@prisma/client";
import { ForbiddenError } from "@/lib/errors";

/**
 * Every "who may do what" rule lives here as a small pure function, so the rules are
 * easy to read and easy to test. Server actions must call these — hiding a button in
 * the UI is never enough.
 */

export type Actor = { id: string; role: Role; canCreateAdmins?: boolean };

/** What a teacher is assigned to in the current academic session. */
export type TeacherScope = {
  /** Classes where this teacher is the Form Teacher. */
  formClassIds: string[];
  /** Subject + class pairs this teacher teaches. */
  subjectAssignments: { classId: string; subjectId: string }[];
};

export const EMPTY_SCOPE: TeacherScope = { formClassIds: [], subjectAssignments: [] };

export type StudentUploadRule = "DIRECT" | "NEEDS_FORM_TEACHER_APPROVAL" | "DENIED";

// ─── Role-level rules ───

export const isAdminOrAbove = (a: Actor) => a.role === "ADMIN" || a.role === "SUPER_ADMIN";
export const isTeacher = (a: Actor) => a.role === "TEACHER";

/** Super Admin always; an Admin only if the Super Admin explicitly granted the capability. */
export const canCreateAdmin = (a: Actor) =>
  a.role === "SUPER_ADMIN" || (a.role === "ADMIN" && a.canCreateAdmins === true);
export const canManageAdmins = (a: Actor) => a.role === "SUPER_ADMIN";
export const canViewAuditLogs = (a: Actor) => a.role === "SUPER_ADMIN";

export const canReviewTeacherRequests = isAdminOrAbove;
export const canManageTeachers = isAdminOrAbove;
export const canAssignTeachers = isAdminOrAbove;
export const canManageAcademicStructure = isAdminOrAbove;
export const canManageWebsiteContent = isAdminOrAbove;
export const canViewAccessLogs = isAdminOrAbove;
export const canManagePins = isAdminOrAbove;
/** Only Admin / Super Admin publish. Teachers and Form Teachers never can. */
export const canPublishResults = isAdminOrAbove;

// ─── Assignment-level rules ───

export const isFormTeacherOf = (scope: TeacherScope, classId: string) => scope.formClassIds.includes(classId);

export const teachesSubjectInClass = (scope: TeacherScope, classId: string, subjectId: string) =>
  scope.subjectAssignments.some((s) => s.classId === classId && s.subjectId === subjectId);

export const teachesAnythingInClass = (scope: TeacherScope, classId: string) =>
  scope.subjectAssignments.some((s) => s.classId === classId);

export function canViewClass(a: Actor, scope: TeacherScope, classId: string) {
  if (isAdminOrAbove(a)) return true;
  return isTeacher(a) && (isFormTeacherOf(scope, classId) || teachesAnythingInClass(scope, classId));
}

/**
 * A Form Teacher may enter any subject in their own class (and only their own class).
 * A Subject Teacher may enter only the exact subject + class pairs assigned to them.
 */
export function canEnterScores(a: Actor, scope: TeacherScope, target: { classId: string; subjectId: string }) {
  if (!isTeacher(a)) return false;
  return isFormTeacherOf(scope, target.classId) || teachesSubjectInClass(scope, target.classId, target.subjectId);
}

/** A Form Teacher reviews subject-teacher submissions for their own class, never their own work. */
export function canFormTeacherReview(
  a: Actor,
  scope: TeacherScope,
  batch: { classId: string; submittedById: string | null },
) {
  return isTeacher(a) && isFormTeacherOf(scope, batch.classId) && batch.submittedById !== a.id;
}

/** Final approval belongs to Admins, and nobody approves their own submission. */
export function canAdminReview(a: Actor, submission: { submittedById: string | null }) {
  return isAdminOrAbove(a) && submission.submittedById !== a.id;
}

export function canManageClassStudents(a: Actor, scope: TeacherScope, classId: string) {
  if (isAdminOrAbove(a)) return true;
  return isTeacher(a) && isFormTeacherOf(scope, classId);
}

/**
 * How a student upload into a class is handled:
 * Admin or the class's Form Teacher -> DIRECT; a teacher of a subject in that class -> needs the
 * Form Teacher's approval; anyone else -> DENIED.
 */
export function studentUploadRule(a: Actor, scope: TeacherScope, classId: string): StudentUploadRule {
  if (isAdminOrAbove(a)) return "DIRECT";
  if (!isTeacher(a)) return "DENIED";
  if (isFormTeacherOf(scope, classId)) return "DIRECT";
  if (teachesAnythingInClass(scope, classId)) return "NEEDS_FORM_TEACHER_APPROVAL";
  return "DENIED";
}

/**
 * The class's Form Teacher approves uploads from other teachers (never their own).
 * An Admin may also approve, so a class with no Form Teacher yet cannot get stuck.
 */
export function canApproveStudentUpload(
  a: Actor,
  scope: TeacherScope,
  batch: { classId: string; uploadedById: string },
) {
  if (batch.uploadedById === a.id) return false;
  if (isAdminOrAbove(a)) return true;
  return isTeacher(a) && isFormTeacherOf(scope, batch.classId);
}

// ─── Enforcement helper ───

/** Throws a ForbiddenError unless the check passed. Use at the top of every server action. */
export function assertAllowed(allowed: boolean, message?: string): asserts allowed {
  if (!allowed) throw new ForbiddenError(message);
}
