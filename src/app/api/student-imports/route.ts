import { NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/session";
import { getCurrentSessionId, loadTeacherScope } from "@/lib/permissions/assignments";
import { EMPTY_SCOPE, studentUploadRule } from "@/lib/permissions/policies";
import { MAX_BYTES, parseStudentWorkbook } from "@/lib/students/import-parse";
import { summarize, validateRows, type ExistingStudent } from "@/lib/students/import-validate";
import { normalizeAdmissionNumber } from "@/lib/students/normalize";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const fail = (error: string, status = 400) => NextResponse.json({ ok: false, error }, { status });

/**
 * Step 1 of an import: read the spreadsheet, check every row, and save the result as a DRAFT batch
 * for the user to review. Nothing touches the real student tables yet.
 */
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return fail("Please sign in again.", 401);
  if (user.mustChangePassword) return fail("Please change your temporary password first.", 403);

  const form = await request.formData().catch(() => null);
  const classId = z.string().uuid().safeParse(form?.get("classId"));
  const file = form?.get("file");
  if (!form || !classId.success) return fail("Choose a class for these students.");
  if (!(file instanceof File)) return fail("Choose a spreadsheet to upload.");
  if (!file.name.toLowerCase().endsWith(".xlsx")) return fail("Please upload the .xlsx template (not CSV or PDF).");
  if (file.size === 0) return fail("That file is empty.");
  if (file.size > MAX_BYTES) return fail("That file is larger than 2 MB.");

  const sessionId = await getCurrentSessionId();
  if (!sessionId) return fail("An Admin must set a current academic session first.", 409);

  // Server-side check: the browser's class choice is never trusted.
  const scope = user.role === "TEACHER" ? await loadTeacherScope(user.id) : EMPTY_SCOPE;
  const rule = studentUploadRule(user, scope, classId.data);
  if (rule === "DENIED") return fail("You cannot upload students into that class.", 403);
  const cls = await db.schoolClass.findFirst({ where: { id: classId.data, isActive: true }, select: { id: true } });
  if (!cls) return fail("That class is not active.", 404);

  const parsed = await parseStudentWorkbook(Buffer.from(await file.arrayBuffer()));
  if (!parsed.ok) return fail(parsed.error);

  const numbers = [...new Set(parsed.rows.map((r) => normalizeAdmissionNumber(String(r.admissionNumber ?? ""))).filter(Boolean))];
  const found = await db.student.findMany({
    where: { admissionNumber: { in: numbers } },
    select: { id: true, admissionNumber: true, normalizedName: true, enrollments: { where: { sessionId }, select: { classId: true } } },
  });
  const existing = new Map<string, ExistingStudent>(
    found.map((s) => [s.admissionNumber, { id: s.id, normalizedName: s.normalizedName, enrolledClassId: s.enrollments[0]?.classId ?? null }]),
  );

  const records = validateRows(parsed.rows, { classId: classId.data, existing });
  const counts = summarize(records);

  const batch = await db.studentImportBatch.create({
    data: {
      uploadedById: user.id,
      classId: classId.data,
      sessionId,
      fileName: file.name.slice(0, 120),
      status: "DRAFT",
      requiresApproval: rule !== "DIRECT",
      totalRows: counts.totalRows,
      newCount: counts.newCount,
      existingCount: counts.existingCount,
      duplicateCount: counts.duplicateCount,
      invalidCount: counts.invalidCount,
      records: {
        create: records.map((r) => ({
          rowNumber: r.rowNumber,
          status: r.status,
          data: r.data as unknown as Prisma.InputJsonValue,
          errors: r.errors as unknown as Prisma.InputJsonValue,
          matchedStudentId: r.matchedStudentId,
        })),
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, batchId: batch.id });
}
