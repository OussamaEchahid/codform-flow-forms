-- تحديث دالة ربط المنتجات لتعمل بدون قيود RLS
-- ================================================

CREATE OR REPLACE FUNCTION public.associate_product_with_form(
  p_shop_id text, 
  p_product_id text, 
  p_form_id uuid, 
  p_block_id text DEFAULT NULL::text, 
  p_enabled boolean DEFAULT true
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result_id UUID;
  main_user_id UUID := '36d7eb85-0c45-4b4f-bea1-a9cb732ca893';
BEGIN
  -- إدراج أو تحديث إعدادات المنتج
  INSERT INTO public.shopify_product_settings (
    form_id, product_id, shop_id, block_id, enabled, user_id, created_at, updated_at
  ) VALUES (
    p_form_id, p_product_id, p_shop_id, p_block_id, p_enabled, main_user_id, now(), now()
  ) 
  ON CONFLICT (shop_id, product_id)
  DO UPDATE SET
    form_id = p_form_id,
    block_id = COALESCE(p_block_id, shopify_product_settings.block_id),
    enabled = p_enabled,
    user_id = main_user_id,
    updated_at = now()
  RETURNING id INTO result_id;
  
  -- إذا لم نحصل على ID، نحاول الحصول عليه من الصف الموجود
  IF result_id IS NULL THEN
    SELECT id INTO result_id 
    FROM public.shopify_product_settings 
    WHERE shop_id = p_shop_id AND product_id = p_product_id;
  END IF;
  
  RETURN result_id;
END;
$$;

-- إنشاء دالة لحفظ المتجر مع ربطه بالمستخدم الافتراضي
CREATE OR REPLACE FUNCTION public.link_store_to_user(
  p_shop text, 
  p_user_id uuid DEFAULT '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'::uuid, 
  p_email text DEFAULT NULL::text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO shopify_stores (shop, user_id, email, is_active, created_at, updated_at)
  VALUES (p_shop, p_user_id, p_email, true, now(), now())
  ON CONFLICT (shop)
  DO UPDATE SET 
    user_id = p_user_id,
    email = COALESCE(p_email, shopify_stores.email),
    is_active = true,
    updated_at = now();
  
  RETURN TRUE;
END;
$$;