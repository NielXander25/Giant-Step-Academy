"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/shared/form-message";
import { RichText } from "@/components/site/rich-text";
import type { BlockDef, BlockValue, ImageValue, ItemField, ListValue } from "@/lib/cms/blocks";
import { resetBlockAction, savePageAction } from "@/lib/cms/actions";
import { useAction } from "@/lib/use-action";
import { ImageField } from "./image-field";

function RichField({ id, value, onChange }: { id: string; value: string; onChange: (v: string) => void }) {
  const [preview, setPreview] = useState(false);
  return (
    <div className="flex flex-col gap-2">
      {preview ? <div className="rounded-lg border border-border bg-white p-4"><RichText source={value} /></div> : <Textarea id={id} rows={8} value={value} onChange={(e) => onChange(e.target.value)} />}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <button type="button" className="underline" onClick={() => setPreview(!preview)}>{preview ? "Back to editing" : "Preview"}</button>
        <span>Formatting: <code>## Heading</code> · <code>- bullet</code> · <code>**bold**</code> · <code>*italic*</code> · <code>[link](https://…)</code> · blank line = new paragraph</span>
      </div>
    </div>
  );
}

function ItemInput({ field, value, onChange, id }: { field: ItemField; value: string; onChange: (v: string) => void; id: string }) {
  if (field.type === "image") return <ImageField label={field.label} value={value ? { url: value, alt: "" } : null} onChange={(v) => onChange(v?.url ?? "")} showAlt={false} />;
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-xs">{field.label}</Label>
      {field.type === "textarea" ? <Textarea id={id} rows={3} value={value} maxLength={2000} onChange={(e) => onChange(e.target.value)} /> : <Input id={id} value={value} maxLength={300} onChange={(e) => onChange(e.target.value)} />}
    </div>
  );
}

function ListEditor({ def, value, onChange }: { def: BlockDef; value: ListValue; onChange: (v: ListValue) => void }) {
  const fields = def.itemFields!;
  const blank = Object.fromEntries(fields.map((f) => [f.key, ""]));
  const move = (i: number, d: -1 | 1) => { const next = [...value]; const j = i + d; if (j < 0 || j >= next.length) return; [next[i], next[j]] = [next[j], next[i]]; onChange(next); };
  return (
    <div className="flex flex-col gap-3">
      {value.map((item, i) => (
        <div key={i} className="rounded-xl border border-border bg-muted/40 p-4">
          <div className="mb-3 flex items-center justify-between"><p className="text-xs font-medium text-muted-foreground">Item {i + 1}</p>
            <div className="flex gap-1">
              <Button type="button" size="icon" variant="ghost" aria-label="Move up" onClick={() => move(i, -1)} disabled={i === 0}><ArrowUp className="size-4" /></Button>
              <Button type="button" size="icon" variant="ghost" aria-label="Move down" onClick={() => move(i, 1)} disabled={i === value.length - 1}><ArrowDown className="size-4" /></Button>
              <Button type="button" size="icon" variant="ghost" aria-label="Remove item" onClick={() => onChange(value.filter((_, j) => j !== i))}><Trash2 className="size-4" /></Button>
            </div></div>
          <div className="grid gap-3">{fields.map((f) => <ItemInput key={f.key} id={`${def.key}-${i}-${f.key}`} field={f} value={item[f.key] ?? ""} onChange={(v) => onChange(value.map((it, j) => (j === i ? { ...it, [f.key]: v } : it)))} />)}</div>
        </div>
      ))}
      {value.length < (def.maxItems ?? 12) && <Button type="button" variant="outline" size="sm" className="self-start" onClick={() => onChange([...value, { ...blank }])}><Plus className="size-4" aria-hidden="true" />Add an item</Button>}
    </div>
  );
}

export function BlockEditor({ page, defs, initial, saved }: { page: string; defs: BlockDef[]; initial: Record<string, BlockValue>; saved: string[] }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [custom, setCustom] = useState(new Set(saved));
  const save = useAction(savePageAction, { onSuccess: () => setCustom(new Set(defs.map((d) => d.key))) });
  const reset = useAction(resetBlockAction, { onSuccess: () => router.refresh() });
  const set = (key: string, v: BlockValue) => setValues((s) => ({ ...s, [key]: v }));
  const groups = [...new Set(defs.map((d) => d.group))];

  return (
    <div className="flex flex-col gap-6">
      {groups.map((group) => (
        <Card key={group}>
          <CardHeader><CardTitle>{group}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-6">
            {defs.filter((d) => d.group === group).map((def) => (
              <div key={def.key} className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {def.type === "image" || def.type === "list" ? <p className="text-sm font-medium">{def.label}</p> : <Label htmlFor={def.key}>{def.label}</Label>}
                  {custom.has(def.key)
                    ? <button type="button" className="inline-flex items-center gap-1 text-xs text-muted-foreground underline" onClick={() => { if (window.confirm("Go back to the sample text for this part?")) { reset.run({ key: def.key }); set(def.key, def.default); setCustom((c) => { const n = new Set(c); n.delete(def.key); return n; }); } }}><RotateCcw className="size-3" aria-hidden="true" />Use sample text</button>
                    : <span className="text-xs text-muted-foreground">Sample text</span>}
                </div>
                {def.type === "text" && <Input id={def.key} value={values[def.key] as string} maxLength={200} onChange={(e) => set(def.key, e.target.value)} />}
                {def.type === "textarea" && <Textarea id={def.key} rows={3} value={values[def.key] as string} maxLength={1500} onChange={(e) => set(def.key, e.target.value)} />}
                {def.type === "richtext" && <RichField id={def.key} value={values[def.key] as string} onChange={(v) => set(def.key, v)} />}
                {def.type === "image" && <ImageField label={def.label} value={values[def.key] as ImageValue} onChange={(v) => set(def.key, v)} />}
                {def.type === "list" && <ListEditor def={def} value={values[def.key] as ListValue} onChange={(v) => set(def.key, v)} />}
                {def.help && <p className="text-xs text-muted-foreground">{def.help}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
      <div className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-white/95 p-4 shadow-lg backdrop-blur">
        <Button type="button" disabled={save.pending} onClick={() => save.run({ page, values })}>{save.pending ? "Saving…" : "Save changes"}</Button>
        <FormMessage error={save.error ?? reset.error} success={save.success ? "Saved. The website is updated." : null} />
      </div>
    </div>
  );
}
