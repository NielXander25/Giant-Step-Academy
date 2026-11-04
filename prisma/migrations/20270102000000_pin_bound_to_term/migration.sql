-- A result PIN is tied to the term it first opens: it then opens that term and earlier ones, never a later one.
ALTER TYPE "PinAccessOutcome" ADD VALUE 'PIN_LATER_TERM';

ALTER TABLE "Pin" ADD COLUMN "termId" UUID;
ALTER TABLE "Pin" ADD CONSTRAINT "Pin_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Already-used PINs keep the term they were first used for.
UPDATE "Pin" p SET "termId" = (
  SELECT l."termId" FROM "PinAccessLog" l
  WHERE l."pinId" = p."id" AND l."outcome" = 'SUCCESS' AND l."termId" IS NOT NULL
  ORDER BY l."createdAt" ASC LIMIT 1
) WHERE p."usageCount" > 0;
