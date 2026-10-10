import { db } from "@/lib/db";
import { ConflictError } from "@/lib/errors";
import { isUniqueViolation } from "@/lib/prisma-errors";
import { normalizeName } from "@/lib/utils";
import { normalizeAdmissionNumber } from "./normalize";
import type { RecordAction } from "./import-validate";

export type CommitResult = { created: number; enrolled: number; skipped: number };

type StoredData = { admissionNumber: string; fullName: string; gender: "MALE" | "FEMALE" | null; dateOfBirth: string | null; action: RecordAction };

/**
 * Writes a reviewed batch into the real tables, all-or-nothing.
 *
 * The preview may be minutes or days old, so every row is checked again against the database
 * at this moment. Rows that no longer fit are skipped and marked, never forced in.
 */
export async function commitBatch(args: {
  batchId: string;
  expectedStatus: "DRAFT" | "PENDING_APPROVAL";
  reviewerId?: string;
}): Promise<CommitResult> {
  try {
    return await db.$transaction(
      async (tx) => {
        // Claiming the batch first means a double click or two reviewers cannot import it twice.
        const claimed = await tx.studentImportBatch.updateMany({
          where: { id: args.batchId, status: args.expectedStatus },
          data: {
            status: "COMMITTED",
            committedAt: new Date(),
            ...(args.reviewerId ? { reviewedById: args.reviewerId, reviewedAt: new Date() } : {}),
          },
        });
        if (claimed.count !== 1) throw new ConflictError("This upload has already been processed.");

        const batch = await tx.studentImportBatch.findUniqueOrThrow({
          where: { id: args.batchId },
          select: { classId: true, sessionId: true, uploadedById: true, class: { select: { isActive: true } } },
        });
        if (!batch.class.isActive) throw new ConflictError("That class is no longer active.");

        const records = await tx.studentImportRecord.findMany({ where: { batchId: args.batchId, status: { in: ["NEW", "EXISTING"] } } });
        const rows = records
          .map((r) => ({ id: r.id, data: r.data as unknown as StoredData }))
          .filter((r) => r.data.action === "CREATE" || r.data.action === "ENROLL");

        const numbers = rows.map((r) => normalizeAdmissionNumber(r.data.admissionNumber));
        const found = await tx.student.findMany({
          where: { admissionNumber: { in: numbers } },
          select: { id: true, admissionNumber: true, normalizedName: true, enrollments: { where: { sessionId: batch.sessionId }, select: { id: true } } },
        });
        const byNumber = new Map(found.map((s) => [s.admissionNumber, s]));

        const toCreate: StoredData[] = [];
        const toEnroll: string[] = [];
        const skipped: { id: string; reason: string }[] = [];

        for (const row of rows) {
          const existing = byNumber.get(normalizeAdmissionNumber(row.data.admissionNumber));
          if (!existing) toCreate.push(row.data);
          else if (existing.normalizedName !== normalizeName(row.data.fullName)) {
            skipped.push({ id: row.id, reason: "Skipped: this admission number now belongs to a different student." });
          } else if (existing.enrollments.length > 0) {
            skipped.push({ id: row.id, reason: "Skipped: the student is already enrolled this session." });
          } else toEnroll.push(existing.id);
        }

        const created = toCreate.length
          ? await tx.student.createManyAndReturn({
              data: toCreate.map((d) => ({
                admissionNumber: d.admissionNumber,
                fullName: d.fullName,
                normalizedName: normalizeName(d.fullName),
                gender: d.gender,
                dateOfBirth: d.dateOfBirth ? new Date(`${d.dateOfBirth}T00:00:00Z`) : null,
                createdById: batch.uploadedById,
              })),
              select: { id: true },
            })
          : [];

        const studentIds = [...created.map((c) => c.id), ...toEnroll];
        if (studentIds.length) {
          await tx.enrollment.createMany({
            data: studentIds.map((studentId) => ({ studentId, sessionId: batch.sessionId, classId: batch.classId })),
          });
        }

        for (const s of skipped) {
          await tx.studentImportRecord.update({ where: { id: s.id }, data: { status: "INVALID", errors: [s.reason] } });
        }

        return { created: created.length, enrolled: toEnroll.length, skipped: skipped.length };
      },
      { timeout: 30_000, maxWait: 10_000 },
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new ConflictError("Some students were added by someone else while you were importing. Please upload the file again.");
    }
    throw error;
  }
}
