import { Badge } from "@/components/ui/badge";
import { BATCH_LABEL, SHEET_LABEL, asBatchStatus, asSheetStatus } from "@/lib/results/workflow";

export function BatchBadge({ status }: { status: string }) {
  const l = BATCH_LABEL[asBatchStatus(status)];
  return <Badge variant={l.variant}>{l.text}</Badge>;
}

export function SheetBadge({ status }: { status: string }) {
  const l = SHEET_LABEL[asSheetStatus(status)];
  return <Badge variant={l.variant}>{l.text}</Badge>;
}
