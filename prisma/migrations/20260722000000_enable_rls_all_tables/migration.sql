-- Security fix: Supabase advisor `rls_disabled_in_public`.
--
-- The storefront and admin NEVER use the Supabase anon key / PostgREST. All DB
-- access goes through Next server code + Prisma over the Postgres pooler
-- (see src/lib/db.ts). Prisma connects as the `postgres` role, which has
-- BYPASSRLS, so enabling RLS does NOT affect the app.
--
-- We enable RLS with NO policies on every public table. With RLS on and no
-- policy, PostgREST (anon + authenticated JWT roles) is denied all access —
-- closing the "anyone with the project URL can read/edit/delete" hole — while
-- the app's BYPASSRLS connection is unaffected.
--
-- NOTE: plain ENABLE (not FORCE) is deliberate. FORCE would apply RLS to the
-- table owner too and could break Prisma. Do not add FORCE.

ALTER TABLE "SiteSettings"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Address"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Product"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Variant"                ENABLE ROW LEVEL SECURITY;
ALTER TABLE "StockMovement"          ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Combo"                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ComboItem"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ComboItemOption"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Cart"                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CartItem"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CartComboSelection"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Order"                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "OrderItem"              ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Testimonial"            ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog"               ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CustomFurnitureRequest" ENABLE ROW LEVEL SECURITY;
