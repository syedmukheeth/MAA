-- Catalogue-only mode. Defaults to true so existing installs keep selling.
ALTER TABLE "SiteSettings" ADD COLUMN "allowPurchases" BOOLEAN NOT NULL DEFAULT true;
