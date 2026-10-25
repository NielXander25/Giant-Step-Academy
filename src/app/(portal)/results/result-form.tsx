"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FormMessage } from "@/components/shared/form-message";
import { TurnstileWidget } from "@/components/portal/turnstile-widget";
import { openResultAction } from "./actions";

export function ResultForm({ terms }: { terms: { id: string; label: string }[] }) {
  const [state, formAction, pending] = useActionState(openResultAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-5" autoComplete="off">
      <div className="flex flex-col gap-2">
        <Label htmlFor="termId">Term</Label>
        <Select key={state?.values?.termId} id="termId" name="termId" required defaultValue={state?.values?.termId || terms[0]?.id}>
          {terms.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="studentName">Student's full name</Label>
        <Input id="studentName" name="studentName" required autoCapitalize="words" defaultValue={state?.values?.studentName} />
        <p className="text-xs text-muted-foreground">Exactly as the school has it, for example "Ada Obi".</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="admissionNumber">Admission number</Label>
        <Input id="admissionNumber" name="admissionNumber" required autoCapitalize="characters" placeholder="GSA/SS2/001" defaultValue={state?.values?.admissionNumber} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="pin">Result PIN</Label>
        <Input id="pin" name="pin" required autoCapitalize="characters" inputMode="text" placeholder="GSA123456" />
      </div>
      <TurnstileWidget />
      <FormMessage error={state?.error} />
      <Button type="submit" size="lg" disabled={pending}>{pending ? "Checking…" : "View result"}</Button>
      <p className="text-xs text-muted-foreground">Each PIN can be used to open a result twice. Wrong details never use up an attempt.</p>
    </form>
  );
}
