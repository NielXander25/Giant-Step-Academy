import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetForm } from "./reset-form";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false, follow: false } };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      title="Forgot your password?"
      subtitle="Choose a new one. It starts working as soon as an Admin approves your request."
      footer={<Link href="/login" className="hover:text-navy">← Back to sign in</Link>}
    >
      <ResetForm />
    </AuthShell>
  );
}
