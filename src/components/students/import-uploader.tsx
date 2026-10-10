"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { FormMessage } from "@/components/shared/form-message";

type ClassOption = { id: string; name: string; needsApproval: boolean };

export function ImportUploader({ classes, reviewPath }: { classes: ClassOption[]; reviewPath: string }) {
  const router = useRouter();
  const [classId, setClassId] = useState(classes[0]?.id ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = classes.find((c) => c.id === classId);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file || !classId) return;
    setBusy(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("classId", classId);
      body.append("file", file);
      const res = await fetch("/api/student-imports", { method: "POST", body });
      const data = (await res.json().catch(() => null)) as { ok?: boolean; batchId?: string; error?: string } | null;
      if (res.ok && data?.ok && data.batchId) router.push(`${reviewPath}?batch=${data.batchId}`);
      else setError(data?.error ?? "The upload failed. Please try again.");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 sm:max-w-lg">
      <div className="flex flex-col gap-2">
        <Label htmlFor="import-class">Class</Label>
        <Select id="import-class" value={classId} onChange={(e) => setClassId(e.target.value)} required>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        {selected?.needsApproval && (
          <p className="text-xs text-muted-foreground">You are not this class's Form Teacher, so its Form Teacher must approve this upload before the students are added.</p>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="import-file">Spreadsheet (.xlsx, up to 500 students)</Label>
        <Input id="import-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(e) => setFile(e.target.files?.[0] ?? null)} required />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={busy || !file || !classId}>{busy ? "Checking the file…" : "Upload and preview"}</Button>
        <Button asChild variant="outline">
          <a href="/api/import-template" download><Download className="size-4" aria-hidden="true" /> Download template</a>
        </Button>
      </div>
      <FormMessage error={error} />
      <p className="text-xs text-muted-foreground">Nothing is saved yet. You will see exactly what will happen to every row first.</p>
    </form>
  );
}
