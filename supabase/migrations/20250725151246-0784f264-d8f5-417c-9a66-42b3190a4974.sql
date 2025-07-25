-- إصلاح دالة ربط المنتجات لتحديث user_id بشكل صحيح
DROP FUNCTION IF EXISTS public.associate_product_with_form(text, text, uuid, text, boolean);

CREATE OR REPLACE FUNCTION public.associate_product_with_form(
  p_shop_id text,
  p_product_id text,
  p_form_id uuid,
  p_block_id text DEFAULT NULL,
  p_enabled boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result_id UUID;
  current_user_id UUID;
BEGIN
  -- الحصول على user_id الحالي
  current_user_id := auth.uid();
  
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
$$;