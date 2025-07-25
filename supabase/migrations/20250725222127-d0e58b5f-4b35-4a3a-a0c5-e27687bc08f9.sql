-- إصلاح فوري لمشاكل المتاجر والمنتجات
-- =======================================

-- إعطال RLS مؤقتاً لحل المشاكل
ALTER TABLE shopify_stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_product_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE forms DISABLE ROW LEVEL SECURITY;
ALTER TABLE quantity_offers DISABLE ROW LEVEL SECURITY;

-- إصلاح بيانات المتاجر - ربط جميع المتاجر بمستخدم واحد
UPDATE shopify_stores 
SET user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893',
    updated_at = now(),
    is_active = true
WHERE access_token IS NOT NULL 
  AND access_token != '' 
  AND access_token != 'placeholder_token';

-- إصلاح بيانات إعدادات المنتجات
UPDATE shopify_product_settings 
SET user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893',
    updated_at = now()
WHERE shop_id IN (
  SELECT shop FROM shopify_stores 
  WHERE user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'
);

-- إصلاح بيانات النماذج
UPDATE forms 
SET user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893',
    updated_at = now()
WHERE shop_id IN (
  SELECT shop FROM shopify_stores 
  WHERE user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'
);

-- إصلاح بيانات عروض الكمية
UPDATE quantity_offers 
SET user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893',
    updated_at = now()
WHERE shop_id IN (
  SELECT shop FROM shopify_stores 
  WHERE user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893'
);

-- تشغيل RLS مرة أخرى
ALTER TABLE shopify_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE shopify_product_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE quantity_offers ENABLE ROW LEVEL SECURITY;