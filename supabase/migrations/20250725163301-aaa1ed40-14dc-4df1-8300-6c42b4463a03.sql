-- Phase 1: Critical Database Security Fixes (Fixed)

-- Re-enable RLS on shopify_stores and create proper policies
ALTER TABLE shopify_stores ENABLE ROW LEVEL SECURITY;

-- Remove the temporary comment
COMMENT ON TABLE shopify_stores IS NULL;

-- Drop ALL existing policies first
DROP POLICY IF EXISTS "Users can view their own stores" ON shopify_stores;
DROP POLICY IF EXISTS "Users can create their own stores" ON shopify_stores;
DROP POLICY IF EXISTS "Users can update their own stores" ON shopify_stores;
DROP POLICY IF EXISTS "Users can delete their own stores" ON shopify_stores;

-- Create secure RLS policies for shopify_stores
CREATE POLICY "authenticated_users_select_own_stores" 
ON shopify_stores FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "authenticated_users_insert_own_stores" 
ON shopify_stores FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_users_update_own_stores" 
ON shopify_stores FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "authenticated_users_delete_own_stores" 
ON shopify_stores FOR DELETE 
USING (auth.uid() = user_id);

-- Fix abandoned_carts policies
DROP POLICY IF EXISTS "Users can view their abandoned carts" ON abandoned_carts;
DROP POLICY IF EXISTS "Users can create abandoned carts for their shops" ON abandoned_carts;
DROP POLICY IF EXISTS "Users can update their abandoned carts" ON abandoned_carts;

CREATE POLICY "authenticated_users_view_shop_carts" 
ON abandoned_carts FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = abandoned_carts.shop_id 
  AND user_id = auth.uid()
));

CREATE POLICY "authenticated_users_create_shop_carts" 
ON abandoned_carts FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = abandoned_carts.shop_id 
  AND user_id = auth.uid()
));

CREATE POLICY "authenticated_users_update_shop_carts" 
ON abandoned_carts FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = abandoned_carts.shop_id 
  AND user_id = auth.uid()
));

-- Fix orders policies
DROP POLICY IF EXISTS "Users can view their orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can update their orders" ON orders;

CREATE POLICY "authenticated_users_view_shop_orders" 
ON orders FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = orders.shop_id 
  AND user_id = auth.uid()
));

CREATE POLICY "authenticated_users_create_orders" 
ON orders FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_users_update_shop_orders" 
ON orders FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = orders.shop_id 
  AND user_id = auth.uid()
));

-- Fix shopify_form_insertion policies
DROP POLICY IF EXISTS "Users can manage their form insertions" ON shopify_form_insertion;

CREATE POLICY "authenticated_users_manage_form_insertions" 
ON shopify_form_insertion FOR ALL
USING (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = shopify_form_insertion.shop_id 
  AND user_id = auth.uid()
));

-- Fix google_sheets_configs policies
DROP POLICY IF EXISTS "Users can manage their google sheets configs" ON google_sheets_configs;

CREATE POLICY "authenticated_users_manage_sheets_configs" 
ON google_sheets_configs FOR ALL
USING (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = google_sheets_configs.shop_id 
  AND user_id = auth.uid()
));

-- Update get_store_access_token to be more secure
CREATE OR REPLACE FUNCTION public.get_store_access_token(p_shop text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  token text;
BEGIN
  -- Only return token if user owns the shop
  SELECT access_token INTO token
  FROM shopify_stores
  WHERE shop = p_shop 
    AND access_token IS NOT NULL 
    AND access_token != ''
    AND user_id = auth.uid()
  LIMIT 1;
  
  RETURN token;
END;
$function$;