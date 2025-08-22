-- Activate the basic subscription for kooblk.myshopify.com
UPDATE shop_subscriptions 
SET 
  status = 'active',
  price_amount = 9.99,
  next_billing_date = now() + INTERVAL '1 month',
  updated_at = now()
WHERE shop_domain = 'kooblk.myshopify.com' 
  AND plan_type = 'basic';