-- حذف الربط القديم الخاطئ وإعادة إنشاء ربط صحيح للمنتجات الفعلية
DELETE FROM shopify_product_settings WHERE shop_id = 'bestform-app.myshopify.com';

-- إضافة ربط جديد للمنتجات الفعلية في المتجر
-- هذا سيتم تحديثه لاحقاً بمعرفات المنتجات الصحيحة
INSERT INTO shopify_product_settings (form_id, product_id, shop_id, enabled) 
VALUES 
  ('c93e31b1-fd6e-4a76-9c1f-7c4975cae93e', 'auto-detect', 'bestform-app.myshopify.com', true);