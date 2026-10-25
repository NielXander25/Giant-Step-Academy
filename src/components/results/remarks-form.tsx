"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { FormMessage } from "@/components/shared/form-message";
import { saveRemarksAction } from "@/lib/results/actions";
import { AFFECTIVE, PSYCHOMOTOR, RATING_MEANING, RATINGS, type Attendance, type Rating, type RatingKey, type Ratings } from "@/lib/results/report-card";
import { useAction } from "@/lib/use-action";

type Student = { enrollmentId: string; fullName: string; remark: string; ratings?: Ratings; attendance?: Attendance };
type Row = { remark: string; ratings: Ratings; attendance: { present: string; opened: string } };

const toNumber = (v: string) => (v.trim() === "" ? null : Math.max(0, Math.floor(Number(v))));

/**
 * Remarks for every student in a class. With `details` (the Form Teacher's form) each student also gets
 * attendance and the psychomotor and affective ratings from the report card.
 */
export function RemarksForm({ classId, kind, students, disabled, details = false }: {
  classId: string; kind: "FORM_TEACHER" | "PRINCIPAL" | "SUPERVISOR"; students: Student[]; disabled: boolean; details?: boolean;
}) {
  const [rows, setRows] = useState<Record<string, Row>>(Object.fromEntries(students.map((s) => [s.enrollmentId, {
    remark: s.remark,
    ratings: s.ratings ?? {},
    attendance: { present: s.attendance?.present?.toString() ?? "", opened: s.attendance?.opened?.toString() ?? "" },
  }])));
  const [opened, setOpened] = useState("");
  const { run, pending, error, success } = useAction(saveRemarksAction);
  const off = disabled || pending;

  const update = (id: string, patch: Partial<Row>) => setRows((r) => ({ ...r, [id]: { ...r[id], ...patch } }));
  const rate = (id: string, key: RatingKey, value: string) => update(id, { ratings: { ...rows[id].ratings, [key]: (value || undefined) as Rating | undefined } });

  const submit = () => run({
    classId, kind,
    remarks: students.map((s) => {
      const r = rows[s.enrollmentId];
      return {
        enrollmentId: s.enrollmentId,
        remark: r.remark,
        ...(details ? {
          ratings: Object.fromEntries(Object.entries(r.ratings).filter(([, v]) => v)),
          attendance: { present: toNumber(r.attendance.present), opened: toNumber(r.attendance.opened) },
        } : {}),
      };
    }),
  });

  if (!details) {
    return (
      <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-col gap-3">
        <ul className="divide-y divide-border">
          {students.map((s) => (
            <li key={s.enrollmentId} className="flex flex-col gap-1 py-2 sm:flex-row sm:items-center sm:gap-4">
              <span className="text-sm sm:w-56">{s.fullName}</span>
              <Input aria-label={`${s.fullName} remark`} value={rows[s.enrollmentId].remark} maxLength={300} disabled={off} onChange={(e) => update(s.enrollmentId, { remark: e.target.value })} placeholder="Remark (optional)" />
            </li>
          ))}
        </ul>
        {!disabled && <Button type="submit" disabled={pending} className="self-start">{pending ? "Saving…" : "Save remarks"}</Button>}
        <FormMessage error={error} success={success ? "Remarks saved." : null} />
      </form>
    );
  }

  const ratingSelect = (id: string, name: string, key: RatingKey, label: string) => (
    <label key={key} className="flex items-center justify-between gap-3 text-sm">
      <span>{label}</span>
      <Select aria-label={`${name}: ${label}`} className="h-9 w-20" value={rows[id].ratings[key] ?? ""} disabled={off} onChange={(e) => rate(id, key, e.target.value)}>
        <option value="">—</option>
        {RATINGS.map((g) => <option key={g} value={g}>{g}</option>)}
      </Select>
    </label>
  );

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">Ratings: {RATINGS.map((g) => `${g} ${RATING_MEANING[g]}`).join(" · ")}</p>
      {!disabled && (
        <div className="flex flex-wrap items-end gap-2 rounded-lg bg-primary-soft p-3 text-sm">
          <label className="flex flex-col gap-1">
            <span>Times school opened this term</span>
            <Input type="number" min={0} inputMode="numeric" className="w-32 bg-white" value={opened} onChange={(e) => setOpened(e.target.value)} />
          </label>
          <Button type="button" variant="outline" size="sm" disabled={!opened}
            onClick={() => setRows((r) => Object.fromEntries(Object.entries(r).map(([id, row]) => [id, { ...row, attendance: { ...row.attendance, opened } }])))}>
            Use for every student
          </Button>
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {students.map((s) => {
          const r = rows[s.enrollmentId];
          const filled = Object.values(r.ratings).filter(Boolean).length;
          return (
            <li key={s.enrollmentId}>
              <details className="group rounded-lg border border-border">
                <summary className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <span className="font-medium">{s.fullName}</span>
                  <span className="text-xs text-muted-foreground">{r.remark ? "Remark ✓ · " : ""}{filled}/8 rated</span>
                </summary>
                <div className="grid gap-4 border-t border-border p-3 md:grid-cols-2">
                  <div className="flex flex-col gap-3 md:col-span-2">
                    <Input aria-label={`${s.fullName} remark`} value={r.remark} maxLength={300} disabled={off} onChange={(e) => update(s.enrollmentId, { remark: e.target.value })} placeholder="Class Teacher's comment" />
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span>Attendance: present</span>
                      <Input aria-label={`${s.fullName} times present`} type="number" min={0} inputMode="numeric" className="w-20" value={r.attendance.present} disabled={off}
                        onChange={(e) => update(s.enrollmentId, { attendance: { ...r.attendance, present: e.target.value } })} />
                      <span>of</span>
                      <Input aria-label={`${s.fullName} times school opened`} type="number" min={0} inputMode="numeric" className="w-20" value={r.attendance.opened} disabled={off}
                        onChange={(e) => update(s.enrollmentId, { attendance: { ...r.attendance, opened: e.target.value } })} />
                    </div>
                  </div>
                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Psychomotor skills</legend>
                    {PSYCHOMOTOR.map((p) => ratingSelect(s.enrollmentId, s.fullName, p.key, p.label))}
                  </fieldset>
                  <fieldset className="flex flex-col gap-2">
                    <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Affective areas</legend>
                    {AFFECTIVE.map((p) => ratingSelect(s.enrollmentId, s.fullName, p.key, p.label))}
                  </fieldset>
                </div>
              </details>
            </li>
          );
        })}
      </ul>
      {!disabled && <Button type="submit" disabled={pending} className="self-start">{pending ? "Saving…" : "Save report card details"}</Button>}
      <FormMessage error={error} success={success ? "Saved." : null} />
    </form>
  );
}
