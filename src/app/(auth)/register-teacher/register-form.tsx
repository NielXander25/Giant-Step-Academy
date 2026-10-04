"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError, FormMessage } from "@/components/shared/form-message";
import { registerTeacherAction } from "./actions";

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(registerTeacherAction, undefined);

  if (state?.ok) {
    return (
      <div role="status" className="rounded-xl border border-border bg-primary-soft p-5">
        <p className="font-serif text-xl text-navy">Request received</p>
        <p className="mt-2 text-sm text-muted-foreground">
          An administrator will review it. You can sign in once it is approved, using the email and password you just chose.
        </p>
      </div>
    );
  }

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {/* Spam trap: hidden from people, visible to bots */}
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="fullName">Full name</Label>
        <Input id="fullName" name="fullName" autoComplete="name" required />
        <FieldError messages={errors.fullName} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">Email address</Label>
        <Input id="email" name="email" type="email" autoComplete="email" inputMode="email" required />
        <FieldError messages={errors.email} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" />
        <FieldError messages={errors.phone} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">Choose a password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" required />
        <p className="text-xs text-muted-foreground">At least 10 characters.</p>
        <FieldError messages={errors.password} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="confirmPassword">Confirm password</Label>
        <Input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required />
        <FieldError messages={errors.confirmPassword} />
      </div>
      <FormMessage error={state && !state.ok ? state.error : null} />
      <Button type="submit" size="lg" disabled={pending}>{pending ? "Sending…" : "Request an account"}</Button>
    </form>
  );
}
