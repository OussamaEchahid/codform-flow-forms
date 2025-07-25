-- Phase 1: Critical Database Security Fixes

-- Re-enable RLS on shopify_stores and create proper policies
ALTER TABLE shopify_stores ENABLE ROW LEVEL SECURITY;

-- Remove the temporary comment
COMMENT ON TABLE shopify_stores IS NULL;

-- Create secure RLS policies for shopify_stores
DROP POLICY IF EXISTS "flexible_select_policy" ON shopify_stores;
DROP POLICY IF EXISTS "flexible_insert_policy" ON shopify_stores;
DROP POLICY IF EXISTS "flexible_update_policy" ON shopify_stores;
DROP POLICY IF EXISTS "flexible_delete_policy" ON shopify_stores;

-- Authenticated users can view stores they own
CREATE POLICY "Users can view their own stores" 
ON shopify_stores FOR SELECT 
USING (auth.uid() = user_id);

-- Authenticated users can insert stores for themselves
CREATE POLICY "Users can create their own stores" 
ON shopify_stores FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own stores
CREATE POLICY "Users can update their own stores" 
ON shopify_stores FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Authenticated users can delete their own stores
CREATE POLICY "Users can delete their own stores" 
ON shopify_stores FOR DELETE 
USING (auth.uid() = user_id);

-- Fix overly permissive policies on other tables
-- Fix abandoned_carts policies
DROP POLICY IF EXISTS "Users can view all abandoned carts" ON abandoned_carts;
DROP POLICY IF EXISTS "Users can create abandoned carts" ON abandoned_carts;
DROP POLICY IF EXISTS "Users can update abandoned carts" ON abandoned_carts;

CREATE POLICY "Users can view their abandoned carts" 
ON abandoned_carts FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = abandoned_carts.shop_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can create abandoned carts for their shops" 
ON abandoned_carts FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = abandoned_carts.shop_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Users can update their abandoned carts" 
ON abandoned_carts FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = abandoned_carts.shop_id 
  AND user_id = auth.uid()
));

-- Fix orders policies
DROP POLICY IF EXISTS "Users can view all orders" ON orders;
DROP POLICY IF EXISTS "Users can create orders" ON orders;
DROP POLICY IF EXISTS "Users can update orders" ON orders;

CREATE POLICY "Users can view their orders" 
ON orders FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = orders.shop_id 
  AND user_id = auth.uid()
));

CREATE POLICY "Authenticated users can create orders" 
ON orders FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their orders" 
ON orders FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = orders.shop_id 
  AND user_id = auth.uid()
));

-- Fix shopify_form_insertion policies
DROP POLICY IF EXISTS "Allow managing Shopify form insertions" ON shopify_form_insertion;

CREATE POLICY "Users can manage their form insertions" 
ON shopify_form_insertion FOR ALL
USING (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = shopify_form_insertion.shop_id 
  AND user_id = auth.uid()
));

-- Fix google_sheets_configs policies
DROP POLICY IF EXISTS "Users can manage google sheets configs" ON google_sheets_configs;

CREATE POLICY "Users can manage their google sheets configs" 
ON google_sheets_configs FOR ALL
USING (EXISTS (
  SELECT 1 FROM shopify_stores 
  WHERE shop = google_sheets_configs.shop_id 
  AND user_id = auth.uid()
));

-- Secure database functions with proper search_path
CREATE OR REPLACE FUNCTION public.link_orphan_stores_to_user()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NOT NULL THEN
    UPDATE shopify_stores 
    SET user_id = auth.uid(), 
        updated_at = now()
    WHERE user_id IS NULL 
      AND is_active = true;
    
    RAISE NOTICE 'Linked orphan stores to user %', auth.uid();
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_stores(p_user_id uuid)
 RETURNS TABLE(shop text, is_active boolean, updated_at timestamp with time zone, access_token text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY 
  SELECT 
    s.shop,
    s.is_active,
    s.updated_at,
    s.access_token
  FROM shopify_stores s
  WHERE s.user_id = p_user_id
  ORDER BY s.updated_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.link_store_to_user(p_shop text, p_user_id uuid, p_email text DEFAULT NULL::text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO shopify_stores (shop, user_id, email, is_active, created_at, updated_at)
  VALUES (p_shop, p_user_id, p_email, true, now(), now())
  ON CONFLICT (shop)
  DO UPDATE SET 
    user_id = p_user_id,
    email = COALESCE(p_email, shopify_stores.email),
    updated_at = now()
  WHERE shopify_stores.user_id IS NULL OR shopify_stores.user_id = p_user_id;
  
  RETURN TRUE;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_store_access_token(p_shop text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  token text;
BEGIN
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

CREATE OR REPLACE FUNCTION public.fix_form_store_links()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE forms 
  SET user_id = s.user_id
  FROM shopify_stores s
  WHERE forms.shop_id = s.shop
    AND s.user_id IS NOT NULL
    AND forms.user_id != s.user_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_user_stores_by_email(p_email text DEFAULT NULL::text)
 RETURNS TABLE(shop text, email text, user_id uuid, access_token text, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, plan_type text, subscription_status text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_email TEXT;
BEGIN
  user_email := COALESCE(p_email, auth.email());
  
  RETURN QUERY
  SELECT 
    s.shop,
    s.email,
    s.user_id,
    s.access_token,
    s.is_active,
    s.created_at,
    s.updated_at,
    COALESCE(sub.plan_type, 'free') as plan_type,
    COALESCE(sub.status, 'inactive') as subscription_status
  FROM shopify_stores s
  LEFT JOIN shop_subscriptions sub ON s.shop = sub.shop_domain
  WHERE 
    (s.email = user_email OR s.user_id = auth.uid())
    AND auth.uid() IS NOT NULL
  ORDER BY s.updated_at DESC;
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_product_form_and_offers(shop_id text, product_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  form_data jsonb;
  offers_data jsonb;
BEGIN
  -- Check if user has access to this shop
  IF NOT EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shop = shop_id 
    AND (user_id = auth.uid() OR auth.uid() IS NULL)
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Access denied');
  END IF;
  
  SELECT to_jsonb(f.*) INTO form_data
  FROM forms f
  JOIN shopify_product_settings ps ON f.id = ps.form_id
  WHERE ps.shop_id = $1 
    AND ps.product_id = $2 
    AND ps.enabled = true
  LIMIT 1;
  
  IF form_data IS NULL THEN
    SELECT to_jsonb(f.*) INTO form_data
    FROM forms f
    JOIN shopify_product_settings ps ON f.id = ps.form_id
    WHERE ps.shop_id = $1 
      AND ps.product_id = 'auto-detect' 
      AND ps.enabled = true
    LIMIT 1;
  END IF;
  
  SELECT to_jsonb(qo.*) INTO offers_data
  FROM quantity_offers qo
  WHERE qo.shop_id = $1 
    AND qo.product_id = $2 
    AND qo.enabled = true
  LIMIT 1;
  
  result := jsonb_build_object(
    'success', CASE WHEN form_data IS NOT NULL THEN true ELSE false END,
    'form', form_data,
    'quantity_offers', offers_data,
    'shop', $1,
    'productId', $2
  );
  
  RETURN result;
END;
$function$;

CREATE OR REPLACE FUNCTION public.associate_product_with_form(p_shop_id text, p_product_id text, p_form_id uuid, p_block_id text DEFAULT NULL::text, p_enabled boolean DEFAULT true)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  
  -- Check if user owns the shop
  IF NOT EXISTS (
    SELECT 1 FROM shopify_stores 
    WHERE shop = p_shop_id 
    AND user_id = current_user_id
  ) THEN
    RAISE EXCEPTION 'Access denied: User does not own this shop';
  END IF;
  
  INSERT INTO public.shopify_product_settings (
    form_id, product_id, shop_id, block_id, enabled, user_id
  ) VALUES (
    p_form_id, p_product_id, p_shop_id, p_block_id, p_enabled, current_user_id
  ) 
  ON CONFLICT (shop_id, product_id)
  DO UPDATE SET
    form_id = p_form_id,
    block_id = COALESCE(p_block_id, shopify_product_settings.block_id),
    enabled = p_enabled,
    user_id = current_user_id,
    updated_at = now()
  RETURNING id INTO result_id;
  
  RETURN result_id;
END;
$function$;