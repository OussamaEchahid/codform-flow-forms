-- تحديث النماذج لتكون مربوطة بالمتجر الصحيح
UPDATE forms 
SET shop_id = 'bestform-app.myshopify.com' 
WHERE shop_id = 'codmagnet.com';

-- تحديث عروض الكمية
UPDATE quantity_offers 
SET shop_id = 'bestform-app.myshopify.com' 
WHERE shop_id = 'codmagnet.com';

-- تحديث إعدادات المنتجات
UPDATE shopify_product_settings 
SET shop_id = 'bestform-app.myshopify.com' 
WHERE shop_id = 'codmagnet.com';

-- تحديث الطلبات
UPDATE orders 
SET shop_id = 'bestform-app.myshopify.com' 
WHERE shop_id = 'codmagnet.com';

-- تحديث عربات التسوق المهجورة
UPDATE abandoned_carts 
SET shop_id = 'bestform-app.myshopify.com' 
WHERE shop_id = 'codmagnet.com';