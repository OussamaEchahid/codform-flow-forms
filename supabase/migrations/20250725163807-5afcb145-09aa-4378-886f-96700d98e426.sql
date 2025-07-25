-- Fix RLS policies to only allow authenticated users (no anonymous access)

-- Update all policies to require authenticated role instead of public
-- This prevents anonymous access

-- Fix abandoned_carts policies
DROP POLICY IF EXISTS "authenticated_users_create_shop_carts" ON abandoned_carts;
DROP POLICY IF EXISTS "authenticated_users_update_shop_carts" ON abandoned_carts;
DROP POLICY IF EXISTS "authenticated_users_view_shop_carts" ON abandoned_carts;

CREATE POLICY "authenticated_users_create_shop_carts" 
ON abandoned_carts FOR INSERT 
TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = abandoned_carts.shop_id 
  AND user_id = auth.uid()
));

CREATE POLICY "authenticated_users_update_shop_carts" 
ON abandoned_carts FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = abandoned_carts.shop_id 
  AND user_id = auth.uid()
));

CREATE POLICY "authenticated_users_view_shop_carts" 
ON abandoned_carts FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = abandoned_carts.shop_id 
  AND user_id = auth.uid()
));

-- Fix orders policies  
DROP POLICY IF EXISTS "authenticated_users_create_orders" ON orders;
DROP POLICY IF EXISTS "authenticated_users_update_shop_orders" ON orders;
DROP POLICY IF EXISTS "authenticated_users_view_shop_orders" ON orders;

CREATE POLICY "authenticated_users_create_orders" 
ON orders FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_users_update_shop_orders" 
ON orders FOR UPDATE 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = orders.shop_id 
  AND user_id = auth.uid()
));

CREATE POLICY "authenticated_users_view_shop_orders" 
ON orders FOR SELECT 
TO authenticated
USING (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = orders.shop_id 
  AND user_id = auth.uid()
));

-- Fix shopify_stores policies
DROP POLICY IF EXISTS "authenticated_users_select_own_stores" ON shopify_stores;
DROP POLICY IF EXISTS "authenticated_users_insert_own_stores" ON shopify_stores;
DROP POLICY IF EXISTS "authenticated_users_update_own_stores" ON shopify_stores;
DROP POLICY IF EXISTS "authenticated_users_delete_own_stores" ON shopify_stores;

CREATE POLICY "authenticated_users_select_own_stores" 
ON shopify_stores FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "authenticated_users_insert_own_stores" 
ON shopify_stores FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_users_update_own_stores" 
ON shopify_stores FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_users_delete_own_stores" 
ON shopify_stores FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Fix forms policies
DROP POLICY IF EXISTS "Users can view their own forms" ON forms;
DROP POLICY IF EXISTS "Users can insert their own forms" ON forms;
DROP POLICY IF EXISTS "Users can update their own forms" ON forms;
DROP POLICY IF EXISTS "Users can delete their own forms" ON forms;

CREATE POLICY "authenticated_users_view_own_forms" 
ON forms FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "authenticated_users_insert_own_forms" 
ON forms FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_users_update_own_forms" 
ON forms FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_users_delete_own_forms" 
ON forms FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Fix quantity_offers policies
DROP POLICY IF EXISTS "Users can view their own quantity offers" ON quantity_offers;
DROP POLICY IF EXISTS "Users can insert their own quantity offers" ON quantity_offers;
DROP POLICY IF EXISTS "Users can update their own quantity offers" ON quantity_offers;
DROP POLICY IF EXISTS "Users can delete their own quantity offers" ON quantity_offers;

CREATE POLICY "authenticated_users_view_own_quantity_offers" 
ON quantity_offers FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "authenticated_users_insert_own_quantity_offers" 
ON quantity_offers FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_users_update_own_quantity_offers" 
ON quantity_offers FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_users_delete_own_quantity_offers" 
ON quantity_offers FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Fix shopify_product_settings policies
DROP POLICY IF EXISTS "Users can view their own product settings" ON shopify_product_settings;
DROP POLICY IF EXISTS "Users can insert their own product settings" ON shopify_product_settings;
DROP POLICY IF EXISTS "Users can update their own product settings" ON shopify_product_settings;  
DROP POLICY IF EXISTS "Users can delete their own product settings" ON shopify_product_settings;

CREATE POLICY "authenticated_users_view_own_product_settings" 
ON shopify_product_settings FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "authenticated_users_insert_own_product_settings" 
ON shopify_product_settings FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_users_update_own_product_settings" 
ON shopify_product_settings FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_users_delete_own_product_settings" 
ON shopify_product_settings FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Fix form insertion and google sheets policies
DROP POLICY IF EXISTS "authenticated_users_manage_form_insertions" ON shopify_form_insertion;
DROP POLICY IF EXISTS "authenticated_users_manage_sheets_configs" ON google_sheets_configs;

CREATE POLICY "authenticated_users_manage_form_insertions" 
ON shopify_form_insertion FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = shopify_form_insertion.shop_id 
  AND user_id = auth.uid()
));

CREATE POLICY "authenticated_users_manage_sheets_configs" 
ON google_sheets_configs FOR ALL
TO authenticated
USING (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = google_sheets_configs.shop_id 
  AND user_id = auth.uid()
));

-- Fix form_submissions policies to require authentication
DROP POLICY IF EXISTS "Users can view submissions by shop" ON form_submissions;
DROP POLICY IF EXISTS "Users can view submissions for their forms" ON form_submissions;

CREATE POLICY "authenticated_users_view_submissions_for_forms" 
ON form_submissions FOR SELECT 
TO authenticated
USING (EXISTS ( 
  SELECT 1 FROM forms 
  WHERE forms.id::text = form_submissions.form_id 
  AND forms.user_id = auth.uid()
));