import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { setCurrentSession, setCurrentTerm } from "./actions";
import { NewSessionForm } from "./session-forms";

export const metadata: Metadata = { title: "Sessions & terms" };

export default async function SessionsPage() {
  await requireRole(...ADMIN_ROLES);
  const sessions = await db.academicSession.findMany({
    orderBy: { name: "desc" },
    include: { terms: { orderBy: { sortOrder: "asc" } } },
  });

  return (
    <>
      <PageHeader
        title="Sessions & terms"
        description="The current session and term decide which teacher assignments and results are active."
      />
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>New academic session</CardTitle>
          <CardDescription>Each session is created with First, Second and Third Term.</CardDescription>
        </CardHeader>
        <CardContent>
          <NewSessionForm />
        </CardContent>
      </Card>

      {sessions.length === 0 ? (
        <EmptyState title="No sessions yet">Create the first session above. It becomes the current session automatically.</EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          {sessions.map((s) => (
            <Card key={s.id}>
              <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CardTitle>{s.name}</CardTitle>
                  {s.isCurrent && <Badge variant="success">Current session</Badge>}
                </div>
                {!s.isCurrent && (
                  <ActionButton
                    action={setCurrentSession}
                    input={{ sessionId: s.id }}
                    label="Make current session"
                    confirm={`Make ${s.name} the current session? Teacher assignments are tracked per session.`}
                  />
                )}
              </CardHeader>
              <CardContent>
                <ul className="divide-y divide-border">
                  {s.terms.map((t) => (
                    <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="flex items-center gap-3">
                        <span>{t.name}</span>
                        {t.isCurrent && <Badge variant="success">Current term</Badge>}
                      </div>
                      {!t.isCurrent && (
                        <ActionButton action={setCurrentTerm} input={{ termId: t.id }} label="Make current term" />
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
