"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { submitEnquiryAction } from "@/app/(site)/contact/actions";
import { FieldError, FormMessage } from "@/components/shared/form-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const SEEN_KEY = "gsa-admission-popup";
const DELAY_MS = 3500;

const field = "h-14 rounded-2xl px-5 text-base";
const label = "text-xs font-extrabold uppercase tracking-[0.12em] text-navy";

/** Invites a new visitor to ask about admissions, once: closing or sending it means it never shows again on that device. */
export function AdmissionPopup() {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(submitEnquiryAction, undefined);
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(SEEN_KEY) === "1"; } catch { /* private mode: show it */ }
    if (seen) return;
    const t = window.setTimeout(() => setOpen(true), DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  const close = () => {
    setOpen(false);
    try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* ignore */ }
  };

  useEffect(() => {
    if (!open) return;
    first.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (state?.ok) try { localStorage.setItem(SEEN_KEY, "1"); } catch { /* ignore */ }
  }, [state]);

  if (!open) return null;
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <div className="fixed inset-0 z-[70] flex items-end justify-center bg-navy/55 p-3 backdrop-blur-sm sm:items-center sm:p-6" onClick={close}>
      <div role="dialog" aria-modal="true" aria-labelledby="admission-title" className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-[2rem] bg-white shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="relative bg-gradient-to-br from-primary via-indigo to-grape px-7 pb-7 pt-9 text-center text-white">
          <button type="button" onClick={close} aria-label="Close" className="absolute right-4 top-4 rounded-full p-2 text-white/80 hover:bg-white/10 hover:text-white">
            <X className="size-6" aria-hidden />
          </button>
          <h2 id="admission-title" className="text-3xl text-white sm:text-4xl">Join Giant Step Academy</h2>
          <p className="mt-2 text-white/85">Send your details for admissions guidance and to book a school tour.</p>
        </div>
        {state?.ok ? (
          <div className="px-7 py-9 text-center">
            <p className="font-serif text-2xl font-bold text-navy">Thank you!</p>
            <p className="mt-2 text-muted-foreground">We have your details and will call you soon.</p>
            <Button type="button" onClick={close} variant="accent" size="lg" className="mt-6 rounded-2xl">Continue to the website</Button>
          </div>
        ) : (
          <form action={formAction} className="flex flex-col gap-5 px-7 py-8" noValidate>
            <div aria-hidden="true" className="absolute -left-[9999px]"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
            <input type="hidden" name="interest" value="General" />
            <div className="flex flex-col gap-2.5">
              <label htmlFor="ap-name" className={label}>Parent&apos;s full name *</label>
              <Input ref={first} id="ap-name" name="name" autoComplete="name" placeholder="e.g. Chidi Okafor" className={field} required />
              <FieldError messages={errors.name} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2.5">
                <label htmlFor="ap-email" className={label}>Email address</label>
                <Input id="ap-email" name="email" type="email" autoComplete="email" placeholder="name@example.com" className={field} />
                <FieldError messages={errors.email} />
              </div>
              <div className="flex flex-col gap-2.5">
                <label htmlFor="ap-phone" className={label}>Phone number *</label>
                <Input id="ap-phone" name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="0803 000 0000" className={field} required />
                <FieldError messages={errors.phone} />
              </div>
            </div>
            <div className="flex flex-col gap-2.5">
              <label htmlFor="ap-class" className={label}>Class of interest (optional)</label>
              <Input id="ap-class" name="classOfInterest" placeholder="e.g. Nursery 1, Basic 3, SS1" className={field} />
            </div>
            <FormMessage error={state && !state.ok ? state.error : null} />
            <Button type="submit" variant="accent" size="lg" disabled={pending} className="h-14 text-lg">{pending ? "Sending…" : "Request admissions info"}</Button>
          </form>
        )}
      </div>
    </div>
  );
}
