-- Fix shop_id for the bestform-app store forms and related data
-- Update forms table
UPDATE forms 
SET shop_id = 'bestform-app.myshopify.com' 
WHERE shop_id = 'codmagnet.com';

-- Update form_submissions table
UPDATE form_submissions 
SET shop_id = 'bestform-app.myshopify.com' 
WHERE shop_id = 'codmagnet.com';

-- Update shopify_product_settings table
UPDATE shopify_product_settings 
SET shop_id = 'bestform-app.myshopify.com' 
WHERE shop_id = 'codmagnet.com';

-- Update quantity_offers table
UPDATE quantity_offers 
SET shop_id = 'bestform-app.myshopify.com' 
WHERE shop_id = 'codmagnet.com';

-- Update orders table
UPDATE orders 
SET shop_id = 'bestform-app.myshopify.com' 
WHERE shop_id = 'codmagnet.com';

-- Update abandoned_carts table
UPDATE abandoned_carts 
SET shop_id = 'bestform-app.myshopify.com' 
WHERE shop_id = 'codmagnet.com';

-- Clean up any incorrect shopify_stores entries that aren't valid Shopify domains
DELETE FROM shopify_stores 
WHERE shop NOT LIKE '%.myshopify.com';

-- Update shopify_form_insertion table
UPDATE shopify_form_insertion 
SET shop_id = 'bestform-app.myshopify.com' 
WHERE shop_id = 'codmagnet.com';