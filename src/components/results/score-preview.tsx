"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { computeSubject, type Component } from "@/lib/results/calc";
import type { GradeBand } from "@/lib/results/grading";

/** Lets an Admin try a score and see the total and grade using the saved setup. */
export function ScorePreview({ components, bands }: { components: Component[]; bands: GradeBand[] }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const scores = Object.fromEntries(components.map((c) => [c.id, values[c.id] === undefined || values[c.id] === "" ? null : Number(values[c.id])]));
  const r = computeSubject(scores, components, bands);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-4">
        {components.map((c) => (
          <div key={c.id} className="flex w-32 flex-col gap-2">
            <Label htmlFor={`prev-${c.id}`}>{c.name} (max {c.maxScore})</Label>
            <Input id={`prev-${c.id}`} type="number" inputMode="decimal" min={0} max={c.maxScore} step="0.01" value={values[c.id] ?? ""} onChange={(e) => setValues({ ...values, [c.id]: e.target.value })} />
          </div>
        ))}
      </div>
      <p className="text-sm" aria-live="polite">
        {r.status === "COMPLETE" ? (
          <>Total <strong>{r.total}</strong> · {r.percent}% · grade <strong>{r.grade ?? "—"}</strong>{r.remark ? ` (${r.remark})` : ""}</>
        ) : r.errors.length ? (
          <span className="text-destructive">{r.errors[0]}</span>
        ) : (
          <span className="text-muted-foreground">Enter a score for every component to see the total and grade.</span>
        )}
      </p>
    </div>
  );
}
