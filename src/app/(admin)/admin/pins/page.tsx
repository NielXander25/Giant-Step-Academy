import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { db } from "@/lib/db";
import { formatDate, formatDateTime } from "@/lib/format";
import { requireRole } from "@/lib/auth/session";
import { setPinEnabledAction, setSampleResultAction } from "@/lib/pin/actions";
import { isSampleEnabled, PRACTICE_STUDENTS, SAMPLE_PIN } from "@/lib/pin/sample-access";
import { isPepperConfigured } from "@/lib/pin/hash";
import { effectivePinStatus } from "@/lib/pin/lifecycle";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { cn } from "@/lib/utils";
import { GeneratePinsForm } from "./generate-form";

export const metadata: Metadata = { title: "Result PINs" };

const PAGE_SIZE = 50;
const FILTERS = ["ACTIVE", "EXHAUSTED", "EXPIRED", "DISABLED"] as const;
type Filter = (typeof FILTERS)[number];

const whereFor = (f: Filter, now: Date): Prisma.PinWhereInput =>
  f === "ACTIVE" ? { status: "ACTIVE", OR: [{ expiresAt: null }, { expiresAt: { gt: now } }] }
  : f === "EXPIRED" ? { OR: [{ status: "EXPIRED" }, { status: "ACTIVE", expiresAt: { lte: now } }] }
  : { status: f };

const BADGE = { ACTIVE: "success", EXHAUSTED: "outline", EXPIRED: "outline", DISABLED: "destructive" } as const;

export default async function PinsPage({ searchParams }: { searchParams: Promise<{ status?: string; page?: string }> }) {
  await requireRole(...ADMIN_ROLES);
  const sp = await searchParams;
  const now = new Date();
  const filter = FILTERS.find((f) => f === sp.status);
  const page = Math.max(1, Number.parseInt(sp.page ?? "1", 10) || 1);

  const [counts, total, pins, sampleOn] = await Promise.all([
    Promise.all(FILTERS.map((f) => db.pin.count({ where: whereFor(f, now) }))),
    db.pin.count({ where: filter ? whereFor(filter, now) : {} }),
    db.pin.findMany({ where: filter ? whereFor(filter, now) : {}, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
    isSampleEnabled(),
  ]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const href = (f?: string, p = 1) => `/admin/pins?${new URLSearchParams({ ...(f ? { status: f } : {}), page: String(p) })}`;
  const tab = (active: boolean) => cn("rounded-lg border border-border bg-background px-3 py-1.5 text-sm hover:bg-primary-soft", active && "border-primary bg-primary text-primary-foreground hover:bg-primary");

  return (
    <>
      <PageHeader title="Result PINs" description="Each PIN opens a result twice and stops working 40 days after its first use. A PIN is not tied to one student." />

      {!isPepperConfigured() && (
        <p role="alert" className="mb-6 rounded-lg bg-red-50 px-3 py-2 text-sm text-destructive">
          PINs cannot be created or used yet. Add a <strong>PIN_PEPPER</strong> setting (a long random value) in Vercel, then redeploy.
        </p>
      )}

      <Card className="mb-8">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle>Practice with a sample result</CardTitle>
            {sampleOn ? <Badge variant="success">On</Badge> : <Badge variant="outline">Off</Badge>}
          </div>
          <CardDescription>
            Try the parent's journey end to end. On the Check results page, these details open a made-up report card with the school's real
            details and layout. It uses no PIN attempts and never touches a real class or student. Switch it off before launch.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm">Result PIN for all of them: <span className="font-mono font-medium">{SAMPLE_PIN}</span> · Term: any term in the list</p>
          <Table>
            <THead><TR><TH>Student's full name</TH><TH>Admission number</TH><TH>Card</TH></TR></THead>
            <TBody>
              {Object.values(PRACTICE_STUDENTS).map((p) => (
                <TR key={p.admissionNumber}>
                  <TD className="font-mono">{p.name}</TD>
                  <TD className="font-mono">{p.admissionNumber}</TD>
                  <TD>{p.className ?? { NURSERY: "Nursery", PRIMARY: "Primary", JSS: "JSS", SS: "SS" }[p.stage]}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <div className="flex flex-wrap gap-3">
            <ActionButton action={setSampleResultAction} input={{ enabled: !sampleOn }} label={sampleOn ? "Switch off" : "Switch on"} variant={sampleOn ? "outline" : "default"}
              confirm={sampleOn ? undefined : "Switch the sample result on? Anyone who knows the sample details will be able to open the made-up report card."} />
            {sampleOn && <Link href="/results" target="_blank" className="inline-flex h-9 items-center rounded-lg border border-input px-3 text-sm hover:bg-primary-soft">Open Check results</Link>}
          </div>
        </CardContent>
      </Card>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active" value={counts[0]} />
        <StatCard label="Used up" value={counts[1]} />
        <StatCard label="Expired" value={counts[2]} />
        <StatCard label="Disabled" value={counts[3]} />
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Create PINs</CardTitle>
          <CardDescription>Give them to parents through the school office. Creating new PINs never cancels older ones.</CardDescription>
        </CardHeader>
        <CardContent><GeneratePinsForm disabled={!isPepperConfigured()} /></CardContent>
      </Card>

      <div className="mb-4 flex flex-wrap gap-2" role="navigation" aria-label="Filter PINs">
        <Link href={href()} className={tab(!filter)}>All</Link>
        {FILTERS.map((f) => <Link key={f} href={href(f)} className={tab(filter === f)}>{f.charAt(0) + f.slice(1).toLowerCase()}</Link>)}
      </div>

      {pins.length === 0 ? (
        <EmptyState title="No PINs here">Create some above.</EmptyState>
      ) : (
        <Card>
          <CardContent className="p-2 sm:p-4">
            <Table>
              <THead><TR><TH>PIN</TH><TH>Note</TH><TH>Status</TH><TH>Used</TH><TH>Created</TH><TH>First used</TH><TH>Expires</TH><TH><span className="sr-only">Actions</span></TH></TR></THead>
              <TBody>
                {pins.map((p) => {
                  const state = effectivePinStatus(p, now);
                  return (
                    <TR key={p.id}>
                      <TD className="whitespace-nowrap font-mono">{p.maskedPin}</TD>
                      <TD>{p.label ?? "—"}</TD>
                      <TD><Badge variant={BADGE[state]}>{state.charAt(0) + state.slice(1).toLowerCase()}</Badge></TD>
                      <TD>{p.usageCount} / {p.maxUses}</TD>
                      <TD>{formatDate(p.createdAt)}</TD>
                      <TD>{formatDateTime(p.firstUsedAt)}</TD>
                      <TD>{formatDate(p.expiresAt)}</TD>
                      <TD className="text-right">
                        {state === "ACTIVE" && <ActionButton action={setPinEnabledAction} input={{ pinId: p.id, enabled: false }} label="Disable" confirm="Disable this PIN? It stops working straight away, even for someone viewing a result right now." />}
                        {state === "DISABLED" && <ActionButton action={setPinEnabledAction} input={{ pinId: p.id, enabled: true }} label="Enable" />}
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {pages > 1 && (
        <nav aria-label="Pages" className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} of {pages} · {total} PINs</span>
          <span className="flex gap-3">
            {page > 1 && <Link href={href(filter, page - 1)} className="text-primary underline underline-offset-4">Previous</Link>}
            {page < pages && <Link href={href(filter, page + 1)} className="text-primary underline underline-offset-4">Next</Link>}
          </span>
        </nav>
      )}
    </>
  );
}
