-- حذف السجلات المكررة في shopify_product_settings
-- الاحتفاظ بأحدث سجل لكل مجموعة (shop_id, product_id)
DELETE FROM shopify_product_settings 
WHERE id NOT IN (
  SELECT DISTINCT ON (shop_id, product_id) id 
  FROM shopify_product_settings 
  ORDER BY shop_id, product_id, updated_at DESC
);

-- تنظيف الإعدادات المتضاربة لمنتج الاختبار
DELETE FROM shopify_product_settings 
WHERE product_id = 'njhygfjuygfujk' AND shop_id = 'codform-test.myshopify.com';

-- إنشاء ربط صحيح بين النموذج والمنتج
INSERT INTO shopify_product_settings (
  shop_id, 
  product_id, 
  form_id, 
  enabled
) 
SELECT 
  'codform-test.myshopify.com',
  'njhygfjuygfujk',
  id,
  true
FROM forms 
WHERE title = 'نموذج طلب المنتج' AND shop_id = 'codform-test.myshopify.com'
LIMIT 1;