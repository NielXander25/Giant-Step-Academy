import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { previewPromotion } from "@/lib/promotion/execute";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { PromotionWizard, type WizardRow } from "./promotion-wizard";

export const metadata: Metadata = { title: "Yearly promotion" };

export default async function PromotionPage({ searchParams }: { searchParams: Promise<{ from?: string; to?: string }> }) {
  await requireRole(...ADMIN_ROLES);
  const sp = await searchParams;
  const sessions = await db.academicSession.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, isCurrent: true } });

  if (sessions.length < 2) {
    return (
      <>
        <PageHeader title="Yearly promotion" />
        <EmptyState title="Create the new session first">Promotion moves students from the year that is ending into the next one. <Link href="/admin/sessions" className="text-primary underline">Create the new session</Link>, then come back.</EmptyState>
      </>
    );
  }

  const from = sessions.find((s) => s.id === sp.from) ?? sessions.find((s) => s.isCurrent) ?? sessions[sessions.length - 2];
  const later = sessions.filter((s) => s.id !== from.id);
  const to = later.find((s) => s.id === sp.to) ?? later.find((s) => s.name > from.name) ?? later[later.length - 1];
  const preview = await previewPromotion(from.id, to.id);
  const classOptions = (await db.schoolClass.findMany({ where: { isActive: true }, orderBy: [{ level: { sortOrder: "asc" } }, { arm: "asc" }], select: { id: true, name: true } }));

  const rows: WizardRow[] = preview.plan.classes.map((c) => ({
    sourceClassId: c.sourceClassId, sourceClassName: c.sourceClassName, eligible: c.eligible, repeaters: c.repeaters, promoted: c.promoted, notPromoted: c.notPromoted,
    targetLabel: c.target.kind === "CLASS" ? c.target.className : c.target.kind === "CREATE" ? `${c.target.name} (will be created)` : c.target.kind === "GRADUATE" ? "Graduate" : "—",
    blockedReason: c.target.kind === "BLOCKED" && c.notPromoted > 0 ? c.target.reason : null,
    published: preview.publishedClassIds.includes(c.sourceClassId),
  }));
  const t = preview.plan.totals;

  return (
    <>
      <PageHeader title="Yearly promotion" description="At the end of the year, move every class up. Students you marked as repeating stay where they are; the final class graduates." />

      <Card className="mb-6">
        <CardHeader><CardTitle>Choose the years</CardTitle><CardDescription>Nothing changes until you press the button at the bottom.</CardDescription></CardHeader>
        <CardContent>
          <form method="get" className="flex flex-wrap items-end gap-4">
            <label className="flex flex-col gap-1 text-sm">Year ending<select name="from" defaultValue={from.id} className="h-10 rounded-lg border border-input bg-background px-3">{sessions.map((s) => <option key={s.id} value={s.id}>{s.name}{s.isCurrent ? " (current)" : ""}</option>)}</select></label>
            <label className="flex flex-col gap-1 text-sm">Moving into<select name="to" defaultValue={to.id} className="h-10 rounded-lg border border-input bg-background px-3">{later.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
            <button className="h-10 rounded-lg border border-input px-4 text-sm hover:bg-primary-soft" type="submit">Show</button>
          </form>
        </CardContent>
      </Card>

      <div className="mb-6 flex flex-wrap gap-3 text-sm">
        <Badge variant="success">{t.promote} move up</Badge><Badge variant="accent">{t.repeat} repeat</Badge><Badge variant="outline">{t.graduate} graduate</Badge>
        {t.notPromoted > 0 && <Badge variant="destructive">{t.notPromoted} not promoted</Badge>}
        {t.classesToCreate > 0 && <Badge variant="outline">{t.classesToCreate} class{t.classesToCreate === 1 ? "" : "es"} will be created</Badge>}
        {t.alreadyInNewSession > 0 && <Badge variant="outline">{t.alreadyInNewSession} already moved</Badge>}
        {t.inactive > 0 && <Badge variant="outline">{t.inactive} inactive, left alone</Badge>}
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No students in the year ending">There are no active students enrolled in {from.name}.</EmptyState>
      ) : (
        <PromotionWizard fromId={from.id} toId={to.id} fromName={from.name} toName={to.name} rows={rows} classOptions={classOptions}
          hasWork={preview.plan.operations.length > 0} unpublishedCount={preview.unpublished.length} />
      )}
    </>
  );
}
