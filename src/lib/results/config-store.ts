import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { ConflictError } from "@/lib/errors";
import type { Component } from "./calc";
import { validateBands, type GradeBand } from "./grading";
import { DEFAULT_RULES, SETTING_KEYS, parseRules, type ResultRules } from "./rules";

// Reads and writes the school's grading configuration.
// "Scope" is a section id, or null for the rule that applies to every section.
// A section's own setup wins; if it has none, the all-sections setup is used.

export type ComponentRow = { id: string; name: string; maxScore: number };

const num = (d: Prisma.Decimal | number) => Number(d);

// ─── Reading ───

export async function getRules(): Promise<ResultRules> {
  const rows = await db.systemSetting.findMany({ where: { key: { in: [SETTING_KEYS.tieMethod, SETTING_KEYS.incompletePolicy] } } });
  const byKey = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return parseRules({ tieMethod: byKey[SETTING_KEYS.tieMethod], incompletePolicy: byKey[SETTING_KEYS.incompletePolicy] });
}

export async function getComponents(scope: string | null): Promise<ComponentRow[]> {
  const rows = await db.assessmentComponent.findMany({ where: { sectionId: scope, isActive: true }, orderBy: { sortOrder: "asc" } });
  return rows.map((r) => ({ id: r.id, name: r.name, maxScore: num(r.maxScore) }));
}

export async function getBands(scope: string | null): Promise<GradeBand[] | null> {
  const scheme = await db.gradingScheme.findFirst({ where: { sectionId: scope, isActive: true }, include: { bands: { orderBy: { minScore: "desc" } } } });
  if (!scheme) return null;
  return scheme.bands.map((b) => ({ minScore: num(b.minScore), maxScore: num(b.maxScore), grade: b.grade, remark: b.remark }));
}

/** The components that apply to a section: its own, else the all-sections ones. */
export async function resolveComponents(sectionId: string | null): Promise<Component[]> {
  const own = sectionId ? await getComponents(sectionId) : [];
  return own.length ? own : await getComponents(null);
}

export async function resolveBands(sectionId: string | null): Promise<GradeBand[]> {
  const own = sectionId ? await getBands(sectionId) : null;
  return own ?? (await getBands(null)) ?? [];
}

/** Everything the calculation engine needs for one class's section. Used when results are entered (Phase 6). */
export async function loadCalcConfig(sectionId: string) {
  const [components, bands, rules] = await Promise.all([resolveComponents(sectionId), resolveBands(sectionId), getRules()]);
  return { components, bands, rules };
}

export const hasScoresEntered = async () => (await db.resultEntry.count()) > 0;

// ─── Writing ───

export async function saveRules(rules: ResultRules, userId: string) {
  await db.$transaction(
    Object.entries({ [SETTING_KEYS.tieMethod]: rules.tieMethod, [SETTING_KEYS.incompletePolicy]: rules.incompletePolicy }).map(([key, value]) =>
      db.systemSetting.upsert({ where: { key }, update: { value, updatedById: userId }, create: { key, value, updatedById: userId } }),
    ),
  );
}

export async function saveBands(scope: string | null, bands: GradeBand[]) {
  const problems = validateBands(bands);
  if (problems.length) throw new ConflictError(problems[0]);

  await db.$transaction(async (tx) => {
    const scheme =
      (await tx.gradingScheme.findFirst({ where: { sectionId: scope } })) ??
      (await tx.gradingScheme.create({ data: { name: scope ? "Section grading" : "School grading", sectionId: scope } }));
    await tx.gradingScheme.update({ where: { id: scheme.id }, data: { isActive: true } });
    await tx.gradeBand.deleteMany({ where: { schemeId: scheme.id } });
    await tx.gradeBand.createMany({
      data: bands.map((b, i) => ({
        schemeId: scheme.id, minScore: b.minScore, maxScore: b.maxScore, grade: b.grade.trim(), remark: b.remark?.trim() || null, sortOrder: i,
      })),
    });
  });
}

export async function removeBandsOverride(scope: string) {
  await db.gradingScheme.deleteMany({ where: { sectionId: scope } }); // its bands go with it
}

/**
 * Saves the score components for a scope.
 * Once any score has been entered, components can only be renamed: adding, removing or changing a
 * maximum would silently change the meaning of scores that already exist.
 */
export async function saveComponents(scope: string | null, rows: { id?: string; name: string; maxScore: number }[]) {
  const names = rows.map((r) => r.name.trim().toLowerCase());
  if (new Set(names).size !== names.length) throw new ConflictError("Two components have the same name.");

  await db.$transaction(async (tx) => {
    const existing = await tx.assessmentComponent.findMany({ where: { sectionId: scope, isActive: true } });
    const locked = (await tx.resultEntry.count()) > 0;

    if (locked) {
      const byId = new Map(existing.map((c) => [c.id, c]));
      const sameSet = rows.length === existing.length && rows.every((r) => r.id && byId.has(r.id));
      const sameMax = rows.every((r) => r.id && byId.get(r.id) && num(byId.get(r.id)!.maxScore) === r.maxScore);
      if (!sameSet || !sameMax) throw new ConflictError("Scores have already been entered, so components can only be renamed.");
    }

    const keep = new Set(rows.map((r) => r.id).filter(Boolean) as string[]);
    await tx.assessmentComponent.deleteMany({ where: { sectionId: scope, id: { notIn: [...keep] } } });

    for (const [i, r] of rows.entries()) {
      const data = { name: r.name.trim(), maxScore: r.maxScore, sortOrder: i, isActive: true };
      if (r.id && existing.some((c) => c.id === r.id)) await tx.assessmentComponent.update({ where: { id: r.id }, data });
      else await tx.assessmentComponent.create({ data: { ...data, sectionId: scope } });
    }
  });
}

export async function removeComponentsOverride(scope: string) {
  if (await hasScoresEntered()) throw new ConflictError("Scores have already been entered, so this setup cannot be removed.");
  await db.assessmentComponent.deleteMany({ where: { sectionId: scope } });
}

export { DEFAULT_RULES };
