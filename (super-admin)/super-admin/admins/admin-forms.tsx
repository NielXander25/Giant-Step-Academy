"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormMessage } from "@/components/shared/form-message";
import { useAction } from "@/lib/use-action";
import { createAdmin } from "./actions";

export function NewAdminForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [canCreateAdmins, setCanCreateAdmins] = useState(false);
  const { run, pending, error, fieldErrors, success } = useAction(createAdmin, {
    onSuccess: () => { setName(""); setEmail(""); setTemporaryPassword(""); setCanCreateAdmins(false); },
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); run({ name, email, temporaryPassword, canCreateAdmins }); }} className="grid gap-4 sm:max-w-xl">
      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-name">Full name</Label>
        <Input id="admin-name" value={name} onChange={(e) => setName(e.target.value)} required />
        <FieldError messages={fieldErrors.name} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-email">Email address</Label>
        <Input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <FieldError messages={fieldErrors.email} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="admin-password">Temporary password</Label>
        <Input id="admin-password" type="text" autoComplete="off" value={temporaryPassword} onChange={(e) => setTemporaryPassword(e.target.value)} required />
        <p className="text-xs text-muted-foreground">At least 12 characters. Share it privately; the admin must change it at first sign-in.</p>
        <FieldError messages={fieldErrors.temporaryPassword} />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={canCreateAdmins} onChange={(e) => setCanCreateAdmins(e.target.checked)} className="size-4" />
        Allow this admin to create other admins
      </label>
      <div className="flex flex-col items-start gap-3">
        <Button type="submit" disabled={pending || !name || !email || temporaryPassword.length < 12}>{pending ? "Creating…" : "Create admin"}</Button>
        <FormMessage error={error} success={success ? "Admin account created." : null} />
      </div>
    </form>
  );
}
