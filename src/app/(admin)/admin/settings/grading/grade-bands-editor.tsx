"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/shared/form-message";
import { SAMPLE_BANDS, validateBands } from "@/lib/results/grading";
import { useAction } from "@/lib/use-action";
import { removeGradeOverride, saveGradeBands } from "../actions";

type Row = { minScore: string; maxScore: string; grade: string; remark: string };
type Initial = { minScore: number; maxScore: number; grade: string; remark?: string | null };

const toRows = (bands: Initial[]): Row[] =>
  [...bands].sort((a, b) => b.minScore - a.minScore).map((b) => ({ minScore: String(b.minScore), maxScore: String(b.maxScore), grade: b.grade, remark: b.remark ?? "" }));

export function GradeBandsEditor({ sectionId, sectionName, initial, usingFallback, hasOverride }: {
  sectionId: string | null;
  sectionName: string | null;
  initial: Initial[];
  /** Showing a copy of the all-sections grading that has not been saved for this section yet. */
  usingFallback: boolean;
  hasOverride: boolean;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(toRows(initial));
  const save = useAction(saveGradeBands);
  const remove = useAction(removeGradeOverride, { onSuccess: () => router.push("/admin/settings/grading") });

  const bands = rows.map((r) => ({ minScore: Number(r.minScore), maxScore: Number(r.maxScore), grade: r.grade, remark: r.remark }));
  const problems = rows.length ? validateBands(bands) : [];
  const set = (i: number, k: keyof Row, v: string) => setRows(rows.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  return (
    <div className="flex flex-col gap-4">
      {usingFallback && (
        <p className="rounded-lg bg-accent-soft px-3 py-2 text-sm">
          {sectionName} currently uses the all-sections grading. These rows are a copy: change them and save to give {sectionName} its own grading.
        </p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[34rem] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr><th className="px-2 py-1">From</th><th className="px-2 py-1">To</th><th className="px-2 py-1">Grade</th><th className="px-2 py-1">Remark</th><th /></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td className="px-2 py-1"><Input aria-label={`Row ${i + 1} from`} type="number" inputMode="decimal" className="w-24" value={r.minScore} onChange={(e) => set(i, "minScore", e.target.value)} /></td>
                <td className="px-2 py-1"><Input aria-label={`Row ${i + 1} to`} type="number" inputMode="decimal" className="w-24" value={r.maxScore} onChange={(e) => set(i, "maxScore", e.target.value)} /></td>
                <td className="px-2 py-1"><Input aria-label={`Row ${i + 1} grade`} className="w-20" maxLength={4} value={r.grade} onChange={(e) => set(i, "grade", e.target.value)} /></td>
                <td className="px-2 py-1"><Input aria-label={`Row ${i + 1} remark`} className="w-44" maxLength={40} value={r.remark} onChange={(e) => set(i, "remark", e.target.value)} /></td>
                <td className="px-2 py-1"><Button type="button" variant="ghost" size="icon" aria-label={`Remove row ${i + 1}`} onClick={() => setRows(rows.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setRows([...rows, { minScore: "", maxScore: "", grade: "", remark: "" }])}><Plus className="size-4" aria-hidden="true" /> Add a row</Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setRows(toRows(SAMPLE_BANDS))}>Fill with sample grades (A–F)</Button>
      </div>

      {problems.length > 0 && (
        <ul role="alert" className="list-disc rounded-lg bg-red-50 py-2 pl-7 pr-3 text-sm text-destructive">{problems.map((p) => <li key={p}>{p}</li>)}</ul>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" disabled={save.pending || rows.length === 0 || problems.length > 0} onClick={() => save.run({ sectionId, bands: bands.map((b) => ({ ...b, remark: b.remark || undefined })) })}>
          {save.pending ? "Saving…" : "Save grading"}
        </Button>
        {sectionId && hasOverride && (
          <Button type="button" variant="outline" disabled={remove.pending} onClick={() => { if (window.confirm(`Remove ${sectionName}'s own grading and use the all-sections grading instead?`)) remove.run({ sectionId }); }}>
            Use the all-sections grading
          </Button>
        )}
      </div>
      <FormMessage error={save.error ?? remove.error} success={save.success ? "Grading saved." : null} />
      <p className="text-xs text-muted-foreground">A score between two whole-number bands (for example 79.5) takes the lower grade.</p>
    </div>
  );
}
