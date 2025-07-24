-- تنظيف قاعدة البيانات من البيانات القديمة وإضافة النطاق الجديد

-- 1. إضافة النطاق الجديد codmagnet.com إلى shopify_stores
INSERT INTO shopify_stores (shop, access_token, scope, token_type, is_active) 
VALUES ('codmagnet.com', 'placeholder_token', 'write_content,write_orders,write_products,write_script_tags,write_themes', 'Bearer', true)
ON CONFLICT (shop) DO UPDATE SET is_active = true;

-- 2. تعطيل النطاق القديم bestform-app.myshopify.com
UPDATE shopify_stores 
SET is_active = false 
WHERE shop = 'bestform-app.myshopify.com';

-- 3. تحديث جميع العروض لتستخدم النطاق الجديد
UPDATE quantity_offers 
SET shop_id = 'codmagnet.com' 
WHERE shop_id = 'bestform-app.myshopify.com';

-- 4. تحديث إعدادات المنتجات لتستخدم النطاق الجديد  
UPDATE shopify_product_settings 
SET shop_id = 'codmagnet.com' 
WHERE shop_id = 'bestform-app.myshopify.com';

-- 5. تحديث إعدادات إدراج النماذج
UPDATE shopify_form_insertion 
SET shop_id = 'codmagnet.com' 
WHERE shop_id = 'bestform-app.myshopify.com';

-- 6. تحديث الطلبات
UPDATE orders 
SET shop_id = 'codmagnet.com' 
WHERE shop_id = 'bestform-app.myshopify.com';

-- 7. تحديث السلال المهجورة
UPDATE abandoned_carts 
SET shop_id = 'codmagnet.com' 
WHERE shop_id = 'bestform-app.myshopify.com';