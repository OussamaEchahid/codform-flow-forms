-- Tighten RLS on currency_settings to restrict access to shop owners only
-- 1) Ensure RLS is enabled
ALTER TABLE public.currency_settings ENABLE ROW LEVEL SECURITY;

-- 2) Drop overly-permissive existing policies if they exist
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'currency_settings' 
      AND policyname = 'Allow read access to currency settings'
  ) THEN
    EXECUTE 'DROP POLICY "Allow read access to currency settings" ON public.currency_settings';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'currency_settings' 
      AND policyname = 'Allow insert for authenticated users'
  ) THEN
    EXECUTE 'DROP POLICY "Allow insert for authenticated users" ON public.currency_settings';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'currency_settings' 
      AND policyname = 'Allow update for authenticated users'
  ) THEN
    EXECUTE 'DROP POLICY "Allow update for authenticated users" ON public.currency_settings';
  END IF;
END$$;

-- 3) Create strict owner-only policies (shop owner = row in shopify_stores with same shop_id and user_id = auth.uid())
CREATE POLICY owners_read_currency_settings
ON public.currency_settings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shopify_stores s
    WHERE s.shop = currency_settings.shop_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY owners_insert_currency_settings
ON public.currency_settings
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shopify_stores s
    WHERE s.shop = currency_settings.shop_id
      AND s.user_id = auth.uid()
  )
);

CREATE POLICY owners_update_currency_settings
ON public.currency_settings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.shopify_stores s
    WHERE s.shop = currency_settings.shop_id
      AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shopify_stores s
    WHERE s.shop = currency_settings.shop_id
      AND s.user_id = auth.uid()
  )
);

-- Note: No DELETE policy is added intentionally to prevent accidental data removal.
-- If deletion is needed later, create a similar owner-only DELETE policy.
