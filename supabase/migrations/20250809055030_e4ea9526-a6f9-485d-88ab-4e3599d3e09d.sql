-- Create a SECURITY DEFINER helper to check if a shop is active without being blocked by RLS on shopify_stores
CREATE OR REPLACE FUNCTION public.store_is_active(p_shop text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shopify_stores s
    WHERE s.shop = p_shop AND s.is_active = true
  );
$$;

-- Update RLS policy on advertising_pixels to use the helper function instead of querying shopify_stores directly (which fails for anon users)
DROP POLICY IF EXISTS "advertising_pixels_shop_access" ON public.advertising_pixels;

CREATE POLICY "advertising_pixels_shop_access"
ON public.advertising_pixels
FOR ALL
USING (public.store_is_active(shop_id))
WITH CHECK (public.store_is_active(shop_id));