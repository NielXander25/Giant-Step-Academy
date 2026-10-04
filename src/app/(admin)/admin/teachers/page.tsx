import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireRole } from "@/lib/auth/session";
import { getCurrentSessionId } from "@/lib/permissions/assignments";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { setTeacherActive } from "./actions";

export const metadata: Metadata = { title: "Teachers" };

export default async function TeachersPage() {
  await requireRole(...ADMIN_ROLES);
  const sessionId = await getCurrentSessionId();

  const teachers = await db.user.findMany({
    where: { role: "TEACHER" },
    orderBy: { name: "asc" },
    include: {
      teacherProfile: true,
      formTeacherAssignments: { where: { sessionId: sessionId ?? "none" }, include: { class: true } },
      subjectAssignments: { where: { sessionId: sessionId ?? "none" }, include: { class: true, subject: true } },
    },
  });

  return (
    <>
      <PageHeader title="Teachers" description="Approved teacher accounts and their assignments in the current session." />
      {teachers.length === 0 ? (
        <EmptyState title="No teachers yet">Approve a request on the Teacher requests page and the teacher will appear here.</EmptyState>
      ) : (
        <Card>
          <CardContent className="p-2 sm:p-4">
            <Table>
              <THead>
                <TR><TH>Name</TH><TH>Contact</TH><TH>Role this session</TH><TH>Status</TH><TH>Last sign-in</TH><TH><span className="sr-only">Actions</span></TH></TR>
              </THead>
              <TBody>
                {teachers.map((t) => {
                  const form = t.formTeacherAssignments[0]?.class.name;
                  const subjects = t.subjectAssignments;
                  return (
                    <TR key={t.id}>
                      <TD>
                        <p className="font-medium">{t.name}</p>
                        {!t.teacherProfile?.profileCompleted && <p className="text-xs text-muted-foreground">Profile not completed</p>}
                      </TD>
                      <TD>
                        <p>{t.email}</p>
                        <p className="text-xs text-muted-foreground">{t.teacherProfile?.phone ?? "—"}</p>
                      </TD>
                      <TD>
                        {form && <Badge variant="accent">Form Teacher · {form}</Badge>}
                        {subjects.length > 0 && (
                          <p className="mt-1 text-xs text-muted-foreground">
                            {subjects.map((s) => `${s.subject.name} (${s.class.name})`).join(", ")}
                          </p>
                        )}
                        {!form && subjects.length === 0 && <span className="text-muted-foreground">Not assigned</span>}
                      </TD>
                      <TD>{t.status === "ACTIVE" ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Deactivated</Badge>}</TD>
                      <TD>{formatDateTime(t.lastLoginAt)}</TD>
                      <TD className="text-right">
                        <ActionButton
                          action={setTeacherActive}
                          input={{ teacherId: t.id, active: t.status !== "ACTIVE" }}
                          label={t.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                          confirm={t.status === "ACTIVE" ? `Deactivate ${t.name}? They will be signed out on their next click.` : undefined}
                        />
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </>
  );
}
