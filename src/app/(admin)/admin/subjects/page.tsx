import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { setSubjectActive } from "./actions";
import { NewSubjectForm } from "./subject-forms";

export const metadata: Metadata = { title: "Subjects" };

export default async function SubjectsPage() {
  await requireRole(...ADMIN_ROLES);
  const subjects = await db.subject.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { classSubjects: true } } } });

  return (
    <>
      <PageHeader title="Subjects" description="The school's subject list. Choose which classes offer each subject on the Assignments page." />
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Add a subject</CardTitle>
          <CardDescription>Subjects can be disabled but not deleted, so old results stay intact.</CardDescription>
        </CardHeader>
        <CardContent>
          <NewSubjectForm />
        </CardContent>
      </Card>

      {subjects.length === 0 ? (
        <EmptyState title="No subjects yet">Add subjects above, or load the sample structure on the Classes page.</EmptyState>
      ) : (
        <Card>
          <CardContent className="p-2 sm:p-4">
            <Table>
              <THead>
                <TR><TH>Subject</TH><TH>Code</TH><TH>Classes</TH><TH>Status</TH><TH><span className="sr-only">Actions</span></TH></TR>
              </THead>
              <TBody>
                {subjects.map((s) => (
                  <TR key={s.id}>
                    <TD className="font-medium">{s.name}</TD>
                    <TD>{s.code ?? "—"}</TD>
                    <TD>{s._count.classSubjects}</TD>
                    <TD>{s.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="outline">Disabled</Badge>}</TD>
                    <TD className="text-right">
                      <ActionButton action={setSubjectActive} input={{ subjectId: s.id, isActive: !s.isActive }} label={s.isActive ? "Disable" : "Enable"} />
                    </TD>
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
