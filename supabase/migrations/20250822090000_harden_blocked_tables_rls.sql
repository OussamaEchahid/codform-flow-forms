-- Phase 1B: Harden RLS for blocked tables
-- Safe, idempotent-ish migration to ensure strict owner-only access

-- 1) blocked_countries
ALTER TABLE IF EXISTS public.blocked_countries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blocked_countries') THEN
    FOR policy_name IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='blocked_countries' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.blocked_countries', policy_name);
    END LOOP;
  END IF;
END $$;

-- Create strict owner-only policy
CREATE POLICY IF NOT EXISTS "blocked_countries_owner_all"
ON public.blocked_countries
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());


-- 2) blocked_ips
ALTER TABLE IF EXISTS public.blocked_ips ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Drop existing policies if they exist
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='blocked_ips') THEN
    FOR policy_name IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='blocked_ips' LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.blocked_ips', policy_name);
    END LOOP;
  END IF;
END $$;

-- Create strict owner-only policy
CREATE POLICY IF NOT EXISTS "blocked_ips_owner_all"
ON public.blocked_ips
FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Notes:
-- - If anonymous or service roles require read for storefront logic, we will add a narrowly scoped read policy
--   based on a SECURITY DEFINER function that validates the shop by header, in a separate migration after testing.

