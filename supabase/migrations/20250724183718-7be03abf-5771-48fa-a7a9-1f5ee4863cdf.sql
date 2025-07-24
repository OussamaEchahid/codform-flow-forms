CREATE OR REPLACE FUNCTION public.get_product_form_and_offers(shop_id text, product_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  form_data jsonb;
  offers_data jsonb;
BEGIN
  -- الحصول على النموذج
  SELECT to_jsonb(f.*) INTO form_data
  FROM forms f
  JOIN shopify_product_settings ps ON f.id = ps.form_id
  WHERE ps.shop_id = $1 
    AND ps.product_id = $2 
    AND ps.enabled = true
  LIMIT 1;
  
  -- إذا لم يتم العثور على نموذج للمنتج المحدد، جرب auto-detect
  IF form_data IS NULL THEN
    SELECT to_jsonb(f.*) INTO form_data
    FROM forms f
    JOIN shopify_product_settings ps ON f.id = ps.form_id
    WHERE ps.shop_id = $1 
      AND ps.product_id = 'auto-detect' 
      AND ps.enabled = true
    LIMIT 1;
  END IF;
  
  -- الحصول على عروض الكمية
  SELECT to_jsonb(qo.*) INTO offers_data
  FROM quantity_offers qo
  WHERE qo.shop_id = $1 
    AND qo.product_id = $2 
    AND qo.enabled = true
  LIMIT 1;
  
  -- إنشاء النتيجة
  result := jsonb_build_object(
    'success', CASE WHEN form_data IS NOT NULL THEN true ELSE false END,
    'form', form_data,
    'quantity_offers', offers_data,
    'shop', $1,
    'productId', $2
  );
  
  RETURN result;
END;
$$;