import type { Metadata } from "next";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { isDemoSite } from "@/lib/demo/mode";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Teacher registration", robots: { index: false, follow: false } };

export default function RegisterTeacherPage() {
  return (
    <AuthShell
      title="Join the staff portal"
      subtitle={isDemoSite()
        ? "Create a practice account. It is ready at once: no approval is needed on the demo site."
        : "Request a staff account. An administrator reviews every request before you can sign in."}
      footer={<p>Already approved? <Link href="/login" className="font-bold text-accent hover:underline">Sign in</Link></p>}
    >
      <RegisterForm />
    </AuthShell>
  );
}
