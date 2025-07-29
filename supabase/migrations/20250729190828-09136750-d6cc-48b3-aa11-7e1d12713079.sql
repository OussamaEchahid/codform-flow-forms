-- إصلاح مشاكل RLS وتوحيد إدارة المتاجر
-- تحديث جميع البيانات لتستخدم user_id الصحيح

-- تحديث جميع النماذج لتستخدم المستخدم الافتراضي
UPDATE forms 
SET user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893', 
    updated_at = now()
WHERE user_id IS NULL OR user_id != '36d7eb85-0c45-4b4f-bea1-a9cb732ca893';

-- تحديث جميع إعدادات المنتجات
UPDATE shopify_product_settings 
SET user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893',
    updated_at = now()
WHERE user_id IS NULL OR user_id != '36d7eb85-0c45-4b4f-bea1-a9cb732ca893';

-- تحديث جميع عروض الكمية
UPDATE quantity_offers 
SET user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893',
    updated_at = now()
WHERE user_id IS NULL OR user_id != '36d7eb85-0c45-4b4f-bea1-a9cb732ca893';

-- تحديث جميع المتاجر
UPDATE shopify_stores 
SET user_id = '36d7eb85-0c45-4b4f-bea1-a9cb732ca893',
    updated_at = now()
WHERE user_id IS NULL OR user_id != '36d7eb85-0c45-4b4f-bea1-a9cb732ca893';