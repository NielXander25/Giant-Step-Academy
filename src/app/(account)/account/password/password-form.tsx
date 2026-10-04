"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormMessage } from "@/components/shared/form-message";
import { useAction } from "@/lib/use-action";
import { changePassword } from "./actions";

export function PasswordForm({ forced }: { forced: boolean }) {
  const router = useRouter();
  const [currentPassword, setCurrent] = useState("");
  const [newPassword, setNew] = useState("");
  const [confirmPassword, setConfirm] = useState("");
  const { run, pending, error, fieldErrors, success } = useAction(changePassword, {
    onSuccess: () => {
      setCurrent(""); setNew(""); setConfirm("");
      if (forced) router.push("/dashboard");
    },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); run({ currentPassword, newPassword, confirmPassword }); }} className="flex flex-col gap-4 sm:max-w-sm">
      <div className="flex flex-col gap-2">
        <Label htmlFor="current">{forced ? "Temporary password" : "Current password"}</Label>
        <Input id="current" type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrent(e.target.value)} required />
        <FieldError messages={fieldErrors.currentPassword} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="new">New password</Label>
        <Input id="new" type="password" autoComplete="new-password" value={newPassword} onChange={(e) => setNew(e.target.value)} required />
        <p className="text-xs text-muted-foreground">At least 10 characters.</p>
        <FieldError messages={fieldErrors.newPassword} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirm">Confirm new password</Label>
        <Input id="confirm" type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirm(e.target.value)} required />
        <FieldError messages={fieldErrors.confirmPassword} />
      </div>
      <Button type="submit" disabled={pending || !currentPassword || !newPassword || !confirmPassword} className="self-start">
        {pending ? "Saving…" : "Change password"}
      </Button>
      <FormMessage error={error} success={success && !forced ? "Password changed." : null} />
    </form>
  );
}
