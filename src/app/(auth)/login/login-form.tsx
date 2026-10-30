"use client";

import Link from "next/link";
import { useActionState } from "react";
import { LogIn } from "lucide-react";
import { AuthLabel, authField } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { loginAction } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2.5">
        <AuthLabel htmlFor="email">Email address</AuthLabel>
        <Input id="email" name="email" type="email" autoComplete="username" inputMode="email" placeholder="you@example.com" className={authField} required />
      </div>
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <AuthLabel htmlFor="password">Password</AuthLabel>
          <Link href="/forgot-password" className="text-sm font-semibold text-accent hover:underline">Forgot password?</Link>
        </div>
        <PasswordInput id="password" name="password" autoComplete="current-password" placeholder="••••••••" className={authField} required />
      </div>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" variant="accent" disabled={pending} className="h-14 text-lg">
        <LogIn className="size-5" aria-hidden />
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
