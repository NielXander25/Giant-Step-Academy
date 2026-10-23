"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { optimizeImage } from "@/lib/cms/helpers";
import { uploadPicture } from "@/lib/cms/upload-client";

export type PictureValue = { url: string; alt: string } | null;

/** Pick a picture from your computer or phone (uploaded safely), or paste a link. Shows what will appear on the site. */
export function ImageField({ label, value, onChange, help, showAlt = true }: { label: string; value: PictureValue; onChange: (v: PictureValue) => void; help?: string; showAlt?: boolean }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [link, setLink] = useState("");

  async function pick(file?: File) {
    if (!file) return;
    setBusy(true); setError(null);
    try { onChange({ url: await uploadPicture(file), alt: value?.alt ?? "" }); }
    catch (e) { setError(e instanceof Error ? e.message : "The upload failed."); }
    finally { setBusy(false); if (input.current) input.current.value = ""; }
  }
  const preview = optimizeImage(value?.url, 480);

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex h-28 w-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-input bg-muted text-xs text-muted-foreground">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {preview ? <img src={preview} alt="" className="h-full w-full object-cover" /> : "No picture yet"}
        </div>
        <div className="flex flex-col gap-2">
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label={`Choose a picture for ${label}`} onChange={(e) => pick(e.target.files?.[0])} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" disabled={busy} onClick={() => input.current?.click()}><ImagePlus className="size-4" aria-hidden="true" />{busy ? "Uploading…" : value ? "Replace picture" : "Choose picture"}</Button>
            {value && <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => onChange(null)}><Trash2 className="size-4" aria-hidden="true" />Remove</Button>}
          </div>
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer">Or paste a picture link</summary>
            <div className="mt-2 flex gap-2"><Input aria-label="Picture link" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://…" className="h-9" /><Button type="button" size="sm" variant="outline" onClick={() => { if (/^https:\/\/\S+$/i.test(link)) { onChange({ url: link, alt: value?.alt ?? "" }); setLink(""); setError(null); } else setError("Use a link starting with https://"); }}>Use</Button></div>
          </details>
          {help && <p className="text-xs text-muted-foreground">{help}</p>}
        </div>
      </div>
      {showAlt && value && (
        <div className="flex flex-col gap-1.5"><Label className="text-xs" htmlFor={`alt-${label}`}>Short description of the picture (for people who cannot see it)</Label><Input id={`alt-${label}`} value={value.alt} maxLength={200} onChange={(e) => onChange({ ...value, alt: e.target.value })} className="h-9" /></div>
      )}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </div>
  );
}
