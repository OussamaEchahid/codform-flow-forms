-- إضافة shop_id إلى جدول custom_currency_rates لعزل البيانات حسب المتجر
ALTER TABLE custom_currency_rates 
ADD COLUMN shop_id text;

-- إزالة المؤشر الفريد القديم إن وجد
DROP INDEX IF EXISTS idx_custom_currency_rates_currency_user;

-- إنشاء مؤشر فريد جديد يتضمن shop_id
CREATE UNIQUE INDEX idx_custom_currency_rates_currency_user_shop 
ON custom_currency_rates (currency_code, user_id, shop_id);

-- تحديث البيانات الموجودة لتتضمن shop_id افتراضي
UPDATE custom_currency_rates 
SET shop_id = 'default-shop' 
WHERE shop_id IS NULL;