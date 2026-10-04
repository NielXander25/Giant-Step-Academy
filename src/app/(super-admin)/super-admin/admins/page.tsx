import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireRole } from "@/lib/auth/session";
import { setAdminActive, setAdminGrant } from "./actions";
import { NewAdminForm } from "./admin-forms";

export const metadata: Metadata = { title: "Admins" };

export default async function AdminsPage() {
  await requireRole("SUPER_ADMIN");
  const admins = await db.user.findMany({ where: { role: "ADMIN" }, orderBy: { createdAt: "desc" } });

  return (
    <>
      <PageHeader title="Admins" description="Admins run the school day to day. Only you can create them, deactivate them, or let them create other admins." />
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create an admin</CardTitle>
          <CardDescription>They sign in with this email and temporary password, then choose their own password.</CardDescription>
        </CardHeader>
        <CardContent>
          <NewAdminForm />
        </CardContent>
      </Card>

      {admins.length === 0 ? (
        <EmptyState title="No admins yet">Create the first admin above.</EmptyState>
      ) : (
        <Card>
          <CardContent className="p-2 sm:p-4">
            <Table>
              <THead>
                <TR><TH>Name</TH><TH>Email</TH><TH>Status</TH><TH>Can create admins</TH><TH>Last sign-in</TH><TH><span className="sr-only">Actions</span></TH></TR>
              </THead>
              <TBody>
                {admins.map((a) => (
                  <TR key={a.id}>
                    <TD className="font-medium">
                      {a.name}
                      {a.mustChangePassword && <p className="text-xs font-normal text-muted-foreground">Temporary password not changed yet</p>}
                    </TD>
                    <TD>{a.email}</TD>
                    <TD>{a.status === "ACTIVE" ? <Badge variant="success">Active</Badge> : <Badge variant="destructive">Deactivated</Badge>}</TD>
                    <TD>
                      <span className="flex items-center gap-2">
                        {a.canCreateAdmins ? <Badge variant="accent">Yes</Badge> : <Badge variant="outline">No</Badge>}
                        <ActionButton action={setAdminGrant} input={{ adminId: a.id, canCreateAdmins: !a.canCreateAdmins }} label={a.canCreateAdmins ? "Revoke" : "Grant"} />
                      </span>
                    </TD>
                    <TD>{formatDateTime(a.lastLoginAt)}</TD>
                    <TD className="text-right">
                      <ActionButton
                        action={setAdminActive}
                        input={{ adminId: a.id, active: a.status !== "ACTIVE" }}
                        label={a.status === "ACTIVE" ? "Deactivate" : "Reactivate"}
                        confirm={a.status === "ACTIVE" ? `Deactivate ${a.name}? They lose access on their next click.` : undefined}
                      />
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
