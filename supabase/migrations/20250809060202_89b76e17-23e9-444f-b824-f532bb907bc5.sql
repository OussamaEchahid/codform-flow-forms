-- Tighten RLS for owner-only access on advertising_pixels
DROP POLICY IF EXISTS "advertising_pixels_shop_access" ON public.advertising_pixels;
CREATE POLICY "advertising_pixels_owner_access"
ON public.advertising_pixels
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.shopify_stores s
  WHERE s.shop = advertising_pixels.shop_id AND s.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.shopify_stores s
  WHERE s.shop = advertising_pixels.shop_id AND s.user_id = auth.uid()
));

-- Restrict currency_display_settings to store owners
DROP POLICY IF EXISTS "Allow all operations on currency_display_settings" ON public.currency_display_settings;
CREATE POLICY "owners_manage_currency_display_settings"
ON public.currency_display_settings
FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.shopify_stores s
  WHERE s.shop = currency_display_settings.shop_id AND s.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.shopify_stores s
  WHERE s.shop = currency_display_settings.shop_id AND s.user_id = auth.uid()
));

-- Restrict custom_currency_symbols to owner/user
DROP POLICY IF EXISTS "Allow all operations on custom_currency_symbols" ON public.custom_currency_symbols;
CREATE POLICY "owners_manage_custom_currency_symbols"
ON public.custom_currency_symbols
FOR ALL
USING (
  (user_id = auth.uid()) OR EXISTS (
    SELECT 1 FROM public.shopify_stores s
    WHERE s.shop = custom_currency_symbols.shop_id AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  (user_id = auth.uid()) OR EXISTS (
    SELECT 1 FROM public.shopify_stores s
    WHERE s.shop = custom_currency_symbols.shop_id AND s.user_id = auth.uid()
  )
);

-- Restrict custom_currency_rates to owner/user
DROP POLICY IF EXISTS "Allow all operations on custom_currency_rates" ON public.custom_currency_rates;
CREATE POLICY "owners_manage_custom_currency_rates"
ON public.custom_currency_rates
FOR ALL
USING (
  (user_id = auth.uid()) OR EXISTS (
    SELECT 1 FROM public.shopify_stores s
    WHERE s.shop = custom_currency_rates.shop_id AND s.user_id = auth.uid()
  )
)
WITH CHECK (
  (user_id = auth.uid()) OR EXISTS (
    SELECT 1 FROM public.shopify_stores s
    WHERE s.shop = custom_currency_rates.shop_id AND s.user_id = auth.uid()
  )
);

-- Remove overly-permissive public inserts on form_submissions
DROP POLICY IF EXISTS "allow_public_form_submissions" ON public.form_submissions;