import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { BatchBadge } from "@/components/results/status-badge";
import { SubjectScoresTable } from "@/components/results/subject-scores-table";
import { Card, CardContent } from "@/components/ui/card";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { getCurrentTerm } from "@/lib/results/class-data";
import { loadSubjectView } from "@/lib/results/subject-view";

export const metadata: Metadata = { title: "Subject results" };

const ids = z.object({ class: z.string().uuid(), subject: z.string().uuid() });

export default async function AdminSubjectPage({ searchParams }: { searchParams: Promise<{ class?: string; subject?: string }> }) {
  await requireRole(...ADMIN_ROLES);
  const parsed = ids.safeParse(await searchParams);
  if (!parsed.success) notFound();
  const term = await getCurrentTerm();
  if (!term) return <EmptyState title="No current term" />;
  const view = await loadSubjectView(parsed.data.class, parsed.data.subject, term);
  if (!view) notFound();

  return (
    <>
      <PageHeader title={`${view.roster.subjectName} · ${view.roster.className}`} description={`${term.name}, ${term.sessionName}. Read-only: corrections go back through the Form Teacher.`} />
      <div className="mb-4 flex items-center gap-3">
        <BatchBadge status={view.batch?.status ?? "DRAFT"} />
        <Link href={`/admin/results/sheet?class=${parsed.data.class}`} className="text-sm text-primary underline underline-offset-4">← Class results</Link>
      </div>
      <Card><CardContent className="p-2 sm:p-4"><SubjectScoresTable components={view.config.components} bands={view.config.bands} rows={view.rows} /></CardContent></Card>
    </>
  );
}
