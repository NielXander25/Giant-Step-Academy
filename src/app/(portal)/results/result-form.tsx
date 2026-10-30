"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShieldCheck } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FormMessage } from "@/components/shared/form-message";
import { TurnstileWidget } from "@/components/portal/turnstile-widget";
import { openResultAction } from "./actions";

const field = "h-13 rounded-2xl bg-muted border-transparent px-4 text-base focus:bg-white";

export function ResultForm({ terms }: { terms: { id: string; label: string }[] }) {
  const [state, formAction, pending] = useActionState(openResultAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-5" autoComplete="off">
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-semibold text-navy" htmlFor="termId">Term</Label>
        <Select className={field} key={state?.values?.termId} id="termId" name="termId" required defaultValue={state?.values?.termId || terms[0]?.id}>
          {terms.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-semibold text-navy" htmlFor="studentName">Student's full name</Label>
        <Input className={field} id="studentName" name="studentName" required autoCapitalize="words" defaultValue={state?.values?.studentName} />
        <p className="text-xs text-muted-foreground">Exactly as the school has it, for example "Ada Obi".</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-semibold text-navy" htmlFor="admissionNumber">Admission number</Label>
        <Input className={field} id="admissionNumber" name="admissionNumber" required autoCapitalize="characters" placeholder="GSA/SS2/001" defaultValue={state?.values?.admissionNumber} />
      </div>
      <div className="flex flex-col gap-2">
        <Label className="text-sm font-semibold text-navy" htmlFor="pin">Result PIN</Label>
        <Input className={field} id="pin" name="pin" required autoCapitalize="characters" inputMode="text" placeholder="GSA123456" />
      </div>
      <TurnstileWidget />
      <FormMessage error={state?.error} />
      <Button type="submit" size="lg" disabled={pending} className="h-14 text-lg">{pending ? "Checking…" : "View result"}</Button>
      <p className="flex items-start gap-2 text-left text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf" aria-hidden="true" />Each PIN opens a result twice. Wrong details never use up an attempt.</p>
    </form>
  );
}
