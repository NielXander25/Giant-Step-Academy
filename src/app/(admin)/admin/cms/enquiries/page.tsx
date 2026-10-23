import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireRole } from "@/lib/auth/session";
import { markEnquiryAction } from "@/lib/cms/actions";
import { telHref, whatsappHref } from "@/lib/cms/helpers";
import { ADMIN_ROLES } from "@/lib/permissions/roles";

export const metadata: Metadata = { title: "Enquiries" };

export default async function EnquiriesPage() {
  await requireRole(...ADMIN_ROLES);
  const rows = await db.enquiry.findMany({ orderBy: [{ status: "asc" }, { createdAt: "desc" }], take: 100 });
  return (
    <>
      <PageHeader title="Enquiries" description="Messages sent through the website's contact and admissions form." />
      {rows.length === 0 ? <EmptyState title="No messages yet">They appear here when someone uses the form.</EmptyState> : (
        <div className="flex flex-col gap-4">
          {rows.map((e) => (
            <Card key={e.id}><CardContent className="flex flex-col gap-3 pt-6">
              <div className="flex flex-wrap items-center gap-3"><p className="font-serif text-lg text-navy">{e.name}</p>{e.status === "NEW" ? <Badge variant="accent">New</Badge> : <Badge variant="outline">Handled</Badge>}{e.interest && <Badge variant="outline">{e.interest}</Badge>}<span className="text-xs text-muted-foreground">{formatDateTime(e.createdAt)}</span></div>
              <p className="whitespace-pre-wrap text-sm">{e.message}</p>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <a href={telHref(e.phone)} className="text-primary underline underline-offset-4">Call {e.phone}</a>
                <a href={whatsappHref(e.phone)} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">WhatsApp</a>
                {e.email && <a href={`mailto:${e.email}`} className="text-primary underline underline-offset-4">{e.email}</a>}
                <span className="ml-auto"><ActionButton action={markEnquiryAction} input={{ enquiryId: e.id, handled: e.status === "NEW" }} label={e.status === "NEW" ? "Mark as handled" : "Mark as new"} /></span>
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}
    </>
  );
}
