-- Fix 1: Enable RLS on unified_default_rates and create proper policies
ALTER TABLE public.unified_default_rates ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read default currency rates (this is public reference data)
CREATE POLICY "Public can read default currency rates" 
ON public.unified_default_rates 
FOR SELECT 
USING (true);

-- Only authenticated users with admin privileges can modify currency rates
CREATE POLICY "Only admin can modify currency rates" 
ON public.unified_default_rates 
FOR ALL 
USING (auth.uid() = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid)
WITH CHECK (auth.uid() = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid);

-- Fix 2: Remove the overly permissive debug policy
DROP POLICY IF EXISTS "debug_subscription_access" ON public.shop_subscriptions;

-- Create a proper policy for subscription access based on shop ownership
CREATE POLICY "Users can view their own shop subscriptions" 
ON public.shop_subscriptions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.shopify_stores 
  WHERE shop = shop_subscriptions.shop_domain 
  AND user_id = auth.uid()
));