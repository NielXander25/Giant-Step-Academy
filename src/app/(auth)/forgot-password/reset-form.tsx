"use client";

import Link from "next/link";
import { useActionState } from "react";
import { AuthLabel, authField } from "@/components/auth/auth-shell";
import { FieldError, FormMessage } from "@/components/shared/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { requestPasswordResetAction } from "./actions";

export function ResetForm() {
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, undefined);

  if (state?.ok) {
    return (
      <div role="status" className="rounded-2xl border border-border bg-cream p-5">
        <p className="font-serif text-xl font-bold text-navy">Request sent</p>
        <p className="mt-2 text-sm text-muted-foreground">
          If that email belongs to a teacher&apos;s account, an Admin will review the request. Once it is approved, sign in with the new password you just chose.
        </p>
        <Link href="/login" className="mt-4 inline-block font-bold text-accent hover:underline">Back to sign in</Link>
      </div>
    );
  }

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};
  return (
    <form action={formAction} className="flex flex-col gap-5" noValidate>
      <div aria-hidden="true" className="absolute -left-[9999px]">
        <label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
      </div>
      <div className="flex flex-col gap-2.5">
        <AuthLabel htmlFor="email">Email address</AuthLabel>
        <Input id="email" name="email" type="email" autoComplete="username" inputMode="email" placeholder="you@example.com" className={authField} required />
        <FieldError messages={errors.email} />
      </div>
      <div className="flex flex-col gap-2.5">
        <AuthLabel htmlFor="password">New password</AuthLabel>
        <PasswordInput id="password" name="password" autoComplete="new-password" className={authField} required />
        <p className="text-xs text-muted-foreground">At least 10 characters.</p>
        <FieldError messages={errors.password} />
      </div>
      <div className="flex flex-col gap-2.5">
        <AuthLabel htmlFor="confirmPassword">Confirm new password</AuthLabel>
        <PasswordInput id="confirmPassword" name="confirmPassword" autoComplete="new-password" className={authField} required />
        <FieldError messages={errors.confirmPassword} />
      </div>
      <FormMessage error={state && !state.ok ? state.error : null} />
      <Button type="submit" size="lg" variant="accent" disabled={pending} className="h-14 rounded-2xl text-lg">{pending ? "Sending…" : "Ask for a new password"}</Button>
    </form>
  );
}
