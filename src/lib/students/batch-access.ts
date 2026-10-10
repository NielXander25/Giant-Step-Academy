import { db } from "@/lib/db";
import type { SessionUser } from "@/lib/auth/session";
import { loadTeacherScope } from "@/lib/permissions/assignments";
import { EMPTY_SCOPE, canApproveStudentUpload, isAdminOrAbove, type TeacherScope } from "@/lib/permissions/policies";

/**
 * Loads an import batch only if this user may see it: the person who uploaded it,
 * an Admin, or the Form Teacher of the batch's class. Anyone else gets null (shown as "not found").
 */
export async function loadBatchForViewer(user: SessionUser, batchId: string) {
  const batch = await db.studentImportBatch.findUnique({
    where: { id: batchId },
    include: {
      class: { select: { name: true } },
      uploadedBy: { select: { name: true } },
      records: { orderBy: { rowNumber: "asc" } },
    },
  });
  if (!batch) return null;

  const scope: TeacherScope = user.role === "TEACHER" ? await loadTeacherScope(user.id) : EMPTY_SCOPE;
  const isUploader = batch.uploadedById === user.id;
  const canApprove = canApproveStudentUpload(user, scope, { classId: batch.classId, uploadedById: batch.uploadedById });

  if (!isUploader && !canApprove && !isAdminOrAbove(user)) return null;
  return { batch, isUploader, canApprove };
}
