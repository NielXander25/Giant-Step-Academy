import type { Metadata } from "next";
import { PageHeader } from "@/components/dashboard/page-header";
import { ScopeTabs } from "@/components/results/scope-tabs";
import { ScorePreview } from "@/components/results/score-preview";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { getBands, hasScoresEntered, resolveComponents } from "@/lib/results/config-store";
import { GradeBandsEditor } from "./grade-bands-editor";

export const metadata: Metadata = { title: "Grading" };

export default async function GradingPage({ searchParams }: { searchParams: Promise<{ section?: string }> }) {
  await requireRole(...ADMIN_ROLES);
  const sections = await db.section.findMany({ orderBy: { sortOrder: "asc" }, select: { id: true, name: true } });
  const sp = await searchParams;
  const section = sections.find((s) => s.id === sp.section) ?? null;
  const scope = section?.id ?? null;

  const [own, global, overrides, locked, components] = await Promise.all([
    getBands(scope),
    getBands(null),
    db.gradingScheme.findMany({ where: { sectionId: { not: null } }, select: { sectionId: true } }),
    hasScoresEntered(),
    resolveComponents(scope),
  ]);

  const initial = own ?? global ?? [];
  const effective = own ?? global ?? [];

  return (
    <>
      <PageHeader
        title="Grading"
        description="The grade a score earns. Set one scale for the whole school, or give a section (for example Primary) its own."
      />
      {sections.length === 0 && (
        <p className="mb-6 rounded-lg bg-accent-soft px-3 py-2 text-sm">Add sections on the Classes page to give a section its own grading. For now this applies to everyone.</p>
      )}
      {sections.length > 0 && <ScopeTabs basePath="/admin/settings/grading" sections={sections} selected={scope} overridden={new Set(overrides.map((o) => o.sectionId!))} />}

      {!global && scope === null && (
        <p className="mb-6 rounded-lg bg-accent-soft px-3 py-2 text-sm">
          No grading has been saved yet. Use "Fill with sample grades" for a starting point, then replace it with the school's official scale.
        </p>
      )}
      {locked && (
        <p className="mb-6 rounded-lg bg-accent-soft px-3 py-2 text-sm">Scores have already been entered. Changed grades apply to results calculated from now on.</p>
      )}

      <Card className="mb-6">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle>{section ? `${section.name} grading` : "All-sections grading"}</CardTitle>
            <CardDescription>Each row says which scores earn which grade.</CardDescription>
          </div>
          {section && (own ? <Badge variant="accent">Own grading</Badge> : <Badge variant="outline">Uses all-sections</Badge>)}
        </CardHeader>
        <CardContent>
          <GradeBandsEditor
            key={scope ?? "all"}
            sectionId={scope}
            sectionName={section?.name ?? null}
            initial={initial}
            usingFallback={Boolean(section && !own && global)}
            hasOverride={Boolean(own)}
          />
        </CardContent>
      </Card>

      {components.length > 0 && effective.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Try it</CardTitle>
            <CardDescription>Enter a score to see the total and grade from the saved setup.</CardDescription>
          </CardHeader>
          <CardContent><ScorePreview components={components} bands={effective} /></CardContent>
        </Card>
      )}
    </>
  );
}
