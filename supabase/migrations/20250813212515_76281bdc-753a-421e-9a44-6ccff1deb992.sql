-- Fix currency for bestform-app.myshopify.com shop
-- Based on the shopify products API, this shop uses MAD currency

UPDATE forms 
SET 
  country = 'MA',
  currency = 'MAD', 
  phone_prefix = '+212',
  updated_at = now()
WHERE shop_id = 'bestform-app.myshopify.com' 
  AND currency = 'SAR';