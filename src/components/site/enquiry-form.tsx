"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FieldError, FormMessage } from "@/components/shared/form-message";
import { submitEnquiryAction } from "@/app/(site)/contact/actions";

export function EnquiryForm({ defaultInterest = "General" }: { defaultInterest?: string }) {
  const [state, formAction, pending] = useActionState(submitEnquiryAction, undefined);

  if (state?.ok) {
    return (
      <div role="status" className="rounded-2xl border border-border bg-primary-soft p-6">
        <p className="font-serif text-2xl text-navy">Thank you</p>
        <p className="mt-2 text-muted-foreground">We have received your message and will get back to you soon.</p>
      </div>
    );
  }
  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2" noValidate>
      <div aria-hidden="true" className="absolute -left-[9999px]"><label>Website<input name="website" tabIndex={-1} autoComplete="off" /></label></div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="enq-name">Your name</Label>
        <Input id="enq-name" name="name" autoComplete="name" required />
        <FieldError messages={errors.name} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="enq-phone">Phone number</Label>
        <Input id="enq-phone" name="phone" type="tel" inputMode="tel" autoComplete="tel" required />
        <FieldError messages={errors.phone} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="enq-email">Email (optional)</Label>
        <Input id="enq-email" name="email" type="email" inputMode="email" autoComplete="email" />
        <FieldError messages={errors.email} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="enq-interest">I am asking about</Label>
        <Select id="enq-interest" name="interest" defaultValue={defaultInterest}>
          <option>General</option><option>Nursery</option><option>Primary</option><option>Secondary</option>
        </Select>
      </div>
      <div className="flex flex-col gap-2 sm:col-span-2">
        <Label htmlFor="enq-message">Your message</Label>
        <Textarea id="enq-message" name="message" required maxLength={1000} />
        <FieldError messages={errors.message} />
      </div>
      <div className="flex flex-col items-start gap-3 sm:col-span-2">
        <FormMessage error={state && !state.ok ? state.error : null} />
        <Button type="submit" size="lg" disabled={pending}>{pending ? "Sending…" : "Send message"}</Button>
        <p className="text-xs text-muted-foreground">We only use your details to reply to you. See our <a href="/privacy" className="underline">privacy notice</a>.</p>
      </div>
    </form>
  );
}
