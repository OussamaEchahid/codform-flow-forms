-- Fix existing policies with CREATE OR REPLACE
-- Update shopify_stores policies to ensure user isolation
DROP POLICY IF EXISTS "Users can view their own stores" ON public.shopify_stores;
DROP POLICY IF EXISTS "Users can insert their own stores" ON public.shopify_stores;
DROP POLICY IF EXISTS "Users can update their own stores" ON public.shopify_stores;
DROP POLICY IF EXISTS "Users can delete their own stores" ON public.shopify_stores;

CREATE POLICY "Users can view their own stores" ON public.shopify_stores
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stores" ON public.shopify_stores
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stores" ON public.shopify_stores
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stores" ON public.shopify_stores
  FOR DELETE USING (auth.uid() = user_id);

-- Update forms policies
DROP POLICY IF EXISTS "Users can view their own forms" ON public.forms;
DROP POLICY IF EXISTS "Users can insert their own forms" ON public.forms;
DROP POLICY IF EXISTS "Users can update their own forms" ON public.forms;
DROP POLICY IF EXISTS "Users can delete their own forms" ON public.forms;

CREATE POLICY "Users can view their own forms" ON public.forms
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own forms" ON public.forms
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own forms" ON public.forms
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own forms" ON public.forms
  FOR DELETE USING (auth.uid() = user_id);

-- Update shopify_product_settings policies  
DROP POLICY IF EXISTS "Allow managing Shopify product settings" ON public.shopify_product_settings;

CREATE POLICY "Users can view their own product settings" ON public.shopify_product_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own product settings" ON public.shopify_product_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own product settings" ON public.shopify_product_settings
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own product settings" ON public.shopify_product_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Update quantity_offers policies
DROP POLICY IF EXISTS "Allow managing quantity offers" ON public.quantity_offers;
DROP POLICY IF EXISTS "Allow public read access to quantity_offers" ON public.quantity_offers;
DROP POLICY IF EXISTS "Allow authenticated users to manage quantity_offers" ON public.quantity_offers;

CREATE POLICY "Users can view their own quantity offers" ON public.quantity_offers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quantity offers" ON public.quantity_offers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quantity offers" ON public.quantity_offers
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quantity offers" ON public.quantity_offers
  FOR DELETE USING (auth.uid() = user_id);