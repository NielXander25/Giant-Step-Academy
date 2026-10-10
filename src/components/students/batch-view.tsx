import Link from "next/link";
import type { loadBatchForViewer } from "@/lib/students/batch-access";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatDateTime } from "@/lib/format";
import { BatchActions } from "./batch-actions";
import { ImportPreview } from "./import-preview";

type Loaded = NonNullable<Awaited<ReturnType<typeof loadBatchForViewer>>>;

const STATUS_LABEL: Record<string, { text: string; variant: "success" | "default" | "accent" | "destructive" | "outline" }> = {
  DRAFT: { text: "Not submitted yet", variant: "outline" },
  PENDING_APPROVAL: { text: "Waiting for approval", variant: "accent" },
  APPROVED: { text: "Approved", variant: "success" },
  COMMITTED: { text: "Imported", variant: "success" },
  REJECTED: { text: "Rejected", variant: "destructive" },
  CANCELLED: { text: "Cancelled", variant: "outline" },
};

export function BatchView({ loaded, listPath, importPath }: { loaded: Loaded; listPath: string; importPath: string }) {
  const { batch, isUploader, canApprove } = loaded;
  const importable = batch.records.filter((r) => {
    const a = (r.data as { action?: string } | null)?.action;
    return (r.status === "NEW" || r.status === "EXISTING") && (a === "CREATE" || a === "ENROLL");
  }).length;
  const skipped = batch.totalRows - importable - batch.records.filter((r) => (r.data as { action?: string } | null)?.action === "NONE").length;

  const mode =
    batch.status === "DRAFT" && isUploader ? "SUBMIT"
    : batch.status === "PENDING_APPROVAL" && canApprove ? "REVIEW"
    : batch.status === "PENDING_APPROVAL" && isUploader ? "WAITING"
    : "NONE";
  const status = STATUS_LABEL[batch.status];

  return (
    <>
      <PageHeader
        title={`Import preview: ${batch.class.name}`}
        description={`${batch.fileName} · uploaded by ${batch.uploadedBy.name} · ${formatDateTime(batch.createdAt)}`}
      />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Badge variant={status.variant}>{status.text}</Badge>
        {batch.reviewNote && <span className="text-sm text-muted-foreground">Reviewer's note: {batch.reviewNote}</span>}
        <Link href={importPath} className="ml-auto text-sm text-primary underline underline-offset-4">Upload another file</Link>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Rows in file" value={batch.totalRows} />
        <StatCard label="New students" value={batch.newCount} />
        <StatCard label="Existing students" value={batch.existingCount} />
        <StatCard label="Duplicates in file" value={batch.duplicateCount} />
        <StatCard label="Rows with problems" value={batch.invalidCount} />
      </div>

      <Card className="mb-6">
        <CardHeader><CardTitle>Next step</CardTitle></CardHeader>
        <CardContent>
          <BatchActions batchId={batch.id} mode={mode} importable={importable} skipped={Math.max(skipped, 0)} listPath={listPath} needsApproval={batch.requiresApproval} />
          {mode === "NONE" && <p className="text-sm text-muted-foreground">No further action is needed on this upload.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-2 sm:p-4">
          <ImportPreview records={batch.records} />
        </CardContent>
      </Card>
    </>
  );
}
