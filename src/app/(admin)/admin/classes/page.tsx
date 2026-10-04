import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ActionButton } from "@/components/shared/action-button";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { setClassActive } from "./actions";
import { AddArmForm, AddLevelForm, AddSectionForm, LoadSampleButton } from "./class-forms";

export const metadata: Metadata = { title: "Classes" };

export default async function ClassesPage() {
  await requireRole(...ADMIN_ROLES);
  const sections = await db.section.findMany({
    orderBy: { sortOrder: "asc" },
    include: { levels: { orderBy: { sortOrder: "asc" }, include: { classes: { orderBy: { arm: "asc" } }, nextLevel: true } } },
  });
  const hasLevels = sections.some((s) => s.levels.length > 0);

  return (
    <>
      <PageHeader
        title="Classes"
        description="A level is a stage such as SS2. A class is one arm of a level, such as SS2A. Students move up one level each year."
      />

      {!hasLevels && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Start with a sample structure</CardTitle>
            <CardDescription>
              Loads Primary 1–6, JSS1–3 and SS1–3 (arm A) plus common subjects, so you can explore the system. This is
              sample data: change it when the school confirms its real structure.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoadSampleButton />
          </CardContent>
        </Card>
      )}

      <div className="mb-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Add a section</CardTitle>
            <CardDescription>For example Nursery, Primary or Secondary.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddSectionForm />
          </CardContent>
        </Card>
        {sections.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Add a level</CardTitle>
              <CardDescription>New levels are placed after the last one, and the previous level promotes into it.</CardDescription>
            </CardHeader>
            <CardContent>
              <AddLevelForm sections={sections.map((s) => ({ id: s.id, name: s.name }))} />
            </CardContent>
          </Card>
        )}
      </div>

      {!hasLevels ? (
        <EmptyState title="No classes yet">Load the sample structure above, or add a section and its levels.</EmptyState>
      ) : (
        <div className="flex flex-col gap-6">
          {sections.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <CardTitle>{section.name}</CardTitle>
              </CardHeader>
              <CardContent className="divide-y divide-border">
                {section.levels.length === 0 && <p className="text-sm text-muted-foreground">No levels yet.</p>}
                {section.levels.map((level) => (
                  <div key={level.id} className="flex flex-col gap-3 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-medium">{level.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {level.isFinal ? "Final level — students graduate" : level.nextLevel ? `Promotes to ${level.nextLevel.name}` : "No next level set"}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      {level.classes.map((c) => (
                        <span key={c.id} className="inline-flex items-center gap-2 rounded-lg border border-border px-2 py-1">
                          <span className="text-sm">{c.name}</span>
                          {!c.isActive && <Badge variant="outline">Disabled</Badge>}
                          <ActionButton
                            action={setClassActive}
                            input={{ classId: c.id, isActive: !c.isActive }}
                            label={c.isActive ? "Disable" : "Enable"}
                          />
                        </span>
                      ))}
                    </div>
                    <AddArmForm levelId={level.id} />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
