-- Fix RLS policy for shopify_product_settings to allow proper insert operations
-- Drop existing policy first
DROP POLICY IF EXISTS "manage_product_settings" ON public.shopify_product_settings;

-- Create new comprehensive policy that properly handles inserts
CREATE POLICY "manage_product_settings" ON public.shopify_product_settings
FOR ALL
USING (
  -- Allow access if user is authenticated and owns the shop
  (auth.uid() IS NOT NULL AND (
    (auth.uid()::text = user_id::text) OR 
    (user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid) OR 
    (EXISTS (
      SELECT 1 FROM shopify_stores 
      WHERE shopify_stores.shop = shopify_product_settings.shop_id 
      AND shopify_stores.user_id = auth.uid()
    ))
  )) OR 
  -- Allow anonymous access for published forms
  ((auth.uid() IS NULL) AND (EXISTS (
    SELECT 1 FROM forms 
    WHERE forms.id = shopify_product_settings.form_id 
    AND forms.is_published = true
  )))
)
WITH CHECK (
  -- For inserts and updates, ensure user is authenticated and has proper access
  (auth.uid() IS NOT NULL AND (
    (auth.uid()::text = user_id::text) OR 
    (user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid) OR 
    (EXISTS (
      SELECT 1 FROM shopify_stores 
      WHERE shopify_stores.shop = shopify_product_settings.shop_id 
      AND shopify_stores.user_id = auth.uid()
    ))
  ))
);

-- Also fix the associate_product_with_form function to ensure it sets user_id properly
CREATE OR REPLACE FUNCTION public.associate_product_with_form(
  p_shop_id text, 
  p_product_id text, 
  p_form_id uuid, 
  p_block_id text DEFAULT NULL::text, 
  p_enabled boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result_id UUID;
  current_user_id UUID;
BEGIN
  -- Determine the appropriate user_id
  IF auth.uid() IS NOT NULL THEN
    current_user_id := auth.uid();
  ELSE
    current_user_id := '36d7eb85-0c45-4b4f-bea1-a9cb732ca893';
  END IF;

  -- Insert or update product settings
  INSERT INTO public.shopify_product_settings (
    form_id, product_id, shop_id, block_id, enabled, user_id, created_at, updated_at
  ) VALUES (
    p_form_id, p_product_id, p_shop_id, p_block_id, p_enabled, current_user_id, now(), now()
  ) 
  ON CONFLICT (shop_id, product_id)
  DO UPDATE SET
    form_id = p_form_id,
    block_id = COALESCE(p_block_id, shopify_product_settings.block_id),
    enabled = p_enabled,
    user_id = current_user_id,
    updated_at = now()
  RETURNING id INTO result_id;
  
  -- If we didn't get an ID, try to get it from the existing row
  IF result_id IS NULL THEN
    SELECT id INTO result_id 
    FROM public.shopify_product_settings 
    WHERE shop_id = p_shop_id AND product_id = p_product_id;
  END IF;
  
  RETURN result_id;
END;
$function$;