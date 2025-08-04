-- إصلاح مشكلة القيود المتضاربة في جدول custom_currency_rates
-- حذف القيد الخاطئ الذي يجعل currency_code فريد على مستوى الجدول
ALTER TABLE custom_currency_rates 
DROP CONSTRAINT IF EXISTS unique_currency_code;

-- التأكد من وجود القيد الصحيح فقط: currency_code + user_id فريد
-- هذا القيد موجود بالفعل ولكن للتأكد:
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        WHERE t.relname = 'custom_currency_rates' 
        AND c.conname = 'custom_currency_rates_currency_user_unique'
    ) THEN
        ALTER TABLE custom_currency_rates 
        ADD CONSTRAINT custom_currency_rates_currency_user_unique 
        UNIQUE (currency_code, user_id);
    END IF;
END $$;