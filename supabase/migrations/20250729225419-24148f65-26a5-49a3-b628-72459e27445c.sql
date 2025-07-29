-- Fix RLS policy for shopify_product_settings to allow upsert operations
-- The current policy might be blocking the upsert operation

-- First, let's check current policies and potentially update them
DROP POLICY IF EXISTS "manage_product_settings" ON public.shopify_product_settings;

-- Create a more permissive policy that allows both authenticated users and anonymous users
-- to create product associations when the form is published
CREATE POLICY "allow_product_settings_management" 
ON public.shopify_product_settings 
FOR ALL 
USING (
  -- Allow if user is authenticated and owns the shop or is the default user
  (auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR
    user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid OR
    EXISTS (
      SELECT 1 FROM shopify_stores 
      WHERE shop = shopify_product_settings.shop_id 
      AND shopify_stores.user_id = auth.uid()
    )
  )) OR
  -- Allow if form is published (for anonymous access)
  (EXISTS (
    SELECT 1 FROM forms 
    WHERE id = shopify_product_settings.form_id 
    AND is_published = true
  ))
) 
WITH CHECK (
  -- For insert/update, allow if user is authenticated
  (auth.uid() IS NOT NULL AND (
    user_id = auth.uid() OR
    user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid OR
    EXISTS (
      SELECT 1 FROM shopify_stores 
      WHERE shop = shopify_product_settings.shop_id 
      AND shopify_stores.user_id = auth.uid()
    )
  )) OR
  -- Or if no auth but default user and form exists
  (auth.uid() IS NULL AND user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid)
);