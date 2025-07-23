-- حذف السجلات المكررة وتحديث shop_id للنطاق الصحيح
DELETE FROM shopify_product_settings 
WHERE shop_id = 'codmagnet.com' AND product_id = '7597766344806';

-- تحديث جميع السجلات لاستخدام النطاق الصحيح
UPDATE shopify_product_settings 
SET shop_id = 'codmagnet.com'
WHERE shop_id IN ('9lsdqy1hqh8pky5c-64036208742.shopifypreview.com', 'codform-test.myshopify.com');

UPDATE forms 
SET shop_id = 'codmagnet.com'
WHERE shop_id IN ('9lsdqy1hqh8pky5c-64036208742.shopifypreview.com', 'codform-test.myshopify.com');

UPDATE quantity_offers 
SET shop_id = 'codmagnet.com'
WHERE shop_id IN ('9lsdqy1hqh8pky5c-64036208742.shopifypreview.com', 'codform-test.myshopify.com');

UPDATE orders 
SET shop_id = 'codmagnet.com'
WHERE shop_id IN ('9lsdqy1hqh8pky5c-64036208742.shopifypreview.com', 'codform-test.myshopify.com');

UPDATE form_submissions 
SET shop_id = 'codmagnet.com'
WHERE shop_id IN ('9lsdqy1hqh8pky5c-64036208742.shopifypreview.com', 'codform-test.myshopify.com');