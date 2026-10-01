-- Giant Step Academy: initial schema (Phase 1)
-- Generated from prisma/schema.prisma, plus integrity rules at the bottom.

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'TEACHER');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'DEACTIVATED');

-- CreateEnum
CREATE TYPE "TeacherRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'GRADUATED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'PROMOTED', 'REPEATED', 'GRADUATED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ImportBatchStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'COMMITTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ImportRecordStatus" AS ENUM ('NEW', 'EXISTING', 'DUPLICATE', 'INVALID');

-- CreateEnum
CREATE TYPE "ResultStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'FORM_TEACHER_REVIEW', 'FORM_TEACHER_APPROVED', 'FORM_TEACHER_REJECTED', 'ADMIN_REVIEW', 'ADMIN_APPROVED', 'ADMIN_REJECTED', 'READY_FOR_PUBLICATION', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "Completeness" AS ENUM ('MISSING', 'INCOMPLETE', 'COMPLETE');

-- CreateEnum
CREATE TYPE "ApprovalTarget" AS ENUM ('SUBJECT_BATCH', 'CLASS_SHEET');

-- CreateEnum
CREATE TYPE "ApprovalAction" AS ENUM ('SUBMIT', 'APPROVE', 'REJECT', 'REQUEST_CORRECTION', 'PUBLISH', 'UNPUBLISH');

-- CreateEnum
CREATE TYPE "PinStatus" AS ENUM ('ACTIVE', 'DISABLED', 'EXHAUSTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PinAccessOutcome" AS ENUM ('SUCCESS', 'INVALID_CREDENTIALS', 'PIN_EXHAUSTED', 'PIN_EXPIRED', 'PIN_DISABLED', 'RESULT_NOT_PUBLISHED', 'RATE_LIMITED', 'CAPTCHA_FAILED');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateTable
CREATE TABLE "User" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE'::"UserStatus",
    "canCreateAdmins" BOOLEAN NOT NULL DEFAULT false,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherProfile" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "phone" TEXT,
    "staffNumber" TEXT,
    "qualification" TEXT,
    "bio" TEXT,
    "profileCompleted" BOOLEAN NOT NULL DEFAULT false,
    "extra" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TeacherProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeacherRequest" (
    "id" UUID NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "note" TEXT,
    "status" "TeacherRequestStatus" NOT NULL DEFAULT 'PENDING'::"TeacherRequestStatus",
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "userId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TeacherRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PasswordResetToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PasswordResetToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Section" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "Section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AcademicSession" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AcademicSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Term" (
    "id" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "resultsLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Term_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassLevel" (
    "id" UUID NOT NULL,
    "sectionId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "nextLevelId" UUID,
    "isFinal" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ClassLevel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolClass" (
    "id" UUID NOT NULL,
    "levelId" UUID NOT NULL,
    "arm" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "SchoolClass_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subject" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassSubject" (
    "id" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "isCompulsory" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "ClassSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FormTeacherAssignment" (
    "id" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FormTeacherAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectAssignment" (
    "id" UUID NOT NULL,
    "teacherId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SubjectAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Student" (
    "id" UUID NOT NULL,
    "admissionNumber" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "gender" "Gender",
    "dateOfBirth" TIMESTAMP(3),
    "photoUrl" TEXT,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVE'::"StudentStatus",
    "extra" JSONB,
    "createdById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Student_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE'::"EnrollmentStatus",
    "isRepeater" BOOLEAN NOT NULL DEFAULT false,
    "promotedFromEnrollmentId" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentSubject" (
    "id" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    CONSTRAINT "StudentSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentImportBatch" (
    "id" UUID NOT NULL,
    "uploadedById" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "sessionId" UUID NOT NULL,
    "fileName" TEXT NOT NULL,
    "status" "ImportBatchStatus" NOT NULL DEFAULT 'DRAFT'::"ImportBatchStatus",
    "requiresApproval" BOOLEAN NOT NULL DEFAULT false,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "newCount" INTEGER NOT NULL DEFAULT 0,
    "existingCount" INTEGER NOT NULL DEFAULT 0,
    "duplicateCount" INTEGER NOT NULL DEFAULT 0,
    "invalidCount" INTEGER NOT NULL DEFAULT 0,
    "reviewedById" UUID,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "committedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudentImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentImportRecord" (
    "id" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "data" JSONB NOT NULL,
    "status" "ImportRecordStatus" NOT NULL,
    "errors" JSONB,
    "matchedStudentId" UUID,
    CONSTRAINT "StudentImportRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentComponent" (
    "id" UUID NOT NULL,
    "sectionId" UUID,
    "name" TEXT NOT NULL,
    "maxScore" DECIMAL(5,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "AssessmentComponent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradingScheme" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "sectionId" UUID,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GradingScheme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GradeBand" (
    "id" UUID NOT NULL,
    "schemeId" UUID NOT NULL,
    "minScore" DECIMAL(5,2) NOT NULL,
    "maxScore" DECIMAL(5,2) NOT NULL,
    "grade" TEXT NOT NULL,
    "remark" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "GradeBand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubjectResultBatch" (
    "id" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "subjectId" UUID NOT NULL,
    "termId" UUID NOT NULL,
    "status" "ResultStatus" NOT NULL DEFAULT 'DRAFT'::"ResultStatus",
    "submittedById" UUID,
    "submittedAt" TIMESTAMP(3),
    "formTeacherReviewedById" UUID,
    "formTeacherReviewedAt" TIMESTAMP(3),
    "lastRejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SubjectResultBatch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultEntry" (
    "id" UUID NOT NULL,
    "batchId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "scores" JSONB NOT NULL,
    "total" DECIMAL(6,2),
    "grade" TEXT,
    "remark" TEXT,
    "enteredById" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ResultEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClassResultSheet" (
    "id" UUID NOT NULL,
    "classId" UUID NOT NULL,
    "termId" UUID NOT NULL,
    "status" "ResultStatus" NOT NULL DEFAULT 'DRAFT'::"ResultStatus",
    "submittedAt" TIMESTAMP(3),
    "adminReviewedById" UUID,
    "adminReviewedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "publishedById" UUID,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ClassResultSheet_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentTermSummary" (
    "id" UUID NOT NULL,
    "sheetId" UUID NOT NULL,
    "enrollmentId" UUID NOT NULL,
    "completeness" "Completeness" NOT NULL DEFAULT 'MISSING'::"Completeness",
    "subjectsEntered" INTEGER NOT NULL DEFAULT 0,
    "subjectsExpected" INTEGER NOT NULL DEFAULT 0,
    "totalScore" DECIMAL(8,2),
    "average" DECIMAL(5,2),
    "overallGrade" TEXT,
    "position" INTEGER,
    "formTeacherRemark" TEXT,
    "principalRemark" TEXT,
    "attendance" JSONB,
    "calculatedAt" TIMESTAMP(3),
    CONSTRAINT "StudentTermSummary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultApprovalRecord" (
    "id" UUID NOT NULL,
    "target" "ApprovalTarget" NOT NULL,
    "batchId" UUID,
    "sheetId" UUID,
    "action" "ApprovalAction" NOT NULL,
    "fromStatus" "ResultStatus",
    "toStatus" "ResultStatus" NOT NULL,
    "actorId" UUID NOT NULL,
    "actorRole" "Role" NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResultApprovalRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pin" (
    "id" UUID NOT NULL,
    "pinHash" TEXT NOT NULL,
    "maskedPin" TEXT NOT NULL,
    "status" "PinStatus" NOT NULL DEFAULT 'ACTIVE'::"PinStatus",
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "maxUses" INTEGER NOT NULL DEFAULT 2,
    "firstUsedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "label" TEXT,
    "createdById" UUID NOT NULL,
    "disabledById" UUID,
    "disabledAt" TIMESTAMP(3),
    "disabledReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Pin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PinAccessLog" (
    "id" UUID NOT NULL,
    "pinId" UUID,
    "studentId" UUID,
    "termId" UUID,
    "outcome" "PinAccessOutcome" NOT NULL,
    "pinStatusAtTime" "PinStatus",
    "ipHash" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PinAccessLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultViewSession" (
    "id" UUID NOT NULL,
    "pinId" UUID NOT NULL,
    "studentId" UUID NOT NULL,
    "termId" UUID NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResultViewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsPost" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "content" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "category" TEXT,
    "authorName" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT'::"ContentStatus",
    "publishedAt" TIMESTAMP(3),
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "NewsPost_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolEvent" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "imageUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT'::"ContentStatus",
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SchoolEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GalleryItem" (
    "id" UUID NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "caption" TEXT,
    "category" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED'::"ContentStatus",
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "GalleryItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffProfile" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "position" TEXT NOT NULL,
    "department" TEXT,
    "photoUrl" TEXT,
    "bio" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED'::"ContentStatus",
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StaffProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Announcement" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT'::"ContentStatus",
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Announcement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Testimonial" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "relationship" TEXT,
    "quote" TEXT NOT NULL,
    "photoUrl" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT'::"ContentStatus",
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Testimonial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PageContent" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT,
    "body" JSONB NOT NULL,
    "isDemo" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PageContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SchoolProfile" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "name" TEXT NOT NULL DEFAULT 'Giant Step Academy',
    "motto" TEXT DEFAULT '[SCHOOL MOTTO]',
    "address" TEXT DEFAULT '[SCHOOL ADDRESS]',
    "phone" TEXT DEFAULT '[SCHOOL PHONE]',
    "email" TEXT DEFAULT '[SCHOOL EMAIL]',
    "logoUrl" TEXT,
    "websiteUrl" TEXT,
    "principalName" TEXT,
    "isPlaceholder" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SchoolProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SystemSetting" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "updatedById" UUID,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SystemSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actorId" UUID,
    "actorRole" "Role",
    "action" TEXT NOT NULL,
    "entityType" TEXT,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherProfile_userId_key" ON "TeacherProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeacherRequest_userId_key" ON "TeacherRequest"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "Section_name_key" ON "Section"("name");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicSession_name_key" ON "AcademicSession"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Term_sessionId_name_key" ON "Term"("sessionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Term_sessionId_sortOrder_key" ON "Term"("sessionId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ClassLevel_name_key" ON "ClassLevel"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolClass_name_key" ON "SchoolClass"("name");

-- CreateIndex
CREATE UNIQUE INDEX "SchoolClass_levelId_arm_key" ON "SchoolClass"("levelId", "arm");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_key" ON "Subject"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Subject_code_key" ON "Subject"("code");

-- CreateIndex
CREATE UNIQUE INDEX "ClassSubject_classId_subjectId_key" ON "ClassSubject"("classId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "FormTeacherAssignment_classId_sessionId_key" ON "FormTeacherAssignment"("classId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "FormTeacherAssignment_teacherId_sessionId_key" ON "FormTeacherAssignment"("teacherId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectAssignment_classId_subjectId_sessionId_key" ON "SubjectAssignment"("classId", "subjectId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "Student_admissionNumber_key" ON "Student"("admissionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Enrollment_studentId_sessionId_key" ON "Enrollment"("studentId", "sessionId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentSubject_enrollmentId_subjectId_key" ON "StudentSubject"("enrollmentId", "subjectId");

-- CreateIndex
CREATE UNIQUE INDEX "SubjectResultBatch_classId_subjectId_termId_key" ON "SubjectResultBatch"("classId", "subjectId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "ResultEntry_batchId_enrollmentId_key" ON "ResultEntry"("batchId", "enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ClassResultSheet_classId_termId_key" ON "ClassResultSheet"("classId", "termId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentTermSummary_sheetId_enrollmentId_key" ON "StudentTermSummary"("sheetId", "enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "Pin_pinHash_key" ON "Pin"("pinHash");

-- CreateIndex
CREATE UNIQUE INDEX "ResultViewSession_tokenHash_key" ON "ResultViewSession"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "NewsPost_slug_key" ON "NewsPost"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "PageContent_key_key" ON "PageContent"("key");

-- CreateIndex
CREATE INDEX "User_role_status_idx" ON "User"("role", "status");

-- CreateIndex
CREATE INDEX "TeacherRequest_status_createdAt_idx" ON "TeacherRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "TeacherRequest_email_idx" ON "TeacherRequest"("email");

-- CreateIndex
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken"("userId");

-- CreateIndex
CREATE INDEX "SubjectAssignment_teacherId_sessionId_idx" ON "SubjectAssignment"("teacherId", "sessionId");

-- CreateIndex
CREATE INDEX "Student_normalizedName_idx" ON "Student"("normalizedName");

-- CreateIndex
CREATE INDEX "Enrollment_classId_sessionId_idx" ON "Enrollment"("classId", "sessionId");

-- CreateIndex
CREATE INDEX "StudentImportBatch_classId_status_idx" ON "StudentImportBatch"("classId", "status");

-- CreateIndex
CREATE INDEX "StudentImportRecord_batchId_idx" ON "StudentImportRecord"("batchId");

-- CreateIndex
CREATE INDEX "AssessmentComponent_sectionId_idx" ON "AssessmentComponent"("sectionId");

-- CreateIndex
CREATE INDEX "GradeBand_schemeId_idx" ON "GradeBand"("schemeId");

-- CreateIndex
CREATE INDEX "SubjectResultBatch_status_idx" ON "SubjectResultBatch"("status");

-- CreateIndex
CREATE INDEX "ResultEntry_enrollmentId_idx" ON "ResultEntry"("enrollmentId");

-- CreateIndex
CREATE INDEX "ClassResultSheet_status_idx" ON "ClassResultSheet"("status");

-- CreateIndex
CREATE INDEX "StudentTermSummary_enrollmentId_idx" ON "StudentTermSummary"("enrollmentId");

-- CreateIndex
CREATE INDEX "ResultApprovalRecord_batchId_idx" ON "ResultApprovalRecord"("batchId");

-- CreateIndex
CREATE INDEX "ResultApprovalRecord_sheetId_idx" ON "ResultApprovalRecord"("sheetId");

-- CreateIndex
CREATE INDEX "Pin_status_idx" ON "Pin"("status");

-- CreateIndex
CREATE INDEX "PinAccessLog_pinId_idx" ON "PinAccessLog"("pinId");

-- CreateIndex
CREATE INDEX "PinAccessLog_studentId_idx" ON "PinAccessLog"("studentId");

-- CreateIndex
CREATE INDEX "PinAccessLog_createdAt_idx" ON "PinAccessLog"("createdAt");

-- CreateIndex
CREATE INDEX "ResultViewSession_expiresAt_idx" ON "ResultViewSession"("expiresAt");

-- CreateIndex
CREATE INDEX "NewsPost_status_publishedAt_idx" ON "NewsPost"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "SchoolEvent_status_startsAt_idx" ON "SchoolEvent"("status", "startsAt");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "AuditLog_actorId_idx" ON "AuditLog"("actorId");

-- AddForeignKey
ALTER TABLE "TeacherProfile" ADD CONSTRAINT "TeacherProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeacherRequest" ADD CONSTRAINT "TeacherRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Term" ADD CONSTRAINT "Term_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassLevel" ADD CONSTRAINT "ClassLevel_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassLevel" ADD CONSTRAINT "ClassLevel_nextLevelId_fkey" FOREIGN KEY ("nextLevelId") REFERENCES "ClassLevel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SchoolClass" ADD CONSTRAINT "SchoolClass_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "ClassLevel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassSubject" ADD CONSTRAINT "ClassSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormTeacherAssignment" ADD CONSTRAINT "FormTeacherAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormTeacherAssignment" ADD CONSTRAINT "FormTeacherAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormTeacherAssignment" ADD CONSTRAINT "FormTeacherAssignment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAssignment" ADD CONSTRAINT "SubjectAssignment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAssignment" ADD CONSTRAINT "SubjectAssignment_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAssignment" ADD CONSTRAINT "SubjectAssignment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectAssignment" ADD CONSTRAINT "SubjectAssignment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSubject" ADD CONSTRAINT "StudentSubject_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSubject" ADD CONSTRAINT "StudentSubject_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentImportBatch" ADD CONSTRAINT "StudentImportBatch_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentImportBatch" ADD CONSTRAINT "StudentImportBatch_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentImportBatch" ADD CONSTRAINT "StudentImportBatch_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "AcademicSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentImportRecord" ADD CONSTRAINT "StudentImportRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "StudentImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentComponent" ADD CONSTRAINT "AssessmentComponent_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradingScheme" ADD CONSTRAINT "GradingScheme_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "Section"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeBand" ADD CONSTRAINT "GradeBand_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "GradingScheme"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectResultBatch" ADD CONSTRAINT "SubjectResultBatch_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectResultBatch" ADD CONSTRAINT "SubjectResultBatch_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectResultBatch" ADD CONSTRAINT "SubjectResultBatch_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultEntry" ADD CONSTRAINT "ResultEntry_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "SubjectResultBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultEntry" ADD CONSTRAINT "ResultEntry_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassResultSheet" ADD CONSTRAINT "ClassResultSheet_classId_fkey" FOREIGN KEY ("classId") REFERENCES "SchoolClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassResultSheet" ADD CONSTRAINT "ClassResultSheet_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTermSummary" ADD CONSTRAINT "StudentTermSummary_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "ClassResultSheet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentTermSummary" ADD CONSTRAINT "StudentTermSummary_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultApprovalRecord" ADD CONSTRAINT "ResultApprovalRecord_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "SubjectResultBatch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultApprovalRecord" ADD CONSTRAINT "ResultApprovalRecord_sheetId_fkey" FOREIGN KEY ("sheetId") REFERENCES "ClassResultSheet"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PinAccessLog" ADD CONSTRAINT "PinAccessLog_pinId_fkey" FOREIGN KEY ("pinId") REFERENCES "Pin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PinAccessLog" ADD CONSTRAINT "PinAccessLog_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PinAccessLog" ADD CONSTRAINT "PinAccessLog_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultViewSession" ADD CONSTRAINT "ResultViewSession_pinId_fkey" FOREIGN KEY ("pinId") REFERENCES "Pin"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultViewSession" ADD CONSTRAINT "ResultViewSession_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultViewSession" ADD CONSTRAINT "ResultViewSession_termId_fkey" FOREIGN KEY ("termId") REFERENCES "Term"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─────────────── Integrity rules Prisma cannot express ───────────────

-- Only one current academic session and one current term at a time.
CREATE UNIQUE INDEX "AcademicSession_single_current_idx" ON "AcademicSession"("isCurrent") WHERE "isCurrent" = true;
CREATE UNIQUE INDEX "Term_single_current_idx" ON "Term"("isCurrent") WHERE "isCurrent" = true;

-- PIN usage can never go negative or exceed its allowance.
ALTER TABLE "Pin" ADD CONSTRAINT "Pin_usage_within_limit_chk" CHECK ("usageCount" >= 0 AND "usageCount" <= "maxUses");

-- An approval record belongs to exactly one target (a subject batch OR a class sheet).
ALTER TABLE "ResultApprovalRecord" ADD CONSTRAINT "ResultApprovalRecord_one_target_chk" CHECK (
  ("batchId" IS NOT NULL AND "sheetId" IS NULL) OR ("batchId" IS NULL AND "sheetId" IS NOT NULL)
);

-- Grade bands must be a valid range.
ALTER TABLE "GradeBand" ADD CONSTRAINT "GradeBand_range_chk" CHECK ("minScore" <= "maxScore");

-- Scores can never be negative.
ALTER TABLE "AssessmentComponent" ADD CONSTRAINT "AssessmentComponent_max_chk" CHECK ("maxScore" > 0);
