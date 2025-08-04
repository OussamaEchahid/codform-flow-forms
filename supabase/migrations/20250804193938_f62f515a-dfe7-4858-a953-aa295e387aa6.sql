-- التحقق من المؤشرات الموجودة وإنشاء المؤشر الصحيح
DROP INDEX IF EXISTS idx_custom_currency_rates_currency_user;
DROP INDEX IF EXISTS unique_currency_code;

-- إنشاء مؤشر فريد جديد يتضمن shop_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_currency_rates_currency_user_shop 
ON custom_currency_rates (currency_code, user_id, shop_id);

-- تحديث البيانات الموجودة لتتضمن shop_id إذا كانت فارغة
UPDATE custom_currency_rates 
SET shop_id = 'default-shop' 
WHERE shop_id IS NULL;