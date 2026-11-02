-- Result PINs: no time limit any more, and each PIN belongs to the first student who opens a result with it.
ALTER TYPE "PinAccessOutcome" ADD VALUE 'PIN_OTHER_STUDENT';

ALTER TABLE "Pin" ADD COLUMN "studentId" UUID;
ALTER TABLE "Pin" ADD CONSTRAINT "Pin_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Pin_studentId_idx" ON "Pin"("studentId");

-- Already-used PINs keep the student they were first used for.
UPDATE "Pin" p SET "studentId" = (
  SELECT l."studentId" FROM "PinAccessLog" l
  WHERE l."pinId" = p."id" AND l."outcome" = 'SUCCESS' AND l."studentId" IS NOT NULL
  ORDER BY l."createdAt" ASC LIMIT 1
) WHERE p."usageCount" > 0;

-- The 40-day expiry is gone: clear it, and bring back PINs that only expired by time.
UPDATE "Pin" SET "expiresAt" = NULL WHERE "expiresAt" IS NOT NULL;
UPDATE "Pin" SET "status" = 'ACTIVE' WHERE "status" = 'EXPIRED' AND "usageCount" < "maxUses";
