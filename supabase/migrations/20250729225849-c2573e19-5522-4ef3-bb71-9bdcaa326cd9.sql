-- Remove all existing policies for shopify_product_settings
DROP POLICY IF EXISTS "manage_product_settings" ON public.shopify_product_settings;
DROP POLICY IF EXISTS "allow_product_settings_management" ON public.shopify_product_settings;
DROP POLICY IF EXISTS "manage_product_settings_v2" ON public.shopify_product_settings;

-- Create a simple and permissive policy for product settings
CREATE POLICY "allow_product_association" 
ON public.shopify_product_settings 
FOR ALL 
USING (true)
WITH CHECK (true);