import type { Prisma, Role } from "@prisma/client";
import { db } from "@/lib/db";

/** Every auditable action in the system. Add new ones here so they stay consistent. */
export const AuditAction = {
  SETUP_COMPLETED: "SETUP_COMPLETED",
  LOGIN_SUCCEEDED: "LOGIN_SUCCEEDED",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGOUT: "LOGOUT",
  ADMIN_CREATED: "ADMIN_CREATED",
  ADMIN_DEACTIVATED: "ADMIN_DEACTIVATED",
  ADMIN_REACTIVATED: "ADMIN_REACTIVATED",
  ADMIN_PERMISSION_CHANGED: "ADMIN_PERMISSION_CHANGED",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  ACADEMIC_STRUCTURE_CHANGED: "ACADEMIC_STRUCTURE_CHANGED",
  SAMPLE_STRUCTURE_LOADED: "SAMPLE_STRUCTURE_LOADED",
  TEACHER_REQUESTED: "TEACHER_REQUESTED",
  TEACHER_APPROVED: "TEACHER_APPROVED",
  TEACHER_REJECTED: "TEACHER_REJECTED",
  TEACHER_DEACTIVATED: "TEACHER_DEACTIVATED",
  TEACHER_REACTIVATED: "TEACHER_REACTIVATED",
  TEACHER_ASSIGNMENT_CHANGED: "TEACHER_ASSIGNMENT_CHANGED",
  STUDENT_ADDED: "STUDENT_ADDED",
  STUDENT_IMPORTED: "STUDENT_IMPORTED",
  STUDENT_UPDATED: "STUDENT_UPDATED",
  STUDENT_REPEATER_CHANGED: "STUDENT_REPEATER_CHANGED",
  STUDENT_UPLOAD_SUBMITTED: "STUDENT_UPLOAD_SUBMITTED",
  STUDENT_UPLOAD_CANCELLED: "STUDENT_UPLOAD_CANCELLED",
  STUDENT_UPLOAD_APPROVED: "STUDENT_UPLOAD_APPROVED",
  STUDENT_UPLOAD_REJECTED: "STUDENT_UPLOAD_REJECTED",
  RESULT_CONFIG_CHANGED: "RESULT_CONFIG_CHANGED",
  RESULT_EDITED: "RESULT_EDITED",
  RESULT_SUBMITTED: "RESULT_SUBMITTED",
  RESULT_FORM_TEACHER_APPROVED: "RESULT_FORM_TEACHER_APPROVED",
  RESULT_REJECTED: "RESULT_REJECTED",
  RESULT_ADMIN_APPROVED: "RESULT_ADMIN_APPROVED",
  RESULT_PUBLISHED: "RESULT_PUBLISHED",
  PIN_GENERATED: "PIN_GENERATED",
  PIN_ENABLED: "PIN_ENABLED",
  PIN_DISABLED: "PIN_DISABLED",
  PIN_EXHAUSTED: "PIN_EXHAUSTED",
  PIN_EXPIRED: "PIN_EXPIRED",
  RESULT_ACCESSED: "RESULT_ACCESSED",
} as const;

export type AuditActionName = (typeof AuditAction)[keyof typeof AuditAction];

export type AuditEntry = {
  actorId?: string | null;
  actorRole?: Role | null;
  action: AuditActionName;
  entityType?: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
  ipHash?: string | null;
};

/**
 * Records an audit entry. An audit failure must never break the action being audited,
 * so errors are logged and swallowed.
 */
export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.auditLog.create({
      data: {
        actorId: entry.actorId ?? null,
        actorRole: entry.actorRole ?? null,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        metadata: entry.metadata,
        ipHash: entry.ipHash ?? null,
      },
    });
  } catch (error) {
    console.error("Audit log write failed", error);
  }
}
