-- DPDP Act 2023 / DPDP Rules 2025: consent evidence and data-principal requests.
--
-- Additive only. No existing column is dropped or retyped, and every new column
-- is nullable, so this migration is safe to apply to a live database and safe to
-- roll back by dropping the new tables and columns.

-- CreateEnum
CREATE TYPE "ConsentPurpose" AS ENUM ('MARKETING_EMAIL', 'TESTIMONIAL_PUBLICATION');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('GRANTED', 'WITHDRAWN');

-- CreateEnum
CREATE TYPE "ConsentSource" AS ENUM ('REGISTRATION', 'ACCOUNT_PRIVACY_PAGE', 'STAFF_RECORDED');

-- CreateEnum
CREATE TYPE "PrivacyRequestType" AS ENUM ('EXPORT', 'CORRECTION', 'ERASURE', 'GRIEVANCE');

-- CreateEnum
CREATE TYPE "PrivacyRequestStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'ON_HOLD', 'CANCELLED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "erasedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN "subjectUserId" TEXT,
                          ADD COLUMN "consentRecordId" TEXT;

-- CreateTable
CREATE TABLE "ConsentRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purpose" "ConsentPurpose" NOT NULL,
    "status" "ConsentStatus" NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawnAt" TIMESTAMP(3),
    "noticeVersion" TEXT NOT NULL,
    "source" "ConsentSource" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConsentRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PrivacyRequest" (
    "id" TEXT NOT NULL,
    -- Nullable: the public grievance page accepts complaints from people with
    -- no account. Those rows carry contactEmail instead.
    "userId" TEXT,
    "contactEmail" TEXT,
    "type" "PrivacyRequestType" NOT NULL,
    "status" "PrivacyRequestStatus" NOT NULL DEFAULT 'PENDING',
    "note" TEXT,
    "resolution" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scheduledFor" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PrivacyRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
-- No unique on (userId, purpose): the table is append-only and the current
-- state is the newest row per pair. A unique constraint would force upserts and
-- destroy the consent history that DPDP s6(1) makes the fiduciary prove.
CREATE INDEX "ConsentRecord_userId_purpose_grantedAt_idx" ON "ConsentRecord"("userId", "purpose", "grantedAt");

-- CreateIndex
CREATE INDEX "PrivacyRequest_status_requestedAt_idx" ON "PrivacyRequest"("status", "requestedAt");

-- CreateIndex
CREATE INDEX "PrivacyRequest_userId_requestedAt_idx" ON "PrivacyRequest"("userId", "requestedAt");

-- CreateIndex
CREATE INDEX "User_erasedAt_idx" ON "User"("erasedAt");

-- CreateIndex
CREATE INDEX "Testimonial_subjectUserId_idx" ON "Testimonial"("subjectUserId");

-- AddForeignKey
ALTER TABLE "ConsentRecord" ADD CONSTRAINT "ConsentRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddCheckConstraint
-- A request with neither an account nor a reply address is unanswerable, and an
-- unanswerable grievance is a compliance failure that looks like a full queue.
ALTER TABLE "PrivacyRequest" ADD CONSTRAINT "PrivacyRequest_contactable_check"
  CHECK ("userId" IS NOT NULL OR "contactEmail" IS NOT NULL);

-- AddForeignKey
ALTER TABLE "PrivacyRequest" ADD CONSTRAINT "PrivacyRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
-- SET NULL, not CASCADE: erasure tombstones the User row rather than deleting
-- it, but if a User row is ever hard-deleted the testimonial should lose its
-- link, not vanish along with the staff member's work.
ALTER TABLE "Testimonial" ADD CONSTRAINT "Testimonial_subjectUserId_fkey" FOREIGN KEY ("subjectUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
