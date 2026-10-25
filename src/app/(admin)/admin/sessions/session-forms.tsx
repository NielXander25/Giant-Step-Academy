"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormMessage } from "@/components/shared/form-message";
import { useAction } from "@/lib/use-action";
import { createSession, setResumptionDate } from "./actions";

export function NewSessionForm() {
  const [name, setName] = useState("");
  const { run, pending, error, fieldErrors, success } = useAction(createSession, { onSuccess: () => setName("") });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run({ name });
      }}
      className="flex flex-col gap-3 sm:max-w-sm"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="session-name">Session name</Label>
        <Input id="session-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="2026/2027" required />
        <FieldError messages={fieldErrors.name} />
      </div>
      <Button type="submit" disabled={pending || !name} className="self-start">
        {pending ? "Creating…" : "Create session"}
      </Button>
      <FormMessage error={error} success={success ? "Session created with its three terms." : null} />
    </form>
  );
}

export function ResumptionForm({ termId, value }: { termId: string; value: string | null }) {
  const [date, setDate] = useState(value ?? "");
  const { run, pending, error, success } = useAction(setResumptionDate);
  return (
    <form onSubmit={(e) => { e.preventDefault(); run({ termId, date: date || null }); }} className="flex flex-wrap items-center gap-2 text-sm">
      <Label htmlFor={`resume-${termId}`} className="text-muted-foreground">Resumption</Label>
      <Input id={`resume-${termId}`} type="date" className="h-9 w-40" value={date} onChange={(e) => setDate(e.target.value)} />
      <Button type="submit" size="sm" variant="outline" disabled={pending || date === (value ?? "")}>{pending ? "Saving…" : "Save"}</Button>
      <FormMessage error={error} success={success ? "Saved." : null} />
    </form>
  );
}
