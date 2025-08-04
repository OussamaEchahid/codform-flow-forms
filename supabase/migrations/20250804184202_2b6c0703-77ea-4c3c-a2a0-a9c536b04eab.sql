-- إصلاح جدول custom_currency_rates لدعم معدلات متعددة لكل مستخدم
-- 1. حذف القيد الفريد الحالي
ALTER TABLE public.custom_currency_rates DROP CONSTRAINT IF EXISTS custom_currency_rates_currency_code_key;

-- 2. إضافة قيد فريد جديد يتضمن user_id
ALTER TABLE public.custom_currency_rates 
ADD CONSTRAINT custom_currency_rates_currency_user_unique 
UNIQUE (currency_code, user_id);

-- 3. التأكد من أن user_id مطلوب
ALTER TABLE public.custom_currency_rates 
ALTER COLUMN user_id SET NOT NULL;