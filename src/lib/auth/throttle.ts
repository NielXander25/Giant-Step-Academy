import { db } from "@/lib/db";
import { AuditAction } from "@/lib/audit";

// Staff sign-in brute-force protection. Failed attempts are recorded in the audit log,
// so no extra table or service is needed.
export const MAX_FAILURES_PER_EMAIL = 5;
export const MAX_FAILURES_PER_IP = 20;
export const LOCKOUT_WINDOW_MINUTES = 15;

export const LOGIN_ATTEMPT_ENTITY = "LoginAttempt";

export async function isLockedOut(email: string, ipHash: string | null): Promise<boolean> {
  const windowStart = new Date(Date.now() - LOCKOUT_WINDOW_MINUTES * 60_000);

  // A successful sign-in clears earlier failures for that email.
  const lastSuccess = await db.auditLog.findFirst({
    where: {
      action: AuditAction.LOGIN_SUCCEEDED,
      entityType: LOGIN_ATTEMPT_ENTITY,
      entityId: email,
      createdAt: { gte: windowStart },
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  const since = lastSuccess ? lastSuccess.createdAt : windowStart;

  const [emailFailures, ipFailures] = await Promise.all([
    db.auditLog.count({
      where: {
        action: AuditAction.LOGIN_FAILED,
        entityType: LOGIN_ATTEMPT_ENTITY,
        entityId: email,
        createdAt: { gt: since },
      },
    }),
    ipHash
      ? db.auditLog.count({
          where: { action: AuditAction.LOGIN_FAILED, ipHash, createdAt: { gte: windowStart } },
        })
      : Promise.resolve(0),
  ]);

  return emailFailures >= MAX_FAILURES_PER_EMAIL || ipFailures >= MAX_FAILURES_PER_IP;
}
