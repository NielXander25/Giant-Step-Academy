"use server";

import { db } from "@/lib/db";
import { AuditAction, writeAudit } from "@/lib/audit";
import { hashPassword } from "@/lib/auth/password";
import { getIpHash } from "@/lib/request";
import { teacherRegistrationInput } from "@/lib/validators/people";

export type RegisterState =
  | { ok?: false; error?: string; fieldErrors?: Record<string, string[] | undefined> }
  | { ok: true }
  | undefined;

const MAX_REQUESTS_PER_IP_PER_HOUR = 5;

export async function registerTeacherAction(_prev: RegisterState, formData: FormData): Promise<RegisterState> {
  // Hidden field that real people never fill in. Bots usually do; they get a fake success.
  if (formData.get("website")) return { ok: true };

  const parsed = teacherRegistrationInput.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone") || undefined,
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return { error: "Please correct the highlighted fields.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const input = parsed.data;
  const ipHash = await getIpHash();

  if (ipHash) {
    const recent = await db.auditLog.count({
      where: { action: AuditAction.TEACHER_REQUESTED, ipHash, createdAt: { gte: new Date(Date.now() - 60 * 60_000) } },
    });
    if (recent >= MAX_REQUESTS_PER_IP_PER_HOUR) return { error: "Too many requests from this network. Please try again later." };
  }

  // Same answer whether or not the email is already known, so this form cannot be used to
  // discover which emails have accounts.
  const [existingUser, existingRequest] = await Promise.all([
    db.user.findUnique({ where: { email: input.email }, select: { id: true } }),
    db.teacherRequest.findFirst({ where: { email: input.email, status: "PENDING" }, select: { id: true } }),
  ]);
  if (existingUser || existingRequest) return { ok: true };

  const request = await db.teacherRequest.create({
    data: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone || null,
      passwordHash: await hashPassword(input.password),
    },
  });
  await writeAudit({
    action: AuditAction.TEACHER_REQUESTED, entityType: "TeacherRequest", entityId: request.id, ipHash,
  });
  return { ok: true };
}
