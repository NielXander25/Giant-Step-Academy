import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { RequestActions } from "./request-actions";

export const metadata: Metadata = { title: "Teacher requests" };

export default async function TeacherRequestsPage() {
  await requireRole(...ADMIN_ROLES);
  const [pending, reviewed] = await Promise.all([
    db.teacherRequest.findMany({ where: { status: "PENDING" }, orderBy: { createdAt: "asc" } }),
    db.teacherRequest.findMany({ where: { status: { not: "PENDING" } }, orderBy: { reviewedAt: "desc" }, take: 25 }),
  ]);

  return (
    <>
      <PageHeader
        title="Teacher requests"
        description="Teachers ask for an account on the public registration page. Nobody can sign in until a request is approved."
      />
      <h2 className="mb-3 text-xl text-navy">Waiting for review ({pending.length})</h2>
      {pending.length === 0 ? (
        <EmptyState title="No pending requests">New requests appear here as soon as a teacher submits the form.</EmptyState>
      ) : (
        <div className="flex flex-col gap-4">
          {pending.map((r) => (
            <Card key={r.id}>
              <CardHeader className="gap-1">
                <CardTitle>{r.fullName}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {r.email}
                  {r.phone ? ` · ${r.phone}` : ""} · requested {formatDateTime(r.createdAt)}
                </p>
              </CardHeader>
              <CardContent>
                <RequestActions requestId={r.id} name={r.fullName} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {reviewed.length > 0 && (
        <>
          <h2 className="mb-3 mt-10 text-xl text-navy">Recently reviewed</h2>
          <Card>
            <CardContent className="p-2 sm:p-4">
              <Table>
                <THead>
                  <TR><TH>Name</TH><TH>Email</TH><TH>Outcome</TH><TH>Reviewed</TH><TH>Reason</TH></TR>
                </THead>
                <TBody>
                  {reviewed.map((r) => (
                    <TR key={r.id}>
                      <TD className="font-medium">{r.fullName}</TD>
                      <TD>{r.email}</TD>
                      <TD>{r.status === "APPROVED" ? <Badge variant="success">Approved</Badge> : <Badge variant="destructive">Rejected</Badge>}</TD>
                      <TD>{formatDateTime(r.reviewedAt)}</TD>
                      <TD>{r.rejectionReason ?? "—"}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
