"use server";

import { db } from "@/lib/db";
import { AuditAction, writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { getIpHash } from "@/lib/request";
import { passwordResetRequestInput } from "@/lib/validators/people";

export type ResetState =
  | { ok?: false; error?: string; fieldErrors?: Record<string, string[] | undefined> }
  | { ok: true }
  | undefined;

const MAX_PER_NETWORK_PER_HOUR = 10;

/**
 * A teacher who forgot their password chooses a new one; it starts working once an Admin approves the request.
 * The answer is the same whether or not the email has an account, so the form cannot be used to find out who has one.
 */
export async function requestPasswordResetAction(_prev: ResetState, formData: FormData): Promise<ResetState> {
  if (formData.get("website")) return { ok: true }; // spam trap

  const parsed = passwordResetRequestInput.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { error: "Please correct the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };

  const ipHash = await getIpHash();
  if (ipHash) {
    const recent = await db.auditLog.count({ where: { action: AuditAction.PASSWORD_RESET_REQUESTED, ipHash, createdAt: { gte: new Date(Date.now() - 60 * 60_000) } } });
    if (recent >= MAX_PER_NETWORK_PER_HOUR) return { error: "Too many requests from this network. Please try again later." };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, role: true, status: true } });
  if (user && user.role === "TEACHER" && user.status === "ACTIVE") {
    const passwordHash = await hashPassword(parsed.data.password);
    await db.$transaction([
      // Only the newest request counts: an older one waiting for review is dropped.
      db.passwordResetRequest.updateMany({ where: { userId: user.id, status: "PENDING" }, data: { status: "REJECTED", reviewedAt: new Date() } }),
      db.passwordResetRequest.create({ data: { userId: user.id, passwordHash } }),
    ]);
  }
  await writeAudit({ action: AuditAction.PASSWORD_RESET_REQUESTED, entityType: "User", entityId: user?.id, ipHash });
  return { ok: true };
}
