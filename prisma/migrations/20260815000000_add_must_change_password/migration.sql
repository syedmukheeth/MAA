-- Forced password change for accounts provisioned with a temporary password.
--
-- Existing rows default to false: they belong to people who chose their own
-- password, and flipping them to true would lock every current session out
-- behind a change screen for no security gain. Only the provisioning script
-- (prisma/scripts/upsert-staff.ts) sets it true.
ALTER TABLE "User" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "passwordChangedAt" TIMESTAMP(3);
