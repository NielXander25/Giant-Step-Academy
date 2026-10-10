import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ImportUploader } from "@/components/students/import-uploader";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { getCurrentSessionId } from "@/lib/permissions/assignments";
import { ADMIN_ROLES } from "@/lib/permissions/roles";

export const metadata: Metadata = { title: "Import students" };

export default async function AdminImportPage() {
  await requireRole(...ADMIN_ROLES);
  const sessionId = await getCurrentSessionId();
  const classes = sessionId
    ? await db.schoolClass.findMany({ where: { isActive: true }, orderBy: [{ level: { sortOrder: "asc" } }, { arm: "asc" }], select: { id: true, name: true } })
    : [];

  return (
    <>
      <PageHeader title="Import students" description="Download the template, fill it in, upload it, and check the preview. Nothing is saved until you confirm." />
      {classes.length === 0 ? (
        <EmptyState title="Nothing to import into">{sessionId ? "Add classes first." : "Set a current academic session first."}</EmptyState>
      ) : (
        <Card><CardContent className="pt-6"><ImportUploader classes={classes.map((c) => ({ ...c, needsApproval: false }))} reviewPath="/admin/students/import/review" /></CardContent></Card>
      )}
    </>
  );
}
