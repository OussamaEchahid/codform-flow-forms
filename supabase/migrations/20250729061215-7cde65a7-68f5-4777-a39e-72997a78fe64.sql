-- إنشاء دالة لربط المتجر بأي مستخدم يسجل دخول
CREATE OR REPLACE FUNCTION public.auto_link_store_to_current_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- إذا كان المستخدم مسجل دخول
  IF auth.uid() IS NOT NULL THEN
    -- تحديث المتاجر التي ليس لها user_id لتكون مرتبطة بالمستخدم الحالي
    UPDATE shopify_stores 
    SET user_id = auth.uid(), 
        updated_at = now()
    WHERE user_id IS NULL 
       OR user_id != auth.uid()
       AND is_active = true
       AND access_token IS NOT NULL
       AND access_token != ''
       AND access_token != 'placeholder_token';
    
    RAISE NOTICE 'تم ربط المتاجر النشطة بالمستخدم الحالي: %', auth.uid();
  END IF;
END;
$function$;

-- إنشاء دالة لسحب المنتجات بدون الحاجة لتسجيل دخول
CREATE OR REPLACE FUNCTION public.get_store_products_public(p_shop text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  store_record RECORD;
  result jsonb;
BEGIN
  -- البحث عن المتجر
  SELECT shop, access_token, is_active
  INTO store_record
  FROM shopify_stores
  WHERE shop = p_shop
    AND is_active = true
    AND access_token IS NOT NULL
    AND access_token != ''
    AND access_token != 'placeholder_token'
  LIMIT 1;
  
  -- إذا لم يوجد المتجر
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'STORE_NOT_FOUND',
      'message', 'المتجر غير موجود أو غير نشط'
    );
  END IF;
  
  -- إرجاع معلومات المتجر
  RETURN jsonb_build_object(
    'success', true,
    'shop', store_record.shop,
    'access_token', store_record.access_token,
    'message', 'تم العثور على المتجر بنجاح'
  );
END;
$function$;