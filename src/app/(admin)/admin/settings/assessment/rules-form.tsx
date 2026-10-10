"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/shared/form-message";
import { INCOMPLETE_POLICIES, TIE_METHODS, type IncompletePolicy, type ResultRules, type TieMethod } from "@/lib/results/rules";
import { useAction } from "@/lib/use-action";
import { saveResultRules } from "../actions";

function Choice<T extends string>({ name, legend, value, onChange, options }: {
  name: string; legend: string; value: T; onChange: (v: T) => void; options: Record<T, { label: string; help: string }>;
}) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1 text-sm font-medium">{legend}</legend>
      {(Object.keys(options) as T[]).map((key) => (
        <label key={key} className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3 has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
          <input type="radio" name={name} checked={value === key} onChange={() => onChange(key)} className="mt-1 size-4" />
          <span>
            <span className="block text-sm font-medium">{options[key].label}</span>
            <span className="block text-xs text-muted-foreground">{options[key].help}</span>
          </span>
        </label>
      ))}
    </fieldset>
  );
}

export function RulesForm({ initial }: { initial: ResultRules }) {
  const [tie, setTie] = useState<TieMethod>(initial.tieMethod);
  const [policy, setPolicy] = useState<IncompletePolicy>(initial.incompletePolicy);
  const { run, pending, error, success } = useAction(saveResultRules);

  return (
    <form onSubmit={(e) => { e.preventDefault(); run({ tieMethod: tie, incompletePolicy: policy }); }} className="flex flex-col gap-6 sm:max-w-xl">
      <Choice name="tie" legend="When students have the same average" value={tie} onChange={setTie} options={TIE_METHODS} />
      <Choice name="policy" legend="When a student is missing some subjects" value={policy} onChange={setPolicy} options={INCOMPLETE_POLICIES} />
      <div className="flex flex-col items-start gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save rules"}</Button>
        <FormMessage error={error} success={success ? "Rules saved." : null} />
      </div>
    </form>
  );
}
