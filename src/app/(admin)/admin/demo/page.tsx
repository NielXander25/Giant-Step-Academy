import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { requireRole } from "@/lib/auth/session";
import { getDemoGuide, isDemoSite } from "@/lib/demo/demo-school";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { clearDemoAction, loadDemoAction } from "./actions";

export const metadata: Metadata = { title: "Demo guide" };
export const dynamic = "force-dynamic";
// Building the practice school makes several hundred database writes: allow it time to finish.
export const maxDuration = 300;

/** Everything needed to present the system: logins, students, PINs and a running order. Demo site only. */
export default async function DemoGuidePage() {
  await requireRole(...ADMIN_ROLES);
  if (!isDemoSite()) notFound();
  const guide = await getDemoGuide();

  return (
    <>
      <PageHeader title="Demo guide" description="A practice school with a full practice term, for presenting the system. This is the demo site: nothing here touches the real school's records." />

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{guide ? "Practice school loaded" : "Load the practice school"}</CardTitle>
          <CardDescription>
            {guide
              ? `Loaded ${new Date(guide.loadedAt).toLocaleString("en-GB", { timeZone: "Africa/Lagos" })}. Load it again before a presentation to start fresh: it replaces the previous demo, PINs included.`
              : "Creates teachers, 48 students in six classes, a full practice term of scores at every stage of the approval chain, published results and 10 working PINs. Takes about a minute."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <ActionButton action={loadDemoAction} input={{}} label={guide ? "Reload practice school" : "Load practice school"} pendingLabel="Building the practice school…" variant="default" size="default"
            confirm={guide ? "Replace the practice school with a fresh copy? Anything done in the demo so far is cleared." : undefined} />
          {guide && <ActionButton action={clearDemoAction} input={{}} label="Remove practice school" confirm="Remove all practice students, teachers, results and PINs?" />}
        </CardContent>
      </Card>

      {guide && (
        <div className="flex flex-col gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Suggested running order</CardTitle>
              <CardDescription>About 15 minutes. Use two browsers (or a phone and a laptop) so you can be the teacher and the Admin at the same time.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal space-y-2 pl-5 text-sm">
                <li><strong>The website.</strong> Open the home page and the menu: About, Academics, Admissions, Gallery and Contact.</li>
                <li><strong>A parent checks a result.</strong> On <Link href="/results" className="text-primary underline" target="_blank">Check results</Link>, enter <em>Tunde Ajayi</em>, <em>DEMO/SS1/001</em> and one of the PINs below. Show the landscape report card, Download PDF and Print. Note the PIN now says 1 of 2 uses.</li>
                <li><strong>A subject teacher enters scores.</strong> Sign in as <em>english@…</em>, open JSS1A English Studies: half the class is entered. Fill in the rest, save and submit.</li>
                <li><strong>Fixing a mistake.</strong> Still as the English teacher, press <em>Take back to edit</em>, change a score and submit again.</li>
                <li><strong>The Form Teacher reviews.</strong> Sign in as <em>form.jss1@…</em>, open Reviews: approve English, then show sending Mathematics back with a reason.</li>
                <li><strong>The Admin approves and publishes.</strong> As the Admin, open Results → SS2A (waiting for the Admin). Approve, then Publish. Its students can now open their results with a PIN.</li>
                <li><strong>Correcting published results.</strong> On a published class, press <em>Send subjects back for correction</em>: the subject reopens for its teacher and parents can&apos;t open it until it&apos;s published again.</li>
                <li><strong>Security.</strong> Show Access logs (every attempt recorded) and that a wrong PIN or a PIN used twice is refused.</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sign-in accounts</CardTitle>
              <CardDescription>Every demo account uses the password <span className="font-mono font-semibold text-foreground">{guide.password}</span>. Your own Admin account works here too.</CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
              <Table>
                <THead><TR><TH>Name</TH><TH>Email</TH><TH>Role</TH></TR></THead>
                <TBody>
                  <TR><TD>{guide.admin.name}</TD><TD className="font-mono text-xs">{guide.admin.email}</TD><TD>Admin</TD></TR>
                  {guide.teachers.map((t) => <TR key={t.email}><TD>{t.name}</TD><TD className="font-mono text-xs">{t.email}</TD><TD>{t.role}</TD></TR>)}
                </TBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Result PINs</CardTitle>
              <CardDescription>Real PINs on the demo site: each opens a result twice, exactly as parents will experience it. Check their use on the PINs page.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-2 font-mono text-sm sm:grid-cols-5">
              {guide.pins.map((p) => <span key={p} className="rounded-md bg-primary-soft px-2 py-1 text-center">{p}</span>)}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Students</CardTitle>
              <CardDescription>Enter the name and admission number exactly as shown. Only classes marked published can be opened by parents.</CardDescription>
            </CardHeader>
            <CardContent className="p-2 sm:p-4">
              <Table>
                <THead><TR><TH>Student</TH><TH>Admission number</TH><TH>Class</TH><TH>Result</TH></TR></THead>
                <TBody>
                  {guide.students.map((s) => (
                    <TR key={s.admissionNumber}>
                      <TD>{s.name}</TD><TD className="font-mono text-xs">{s.admissionNumber}</TD><TD>{s.className}</TD>
                      <TD>{s.published ? <Badge variant="success">Published</Badge> : <Badge variant="outline">Not yet</Badge>}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
