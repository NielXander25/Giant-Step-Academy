import { Badge } from "@/components/ui/badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import type { RecordAction, RecordStatus } from "@/lib/students/import-validate";

export type PreviewRecord = {
  rowNumber: number;
  status: RecordStatus;
  errors: unknown;
  data: unknown;
};

type Data = { admissionNumber?: string; fullName?: string; gender?: string | null; dateOfBirth?: string | null; action?: RecordAction };

const STATUS: Record<RecordStatus, { label: string; variant: "success" | "default" | "accent" | "destructive" }> = {
  NEW: { label: "New", variant: "success" },
  EXISTING: { label: "Existing", variant: "default" },
  DUPLICATE: { label: "Duplicate", variant: "accent" },
  INVALID: { label: "Problem", variant: "destructive" },
};

const OUTCOME: Record<string, string> = {
  CREATE: "Will be added",
  ENROLL: "Will be added to this class",
  NONE: "Already in this class",
  SKIP: "Skipped",
};

export function ImportPreview({ records }: { records: PreviewRecord[] }) {
  return (
    <Table>
      <THead>
        <TR><TH>Row</TH><TH>Admission no.</TH><TH>Name</TH><TH>Gender</TH><TH>Date of birth</TH><TH>Result</TH><TH>What happens</TH></TR>
      </THead>
      <TBody>
        {records.map((r) => {
          const d = (r.data ?? {}) as Data;
          const errors = Array.isArray(r.errors) ? (r.errors as string[]) : [];
          const s = STATUS[r.status];
          return (
            <TR key={r.rowNumber}>
              <TD className="text-muted-foreground">{r.rowNumber}</TD>
              <TD className="whitespace-nowrap font-medium">{d.admissionNumber || "—"}</TD>
              <TD>{d.fullName || "—"}</TD>
              <TD>{d.gender ? d.gender.toLowerCase() : "—"}</TD>
              <TD className="whitespace-nowrap">{d.dateOfBirth ?? "—"}</TD>
              <TD><Badge variant={s.variant}>{s.label}</Badge></TD>
              <TD>
                <p>{OUTCOME[d.action ?? "SKIP"]}</p>
                {errors.map((e, i) => <p key={i} className="text-xs text-destructive">{e}</p>)}
              </TD>
            </TR>
          );
        })}
      </TBody>
    </Table>
  );
}
