"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/shared/form-message";
import { savePageAction } from "@/lib/cms/actions";
import { saveLogoAction } from "@/app/(admin)/admin/settings/school/actions";
import { useAction } from "@/lib/use-action";
import { ImageField, type PictureValue } from "./image-field";

/** One picture on the website. Choose a new one, save, and it is live straight away. */
export function PictureSlot({ label, where, page, blockKey, initial, logo = false }: { label: string; where: string; page?: string; blockKey?: string; initial: PictureValue; logo?: boolean }) {
  const [value, setValue] = useState(initial);
  const page_ = useAction(savePageAction);
  const logo_ = useAction(saveLogoAction);
  const pending = page_.pending || logo_.pending;
  const done = page_.success || logo_.success;
  const save = () => (logo ? logo_.run({ logoUrl: value?.url ?? "" }) : page_.run({ page: page!, values: { [blockKey!]: value } }));

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div><p className="font-serif text-lg text-navy">{label}</p><p className="text-xs text-muted-foreground">{where}</p></div>
      <ImageField label={label} value={value} onChange={(v) => setValue(logo && v ? { ...v, alt: "" } : v)} showAlt={!logo} />
      <div className="flex items-center gap-3"><Button type="button" size="sm" disabled={pending} onClick={save}>{pending ? "Saving…" : "Save picture"}</Button><FormMessage error={page_.error ?? logo_.error} success={done ? "Saved. Live on the website." : null} /></div>
    </div>
  );
}
