import type { Metadata } from "next";
import Link from "next/link";
import type { PinAccessOutcome } from "@prisma/client";
import { PageHeader } from "@/components/dashboard/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Access logs" };

const PAGE_SIZE = 50;
const OUTCOMES: Record<PinAccessOutcome, { text: string; variant: "success" | "outline" | "destructive" | "accent" }> = {
  SUCCESS: { text: "Result opened", variant: "success" },
  INVALID_CREDENTIALS: { text: "Details did not match", variant: "outline" },
  PIN_EXHAUSTED: { text: "PIN already used up", variant: "outline" },
  PIN_EXPIRED: { text: "PIN expired", variant: "outline" },
  PIN_DISABLED: { text: "PIN disabled", variant: "destructive" },
  RESULT_NOT_PUBLISHED: { text: "Result not published", variant: "accent" },
  RATE_LIMITED: { text: "Blocked: too many tries", variant: "destructive" },
  CAPTCHA_FAILED: { text: "Bot check failed", variant: "destructive" },
};

export default async function AccessLogsPage({ searchParams }: { searchParams: Promise<{ outcome?: string; page?: string }> }) {
  await requireRole(...ADMIN_ROLES);
  const sp = await searchParams;
  const outcome = (Object.keys(OUTCOMES) as PinAccessOutcome[]).find((o) => o === sp.outcome);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);
  const where = outcome ? { outcome } : {};

  const [total, logs] = await Promise.all([
    db.pinAccessLog.count({ where }),
    db.pinAccessLog.findMany({
      where, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE,
      include: {
        pin: { select: { maskedPin: true } },
        student: { select: { fullName: true, admissionNumber: true } },
        term: { select: { name: true, session: { select: { name: true } } } },
      },
    }),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (o?: string, p = 1) => `/admin/access-logs?${new URLSearchParams({ ...(o ? { outcome: o } : {}), page: String(p) })}`;
  const tab = (active: boolean) => cn("rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-primary-soft", active && "border-primary bg-primary text-primary-foreground hover:bg-primary");

  return (
    <>
      <PageHeader title="Access logs" description="Every attempt to open a result, successful or not. Only a scrambled network code is kept, never an IP address." />
      <div className="mb-4 flex flex-wrap gap-2" role="navigation" aria-label="Filter">
        <Link href={href()} className={tab(!outcome)}>All</Link>
        {(["SUCCESS", "INVALID_CREDENTIALS", "PIN_EXHAUSTED", "PIN_EXPIRED", "RESULT_NOT_PUBLISHED", "RATE_LIMITED"] as const).map((o) => (
          <Link key={o} href={href(o)} className={tab(outcome === o)}>{OUTCOMES[o].text}</Link>
        ))}
      </div>

      {logs.length === 0 ? (
        <EmptyState title="Nothing here yet">Attempts appear as soon as someone uses the result portal.</EmptyState>
      ) : (
        <Card>
          <CardContent className="p-2 sm:p-4">
            <Table>
              <THead><TR><TH>When</TH><TH>What happened</TH><TH>PIN</TH><TH>Student</TH><TH>Term</TH><TH>Network</TH></TR></THead>
              <TBody>
                {logs.map((l) => (
                  <TR key={l.id}>
                    <TD className="whitespace-nowrap">{formatDateTime(l.createdAt)}</TD>
                    <TD><Badge variant={OUTCOMES[l.outcome].variant}>{OUTCOMES[l.outcome].text}</Badge></TD>
                    <TD className="whitespace-nowrap font-mono">{l.pin?.maskedPin ?? "—"}</TD>
                    <TD>{l.student ? <><p className="font-medium">{l.student.fullName}</p><p className="text-xs text-muted-foreground">{l.student.admissionNumber}</p></> : "—"}</TD>
                    <TD>{l.term ? `${l.term.session.name} · ${l.term.name}` : "—"}</TD>
                    <TD className="font-mono text-xs text-muted-foreground">{l.ipHash ? l.ipHash.slice(0, 8) : "—"}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {pages} · {total} entries</span>
          <span className="flex gap-3">
            {page > 1 && <Link href={href(outcome, page - 1)} className="text-primary underline underline-offset-4">Previous</Link>}
            {page < pages && <Link href={href(outcome, page + 1)} className="text-primary underline underline-offset-4">Next</Link>}
          </span>
        </nav>
      )}
    </>
  );
}
