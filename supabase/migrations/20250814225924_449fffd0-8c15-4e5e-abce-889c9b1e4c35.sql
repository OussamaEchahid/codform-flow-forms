-- Fix shopify_product_settings security vulnerability

-- Remove the problematic public access policy
DROP POLICY IF EXISTS "Public can view product settings for published forms" ON public.shopify_product_settings;

-- Keep the secure policy for owners
-- "Owners manage product settings" policy remains - it's secure and necessary

-- Create a security definer function for public form-product associations
-- This only returns the minimal data needed for form rendering without exposing sensitive info
CREATE OR REPLACE FUNCTION public.get_product_form_association(p_shop_id text, p_product_id text)
RETURNS TABLE(form_id uuid, enabled boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only return form association if the form is published
  RETURN QUERY
  SELECT 
    sps.form_id,
    sps.enabled
  FROM public.shopify_product_settings sps
  JOIN public.forms f ON f.id = sps.form_id
  JOIN public.shopify_stores s ON s.shop = sps.shop_id
  WHERE sps.shop_id = p_shop_id 
    AND sps.product_id = p_product_id
    AND sps.enabled = true
    AND f.is_published = true
    AND s.is_active = true
  LIMIT 1;
END;
$$;

-- Create a function to check if auto-detect form exists for a shop
CREATE OR REPLACE FUNCTION public.get_shop_auto_form(p_shop_id text)
RETURNS TABLE(form_id uuid, enabled boolean)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Return auto-detect form if available and published
  RETURN QUERY
  SELECT 
    sps.form_id,
    sps.enabled
  FROM public.shopify_product_settings sps
  JOIN public.forms f ON f.id = sps.form_id
  JOIN public.shopify_stores s ON s.shop = sps.shop_id
  WHERE sps.shop_id = p_shop_id 
    AND sps.product_id = 'auto-detect'
    AND sps.enabled = true
    AND f.is_published = true
    AND s.is_active = true
  LIMIT 1;
END;
$$;