"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, FormMessage } from "@/components/shared/form-message";
import { useAction } from "@/lib/use-action";
import { saveTeacherProfile } from "./actions";

type Initial = { phone: string; staffNumber: string; qualification: string; bio: string };

export function OnboardingForm({ initial }: { initial: Initial }) {
  const [v, setV] = useState(initial);
  const { run, pending, error, fieldErrors, success } = useAction(saveTeacherProfile);
  const set = (k: keyof Initial) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setV({ ...v, [k]: e.target.value });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        run({ phone: v.phone, staffNumber: v.staffNumber || undefined, qualification: v.qualification || undefined, bio: v.bio || undefined });
      }}
      className="flex flex-col gap-4 sm:max-w-lg"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Phone number</Label>
        <Input id="phone" type="tel" inputMode="tel" value={v.phone} onChange={set("phone")} required />
        <FieldError messages={fieldErrors.phone} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="staffNumber">Staff number (optional)</Label>
        <Input id="staffNumber" value={v.staffNumber} onChange={set("staffNumber")} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="qualification">Qualification (optional)</Label>
        <Input id="qualification" value={v.qualification} onChange={set("qualification")} placeholder="B.Ed Mathematics" />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="bio">Short bio (optional)</Label>
        <Textarea id="bio" value={v.bio} onChange={set("bio")} maxLength={600} />
      </div>
      <Button type="submit" disabled={pending || !v.phone} className="self-start">{pending ? "Saving…" : "Save profile"}</Button>
      <FormMessage error={error} success={success ? "Profile saved." : null} />
    </form>
  );
}
