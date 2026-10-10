import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ScopeTabs } from "@/components/results/scope-tabs";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { getComponents, getRules, hasScoresEntered } from "@/lib/results/config-store";
import { ComponentsEditor } from "./components-editor";
import { RulesForm } from "./rules-form";

export const metadata: Metadata = { title: "Assessment & rules" };

export default async function AssessmentPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  await requireRole(...ADMIN_ROLES);
  const sections = await db.section.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  const sp = await searchParams;
  const section = sections.find((s) => s.id === sp.section) ?? null;
  const scope = section?.id ?? null;

  const [own, global, overrides, locked, rules] = await Promise.all([
    getComponents(scope),
    getComponents(null),
    db.assessmentComponent.findMany({ where: { sectionId: { not: null }, isActive: true }, select: { sectionId: true }, distinct: ["sectionId"] }),
    hasScoresEntered(),
    getRules(),
  ]);

  const usingFallback = Boolean(section && own.length === 0 && global.length > 0);
  const initial = own.length ? own : global;

  return (
    <>
      <PageHeader title="Assessment & rules" description="How a subject's score is made up, and how averages and positions are worked out." />
      {sections.length > 0 && <ScopeTabs basePath="/admin/settings/assessment" sections={sections} selected={scope} overridden={new Set(overrides.map((o) => o.sectionId!))} />}

      {global.length === 0 && scope === null && (
        <p className="mb-6 rounded-lg bg-accent-soft px-3 py-2 text-sm">
          No score components have been saved yet. Use "Fill with sample" for a starting point, then enter the school's real marking scheme.
        </p>
      )}

      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>{section ? `${section.name} score components` : "Score components (all sections)"}</CardTitle>
            <CardDescription>For example CA out of 40 and Exam out of 60. A subject's total is the sum of its components.</CardDescription>
          </div>
          {section && (own.length ? <Badge variant="accent">Own setup</Badge> : <Badge variant="outline">Uses all-sections</Badge>)}
        </CardHeader>
        <CardContent>
          <ComponentsEditor
            key={scope ?? "all"}
            sectionId={scope}
            sectionName={section?.name ?? null}
            initial={initial}
            usingFallback={usingFallback}
            hasOverride={own.length > 0}
            locked={locked && own.length > 0}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Result rules</CardTitle>
          <CardDescription>These apply to the whole school. They are still to be confirmed with the school, so the safest option is chosen by default.</CardDescription>
        </CardHeader>
        <CardContent><RulesForm initial={rules} /></CardContent>
      </Card>
    </>
  );
}
