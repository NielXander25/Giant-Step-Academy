"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormMessage } from "@/components/shared/form-message";
import { useAction } from "@/lib/use-action";
import type { ReportLayout } from "@/lib/results/report-layout";
import { saveReportLayoutAction, saveSchoolProfile } from "./actions";

type Profile = { name: string; motto: string; address: string; phone: string; email: string; principalName: string; logoUrl: string; websiteUrl: string };

export function SchoolProfileForm({ initial }: { initial: Profile }) {
  const [v, setV] = useState(initial);
  const { run, pending, error, fieldErrors, success } = useAction(saveSchoolProfile);
  const bind = (k: keyof Profile) => ({ value: v[k], onChange: (e: React.ChangeEvent<HTMLInputElement>) => setV({ ...v, [k]: e.target.value }) });

  return (
    <form onSubmit={(e) => { e.preventDefault(); run({ name: v.name, motto: v.motto, address: v.address, phone: v.phone, email: v.email, principalName: v.principalName, logoUrl: v.logoUrl, websiteUrl: v.websiteUrl }); }} className="grid gap-4 sm:max-w-2xl sm:grid-cols-2">
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="s-name">School name</Label>
        <Input id="s-name" required {...bind("name")} />
        <FieldError messages={fieldErrors.name} />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="s-motto">Motto</Label>
        <Input id="s-motto" {...bind("motto")} />
        <FieldError messages={fieldErrors.motto} />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="s-address">Address</Label>
        <Input id="s-address" {...bind("address")} />
        <FieldError messages={fieldErrors.address} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="s-phone">Phone / WhatsApp</Label>
        <Input id="s-phone" inputMode="tel" {...bind("phone")} placeholder="0813 913 9020 / 0911 696 1727" />
        <FieldError messages={fieldErrors.phone} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="s-email">Email</Label>
        <Input id="s-email" type="email" {...bind("email")} />
        <FieldError messages={fieldErrors.email} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="s-principal">Principal's name</Label>
        <Input id="s-principal" {...bind("principalName")} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="s-web">Website</Label>
        <Input id="s-web" inputMode="url" {...bind("websiteUrl")} placeholder="https://" />
        <FieldError messages={fieldErrors.websiteUrl} />
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="s-logo">Logo link</Label>
        <Input id="s-logo" inputMode="url" {...bind("logoUrl")} placeholder="https://…/logo.png" />
        <p className="text-xs text-muted-foreground">A secure link to a PNG or JPG image. Uploading the logo straight from this page arrives with the website content manager (Phase 9).</p>
        <FieldError messages={fieldErrors.logoUrl} />
      </div>
      <div className="flex flex-col items-start gap-3 sm:col-span-2">
        <Button type="submit" disabled={pending || !v.name}>{pending ? "Saving…" : "Save school details"}</Button>
        <FormMessage error={error} success={success ? "School details saved." : null} />
      </div>
    </form>
  );
}

const SWITCHES: { key: keyof Omit<ReportLayout, "footerNote">; label: string; help: string }[] = [
  { key: "showGender", label: "Show the student's gender", help: "" },
  { key: "showPosition", label: "Show the class position", help: "Turn off if the school does not rank students on the report." },
  { key: "showClassSize", label: "Show the number of students (\"3rd of 28\")", help: "Only applies when the position is shown." },
  { key: "showSignatures", label: "Show signature lines", help: "For the Form Teacher and the Principal." },
];

export function ReportLayoutForm({ initial }: { initial: ReportLayout }) {
  const [v, setV] = useState(initial);
  const { run, pending, error, success } = useAction(saveReportLayoutAction);

  return (
    <form onSubmit={(e) => { e.preventDefault(); run(v); }} className="flex flex-col gap-4 sm:max-w-xl">
      {SWITCHES.map((s) => (
        <label key={s.key} className="flex items-start gap-3">
          <input type="checkbox" className="mt-1 size-4" checked={v[s.key]} onChange={(e) => setV({ ...v, [s.key]: e.target.checked })} />
          <span>
            <span className="block text-sm font-medium">{s.label}</span>
            {s.help && <span className="block text-xs text-muted-foreground">{s.help}</span>}
          </span>
        </label>
      ))}
      <div className="flex flex-col gap-2">
        <Label htmlFor="r-note">Note at the bottom of every report (optional)</Label>
        <Input id="r-note" maxLength={200} value={v.footerNote} onChange={(e) => setV({ ...v, footerNote: e.target.value })} placeholder="e.g. Next term begins on 5 January" />
      </div>
      <div className="flex flex-col items-start gap-3">
        <Button type="submit" disabled={pending}>{pending ? "Saving…" : "Save report layout"}</Button>
        <FormMessage error={error} success={success ? "Report layout saved." : null} />
      </div>
    </form>
  );
}
