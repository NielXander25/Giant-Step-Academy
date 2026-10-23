"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, FormMessage } from "@/components/shared/form-message";
import { RichText } from "@/components/site/rich-text";
import {
  addGalleryItemsAction, saveAnnouncementAction, saveEventAction, saveGalleryAction, saveNewsAction, saveStaffAction, saveTestimonialAction,
} from "@/lib/cms/actions";
import type { FormField } from "@/lib/cms/modules";
import { uploadPicture } from "@/lib/cms/upload-client";
import { useAction } from "@/lib/use-action";
import type { ContentType } from "@/lib/validators/cms";
import { ImageField } from "./image-field";

type Values = Record<string, string>;
const ACTIONS = { news: saveNewsAction, events: saveEventAction, gallery: saveGalleryAction, staff: saveStaffAction, announcements: saveAnnouncementAction, testimonials: saveTestimonialAction } as const;

export function ContentForm({ type, fields, initial, id }: { type: ContentType; fields: FormField[]; initial: Values; id?: string }) {
  const router = useRouter();
  const [v, setV] = useState<Values>(initial);
  const [preview, setPreview] = useState(false);
  // The six actions share one shape here; the server checks every field again.
  const action = ACTIONS[type] as unknown as (input: Record<string, unknown>) => Promise<import("@/lib/action").ActionResult<unknown>>;
  const { run, pending, error, fieldErrors } = useAction(action, { onSuccess: () => router.push(`/admin/cms/content?type=${type}`) });
  const set = (name: string, value: string) => setV((s) => ({ ...s, [name]: value }));

  return (
    <form onSubmit={(e) => { e.preventDefault(); run({ ...v, ...(id ? { id } : {}) }); }} className="grid gap-5 sm:max-w-2xl">
      {fields.map((f) => (
        <div key={f.name} className="flex flex-col gap-2">
          {f.type === "image" ? (
            <ImageField label={f.label} value={v[f.name] ? { url: v[f.name], alt: "" } : null} onChange={(p) => set(f.name, p?.url ?? "")} showAlt={false} />
          ) : (
            <>
              <Label htmlFor={`f-${f.name}`}>{f.label}{f.required ? " *" : ""}</Label>
              {f.type === "text" && <Input id={`f-${f.name}`} value={v[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} required={f.required} />}
              {f.type === "number" && <Input id={`f-${f.name}`} type="number" min={0} max={9999} value={v[f.name] ?? "0"} onChange={(e) => set(f.name, e.target.value)} className="sm:w-32" />}
              {f.type === "datetime" && <Input id={`f-${f.name}`} type="datetime-local" value={v[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} required={f.required} className="sm:w-64" />}
              {f.type === "textarea" && <Textarea id={`f-${f.name}`} rows={4} value={v[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} required={f.required} />}
              {f.type === "select" && <Select id={`f-${f.name}`} value={v[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)}>{f.options!.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>}
              {f.type === "richtext" && (
                <>
                  {preview ? <div className="rounded-lg border border-border bg-white p-4"><RichText source={v[f.name]} /></div> : <Textarea id={`f-${f.name}`} rows={12} value={v[f.name] ?? ""} onChange={(e) => set(f.name, e.target.value)} required={f.required} />}
                  <p className="text-xs text-muted-foreground"><button type="button" className="underline" onClick={() => setPreview(!preview)}>{preview ? "Back to editing" : "Preview"}</button> · <code>## Heading</code> · <code>- bullet</code> · <code>**bold**</code> · <code>[link](https://…)</code> · blank line = new paragraph</p>
                </>
              )}
            </>
          )}
          {f.help && <p className="text-xs text-muted-foreground">{f.help}</p>}
          <FieldError messages={fieldErrors[f.name]} />
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : id ? "Save changes" : "Add"}</Button>
        <Button type="button" variant="ghost" onClick={() => router.push(`/admin/cms/content?type=${type}`)}>Cancel</Button>
      </div>
      <FormMessage error={error} />
    </form>
  );
}

/** Upload many pictures to the gallery at once. */
export function GalleryUploader() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState("");
  const [msg, setMsg] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function go(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true); setMsg(null);
    const urls: string[] = [];
    try {
      for (const file of Array.from(files).slice(0, 20)) urls.push(await uploadPicture(file));
      const r = await addGalleryItemsAction({ category: category || undefined, images: urls.map((url) => ({ url })) });
      if (!r.ok) throw new Error(r.error);
      setMsg({ kind: "success", text: `${urls.length} picture${urls.length === 1 ? "" : "s"} added.` });
      router.refresh();
    } catch (e) {
      setMsg({ kind: "error", text: (e instanceof Error ? e.message : "The upload failed.") + (urls.length ? ` ${urls.length} uploaded before the problem.` : "") });
    } finally { setBusy(false); }
  }
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-input p-4 sm:max-w-xl">
      <p className="text-sm font-medium">Add many pictures at once (up to 20)</p>
      <Input aria-label="Group (optional)" placeholder="Group, for example Sports (optional)" value={category} onChange={(e) => setCategory(e.target.value)} className="h-9" />
      <input type="file" multiple accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={(e) => go(e.target.files)} aria-label="Choose pictures" className="text-sm" />
      {busy && <p className="text-sm text-muted-foreground">Uploading… please wait.</p>}
      <FormMessage error={msg?.kind === "error" ? msg.text : null} success={msg?.kind === "success" ? msg.text : null} />
    </div>
  );
}
