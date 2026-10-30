-- Use the class names from the school magazine: Pre-Nursery, Nursery, Basic 1-9 and SS.
-- Renames levels and their classes in place (e.g. "Primary 4" -> "Basic 4", "JSS1A" -> "Basic 7A"). Students, results and
-- PINs keep pointing at the same rows. A level is skipped if the school already has one with the new name.

UPDATE "SchoolClass" c SET "name" = 'Pre-Nursery 1' || substr(c."name", 16)
  FROM "ClassLevel" l
  WHERE c."levelId" = l."id" AND l."name" = 'Pre-Reception 1' AND c."name" LIKE 'Pre-Reception 1%'
    AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Pre-Nursery 1');
UPDATE "ClassLevel" SET "name" = 'Pre-Nursery 1' WHERE "name" = 'Pre-Reception 1' AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Pre-Nursery 1');

UPDATE "SchoolClass" c SET "name" = 'Pre-Nursery 2' || substr(c."name", 16)
  FROM "ClassLevel" l
  WHERE c."levelId" = l."id" AND l."name" = 'Pre-Reception 2' AND c."name" LIKE 'Pre-Reception 2%'
    AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Pre-Nursery 2');
UPDATE "ClassLevel" SET "name" = 'Pre-Nursery 2' WHERE "name" = 'Pre-Reception 2' AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Pre-Nursery 2');

UPDATE "SchoolClass" c SET "name" = 'Basic 1' || substr(c."name", 10)
  FROM "ClassLevel" l
  WHERE c."levelId" = l."id" AND l."name" = 'Primary 1' AND c."name" LIKE 'Primary 1%'
    AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Basic 1');
UPDATE "ClassLevel" SET "name" = 'Basic 1' WHERE "name" = 'Primary 1' AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Basic 1');

UPDATE "SchoolClass" c SET "name" = 'Basic 2' || substr(c."name", 10)
  FROM "ClassLevel" l
  WHERE c."levelId" = l."id" AND l."name" = 'Primary 2' AND c."name" LIKE 'Primary 2%'
    AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Basic 2');
UPDATE "ClassLevel" SET "name" = 'Basic 2' WHERE "name" = 'Primary 2' AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Basic 2');

UPDATE "SchoolClass" c SET "name" = 'Basic 3' || substr(c."name", 10)
  FROM "ClassLevel" l
  WHERE c."levelId" = l."id" AND l."name" = 'Primary 3' AND c."name" LIKE 'Primary 3%'
    AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Basic 3');
UPDATE "ClassLevel" SET "name" = 'Basic 3' WHERE "name" = 'Primary 3' AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Basic 3');

UPDATE "SchoolClass" c SET "name" = 'Basic 4' || substr(c."name", 10)
  FROM "ClassLevel" l
  WHERE c."levelId" = l."id" AND l."name" = 'Primary 4' AND c."name" LIKE 'Primary 4%'
    AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Basic 4');
UPDATE "ClassLevel" SET "name" = 'Basic 4' WHERE "name" = 'Primary 4' AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Basic 4');

UPDATE "SchoolClass" c SET "name" = 'Basic 5' || substr(c."name", 10)
  FROM "ClassLevel" l
  WHERE c."levelId" = l."id" AND l."name" = 'Primary 5' AND c."name" LIKE 'Primary 5%'
    AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Basic 5');
UPDATE "ClassLevel" SET "name" = 'Basic 5' WHERE "name" = 'Primary 5' AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Basic 5');

UPDATE "SchoolClass" c SET "name" = 'Basic 6' || substr(c."name", 10)
  FROM "ClassLevel" l
  WHERE c."levelId" = l."id" AND l."name" = 'Primary 6' AND c."name" LIKE 'Primary 6%'
    AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Basic 6');
UPDATE "ClassLevel" SET "name" = 'Basic 6' WHERE "name" = 'Primary 6' AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Basic 6');

UPDATE "SchoolClass" c SET "name" = 'Basic 7' || substr(c."name", 5)
  FROM "ClassLevel" l
  WHERE c."levelId" = l."id" AND l."name" = 'JSS1' AND c."name" LIKE 'JSS1%'
    AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Basic 7');
UPDATE "ClassLevel" SET "name" = 'Basic 7' WHERE "name" = 'JSS1' AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Basic 7');

UPDATE "SchoolClass" c SET "name" = 'Basic 8' || substr(c."name", 5)
  FROM "ClassLevel" l
  WHERE c."levelId" = l."id" AND l."name" = 'JSS2' AND c."name" LIKE 'JSS2%'
    AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Basic 8');
UPDATE "ClassLevel" SET "name" = 'Basic 8' WHERE "name" = 'JSS2' AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Basic 8');

UPDATE "SchoolClass" c SET "name" = 'Basic 9' || substr(c."name", 5)
  FROM "ClassLevel" l
  WHERE c."levelId" = l."id" AND l."name" = 'JSS3' AND c."name" LIKE 'JSS3%'
    AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Basic 9');
UPDATE "ClassLevel" SET "name" = 'Basic 9' WHERE "name" = 'JSS3' AND NOT EXISTS (SELECT 1 FROM "ClassLevel" x WHERE x."name" = 'Basic 9');
