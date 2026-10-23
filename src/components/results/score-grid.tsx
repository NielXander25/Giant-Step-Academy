"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/shared/form-message";
import { computeSubject, type Component } from "@/lib/results/calc";
import type { GradeBand } from "@/lib/results/grading";
import { saveScoresAction, submitSubjectAction } from "@/lib/results/actions";

export type GridRow = { enrollmentId: string; admissionNumber: string; fullName: string; scores: Record<string, number | null>; remark: string };

type Props = {
  classId: string;
  subjectId: string;
  components: Component[];
  bands: GradeBand[];
  rows: GridRow[];
  canEdit: boolean;
  /** True for a Form Teacher: submitting goes straight to the Admin stage instead of to the Form Teacher. */
  byFormTeacher: boolean;
};

const toText = (v: number | null | undefined) => (v === null || v === undefined ? "" : String(v));

export function ScoreGrid({ classId, subjectId, components, bands, rows, canEdit, byFormTeacher }: Props) {
  const router = useRouter();
  const [cells, setCells] = useState<Record<string, Record<string, string>>>(
    Object.fromEntries(rows.map((r) => [r.enrollmentId, Object.fromEntries(components.map((c) => [c.id, toText(r.scores[c.id])]))])),
  );
  const [remarks, setRemarks] = useState<Record<string, string>>(Object.fromEntries(rows.map((r) => [r.enrollmentId, r.remark])));
  const [dirty, setDirty] = useState(false);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  const numbersOf = (id: string) => Object.fromEntries(components.map((c) => [c.id, cells[id][c.id].trim() === "" ? null : Number(cells[id][c.id])]));
  const results = rows.map((r) => computeSubject(numbersOf(r.enrollmentId), components, bands));
  const complete = results.filter((r) => r.status === "COMPLETE").length;
  const hasErrors = results.some((r) => r.errors.length > 0);
  const payload = () => rows.map((r) => ({ enrollmentId: r.enrollmentId, scores: numbersOf(r.enrollmentId), remark: remarks[r.enrollmentId]?.trim() || undefined }));

  const change = (id: string, comp: string, value: string) => {
    setCells({ ...cells, [id]: { ...cells[id], [comp]: value } });
    setDirty(true);
    setMessage(null);
  };

  function down(e: React.KeyboardEvent<HTMLInputElement>, row: number, col: number) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    (document.getElementById(`cell-${row + 1}-${col}`) as HTMLInputElement | null)?.focus();
  }

  const saveDraft = () =>
    start(async () => {
      const r = await saveScoresAction({ classId, subjectId, rows: payload() });
      if (!r.ok) return setMessage({ kind: "error", text: r.error });
      setDirty(false);
      setMessage({ kind: "success", text: "Draft saved." });
      router.refresh();
    });

  const submit = () => {
    const ask = byFormTeacher
      ? "Submit these results? They go to the Admin stage and you cannot change them unless you reopen them."
      : "Submit these results to the Form Teacher? You cannot change them unless the Form Teacher sends them back.";
    if (!window.confirm(ask)) return;
    start(async () => {
      const saved = await saveScoresAction({ classId, subjectId, rows: payload() });
      if (!saved.ok) return setMessage({ kind: "error", text: saved.error });
      const sent = await submitSubjectAction({ classId, subjectId });
      if (!sent.ok) return setMessage({ kind: "error", text: sent.error });
      setDirty(false);
      router.refresh();
    });
  };

  if (components.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[40rem] text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="sticky left-0 bg-card px-3 py-2">Student</th>
              {components.map((c) => <th key={c.id} className="px-2 py-2">{c.name} <span className="font-normal normal-case">/{c.maxScore}</span></th>)}
              <th className="px-3 py-2">Total</th>
              <th className="px-3 py-2">Grade</th>
              <th className="px-3 py-2">Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((r, ri) => {
              const res = results[ri];
              return (
                <tr key={r.enrollmentId}>
                  <td className="sticky left-0 whitespace-nowrap bg-card px-3 py-2">
                    <p className="font-medium">{r.fullName}</p>
                    <p className="text-xs text-muted-foreground">{r.admissionNumber}</p>
                  </td>
                  {components.map((c, ci) => {
                    const bad = res.errors.some((e) => e.startsWith(c.name));
                    return (
                      <td key={c.id} className="px-2 py-2">
                        <Input
                          id={`cell-${ri}-${ci}`}
                          aria-label={`${r.fullName} ${c.name}`}
                          aria-invalid={bad}
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={c.maxScore}
                          step="0.01"
                          disabled={!canEdit || pending}
                          value={cells[r.enrollmentId][c.id]}
                          onChange={(e) => change(r.enrollmentId, c.id, e.target.value)}
                          onKeyDown={(e) => down(e, ri, ci)}
                          className={`h-9 w-20 ${bad ? "border-destructive" : ""}`}
                        />
                      </td>
                    );
                  })}
                  <td className="whitespace-nowrap px-3 py-2 font-medium">{res.status === "COMPLETE" ? res.total : "—"}</td>
                  <td className="px-3 py-2 font-medium">{res.grade ?? "—"}</td>
                  <td className="px-3 py-2">
                    <Input
                      aria-label={`${r.fullName} remark`}
                      className="h-9 w-44"
                      maxLength={200}
                      disabled={!canEdit || pending}
                      value={remarks[r.enrollmentId]}
                      onChange={(e) => { setRemarks({ ...remarks, [r.enrollmentId]: e.target.value }); setDirty(true); }}
                      placeholder="Optional"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {complete} of {rows.length} students complete{dirty ? " · unsaved changes" : ""}. Press Enter to move down a column.
      </p>
      {hasErrors && <p role="alert" className="text-sm text-destructive">Some scores are not allowed (negative or above the maximum). Fix the red boxes first.</p>}

      {canEdit && (
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" variant="outline" disabled={pending || hasErrors || !dirty} onClick={saveDraft}>{pending ? "Working…" : "Save draft"}</Button>
          <Button type="button" disabled={pending || hasErrors || complete !== rows.length || rows.length === 0} onClick={submit}>
            {byFormTeacher ? "Submit results" : "Submit to Form Teacher"}
          </Button>
        </div>
      )}
      <FormMessage error={message?.kind === "error" ? message.text : null} success={message?.kind === "success" ? message.text : null} />
    </div>
  );
}
