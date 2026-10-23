"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormMessage } from "@/components/shared/form-message";
import { saveRemarksAction } from "@/lib/results/actions";
import { useAction } from "@/lib/use-action";

type Student = { enrollmentId: string; fullName: string; remark: string };

export function RemarksForm({ classId, kind, students, disabled }: { classId: string; kind: "FORM_TEACHER" | "PRINCIPAL"; students: Student[]; disabled: boolean }) {
  const [values, setValues] = useState<Record<string, string>>(Object.fromEntries(students.map((s) => [s.enrollmentId, s.remark])));
  const { run, pending, error, success } = useAction(saveRemarksAction);

  return (
    <form onSubmit={(e) => { e.preventDefault(); run({ classId, kind, remarks: students.map((s) => ({ enrollmentId: s.enrollmentId, remark: values[s.enrollmentId] ?? "" })) }); }} className="flex flex-col gap-3">
      <ul className="divide-y divide-border">
        {students.map((s) => (
          <li key={s.enrollmentId} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:gap-4">
            <span className="text-sm sm:w-56">{s.fullName}</span>
            <Input aria-label={`${s.fullName} remark`} value={values[s.enrollmentId] ?? ""} maxLength={300} disabled={disabled || pending} onChange={(e) => setValues({ ...values, [s.enrollmentId]: e.target.value })} placeholder="Remark (optional)" />
          </li>
        ))}
      </ul>
      {!disabled && <Button type="submit" disabled={pending} className="self-start">{pending ? "Saving…" : "Save remarks"}</Button>}
      <FormMessage error={error} success={success ? "Remarks saved." : null} />
    </form>
  );
}
