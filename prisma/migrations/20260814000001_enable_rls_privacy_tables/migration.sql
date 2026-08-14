-- Same posture as 20260722000000_enable_rls_all_tables, applied to the two new
-- tables. RLS is NOT inherited by tables created later, so without this the
-- Supabase advisor `rls_disabled_in_public` fires again and consent + request
-- records become readable through PostgREST with the project's anon key.
--
-- Plain ENABLE, never FORCE — see the header of that earlier migration.

ALTER TABLE "ConsentRecord"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PrivacyRequest" ENABLE ROW LEVEL SECURITY;
