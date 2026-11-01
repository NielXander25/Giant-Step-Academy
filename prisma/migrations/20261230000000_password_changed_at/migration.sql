-- When a password last changed: sessions signed in before it stop working.
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);
