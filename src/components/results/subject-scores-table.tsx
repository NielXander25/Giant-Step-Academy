import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { computeSubject, type Component } from "@/lib/results/calc";
import type { GradeBand } from "@/lib/results/grading";
import type { SubjectViewRow } from "@/lib/results/subject-view";

/** Read-only view of one subject's scores with the totals and grades worked out. */
export function SubjectScoresTable({ components, bands, rows }: { components: Component[]; bands: GradeBand[]; rows: SubjectViewRow[] }) {
  return (
    <Table>
      <THead>
        <TR>
          <TH>Student</TH>
          {components.map((c) => <TH key={c.id}>{c.name} /{c.maxScore}</TH>)}
          <TH>Total</TH><TH>Grade</TH><TH>Remark</TH>
        </TR>
      </THead>
      <TBody>
        {rows.map((r) => {
          const res = computeSubject(r.scores, components, bands);
          return (
            <TR key={r.enrollmentId}>
              <TD><p className="font-medium">{r.fullName}</p><p className="text-xs text-muted-foreground">{r.admissionNumber}</p></TD>
              {components.map((c) => <TD key={c.id}>{r.scores[c.id] ?? "—"}</TD>)}
              <TD className="font-medium">{res.status === "COMPLETE" ? res.total : "—"}</TD>
              <TD className="font-medium">{res.grade ?? "—"}</TD>
              <TD>{r.remark || <span className="text-muted-foreground">—</span>}</TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}
