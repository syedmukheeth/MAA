-- Contact channels and the two content blocks that used to be hardcoded arrays
-- in components (trust badges, showroom FAQ).
--
-- All nullable with no default: null means "the owner has not entered this yet"
-- and the section hides itself, which is the correct state for a claim nobody
-- has stood behind. Existing rows therefore need no backfill.
ALTER TABLE "SiteSettings" ADD COLUMN "contactEmail" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "mapsUrl" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "trustBadges" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "faqItems" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "studioImageUrl" TEXT;
