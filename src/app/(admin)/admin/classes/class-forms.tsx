"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FieldError, FormMessage } from "@/components/shared/form-message";
import { useAction } from "@/lib/use-action";
import { createClass, createLevel, createSection, loadSample } from "./actions";

export function LoadSampleButton() {
  const { run, pending, error } = useAction(loadSample);
  return (
    <div className="flex flex-col items-start gap-3">
      <Button type="button" disabled={pending} onClick={() => run({})}>
        {pending ? "Loading…" : "Load sample structure"}
      </Button>
      <FormMessage error={error} />
    </div>
  );
}

export function AddSectionForm() {
  const [name, setName] = useState("");
  const { run, pending, error, fieldErrors } = useAction(createSection, { onSuccess: () => setName("") });
  return (
    <form onSubmit={(e) => { e.preventDefault(); run({ name }); }} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="section-name">Section name</Label>
        <Input id="section-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Primary" required />
        <FieldError messages={fieldErrors.name} />
      </div>
      <Button type="submit" disabled={pending || !name} className="self-start">Add section</Button>
      <FormMessage error={error} />
    </form>
  );
}

export function AddLevelForm({ sections }: { sections: { id: string; name: string }[] }) {
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? "");
  const [name, setName] = useState("");
  const [isFinal, setIsFinal] = useState(false);
  const { run, pending, error, fieldErrors } = useAction(createLevel, { onSuccess: () => { setName(""); setIsFinal(false); } });
  return (
    <form onSubmit={(e) => { e.preventDefault(); run({ sectionId, name, isFinal }); }} className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="level-section">Section</Label>
        <Select id="level-section" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
          {sections.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </Select>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="level-name">Level name</Label>
        <Input id="level-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="SS3" required />
        <FieldError messages={fieldErrors.name} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isFinal} onChange={(e) => setIsFinal(e.target.checked)} className="size-4" />
        This is the final level (students graduate after it)
      </label>
      <Button type="submit" disabled={pending || !name || !sectionId} className="self-start">Add level</Button>
      <FormMessage error={error} />
    </form>
  );
}

export function AddArmForm({ levelId }: { levelId: string }) {
  const [arm, setArm] = useState("");
  const { run, pending, error } = useAction(createClass, { onSuccess: () => setArm("") });
  return (
    <form onSubmit={(e) => { e.preventDefault(); run({ levelId, arm }); }} className="flex flex-wrap items-center gap-2">
      <Input aria-label="New arm, such as B" value={arm} onChange={(e) => setArm(e.target.value)} placeholder="B" maxLength={3} className="h-9 w-16" />
      <Button type="submit" size="sm" variant="outline" disabled={pending || !arm}>Add arm</Button>
      {error && <span role="alert" className="text-xs text-destructive">{error}</span>}
    </form>
  );
}
