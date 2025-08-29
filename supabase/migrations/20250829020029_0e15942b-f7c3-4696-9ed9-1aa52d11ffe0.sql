-- Debug: Create a more permissive policy for subscription access
-- First, let's check the current situation

-- Drop the restrictive policy
DROP POLICY IF EXISTS "Users can view their own shop subscriptions" ON public.shop_subscriptions;

-- Create a more comprehensive policy that allows multiple access patterns
CREATE POLICY "Comprehensive subscription access" 
ON public.shop_subscriptions 
FOR SELECT 
USING (
  -- Allow access if user owns the shop in shopify_stores
  EXISTS (
    SELECT 1 FROM public.shopify_stores 
    WHERE shop = shop_subscriptions.shop_domain 
    AND user_id = auth.uid()
  )
  OR
  -- Allow access if the subscription has the same user_id as the current user
  (user_id = auth.uid())
  OR
  -- Allow access if user_id is null (for legacy subscriptions)
  (user_id IS NULL AND auth.uid() IS NOT NULL)
);

-- Also ensure users can update their subscriptions
CREATE POLICY "Users can update their subscriptions" 
ON public.shop_subscriptions 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.shopify_stores 
    WHERE shop = shop_subscriptions.shop_domain 
    AND user_id = auth.uid()
  )
  OR
  (user_id = auth.uid())
);

-- Allow inserting subscriptions for shops the user owns
CREATE POLICY "Users can create subscriptions for their stores" 
ON public.shop_subscriptions 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.shopify_stores 
    WHERE shop = shop_subscriptions.shop_domain 
    AND user_id = auth.uid()
  )
);