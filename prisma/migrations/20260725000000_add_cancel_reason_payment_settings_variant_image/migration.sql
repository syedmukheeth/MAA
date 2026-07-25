-- Backfills drift between prisma/schema.prisma and the migration history.
--
-- These ten columns are declared in the schema and read by application code,
-- but no migration ever created them — they reached the live database via
-- `prisma db push`, which does not write migration files. The consequence was
-- that `prisma migrate deploy` against a fresh database produced a schema the
-- app could not run on: seeding died with P2022 ColumnNotFound on Variant.image,
-- and checkout would have failed on the missing SiteSettings payment columns.
--
-- Generated with:
--   prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script
--
-- Every statement is additive and either nullable or defaulted, so this is safe
-- to apply to a database that already has the columns ONLY after checking —
-- see the note in HANDOVER-SESSION-2026-07-25.md. Production very likely
-- already has all ten, in which case this needs to be marked as applied with
-- `prisma migrate resolve --applied 20260725000000_add_cancel_reason_payment_settings_variant_image`
-- rather than run.

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "cancelReason" TEXT;

-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN     "allowCOD" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "allowUPI" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "shopSections" TEXT,
ADD COLUMN     "studioBudgets" TEXT,
ADD COLUMN     "studioFinishes" TEXT,
ADD COLUMN     "studioWoods" TEXT,
ADD COLUMN     "upiId" TEXT,
ADD COLUMN     "upiQrImage" TEXT;

-- AlterTable
ALTER TABLE "Variant" ADD COLUMN     "image" TEXT;
