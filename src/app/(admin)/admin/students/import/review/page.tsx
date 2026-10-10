import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { BatchView } from "@/components/students/batch-view";
import { requireRole } from "@/lib/auth/session";
import { ADMIN_ROLES } from "@/lib/permissions/roles";
import { loadBatchForViewer } from "@/lib/students/batch-access";

export const metadata: Metadata = { title: "Import preview" };

export default async function AdminImportReviewPage({ searchParams }: { searchParams: Promise<{ batch?: string }> }) {
  const user = await requireRole(...ADMIN_ROLES);
  const id = z.string().uuid().safeParse((await searchParams).batch);
  if (!id.success) notFound();
  const loaded = await loadBatchForViewer(user, id.data);
  if (!loaded) notFound();
  return <BatchView loaded={loaded} listPath="/admin/students" importPath="/admin/students/import" />;
}
