"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormMessage } from "@/components/shared/form-message";
import { useAction } from "@/lib/use-action";
import { createSubject } from "./actions";

export function NewSubjectForm() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const { run, pending, error, fieldErrors } = useAction(createSubject, { onSuccess: () => { setName(""); setCode(""); } });
  return (
    <form onSubmit={(e) => { e.preventDefault(); run({ name, code: code || undefined }); }} className="grid gap-3 sm:max-w-xl sm:grid-cols-[2fr_1fr]">
      <div className="flex flex-col gap-2">
        <Label htmlFor="subject-name">Subject name</Label>
        <Input id="subject-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Mathematics" required />
        <FieldError messages={fieldErrors.name} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="subject-code">Code (optional)</Label>
        <Input id="subject-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="MTH" maxLength={10} />
        <FieldError messages={fieldErrors.code} />
      </div>
      <div className="sm:col-span-2 flex flex-col items-start gap-3">
        <Button type="submit" disabled={pending || !name}>{pending ? "Adding…" : "Add subject"}</Button>
        <FormMessage error={error} />
      </div>
    </form>
  );
}
