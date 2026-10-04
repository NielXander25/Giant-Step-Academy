import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Staff sign in", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");

  return (
    <main className="grid min-h-screen md:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-navy p-12 text-white md:flex">
        <div className="font-serif text-2xl">Giant Step Academy</div>
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 flex items-end gap-2 px-12 opacity-25">
          {[12, 22, 34, 46, 60].map((h, i) => (
            <div key={i} className={`w-14 rounded-t-md ${i === 4 ? "bg-accent" : "bg-white"}`} style={{ height: `${h * 4}px` }} />
          ))}
        </div>
        <div className="relative max-w-sm">
          <h2 className="text-4xl leading-tight">Staff portal</h2>
          <p className="mt-3 text-white/75">
            Manage students, enter results and keep the school running — all in one secure place.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <div className="mb-8 font-serif text-2xl text-navy md:hidden">Giant Step Academy</div>
          <h1 className="text-3xl text-navy">Sign in</h1>
          <p className="mb-8 mt-2 text-sm text-muted-foreground">For administrators and teachers. Students and parents do not need an account.</p>
          <LoginForm />
          <p className="mt-6 text-sm text-muted-foreground">
            Teacher without an account?{" "}
            <Link href="/register-teacher" className="text-primary underline underline-offset-4">Request one</Link>
            {" · "}
            <Link href="/" className="text-primary underline underline-offset-4">Back to home</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
