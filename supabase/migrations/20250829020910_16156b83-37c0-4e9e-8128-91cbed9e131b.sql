-- Fix the subscription access issue by creating a more permissive policy
-- First, drop the existing restrictive policies
DROP POLICY IF EXISTS "Comprehensive subscription read access" ON public.shop_subscriptions;
DROP POLICY IF EXISTS "Users can modify their subscriptions" ON public.shop_subscriptions;
DROP POLICY IF EXISTS "Users can view their own shop subscriptions" ON public.shop_subscriptions;

-- Create a simple, permissive read policy for subscriptions
-- This allows access to subscription data based on shop ownership or for legacy data
CREATE POLICY "Allow subscription access" 
ON public.shop_subscriptions 
FOR SELECT 
USING (
  -- Always allow access if the shop exists in shopify_stores (regardless of user_id)
  EXISTS (
    SELECT 1 FROM public.shopify_stores 
    WHERE shop = shop_subscriptions.shop_domain 
    AND is_active = true
  )
  OR
  -- Allow access for legacy subscriptions (user_id is null)
  (user_id IS NULL)
  OR
  -- Allow access if user owns the subscription
  (user_id = auth.uid())
);

-- Create a comprehensive policy for modifying subscriptions
CREATE POLICY "Allow subscription modifications" 
ON public.shop_subscriptions 
FOR ALL 
USING (
  -- Allow if shop exists and is active
  EXISTS (
    SELECT 1 FROM public.shopify_stores 
    WHERE shop = shop_subscriptions.shop_domain 
    AND is_active = true
  )
  OR
  -- Allow for legacy data
  (user_id IS NULL)
  OR
  -- Allow if user owns it
  (user_id = auth.uid())
)
WITH CHECK (
  -- Same conditions for inserts/updates
  EXISTS (
    SELECT 1 FROM public.shopify_stores 
    WHERE shop = shop_subscriptions.shop_domain 
    AND is_active = true
  )
  OR
  (user_id IS NULL)
  OR
  (user_id = auth.uid())
);