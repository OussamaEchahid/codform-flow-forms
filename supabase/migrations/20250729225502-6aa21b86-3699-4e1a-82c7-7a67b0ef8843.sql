-- Update the existing RLS policy to fix the upsert permission issue
DROP POLICY IF EXISTS "allow_product_settings_management" ON public.shopify_product_settings;

-- Create a comprehensive policy that allows proper product association management
CREATE POLICY "manage_product_settings_v2" 
ON public.shopify_product_settings 
FOR ALL 
TO authenticated, anon
USING (
  -- Allow access if user owns the shop or uses default user
  (
    user_id = COALESCE(auth.uid(), '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid) OR
    user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid OR
    EXISTS (
      SELECT 1 FROM shopify_stores 
      WHERE shop = shopify_product_settings.shop_id 
      AND (shopify_stores.user_id = auth.uid() OR auth.uid() IS NULL)
    ) OR
    EXISTS (
      SELECT 1 FROM forms 
      WHERE id = shopify_product_settings.form_id 
      AND is_published = true
    )
  )
) 
WITH CHECK (
  -- Allow insert/update if authenticated or using default user
  (
    user_id = COALESCE(auth.uid(), '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid) OR
    user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid OR
    EXISTS (
      SELECT 1 FROM shopify_stores 
      WHERE shop = shopify_product_settings.shop_id 
      AND (shopify_stores.user_id = auth.uid() OR auth.uid() IS NULL)
    )
  )
);