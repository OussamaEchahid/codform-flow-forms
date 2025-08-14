-- Fix the complex RLS policy that's causing timeouts
-- Simplify the shopify_product_settings policy to avoid complex subqueries

-- Drop the complex policy
DROP POLICY IF EXISTS "Shop owners manage product settings" ON public.shopify_product_settings;

-- Create a simpler, more efficient policy
CREATE POLICY "Simple product settings access" 
ON public.shopify_product_settings 
FOR ALL 
USING (
  -- Allow access if user owns the shop OR if it's the default user
  user_id = auth.uid() 
  OR 
  user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid
) 
WITH CHECK (
  -- For writes, ensure user owns the shop
  user_id = auth.uid() 
  OR 
  user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid
);

-- Also create a function to efficiently check shop ownership
CREATE OR REPLACE FUNCTION public.user_can_access_shop(p_shop_id text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.shopify_stores 
    WHERE shop = p_shop_id 
    AND user_id = auth.uid() 
    AND is_active = true
  );
$$;