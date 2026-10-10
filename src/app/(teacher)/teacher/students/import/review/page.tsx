import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { z } from "zod";
import { BatchView } from "@/components/students/batch-view";
import { requireRole } from "@/lib/auth/session";
import { loadBatchForViewer } from "@/lib/students/batch-access";

export const metadata: Metadata = { title: "Import preview" };

export default async function TeacherImportReviewPage({ searchParams }: { searchParams: Promise<{ batch?: string }> }) {
  const user = await requireRole("TEACHER");
  const id = z.string().uuid().safeParse((await searchParams).batch);
  if (!id.success) notFound();
  const loaded = await loadBatchForViewer(user, id.data);
  if (!loaded) notFound();
  return <BatchView loaded={loaded} listPath="/teacher/students/approvals" importPath="/teacher/students/import" />;
}
