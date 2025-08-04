-- إنشاء جدول لحفظ الرموز المخصصة للعملات
CREATE TABLE IF NOT EXISTS public.custom_currency_symbols (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  shop_id text,
  currency_code text NOT NULL,
  custom_symbol text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, shop_id, currency_code)
);

-- تمكين RLS
ALTER TABLE public.custom_currency_symbols ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسات RLS
CREATE POLICY "Users can manage their own currency symbols" 
ON public.custom_currency_symbols 
FOR ALL 
USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- تحديث جدول إعدادات العرض ليدعم المتاجر
ALTER TABLE public.currency_display_settings 
ADD COLUMN IF NOT EXISTS shop_id text;

-- إنشاء فهرس فريد جديد
DROP INDEX IF EXISTS currency_display_settings_user_shop_unique;
CREATE UNIQUE INDEX currency_display_settings_user_shop_unique 
ON public.currency_display_settings(COALESCE(user_id::text, 'null'), COALESCE(shop_id, 'null'));

-- تحديث سياسات RLS لدعم المتاجر
DROP POLICY IF EXISTS "Users can view their own display settings" ON public.currency_display_settings;
DROP POLICY IF EXISTS "Users can create their own display settings" ON public.currency_display_settings;
DROP POLICY IF EXISTS "Users can update their own display settings" ON public.currency_display_settings;
DROP POLICY IF EXISTS "Users can delete their own display settings" ON public.currency_display_settings;

CREATE POLICY "Users can manage currency display settings" 
ON public.currency_display_settings 
FOR ALL 
USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- دالة لجلب إعدادات العملة للمتجر
CREATE OR REPLACE FUNCTION public.get_shop_currency_settings(p_shop_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
  
  -- جلب المعدلات المخصصة
  SELECT jsonb_object_agg(currency_code, exchange_rate) INTO custom_rates
  FROM custom_currency_rates ccr
  WHERE EXISTS (
    SELECT 1 FROM currency_display_settings cds 
    WHERE cds.shop_id = p_shop_id AND cds.user_id = ccr.user_id
  );
  
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
$function$;