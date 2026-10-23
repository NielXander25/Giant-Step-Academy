import { db } from "@/lib/db";
import { LAYOUT_KEY, parseLayout, type ReportLayout } from "./report-layout";

export async function getReportLayout(): Promise<ReportLayout> {
  const row = await db.systemSetting.findUnique({ where: { key: LAYOUT_KEY } });
  return parseLayout(row?.value);
}

export async function saveReportLayout(layout: ReportLayout, userId: string) {
  await db.systemSetting.upsert({
    where: { key: LAYOUT_KEY },
    update: { value: layout, updatedById: userId },
    create: { key: LAYOUT_KEY, value: layout, updatedById: userId },
  });
}
