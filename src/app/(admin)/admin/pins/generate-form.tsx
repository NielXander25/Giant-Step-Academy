"use client";

import { useState } from "react";
import { Copy, Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormMessage } from "@/components/shared/form-message";
import { generatePinsAction } from "@/lib/pin/actions";
import { useAction } from "@/lib/use-action";

export function GeneratePinsForm({ disabled }: { disabled: boolean }) {
  const [count, setCount] = useState("10");
  const [label, setLabel] = useState("");
  const [pins, setPins] = useState<string[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [pdf, setPdf] = useState<{ busy: boolean; error: string | null }>({ busy: false, error: null });
  const { run, pending, error, fieldErrors } = useAction(generatePinsAction, { onSuccess: (d) => { setPins(d.pins); setCopied(false); } });

  const csv = () => {
    const rows = ["No.,PIN,Label", ...(pins ?? []).map((p, i) => `${String(i + 1).padStart(3, "0")},${p},"${label.replaceAll('"', '""')}"`)];
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: "result-pins.csv" });
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = async () => {
    setPdf({ busy: true, error: null });
    try {
      const res = await fetch("/api/pins/pdf", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pins, label: label || undefined }) });
      if (!res.ok) throw new Error((await res.text()) || "The PDF could not be made.");
      const url = URL.createObjectURL(await res.blob());
      const a = Object.assign(document.createElement("a"), { href: url, download: `result-pins-${new Date().toISOString().slice(0, 10)}.pdf` });
      a.click();
      URL.revokeObjectURL(url);
      setPdf({ busy: false, error: null });
    } catch (e) {
      setPdf({ busy: false, error: e instanceof Error ? e.message : "The PDF could not be made." });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={(e) => { e.preventDefault(); run({ count: Number(count), label: label || undefined }); }} className="grid gap-4 sm:max-w-xl sm:grid-cols-[1fr_2fr]">
        <div className="flex flex-col gap-2">
          <Label htmlFor="pin-count">How many</Label>
          <Input id="pin-count" type="number" min={1} max={100} value={count} onChange={(e) => setCount(e.target.value)} required />
          <FieldError messages={fieldErrors.count} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="pin-label">Note (optional)</Label>
          <Input id="pin-label" value={label} maxLength={60} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. First Term 2026/2027" />
        </div>
        <div className="flex flex-col items-start gap-3 sm:col-span-2">
          <Button type="submit" disabled={pending || disabled || !count}>{pending ? "Creating…" : "Create PINs"}</Button>
          <FormMessage error={error} />
        </div>
      </form>

      {pins && (
        <div role="status" className="rounded-xl border border-accent bg-accent-soft p-4">
          <p className="font-medium">Save these {pins.length} PIN{pins.length === 1 ? "" : "s"} now.</p>
          <p className="mb-3 text-sm text-muted-foreground">For security the system keeps only a scrambled copy. They cannot be shown again once you leave or hide this box.</p>
          <ol className="mb-4 grid gap-1 font-mono text-sm sm:grid-cols-3">{pins.map((p, i) => <li key={p}><span className="text-muted-foreground">{String(i + 1).padStart(3, "0")}.</span> {p}</li>)}</ol>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="accent" size="sm" onClick={downloadPdf} disabled={pdf.busy}>
              <FileText className="size-4" aria-hidden="true" /> {pdf.busy ? "Making PDF…" : "Download printable PDF"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={async () => { await navigator.clipboard.writeText(pins.join("\n")); setCopied(true); }}>
              <Copy className="size-4" aria-hidden="true" /> {copied ? "Copied" : "Copy all"}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={csv}><Download className="size-4" aria-hidden="true" /> Download CSV</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => { if (window.confirm("Hide these PINs? You will not be able to see them again.")) setPins(null); }}>I have saved them</Button>
          </div>
          {pdf.error && <p role="alert" className="mt-2 text-sm text-destructive">{pdf.error}</p>}
        </div>
      )}
    </div>
  );
}
