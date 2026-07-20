-- AlterTable
ALTER TABLE "SiteSettings" ADD COLUMN "shopCustomSections" TEXT;
ALTER TABLE "SiteSettings" ADD COLUMN "studioFeatures" TEXT;

-- AlterTable
ALTER TABLE "CustomFurnitureRequest" ADD COLUMN "customOptions" TEXT;
