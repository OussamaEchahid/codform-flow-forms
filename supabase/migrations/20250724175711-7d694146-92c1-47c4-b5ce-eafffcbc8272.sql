-- ربط عروض الكمية بالنموذج الصحيح والمنتجات الفعلية
-- حذف الإعدادات القديمة وإعادة إنشائها بشكل صحيح
DELETE FROM shopify_product_settings WHERE shop_id = 'bestform-app.myshopify.com';

-- إدراج إعدادات صحيحة لربط النماذج بالمنتجات
INSERT INTO shopify_product_settings (form_id, product_id, shop_id, enabled) VALUES
  -- ربط النموذج "نموذج جديد" بالمنتج 7597766148198
  ('819fe087-ee65-4e76-8c5f-a75d95d00051', '7597766148198', 'bestform-app.myshopify.com', true),
  -- ربط النموذج "نموذج طلب المنتج" بالمنتج 7597766344806  
  ('12345678-1234-1234-1234-123456789012', '7597766344806', 'bestform-app.myshopify.com', true),
  -- ربط النموذج "New Form" كنموذج عام للمنتجات الأخرى
  ('c93e31b1-fd6e-4a76-9c1f-7c4975cae93e', 'auto-detect', 'bestform-app.myshopify.com', true);