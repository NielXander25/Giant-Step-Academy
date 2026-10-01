import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Admin overview" };

export default async function AdminOverview() {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");

  const [teachers, pendingRequests, students, classes, sessions] = await Promise.all([
    db.user.count({ where: { role: "TEACHER", status: "ACTIVE" } }),
    db.teacherRequest.count({ where: { status: "PENDING" } }),
    db.student.count({ where: { status: "ACTIVE" } }),
    db.schoolClass.count({ where: { isActive: true } }),
    db.academicSession.count(),
  ]);

  const nextStep =
    sessions === 0
      ? "Create the first academic session and its terms."
      : classes === 0
        ? "Add the school's classes and subjects."
        : teachers === 0
          ? "Review teacher requests and assign teachers to classes."
          : "Students and results are next.";

  return (
    <>
      <PageHeader title={`Welcome, ${user.name.split(" ")[0]}`} description="A quick view of the school's records." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Active teachers" value={teachers} />
        <StatCard label="Pending requests" value={pendingRequests} />
        <StatCard label="Active students" value={students} />
        <StatCard label="Classes" value={classes} />
        <StatCard label="Sessions" value={sessions} />
      </div>
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Next step</CardTitle>
          <CardDescription>{nextStep}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Greyed-out items in the menu are built in later phases and switch on automatically as they arrive.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
