import { describe, expect, it } from "vitest";
import { planPromotion, type ClassRow, type EnrollmentRow, type LevelRow } from "./plan";

const levels: LevelRow[] = [
  { id: "p6", name: "Primary 6", nextLevelId: "j1", isFinal: false },
  { id: "j1", name: "JSS1", nextLevelId: "j2", isFinal: false },
  { id: "j2", name: "JSS2", nextLevelId: "ss3", isFinal: false },
  { id: "ss3", name: "SS3", nextLevelId: null, isFinal: true },
  { id: "odd", name: "Odd", nextLevelId: null, isFinal: false }, // misconfigured: no next level, not final
];
const classes: ClassRow[] = [
  { id: "p6a", name: "Primary 6A", levelId: "p6", arm: "A", isActive: true },
  { id: "j1a", name: "JSS1A", levelId: "j1", arm: "A", isActive: true },
  { id: "j1b", name: "JSS1B", levelId: "j1", arm: "B", isActive: true },
  { id: "j2a", name: "JSS2A", levelId: "j2", arm: "A", isActive: true },
  { id: "j2c", name: "JSS2C", levelId: "j2", arm: "C", isActive: false }, // exists but disabled
  { id: "ss3a", name: "SS3A", levelId: "ss3", arm: "A", isActive: true },
  { id: "odd1", name: "Odd1", levelId: "odd", arm: "A", isActive: true },
];
let n = 0;
const st = (classId: string, o: Partial<EnrollmentRow> = {}): EnrollmentRow => ({ id: `e${++n}`, studentId: `s${n}`, classId, isRepeater: false, studentActive: true, ...o });
const plan = (enrollments: EnrollmentRow[], extra: Partial<Parameters<typeof planPromotion>[0]> = {}) =>
  planPromotion({ levels, classes, enrollments, alreadyInNewSession: new Set(), ...extra });

describe("promoting a school up a year", () => {
  it("moves everyone into the same arm of the next level", () => {
    const p = plan([st("j1a"), st("j1a"), st("j1b")]);
    const a = p.classes.find((c) => c.sourceClassId === "j1a")!;
    expect(a.target).toEqual({ kind: "CLASS", classId: "j2a", className: "JSS2A" });
    expect(p.operations.filter((o) => o.targetClassId === "j2a")).toHaveLength(2);
    expect(p.totals).toMatchObject({ promote: 3, repeat: 0, graduate: 0, notPromoted: 0, classesToCreate: 1 }); // JSS1B -> JSS2B does not exist yet
  });
  it("students marked to repeat stay in their own class", () => {
    const p = plan([st("j1a"), st("j1a", { isRepeater: true })]);
    const ops = p.operations;
    expect(ops.filter((o) => o.kind === "REPEAT")).toEqual([expect.objectContaining({ targetClassId: "j1a" })]);
    expect(ops.filter((o) => o.kind === "PROMOTE")).toHaveLength(1);
    expect(p.totals).toMatchObject({ promote: 1, repeat: 1 });
  });
  it("students in the final level graduate, and a repeater in the final level stays", () => {
    const p = plan([st("ss3a"), st("ss3a"), st("ss3a", { isRepeater: true })]);
    expect(p.totals).toMatchObject({ graduate: 2, repeat: 1, promote: 0 });
    expect(p.classes[0].target).toEqual({ kind: "GRADUATE" });
  });
  it("crosses sections when the levels are linked that way (Primary 6 to JSS1)", () => {
    expect(plan([st("p6a")]).classes[0].target).toEqual({ kind: "CLASS", classId: "j1a", className: "JSS1A" });
  });
  it("offers to create a missing arm instead of failing, once however many students need it", () => {
    const p = plan([st("j1b"), st("j1b"), st("j1b")]);
    expect(p.classes[0].target).toEqual({ kind: "CREATE", levelId: "j2", arm: "B", name: "JSS2B" });
    expect(p.newClasses).toEqual([{ key: "j2:B", levelId: "j2", arm: "B", name: "JSS2B" }]);
    expect(p.operations.every((o) => o.createKey === "j2:B")).toBe(true);
  });
  it("does not create a class nobody would move into", () => {
    expect(plan([st("j1b", { isRepeater: true })]).newClasses).toEqual([]);
  });
  it("leaves students behind, and says why, when the destination is unusable", () => {
    const disabled = plan([st("j2a")], { classes: classes.map((c) => (c.id === "ss3a" ? { ...c, isActive: false } : c)) });
    expect(disabled.classes[0]).toMatchObject({ notPromoted: 1, target: { kind: "BLOCKED" } });
    expect(disabled.totals.notPromoted).toBe(1);
    expect(disabled.operations).toHaveLength(0);
    const odd = plan([st("odd1"), st("odd1", { isRepeater: true })]);
    expect(odd.classes[0].target).toMatchObject({ kind: "BLOCKED", reason: expect.stringContaining("No next level") });
    expect(odd.totals).toMatchObject({ notPromoted: 1, repeat: 1 }); // the repeater still stays
  });
  it("an Admin's override wins: another class, or graduate", () => {
    expect(plan([st("j1a")], { overrides: { j1a: "ss3a" } }).classes[0].target).toEqual({ kind: "CLASS", classId: "ss3a", className: "SS3A" });
    expect(plan([st("j1a")], { overrides: { j1a: "GRADUATE" } }).totals.graduate).toBe(1);
    expect(plan([st("j1a")], { overrides: { j1a: "j2c" } }).classes[0].target).toMatchObject({ kind: "BLOCKED" }); // disabled
    expect(plan([st("j1a")], { overrides: { j1a: "nope" } }).classes[0].target).toMatchObject({ kind: "BLOCKED" });
  });
  it("leaves inactive students and students already in the new session alone", () => {
    const keep = st("j1a");
    const p = plan([keep, st("j1a", { studentActive: false }), st("j1a")], { alreadyInNewSession: new Set([keep.studentId]) });
    expect(p.totals).toMatchObject({ promote: 1, inactive: 1, alreadyInNewSession: 1 });
    expect(p.operations.map((o) => o.studentId)).not.toContain(keep.studentId);
  });
  it("running it again after everyone is moved does nothing", () => {
    const list = [st("j1a"), st("j2a"), st("ss3a")];
    const again = plan(list, { alreadyInNewSession: new Set(list.map((e) => e.studentId)) });
    expect(again.operations).toHaveLength(0);
    expect(again.totals.alreadyInNewSession).toBe(3);
  });
  it("counts add up across a whole school, and every student appears at most once", () => {
    const list = [...Array(5).fill(0).map(() => st("p6a")), ...Array(4).fill(0).map(() => st("j1a")), st("j1a", { isRepeater: true }), ...Array(3).fill(0).map(() => st("ss3a"))];
    const p = plan(list);
    expect(p.totals.promote + p.totals.repeat + p.totals.graduate + p.totals.notPromoted).toBe(list.length);
    const ids = p.operations.map((o) => o.studentId);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
