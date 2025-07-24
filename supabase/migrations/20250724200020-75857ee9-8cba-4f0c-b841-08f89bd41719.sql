-- تحديث shop_id في جميع الجداول من النطاق القديم إلى الجديد
UPDATE shopify_product_settings 
SET shop_id = 'codmagnet.com' 
WHERE shop_id = 'bestform-app.myshopify.com';

UPDATE quantity_offers 
SET shop_id = 'codmagnet.com' 
WHERE shop_id = 'bestform-app.myshopify.com';

UPDATE shopify_stores 
SET shop = 'codmagnet.com' 
WHERE shop = 'bestform-app.myshopify.com';

UPDATE forms 
SET shop_id = 'codmagnet.com' 
WHERE shop_id = 'bestform-app.myshopify.com';

UPDATE abandoned_carts 
SET shop_id = 'codmagnet.com' 
WHERE shop_id = 'bestform-app.myshopify.com';

UPDATE orders 
SET shop_id = 'codmagnet.com' 
WHERE shop_id = 'bestform-app.myshopify.com';

UPDATE form_submissions 
SET shop_id = 'codmagnet.com' 
WHERE shop_id = 'bestform-app.myshopify.com';

UPDATE shopify_form_insertion 
SET shop_id = 'codmagnet.com' 
WHERE shop_id = 'bestform-app.myshopify.com';