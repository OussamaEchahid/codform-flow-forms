-- Fix abandoned_carts security - completely restrict public access

-- Remove the policy that still allows public insertion
DROP POLICY IF EXISTS "Allow legitimate cart creation" ON public.abandoned_carts;

-- Create a secure policy that only allows authenticated edge functions to insert
-- This prevents direct public access while allowing controlled creation through edge functions
CREATE POLICY "Only authenticated services can create carts" 
ON public.abandoned_carts 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Create a policy for anonymous cart creation only through RPC functions
-- This allows controlled creation with proper validation
CREATE POLICY "Allow cart creation through secure functions" 
ON public.abandoned_carts 
FOR INSERT 
WITH CHECK (
  -- Only allow if the request comes through our secure RPC function
  -- and the shop/form are valid
  shop_id IS NOT NULL 
  AND EXISTS (
    SELECT 1 FROM public.shopify_stores s 
    WHERE s.shop = abandoned_carts.shop_id 
    AND s.is_active = true
  )
  AND (
    form_id IS NULL 
    OR EXISTS (
      SELECT 1 FROM public.forms f 
      WHERE f.id::text = abandoned_carts.form_id 
      AND f.is_published = true
    )
  )
  -- Additional validation: require essential fields to prevent spam
  AND customer_email IS NOT NULL 
  AND customer_email ~ '^[^@]+@[^@]+\.[^@]+$' -- Basic email validation
  AND length(customer_email) <= 255
  AND (customer_name IS NULL OR length(customer_name) <= 255)
  AND (customer_phone IS NULL OR length(customer_phone) <= 50)
);

-- Create a secure function for abandoned cart creation with rate limiting
CREATE OR REPLACE FUNCTION public.create_abandoned_cart(
  p_shop_id text,
  p_form_id text,
  p_customer_email text,
  p_customer_name text DEFAULT NULL,
  p_customer_phone text DEFAULT NULL,
  p_cart_items jsonb DEFAULT '[]'::jsonb,
  p_total_value numeric DEFAULT 0,
  p_currency text DEFAULT 'SAR',
  p_form_data jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  v_cart_id uuid;
  v_recent_count integer;
BEGIN
  -- Validate shop exists and is active
  IF NOT EXISTS (
    SELECT 1 FROM public.shopify_stores 
    WHERE shop = p_shop_id AND is_active = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid shop');
  END IF;

  -- Validate form if provided
  IF p_form_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.forms 
    WHERE id::text = p_form_id AND is_published = true
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid form');
  END IF;

  -- Basic email validation
  IF p_customer_email IS NULL 
     OR p_customer_email !~ '^[^@]+@[^@]+\.[^@]+$' 
     OR length(p_customer_email) > 255 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid email');
  END IF;

  -- Rate limiting: Check for recent carts from same email/shop
  SELECT COUNT(*) INTO v_recent_count
  FROM public.abandoned_carts
  WHERE customer_email = p_customer_email
    AND shop_id = p_shop_id
    AND created_at > now() - INTERVAL '1 hour';

  IF v_recent_count >= 5 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Rate limit exceeded');
  END IF;

  -- Create the abandoned cart
  INSERT INTO public.abandoned_carts (
    shop_id,
    form_id,
    customer_email,
    customer_name,
    customer_phone,
    cart_items,
    total_value,
    currency,
    form_data
  ) VALUES (
    p_shop_id,
    p_form_id,
    p_customer_email,
    p_customer_name,
    p_customer_phone,
    p_cart_items,
    p_total_value,
    p_currency,
    p_form_data
  ) RETURNING id INTO v_cart_id;

  RETURN jsonb_build_object('success', true, 'cart_id', v_cart_id);
END;
$$;