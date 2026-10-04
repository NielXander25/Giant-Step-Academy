"use server";

import { db } from "@/lib/db";
import { defineAction } from "@/lib/action";
import { AuditAction, writeAudit } from "@/lib/audit";
import { sendEmail } from "@/lib/email";
import { ConflictError, NotFoundError } from "@/lib/errors";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { assertAllowed, canReviewTeacherRequests } from "@/lib/permissions/policies";
import { approveRequestInput, rejectRequestInput } from "@/lib/validators/people";

const ALREADY_REVIEWED = "This request has already been reviewed.";

export const approveRequest = defineAction({
  roles: ADMIN_ROLES,
  input: approveRequestInput,
  handler: async ({ user, input }) => {
    assertAllowed(canReviewTeacherRequests(user));
    const request = await db.teacherRequest.findUnique({ where: { id: input.requestId } });
    if (!request) throw new NotFoundError("That request could not be found.");
    if (request.status !== "PENDING") throw new ConflictError(ALREADY_REVIEWED);

    const email = request.email.trim().toLowerCase();
    if (await db.user.findUnique({ where: { email }, select: { id: true } })) {
      throw new ConflictError("An account with this email already exists.");
    }

    try {
      const teacher = await db.$transaction(async (tx) => {
        // Claiming the request first means two admins clicking at once cannot both approve it.
        const claimed = await tx.teacherRequest.updateMany({
          where: { id: request.id, status: "PENDING" },
          data: { status: "APPROVED", reviewedById: user.id, reviewedAt: new Date() },
        });
        if (claimed.count !== 1) throw new ConflictError(ALREADY_REVIEWED);

        const created = await tx.user.create({
          data: {
            email,
            name: request.fullName,
            passwordHash: request.passwordHash,
            role: "TEACHER",
            createdById: user.id,
            teacherProfile: { create: { phone: request.phone } },
          },
          select: { id: true },
        });
        await tx.teacherRequest.update({ where: { id: request.id }, data: { userId: created.id } });
        return created;
      });

      await writeAudit({
        actorId: user.id, actorRole: user.role, action: AuditAction.TEACHER_APPROVED,
        entityType: "User", entityId: teacher.id, metadata: { requestId: request.id },
      });
      await sendEmail({
        to: email,
        subject: "Your Giant Step Academy account is ready",
        text: `Hello ${request.fullName},\n\nYour staff account request has been approved. You can now sign in with the email and password you chose.\n\nGiant Step Academy`,
      });
      return { id: teacher.id };
    } catch (error) {
      if (isUniqueViolation(error)) throw new ConflictError("An account with this email already exists.");
      throw error;
    }
  },
});

export const rejectRequest = defineAction({
  roles: ADMIN_ROLES,
  input: rejectRequestInput,
  handler: async ({ user, input }) => {
    assertAllowed(canReviewTeacherRequests(user));
    const request = await db.teacherRequest.findUnique({ where: { id: input.requestId } });
    if (!request) throw new NotFoundError("That request could not be found.");

    const claimed = await db.teacherRequest.updateMany({
      where: { id: request.id, status: "PENDING" },
      data: { status: "REJECTED", reviewedById: user.id, reviewedAt: new Date(), rejectionReason: input.reason },
    });
    if (claimed.count !== 1) throw new ConflictError(ALREADY_REVIEWED);

    await writeAudit({
      actorId: user.id, actorRole: user.role, action: AuditAction.TEACHER_REJECTED,
      entityType: "TeacherRequest", entityId: request.id,
    });
    await sendEmail({
      to: request.email,
      subject: "Your Giant Step Academy account request",
      text: `Hello ${request.fullName},\n\nYour staff account request could not be approved.\nReason: ${input.reason}\n\nPlease contact the school office if you believe this is a mistake.\n\nGiant Step Academy`,
    });
    return { id: request.id };
  },
});
