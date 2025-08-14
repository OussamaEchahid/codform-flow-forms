-- Fix abandoned_carts security vulnerabilities

-- Drop the overly permissive public policies
DROP POLICY IF EXISTS "public_can_create_abandoned_carts" ON public.abandoned_carts;
DROP POLICY IF EXISTS "public_can_update_abandoned_carts" ON public.abandoned_carts;

-- Create secure policy for cart creation
-- Only allow creation for legitimate form submissions with valid shop context
CREATE POLICY "Allow legitimate cart creation" 
ON public.abandoned_carts 
FOR INSERT 
WITH CHECK (
  -- Shop must be active if shop_id is provided
  shop_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.shopify_stores s 
    WHERE s.shop = abandoned_carts.shop_id 
    AND s.is_active = true
  )
  -- Form must be published if form_id is provided
  AND (
    form_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM public.forms f 
      WHERE f.id::text = abandoned_carts.form_id 
      AND f.is_published = true
    )
  )
);

-- Create secure policy for cart updates
-- Only allow updates by authenticated shop owners
CREATE POLICY "Shop owners can update their carts" 
ON public.abandoned_carts 
FOR UPDATE 
TO authenticated
USING (
  shop_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.shopify_stores s 
    WHERE s.shop = abandoned_carts.shop_id 
    AND s.user_id = auth.uid()
    AND s.is_active = true
  )
)
WITH CHECK (
  shop_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.shopify_stores s 
    WHERE s.shop = abandoned_carts.shop_id 
    AND s.user_id = auth.uid()
    AND s.is_active = true
  )
);

-- Create policy for cart deletion by shop owners
CREATE POLICY "Shop owners can delete their carts" 
ON public.abandoned_carts 
FOR DELETE 
TO authenticated
USING (
  shop_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.shopify_stores s 
    WHERE s.shop = abandoned_carts.shop_id 
    AND s.user_id = auth.uid()
    AND s.is_active = true
  )
);

-- Keep the existing secure view policy for authenticated shop owners
-- "authenticated_users_can_view_shop_carts" remains as it's already secure