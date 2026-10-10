"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/shared/form-message";
import { useAction } from "@/lib/use-action";
import { removeComponentsOverrideAction, saveAssessmentComponents } from "../actions";

type Row = { id?: string; name: string; maxScore: string };

export function ComponentsEditor({ sectionId, sectionName, initial, usingFallback, hasOverride, locked }: {
  sectionId: string | null;
  sectionName: string | null;
  initial: { id?: string; name: string; maxScore: number }[];
  usingFallback: boolean;
  hasOverride: boolean;
  /** Scores exist: only renaming is allowed. */
  locked: boolean;
}) {
  const router = useRouter();
  // A copy of the all-sections setup has no ids, so saving it creates the section's own components.
  const [rows, setRows] = useState<Row[]>(initial.map((c) => ({ id: usingFallback ? undefined : c.id, name: c.name, maxScore: String(c.maxScore) })));
  const save = useAction(saveAssessmentComponents);
  const remove = useAction(removeComponentsOverrideAction, { onSuccess: () => router.push("/admin/settings/assessment") });

  const total = rows.reduce((sum, r) => sum + (Number(r.maxScore) || 0), 0);
  const valid = rows.length > 0 && rows.every((r) => r.name.trim() && Number(r.maxScore) > 0 && Number(r.maxScore) <= 100);
  const set = (i: number, k: keyof Row, v: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  return (
    <div className="flex flex-col gap-4">
      {usingFallback && (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm">{sectionName} currently uses the all-sections setup. These rows are a copy: change them and save to give {sectionName} its own.</p>
      )}
      {locked && <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm">Scores have already been entered, so components can only be renamed.</p>}

      <div className="flex flex-col gap-2">
        {rows.map((r, i) => (
          <div key={r.id ?? i} className="flex flex-wrap items-center gap-2">
            <Input aria-label={`Component ${i + 1} name`} className="w-48" value={r.name} maxLength={30} placeholder="CA" onChange={(e) => set(i, "name", e.target.value)} />
            <span className="text-sm text-muted-foreground">out of</span>
            <Input aria-label={`Component ${i + 1} maximum`} className="w-24" type="number" inputMode="decimal" value={r.maxScore} disabled={locked} onChange={(e) => set(i, "maxScore", e.target.value)} />
            {!locked && <Button type="button" variant="ghost" size="icon" aria-label={`Remove component ${i + 1}`} onClick={() => setRows(rows.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {!locked && rows.length < 6 && (
          <Button type="button" variant="outline" size="sm" onClick={() => setRows([...rows, { name: "", maxScore: "" }])}><Plus className="size-4" aria-hidden="true" /> Add a component</Button>
        )}
        {!locked && (
          <Button type="button" variant="ghost" size="sm" onClick={() => setRows([{ name: "CA", maxScore: "40" }, { name: "Exam", maxScore: "60" }])}>Fill with sample (CA 40 + Exam 60)</Button>
        )}
      </div>

      <p className={total === 100 || total === 0 ? "text-sm text-muted-foreground" : "text-sm text-accent"}>
        Total available: <strong>{total}</strong>{total !== 100 && total > 0 ? " — most schools use 100. Averages are still worked out as a percentage." : ""}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={save.pending || !valid} onClick={() => save.run({ sectionId, components: rows.map((r) => ({ id: r.id, name: r.name, maxScore: Number(r.maxScore) })) })}>
          {save.pending ? "Saving…" : "Save components"}
        </Button>
        {sectionId && hasOverride && !locked && (
          <Button type="button" variant="outline" disabled={remove.pending} onClick={() => { if (window.confirm(`Remove ${sectionName}'s own setup and use the all-sections one?`)) remove.run({ sectionId }); }}>
            Use the all-sections setup
          </Button>
        )}
      </div>
      <FormMessage error={save.error ?? remove.error} success={save.success ? "Components saved." : null} />
    </div>
  );
}
