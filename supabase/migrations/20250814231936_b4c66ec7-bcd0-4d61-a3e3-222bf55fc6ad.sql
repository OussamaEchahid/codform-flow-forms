-- Fix RLS policy for shopify_product_settings to work with shop association
-- This allows access to product settings based on shop ownership rather than direct user ownership

-- Drop current policy and create a more flexible one
DROP POLICY IF EXISTS "Owners manage product settings" ON public.shopify_product_settings;

-- Create new policy that works with shop association
CREATE POLICY "Shop owners manage product settings" 
ON public.shopify_product_settings 
FOR ALL 
USING (
  -- Allow if user owns the shop OR if the settings belong to the default user but user owns the shop
  EXISTS (
    SELECT 1 FROM public.shopify_stores s 
    WHERE s.shop = shopify_product_settings.shop_id 
    AND s.user_id = auth.uid()
    AND s.is_active = true
  )
  OR
  -- Allow access to default user settings if user owns the shop
  (
    shopify_product_settings.user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid
    AND EXISTS (
      SELECT 1 FROM public.shopify_stores s 
      WHERE s.shop = shopify_product_settings.shop_id 
      AND s.user_id = auth.uid()
      AND s.is_active = true
    )
  )
) 
WITH CHECK (
  -- Same check for writes
  EXISTS (
    SELECT 1 FROM public.shopify_stores s 
    WHERE s.shop = shopify_product_settings.shop_id 
    AND s.user_id = auth.uid()
    AND s.is_active = true
  )
);