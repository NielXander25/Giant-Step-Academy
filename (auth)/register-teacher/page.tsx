import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Teacher registration", robots: { index: false, follow: false } };

export default function RegisterTeacherPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-6 font-serif text-2xl text-navy">Giant Step Academy</div>
      <h1 className="text-3xl text-navy">Teacher registration</h1>
      <p className="mb-8 mt-2 text-sm text-muted-foreground">
        Request a staff account. An administrator reviews every request before you can sign in.
      </p>
      <RegisterForm />
      <p className="mt-6 text-sm text-muted-foreground">
        Already approved? <Link href="/login" className="text-primary underline underline-offset-4">Sign in</Link>
      </p>
    </main>
  );
}
