import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Staff sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your staff portal"
      footer={
        <>
          <p>New teacher? <Link href="/register-teacher" className="font-bold text-accent hover:underline">Request an account</Link></p>
          <Link href="/" className="hover:text-navy">← Back to website</Link>
        </>
      }
    >
      <LoginForm />
    </AuthShell>
  );
}
