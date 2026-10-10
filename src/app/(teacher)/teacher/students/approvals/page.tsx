import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireRole } from "@/lib/auth/session";
import { loadTeacherScope } from "@/lib/permissions/assignments";

export const metadata: Metadata = { title: "Uploads and approvals" };

const LABEL: Record<string, { text: string; variant: "success" | "accent" | "destructive" | "outline" }> = {
  DRAFT: { text: "Not submitted", variant: "outline" },
  PENDING_APPROVAL: { text: "Waiting for approval", variant: "accent" },
  COMMITTED: { text: "Imported", variant: "success" },
  APPROVED: { text: "Approved", variant: "success" },
  REJECTED: { text: "Rejected", variant: "destructive" },
  CANCELLED: { text: "Cancelled", variant: "outline" },
};

export default async function ApprovalsPage() {
  const user = await requireRole("TEACHER");
  const scope = await loadTeacherScope(user.id);

  const [toReview, mine] = await Promise.all([
    scope.formClassIds.length
      ? db.studentImportBatch.findMany({
          where: { classId: { in: scope.formClassIds }, status: "PENDING_APPROVAL", uploadedById: { not: user.id } },
          orderBy: { createdAt: "asc" },
          include: { class: { select: { name: true } }, uploadedBy: { select: { name: true } } },
        })
      : Promise.resolve([]),
    db.studentImportBatch.findMany({
      where: { uploadedById: user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
      include: { class: { select: { name: true } } },
    }),
  ]);

  return (
    <>
      <PageHeader title="Uploads and approvals" description="Student uploads from other teachers wait here for you if you are the class's Form Teacher." />

      {scope.formClassIds.length > 0 && (
        <>
          <h2 className="mb-3 text-xl text-navy">Waiting for your approval ({toReview.length})</h2>
          {toReview.length === 0 ? (
            <EmptyState title="Nothing waiting">Uploads from other teachers appear here.</EmptyState>
          ) : (
            <Card className="mb-10">
              <CardContent className="p-2 sm:p-4">
                <Table>
                  <THead><TR><TH>Class</TH><TH>Uploaded by</TH><TH>File</TH><TH>Rows</TH><TH>When</TH><TH><span className="sr-only">Open</span></TH></TR></THead>
                  <TBody>
                    {toReview.map((b) => (
                      <TR key={b.id}>
                        <TD className="font-medium">{b.class.name}</TD>
                        <TD>{b.uploadedBy.name}</TD>
                        <TD>{b.fileName}</TD>
                        <TD>{b.newCount + b.existingCount} valid of {b.totalRows}</TD>
                        <TD>{formatDateTime(b.createdAt)}</TD>
                        <TD className="text-right"><Link href={`/teacher/students/import/review?batch=${b.id}`} className="text-primary underline underline-offset-4">Review</Link></TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <h2 className="mb-3 text-xl text-navy">My uploads</h2>
      {mine.length === 0 ? (
        <EmptyState title="No uploads yet">Use "Import from spreadsheet" on the My students page.</EmptyState>
      ) : (
        <Card>
          <CardContent className="p-2 sm:p-4">
            <Table>
              <THead><TR><TH>Class</TH><TH>File</TH><TH>Status</TH><TH>When</TH><TH><span className="sr-only">Open</span></TH></TR></THead>
              <TBody>
                {mine.map((b) => (
                  <TR key={b.id}>
                    <TD className="font-medium">{b.class.name}</TD>
                    <TD>{b.fileName}</TD>
                    <TD><Badge variant={LABEL[b.status].variant}>{LABEL[b.status].text}</Badge></TD>
                    <TD>{formatDateTime(b.createdAt)}</TD>
                    <TD className="text-right"><Link href={`/teacher/students/import/review?batch=${b.id}`} className="text-primary underline underline-offset-4">Open</Link></TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
