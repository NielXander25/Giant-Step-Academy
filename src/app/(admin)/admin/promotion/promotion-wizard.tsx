"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { FormMessage } from "@/components/shared/form-message";
import { runPromotionAction } from "@/lib/promotion/actions";
import { useAction } from "@/lib/use-action";

export type WizardRow = {
  sourceClassId: string; sourceClassName: string; eligible: number; repeaters: number; promoted: number; notPromoted: number;
  targetLabel: string; blockedReason: string | null; published: boolean;
};

type Props = { fromId: string; toId: string; fromName: string; toName: string; rows: WizardRow[]; classOptions: { id: string; name: string }[]; hasWork: boolean; unpublishedCount: number };

export function PromotionWizard({ fromId, toId, fromName, toName, rows, classOptions, hasWork, unpublishedCount }: Props) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [allowUnpublished, setAllowUnpublished] = useState(false);
  const [understood, setUnderstood] = useState(false);
  const { run, pending, error, success } = useAction(runPromotionAction);
  const [summary, setSummary] = useState<string | null>(null);

  const blocked = rows.filter((r) => r.blockedReason && !overrides[r.sourceClassId]);
  const stuck = blocked.reduce((n, r) => n + r.notPromoted, 0);
  const total = rows.reduce((n, r) => n + r.promoted + r.repeaters, 0);
  const ready = hasWork && (unpublishedCount === 0 || allowUnpublished) && (stuck === 0 || understood);

  const label = (r: WizardRow) => {
    const o = overrides[r.sourceClassId];
    if (o === "GRADUATE") return "Graduate";
    if (o) return classOptions.find((c) => c.id === o)?.name ?? r.targetLabel;
    return r.targetLabel;
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <THead><TR><TH>Class now</TH><TH>Students</TH><TH>Repeating</TH><TH>Results published</TH><TH>Moves to</TH><TH>Change destination</TH></TR></THead>
          <TBody>
            {rows.map((r) => {
              const isBlocked = r.blockedReason && !overrides[r.sourceClassId];
              return (
                <TR key={r.sourceClassId}>
                  <TD className="font-medium">{r.sourceClassName}</TD>
                  <TD>{r.eligible}</TD>
                  <TD>{r.repeaters ? <Badge variant="accent">{r.repeaters} stay</Badge> : "—"}</TD>
                  <TD>{r.published ? <Badge variant="success">Yes</Badge> : <Badge variant="destructive">No</Badge>}</TD>
                  <TD>{isBlocked ? <span className="text-destructive">Not promoted: {r.blockedReason}</span> : r.promoted === 0 && r.repeaters > 0 ? "—" : label(r)}</TD>
                  <TD>
                    <Select aria-label={`Destination for ${r.sourceClassName}`} className="h-9 min-w-40" value={overrides[r.sourceClassId] ?? ""} onChange={(e) => setOverrides({ ...overrides, [r.sourceClassId]: e.target.value })}>
                      <option value="">Automatic</option>
                      <option value="GRADUATE">Graduate them</option>
                      {classOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </Select>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </div>

      {unpublishedCount > 0 && (
        <label className="flex items-start gap-3 rounded-lg bg-accent-soft p-3 text-sm">
          <input type="checkbox" className="mt-1 size-4" checked={allowUnpublished} onChange={(e) => setAllowUnpublished(e.target.checked)} />
          <span>{unpublishedCount} class{unpublishedCount === 1 ? " has" : "es have"} results that are not published yet. I want to continue anyway.</span>
        </label>
      )}
      {stuck > 0 && (
        <label className="flex items-start gap-3 rounded-lg bg-red-50 p-3 text-sm">
          <input type="checkbox" className="mt-1 size-4" checked={understood} onChange={(e) => setUnderstood(e.target.checked)} />
          <span>{stuck} student{stuck === 1 ? "" : "s"} will NOT be promoted because their class has no usable destination (pick one above to include them). I understand.</span>
        </label>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button" size="lg" disabled={pending || !ready}
          onClick={() => {
            if (!window.confirm(`Promote ${total} students from ${fromName} into ${toName}? This moves every class up and cannot be undone with one click.`)) return;
            run({ fromSessionId: fromId, toSessionId: toId, overrides: Object.fromEntries(Object.entries(overrides).filter(([, v]) => v)), allowUnpublished });
          }}
        >
          {pending ? "Promoting…" : `Promote ${total} students`}
        </Button>
        {!hasWork && <span className="text-sm text-muted-foreground">There is nobody left to promote for this pair of sessions.</span>}
      </div>
      <FormMessage error={error} success={success ? "Done. Open the Students page to see everyone in their new class. Remember to make the new session current on Sessions & terms." : summary} />
    </div>
  );
}
