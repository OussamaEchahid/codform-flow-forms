-- إصلاح دالة get_shop_currency_settings لتسترجع المعدلات المخصصة بشكل صحيح
CREATE OR REPLACE FUNCTION public.get_shop_currency_settings(p_shop_id text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  display_settings jsonb;
  custom_symbols jsonb;
  custom_rates jsonb;
  result jsonb;
BEGIN
  -- جلب إعدادات العرض
  SELECT to_jsonb(cds.*) INTO display_settings
  FROM currency_display_settings cds
  WHERE cds.shop_id = p_shop_id
  LIMIT 1;
  
  -- إذا لم توجد إعدادات للمتجر، استخدم الإعدادات الافتراضية
  IF display_settings IS NULL THEN
    display_settings := jsonb_build_object(
      'show_symbol', true,
      'symbol_position', 'before',
      'decimal_places', 2
    );
  END IF;
  
  -- جلب الرموز المخصصة
  SELECT jsonb_object_agg(currency_code, custom_symbol) INTO custom_symbols
  FROM custom_currency_symbols
  WHERE shop_id = p_shop_id;
  
  -- جلب المعدلات المخصصة بشكل مباشر من الجدول
  SELECT jsonb_object_agg(currency_code, exchange_rate) INTO custom_rates
  FROM custom_currency_rates ccr
  WHERE ccr.shop_id = p_shop_id;
  
  -- تجميع النتيجة
  result := jsonb_build_object(
    'success', true,
    'display_settings', display_settings,
    'custom_symbols', COALESCE(custom_symbols, '{}'::jsonb),
    'custom_rates', COALESCE(custom_rates, '{}'::jsonb),
    'shop_id', p_shop_id
  );
  
  RETURN result;
END;
$function$