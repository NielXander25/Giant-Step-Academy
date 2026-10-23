-- Phase 9: messages from the public contact / admissions enquiry form.

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'HANDLED');

-- CreateTable
CREATE TABLE "Enquiry" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "interest" TEXT,
    "message" TEXT NOT NULL,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "ipHash" TEXT,
    "handledById" UUID,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Enquiry_status_createdAt_idx" ON "Enquiry"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Enquiry_ipHash_createdAt_idx" ON "Enquiry"("ipHash", "createdAt");
