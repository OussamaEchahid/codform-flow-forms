-- Update all forms to use codmagnet.com instead of bestform-app.myshopify.com
UPDATE forms 
SET shop_id = 'codmagnet.com', updated_at = now()
WHERE shop_id = 'bestform-app.myshopify.com';

-- Update all quantity_offers to use codmagnet.com
UPDATE quantity_offers 
SET shop_id = 'codmagnet.com', updated_at = now()
WHERE shop_id = 'bestform-app.myshopify.com';

-- Update all shopify_product_settings to use codmagnet.com
UPDATE shopify_product_settings 
SET shop_id = 'codmagnet.com', updated_at = now()
WHERE shop_id = 'bestform-app.myshopify.com';

-- Update all orders to use codmagnet.com
UPDATE orders 
SET shop_id = 'codmagnet.com', updated_at = now()
WHERE shop_id = 'bestform-app.myshopify.com';

-- Update all abandoned_carts to use codmagnet.com
UPDATE abandoned_carts 
SET shop_id = 'codmagnet.com', updated_at = now()
WHERE shop_id = 'bestform-app.myshopify.com';

-- Update all shopify_form_insertion to use codmagnet.com
UPDATE shopify_form_insertion 
SET shop_id = 'codmagnet.com', updated_at = now()
WHERE shop_id = 'bestform-app.myshopify.com';

-- Update all form_submissions to use codmagnet.com
UPDATE form_submissions 
SET shop_id = 'codmagnet.com'
WHERE shop_id = 'bestform-app.myshopify.com';