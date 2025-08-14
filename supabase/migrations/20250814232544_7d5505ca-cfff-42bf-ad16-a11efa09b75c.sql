-- Update orphaned product settings to link them to the correct user
-- This ensures that product settings work with the simplified RLS policy

UPDATE public.shopify_product_settings 
SET user_id = (
  SELECT user_id 
  FROM public.shopify_stores 
  WHERE shop = shopify_product_settings.shop_id 
  AND is_active = true 
  LIMIT 1
)
WHERE user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid
AND EXISTS (
  SELECT 1 
  FROM public.shopify_stores 
  WHERE shop = shopify_product_settings.shop_id 
  AND is_active = true 
  AND user_id != '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid
);